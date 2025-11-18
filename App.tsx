
import React, { useState, useEffect, useMemo } from 'react';
import { UploadIcon, ReviewIcon, ReportIcon, LogoIcon, CalcIcon, TrashIcon } from './components/icons';
import UploadArea from './components/UploadArea';
import ReviewTable from './components/ReviewTable';
import ReportsGenerator from './components/ReportsGenerator';
import CompanyManager from './components/CompanyManager';
import CalculationsInput from './components/CalculationsInput';
import { parseNFeXML } from './utils/xmlParser';
import { Company, CompanyData, Invoice, InvoiceItem, UploadFile, UploadStatus, CalculationInput } from './types';
import { checkIsMonofasico } from './utils/ncmMatcher';
import { saveData, loadData } from './services/storage';


type Page = 'upload' | 'review' | 'calculations' | 'reports';

const MONOFASICO_CSTS = new Set(['04', '06', '07', '08', '09']);

const App: React.FC = () => {
  // Load data once and derive initial states from it to avoid re-loading or inconsistencies.
  const initialData = useMemo(() => loadData(), []);
  const [companiesData, setCompaniesData] = useState<Record<string, CompanyData>>(initialData);
  
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => {
    const companyIds = Object.keys(initialData);
    return companyIds.length > 0 ? companyIds[0] : null;
  });

  const [currentPage, setCurrentPage] = useState<Page>('upload');

  useEffect(() => {
    saveData(companiesData);
  }, [companiesData]);

  // This effect ensures that if the active company is removed or data becomes inconsistent,
  // we either select a new valid company or go back to the selection screen.
  useEffect(() => {
      if (activeCompanyId && !companiesData[activeCompanyId]) {
          // Active company no longer exists in data
          const companyIds = Object.keys(companiesData);
          // Try to switch to another company, or go to null (Manager) if none left
          setActiveCompanyId(companyIds.length > 0 ? companyIds[0] : null);
      }
  }, [companiesData, activeCompanyId]);


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

  const handleDeleteCompany = (companyId: string) => {
      setCompaniesData(prev => {
          const newData = { ...prev };
          delete newData[companyId];
          return newData;
      });
  };

  const handleDeleteActiveCompany = () => {
      if (!activeCompanyId) return;
      
      const companyData = companiesData[activeCompanyId];
      if (!companyData) return;

      const companyName = companyData.company.name;
      const idToDelete = activeCompanyId;
      
      if (window.confirm(`ATENÇÃO: Tem certeza que deseja excluir a empresa "${companyName}"?\n\nEsta ação apagará TODOS os dados, notas fiscais e apurações permanentemente.`)) {
          // 1. Exit the company context first to prevent rendering errors
          setActiveCompanyId(null);
          // 2. Delete the data from the store
          handleDeleteCompany(idToDelete);
      }
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
                // Lógica de Classificação
                const ncmCheck = checkIsMonofasico(item.ncm_code);
                const isNcmMono = ncmCheck.isMonofasico;
                const isCstMono = MONOFASICO_CSTS.has(item.cst_pis);

                // AGORA: Todos os itens vão para revisão (imperativo), 
                // mas já chegam com a sugestão marcada se o NCM bater.
                const needsReview = true; 
                
                let rule = '';
                
                // Define a descrição da regra para ajudar o humano
                if (isNcmMono && !isCstMono) {
                    rule = 'SUGESTÃO: SIM (Divergência: CST diz não)';
                } else if (!isNcmMono && isCstMono) {
                    rule = 'SUGESTÃO: NÃO (Divergência: CST diz sim)';
                } else if (isNcmMono) {
                    rule = 'SUGESTÃO: SIM (Automático)';
                } else {
                    rule = 'SUGESTÃO: NÃO';
                }

                return {
                    ...item,
                    is_monofasico: isNcmMono, // O sistema sugere marcando o checkbox
                    needs_human_review: needsReview, // Obrigatório o humano confirmar (botão salvar)
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

    alert(`${processedCount} faturas processadas com sucesso. ${failedCount > 0 ? `${failedCount} falharam.` : ''}\nTodos os ${itemsToReviewCount} itens foram enviados para revisão e validação manual.`);
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
            // Se o item foi editado, aplica as mudanças e remove flag de revisão.
            if (updatedItems[item.id]) {
              return { ...item, ...updatedItems[item.id], needs_human_review: false };
            }
            // Se o item estava sob revisão e NÃO foi editado, assumimos que o usuário aceitou o padrão (clicou em Salvar Tudo)
            // Então removemos a flag needs_human_review.
            if (item.needs_human_review) {
                return { ...item, needs_human_review: false };
            }
            return item;
          })
        }))
      }
    }));
  };
  
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
    // Defensively filter the companies prop to prevent crashes from malformed data.
    const validCompanies = (Object.values(companiesData) as CompanyData[])
      .filter(cd => cd && cd.company)
      .map(cd => cd.company);

    return <CompanyManager 
              companies={validCompanies} 
              onSelectCompany={handleCompanySelect}
              onAddCompany={handleAddCompany}
              onDeleteCompany={handleDeleteCompany}
            />;
  }

  const activeCompanyData = companiesData[activeCompanyId];

  if (!activeCompanyData) {
      // Fallback if data is missing
      return <div className="p-10 text-center">Erro: Dados da empresa não encontrados. <button className="text-blue-600 underline" onClick={() => setActiveCompanyId(null)}>Voltar</button></div>;
  }

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
        type="button"
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
          
          <div className="p-2 border-t border-gray-100 mt-4 space-y-2">
             <button
                type="button"
                onClick={handleGoToCompanyManager}
                className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-md transition-colors"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"></path></svg>
                Voltar para Seleção
            </button>
            
             <button
                type="button"
                onClick={handleDeleteActiveCompany}
                className="w-full flex items-center justify-center text-sm text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors"
            >
                <TrashIcon />
                <span className="ml-2">Excluir Empresa</span>
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
