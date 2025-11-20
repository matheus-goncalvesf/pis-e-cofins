import React, { useState, useEffect } from 'react';
import UploadArea from './components/UploadArea';
import ReviewTable from './components/ReviewTable';
import CalculationsInput from './components/CalculationsInput';
import ReportsGenerator from './components/ReportsGenerator';
import CompanyManager from './components/CompanyManager';
import Dashboard from './components/Dashboard';
import { DashboardLayout } from './components/Layout';
import { UploadFile, Invoice, InvoiceItem, CalculationInput, Company, CompanyData, UploadStatus } from './types';
import { parseNFeXML } from './utils/xmlParser';
import { checkIsMonofasico } from './utils/ncmMatcher';
import { db, CompanyEntity, InvoiceEntity, CalculationEntity } from './services/db';
import { useLiveQuery } from 'dexie-react-hooks';

type Page = 'dashboard' | 'upload' | 'review' | 'calculations' | 'reports';

const App: React.FC = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedCompanyId');
    return saved ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    if (selectedCompanyId) {
      localStorage.setItem('selectedCompanyId', selectedCompanyId.toString());
    } else {
      localStorage.removeItem('selectedCompanyId');
    }
  }, [selectedCompanyId]);

  const [currentView, setCurrentView] = useState<Page>('dashboard');

  // Fetch companies from IndexedDB
  const companies = useLiveQuery(() => db.companies.toArray(), []);

  // Fetch active company data
  const activeCompanyData = useLiveQuery(async () => {
    if (!selectedCompanyId) return null;

    const company = await db.companies.get(selectedCompanyId);
    if (!company) return null;

    const invoices = await db.invoices.where('companyId').equals(selectedCompanyId).toArray();
    const files = await db.files.where('companyId').equals(selectedCompanyId).toArray();
    const calculations = await db.calculations.where('companyId').equals(selectedCompanyId).toArray();

    // Transform calculations array to record
    const calculationInputs: Record<string, CalculationInput> = {};
    calculations.forEach(c => {
      calculationInputs[c.competence_month] = {
        rbt12: c.rbt12,
        das_paid: c.das_paid,
        anexo: c.anexo
      };
    });

    // Transform files to UploadFile
    const uploadFiles: UploadFile[] = files.map(f => ({
      id: f.id!,
      name: f.name,
      content: f.content,
      status: f.status as UploadStatus,
      uploadDate: f.uploadDate || new Date().toISOString(),
      type: 'XML',
      progress: 100,
      size: f.content.length
    }));

    // Transform invoices to Invoice
    const parsedInvoices: Invoice[] = invoices.map(inv => ({
      ...inv,
      items: inv.items as InvoiceItem[]
    }));

    return {
      company: { ...company, created_at: company.created_at || new Date().toISOString() } as Company,
      invoices: parsedInvoices,
      uploadedFiles: uploadFiles,
      calculation_inputs: calculationInputs
    } as CompanyData;

  }, [selectedCompanyId]);


  const handleAddCompany = async (company: Omit<Company, 'id' | 'created_at'>) => {
    try {
      console.log('handleAddCompany called with:', company);
      const newCompany: CompanyEntity = {
        ...company,
        created_at: new Date().toISOString()
      };
      console.log('About to add company to DB:', newCompany);
      const id = await db.companies.add(newCompany);
      console.log('Company added with ID:', id);
      setSelectedCompanyId(id as number);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error adding company:', error);
      alert(`Erro ao criar empresa: ${error}`);
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta empresa e TODOS os seus dados?')) {
      await db.transaction('rw', db.companies, db.invoices, db.files, db.calculations, async () => {
        await db.companies.delete(id);
        await db.invoices.where('companyId').equals(id).delete();
        await db.files.where('companyId').equals(id).delete();
        await db.calculations.where('companyId').equals(id).delete();
      });
      if (selectedCompanyId === id) {
        setSelectedCompanyId(null);
      }
    }
  };

  const handleFilesUploaded = async (newFiles: UploadFile[]) => {
    if (!selectedCompanyId) return;
    // Add companyId to files
    const filesWithId = newFiles.map(f => ({ ...f, companyId: selectedCompanyId }));
    // @ts-ignore
    await db.files.bulkAdd(filesWithId);
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!selectedCompanyId) return;
    await db.files.delete(fileId);
  };

  const handleProcessFiles = async () => {
    if (!activeCompanyData || !selectedCompanyId) return;

    const pendingFiles = activeCompanyData.uploadedFiles.filter(f => f.status === UploadStatus.Pending);
    if (pendingFiles.length === 0) return;

    const newInvoices: InvoiceEntity[] = [];
    const processedFileIds: number[] = [];
    const failedFileIds: number[] = [];

    for (const file of pendingFiles) {
      try {
        const invoice = parseNFeXML(file.content, file.name);
        if (invoice) {
          // Classify items
          invoice.items = invoice.items.map(item => {
            const { isMonofasico, ruleDescription } = checkIsMonofasico(item.ncm_code);
            return {
              ...item,
              is_monofasico: isMonofasico,
              classification_rule: ruleDescription,
              needs_human_review: ruleDescription.includes('Divergência') || ruleDescription.includes('Verificar')
            };
          });

          // Add companyId and prepare for DB
          const invoiceEntity: InvoiceEntity = {
            ...invoice,
            companyId: selectedCompanyId
          };
          newInvoices.push(invoiceEntity);
          processedFileIds.push(file.id);
        } else {
          failedFileIds.push(file.id);
        }
      } catch (e) {
        console.error(`Error processing file ${file.name}:`, e);
        failedFileIds.push(file.id);
      }
    }

    // Save to DB
    await db.transaction('rw', db.invoices, db.files, async () => {
      if (newInvoices.length > 0) {
        await db.invoices.bulkAdd(newInvoices);
      }

      // Update file statuses
      for (const id of processedFileIds) {
        await db.files.update(id, { status: UploadStatus.Processed });
      }
      for (const id of failedFileIds) {
        await db.files.update(id, { status: UploadStatus.Failed });
      }
    });

    setCurrentView('review');
  };

  const handleReviewSave = async (updatedInvoices: Invoice[]) => {
    if (!selectedCompanyId) return;

    // Update invoices in DB
    await db.transaction('rw', db.invoices, async () => {
      for (const inv of updatedInvoices) {
        // We need to cast back to InvoiceEntity structure (items is JSON/object stored)
        // Dexie stores objects, so we just need to make sure it matches the interface
        const invoiceEntity: InvoiceEntity = {
          ...inv,
          companyId: selectedCompanyId
        };
        await db.invoices.put(invoiceEntity);
      }
    });
    alert('Revisão salva com sucesso!');
    setCurrentView('calculations');
  };

  const handleCalculationsSave = async (inputs: Record<string, CalculationInput>) => {
    if (!selectedCompanyId) return;

    const calculationEntities: CalculationEntity[] = Object.entries(inputs).map(([month, data]) => ({
      companyId: selectedCompanyId,
      competence_month: month,
      ...data
    }));

    await db.calculations.bulkPut(calculationEntities);
    alert('Cálculos salvos com sucesso!');
    setCurrentView('reports');
  };


  if (!selectedCompanyId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <CompanyManager
          companies={(companies || []).map(c => ({ ...c, id: c.id!, created_at: c.created_at || new Date().toISOString() }))}
          onSelectCompany={(id) => {
            setSelectedCompanyId(id);
            setCurrentView('dashboard');
          }}
          onCreateCompany={handleAddCompany}
          onDeleteCompany={handleDeleteCompany}
        />
      </div>
    );
  }

  if (!activeCompanyData) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <DashboardLayout
      activePage={currentView}
      onNavigate={(view) => setCurrentView(view as Page)}
      onExitCompany={() => setSelectedCompanyId(null)}
      companyName={activeCompanyData.company.name}
    >
      {currentView === 'dashboard' && (
        <Dashboard
          data={activeCompanyData}
          onNavigate={(view) => setCurrentView(view as Page)}
        />
      )}

      {currentView === 'upload' && (
        <UploadArea
          files={activeCompanyData.uploadedFiles}
          onFilesUploaded={handleFilesUploaded}
          onProcessFiles={handleProcessFiles}
          onDeleteFile={handleDeleteFile}
        />
      )}

      {currentView === 'review' && (
        <ReviewTable
          invoices={activeCompanyData.invoices}
          onSave={handleReviewSave}
        />
      )}

      {currentView === 'calculations' && (
        <CalculationsInput
          invoices={activeCompanyData.invoices}
          initialData={activeCompanyData.calculation_inputs}
          onSave={handleCalculationsSave}
        />
      )}

      {currentView === 'reports' && (
        <ReportsGenerator
          company={activeCompanyData.company}
          invoices={activeCompanyData.invoices}
          calculationInputs={activeCompanyData.calculation_inputs}
        />
      )}
    </DashboardLayout>
  );
};

export default App;
