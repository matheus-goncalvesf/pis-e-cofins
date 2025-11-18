import React, { useState, useEffect } from 'react';
import { UploadIcon, ReviewIcon, ReportIcon, LogoIcon, CalcIcon } from './components/icons';
import UploadArea from './components/UploadArea';
import ReviewTable from './components/ReviewTable';
import ReportsGenerator from './components/ReportsGenerator';
import CompanyManager from './components/CompanyManager';
import CalculationsInput from './components/CalculationsInput';
import { parseNFeXML } from './utils/xmlParser';
import { Company, CompanyData, Invoice, InvoiceItem, UploadFile, UploadStatus, CalculationInput } from './types';
import { MONOFASICO_NCM_TABLE } from './data/mockData';
import { saveData, loadData } from './services/storage';


type Page = 'upload' | 'review' | 'calculations' | 'reports';

const MONOFASICO_CSTS = new Set(['04', '06', '07', '08', '09']);

const App: React.FC = () => {
  const [companiesData, setCompaniesData] = useState<Record<string, CompanyData>>(loadData());
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('upload');

  useEffect(() => {
    saveData(companiesData);
  }, [companiesData]);

  const handleCompanySelect = (companyId: string) => {
    setActiveCompanyId(companyId);
    setCurrentPage('upload');
  };

  const handleAddCompany = (company: Company) => {
    const newCompanyData = { company, invoices: [], calculation_inputs: {}, uploadedFiles: [] };
    setCompaniesData(prev => ({
      ...prev,
      [company.id]: newCompanyData
    }));
    setActiveCompanyId(company.id);
    setCurrentPage('upload');
  };
  
  const handleGoToCompanyManager = () => {
    setActiveCompanyId(null);
  }

  const handleFilesUploaded = (newFiles: UploadFile[]) => {
      if (!activeCompanyId) return;
      setCompaniesData(prev => ({
          ...prev,
          [activeCompanyId]: {
              ...prev[activeCompanyId],
              uploadedFiles: [...prev[activeCompanyId].uploadedFiles, ...newFiles]
          }
      }));
  };
  
  const handleFileDelete = (fileId: number) => {
       if (!activeCompanyId) return;
        setCompaniesData(prev => ({
          ...prev,
          [activeCompanyId]: {
              ...prev[activeCompanyId],
              uploadedFiles: prev[activeCompanyId].uploadedFiles.filter(f => f.id !== fileId)
          }
      }));
  };

  const handleClearFiles = () => {
      if (!activeCompanyId) return;
        setCompaniesData(prev => ({
          ...prev,
          [activeCompanyId]: {
              ...prev[activeCompanyId],
              uploadedFiles: []
          }
      }));
  };

  const handleProcessFiles = () => {
    if (!activeCompanyId) return;

    const filesToProcess = companiesData[activeCompanyId].uploadedFiles.filter(f => f.status === UploadStatus.Pending);
    if (filesToProcess.length === 0) {
        alert("Nenhum arquivo novo para processar.");
        return;
    }
    
    let processedCount = 0;
    const newInvoices: Invoice[] = [];

    const updatedUploadedFiles = companiesData[activeCompanyId].uploadedFiles.map(file => {
        if (file.status !== UploadStatus.Pending) return file;

        const parsedInvoice = parseNFeXML(file.content);
        
        if (!parsedInvoice) {
            console.warn(`Falha ao processar o arquivo: ${file.name}`);
            return { ...file, status: UploadStatus.Failed };
        }

        const classifiedInvoice: Invoice = {
            ...parsedInvoice,
            items: parsedInvoice.items.map(item => {
                const isNcmMono = MONOFASICO_NCM_TABLE.has(item.ncm_code);
                const isCstMono = MONOFASICO_CSTS.has(item.cst_pis);

                const needsReview = isNcmMono !== isCstMono;
                
                let rule = 'NÃO MONOFÁSICO';
                if (isNcmMono && isCstMono) rule = 'OK: NCM E CST MONOFÁSICOS';
                else if (isNcmMono && !isCstMono) rule = 'REVISAR: NCM MONOFÁSICO, CST NÃO';
                else if (!isNcmMono && isCstMono) rule = 'REVISAR: NCM NÃO MONOFÁSICO, CST SIM';

                return {
                    ...item,
                    is_monofasico: isNcmMono, // A regra do NCM prevalece para o cálculo
                    needs_human_review: needsReview,
                    classification_rule: rule,
                };
            })
        };
        processedCount++;
        newInvoices.push(classifiedInvoice);
        return { ...file, status: UploadStatus.Processed };
    });

    setCompaniesData(prev => ({
      ...prev,
      [activeCompanyId]: {
        ...prev[activeCompanyId],
        invoices: [...prev[activeCompanyId].invoices, ...newInvoices],
        uploadedFiles: updatedUploadedFiles,
      }
    }));
    
    const itemsToReviewCount = newInvoices.reduce((acc, inv) => acc + inv.items.filter(item => item.needs_human_review).length, 0);
    const failedCount = filesToProcess.length - processedCount;

    alert(`${processedCount} faturas processadas com sucesso. ${failedCount > 0 ? `${failedCount} falharam.` : ''}\n${itemsToReviewCount} itens foram marcados para revisão manual.`);
    setCurrentPage('review');
  };


  const handleReviewSave = (updatedItems: Record<number, Partial<InvoiceItem>>) => {
    if (!activeCompanyId) return;
    setCompaniesData(prev => ({
      ...prev,
      [activeCompanyId]: {
        ...prev[activeCompanyId],
        invoices: prev[activeCompanyId].invoices.map(invoice => ({
          ...invoice,
          items: invoice.items.map(item => {
            if (updatedItems[item.id]) {
              return { ...item, ...updatedItems[item.id], needs_human_review: false };
            }
            return item;
          })
        }))
      }
    }));
  };
  
  // FIX: Correct the type of `inputs` to `Record<string, CalculationInput>`.
  // A previous incorrect or weaker type (e.g., `any`) was causing type pollution in
  // the `companiesData` state, leading to a type error when accessing `cd.company`.
  const handleCalculationsSave = (inputs: Record<string, CalculationInput>) => {
    if (!activeCompanyId) return;
    setCompaniesData(prev => ({
        ...prev,
        [activeCompanyId]: {
            ...prev[activeCompanyId],
            calculation_inputs: {
                ...prev[activeCompanyId].calculation_inputs,
                ...inputs
            }
        }
    }));
    alert("Dados de apuração salvos com sucesso!");
    setCurrentPage('reports');
  };

  if (!activeCompanyId) {
    return <CompanyManager 
              companies={Object.values(companiesData).map(cd => cd.company)} 
              onSelectCompany={handleCompanySelect}
              onAddCompany={handleAddCompany}
            />;
  }

  const activeCompanyData = companiesData[activeCompanyId];

  const renderPage = () => {
    switch (currentPage) {
      case 'upload':
        return <UploadArea 
                  uploadedFiles={activeCompanyData.uploadedFiles}
                  onFilesUploaded={handleFilesUploaded}
                  onProcessFiles={handleProcessFiles}
                  onFileDelete={handleFileDelete}
                  onClearFiles={handleClearFiles}
                />;
      case 'review':
        return <ReviewTable invoices={activeCompanyData.invoices} onSaveChanges={handleReviewSave} />;
      case 'calculations':
        return <CalculationsInput companyData={activeCompanyData} onSave={handleCalculationsSave} />;
      case 'reports':
        return <ReportsGenerator companyData={activeCompanyData} />;
      default:
        return <UploadArea 
                  uploadedFiles={activeCompanyData.uploadedFiles}
                  onFilesUploaded={handleFilesUploaded}
                  onProcessFiles={handleProcessFiles}
                  onFileDelete={handleFileDelete}
                  onClearFiles={handleClearFiles}
                />;
    }
  };

  const NavItem: React.FC<{ page: Page; label: string; icon: React.ReactNode; }> = ({ page, label, icon }) => (
    <li>
      <button
        onClick={() => setCurrentPage(page)}
        className={`flex items-center p-2 w-full text-base font-normal rounded-lg transition duration-75 group ${
          currentPage === page
            ? 'bg-blue-100 text-blue-900'
            : 'text-gray-900 hover:bg-gray-100'
        }`}
      >
        {icon}
        <span className="ml-3">{label}</span>
      </button>
    </li>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-64" aria-label="Sidebar">
        <div className="overflow-y-auto h-full py-4 px-3 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex items-center pl-2.5 mb-5">
            <LogoIcon />
            <span className="self-center text-xl font-semibold whitespace-nowrap ml-2 text-gray-800">Recupera PIS/COFINS</span>
          </div>
          <div className="flex-1">
            <div className="p-2 mb-4 bg-gray-100 rounded-lg">
                <p className="text-xs font-semibold text-gray-500">EMPRESA ATIVA</p>
                <p className="font-bold text-gray-800 truncate">{activeCompanyData.company.name}</p>
                <p className="text-sm text-gray-600">{activeCompanyData.company.cnpj}</p>
            </div>
            <ul className="space-y-2">
              <NavItem page="upload" label="Upload de Notas" icon={<UploadIcon />} />
              <NavItem page="review" label="Revisão Manual" icon={<ReviewIcon />} />
              <NavItem page="calculations" label="Apuração & Cálculo" icon={<CalcIcon />} />
              <NavItem page="reports" label="Relatórios" icon={<ReportIcon />} />
            </ul>
          </div>
          <div className="p-2">
            <button
                onClick={handleGoToCompanyManager}
                className="w-full text-sm text-gray-600 hover:text-blue-700 hover:bg-gray-100 p-2 rounded-md"
            >
                Trocar de Empresa
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;