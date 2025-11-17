import React, { useState } from 'react';
import { CompanyData } from '../types';
import { useCalculations } from '../hooks/useCalculations';
import BuiltInReport from './BuiltInReport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Helper to format currency
const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type ReportView = 'monthly' | 'yearly' | 'total';

const ReportsGenerator: React.FC<{ companyData: CompanyData }> = ({ companyData }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentView, setCurrentView] = useState<ReportView>('monthly');
    
    const calculations = useCalculations(companyData.invoices, companyData.calculation_inputs);

    const handleGenerateReport = (format: 'Excel' | 'PDF') => {
        if (calculations.length === 0) {
            alert('Não há dados calculados para gerar relatórios. Preencha os dados na tela de Apuração & Cálculo.');
            return;
        }
        setIsGenerating(true);
        setTimeout(() => { // Simulate processing time
            try {
                if (format === 'Excel') {
                    generateExcel();
                } else {
                    generatePdf();
                }
            } catch (error) {
                console.error("Error generating report:", error);
                alert("Ocorreu um erro ao gerar o relatório.");
            } finally {
                setIsGenerating(false);
            }
        }, 500);
    };

    const generateExcel = () => {
        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const totalCredit = calculations.reduce((sum, calc) => sum + calc.credit_amount, 0);
        const totalRevenue = calculations.reduce((sum, calc) => sum + calc.total_revenue, 0);
        const totalMonofasico = calculations.reduce((sum, calc) => sum + calc.monofasico_revenue, 0);
        
        const summary_data = [
            { Descrição: "Crédito Total Apurado", Valor: totalCredit },
            { Descrição: "Receita Total no Período", Valor: totalRevenue },
            { Descrição: "Receita Monofásica no Período", Valor: totalMonofasico },
            { Descrição: "Meses Apurados", Valor: calculations.length },
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summary_data);
        wsSummary["B2"].z = 'R$ #,##0.00';
        wsSummary["B3"].z = 'R$ #,##0.00';
        wsSummary["B4"].z = 'R$ #,##0.00';
        XLSX.utils.book_append_sheet(wb, wsSummary, "Sumário Total");


        // Monthly Details Sheet
        const monthly_details = calculations.map(c => ({
            "Mês": c.competence_month,
            "Receita Total": c.total_revenue,
            "Receita Monofásica": c.monofasico_revenue,
            "DAS Pago": c.das_paid,
            "Alíquota Efetiva": c.effective_aliquot,
            "Novo DAS Devido": c.recalculated_das_due,
            "Crédito Apurado": c.credit_amount
        }));
        const wsMonthly = XLSX.utils.json_to_sheet(monthly_details);
        XLSX.utils.book_append_sheet(wb, wsMonthly, "Apuração Mensal");

        // Items Sheet
        const detailedItems = companyData.invoices.flatMap(inv => 
            inv.items.filter(item => item.is_monofasico).map(item => ({
                'Chave de Acesso': inv.access_key,
                'Data Emissão': new Date(inv.issue_date).toLocaleDateString('pt-BR'),
                'Descrição do Produto': item.description,
                'NCM': item.ncm_code,
                'Valor': item.total_value,
                'Regra': item.classification_rule,
            }))
        );
        const wsItems = XLSX.utils.json_to_sheet(detailedItems);
        XLSX.utils.book_append_sheet(wb, wsItems, "Itens Monofásicos");

        XLSX.writeFile(wb, `Relatorio_PIS-COFINS_${companyData.company.name}.xlsx`);
    };

    const generatePdf = () => {
        const doc = new jsPDF();
        
        doc.text(`Relatório de Créditos - ${companyData.company.name}`, 14, 20);
        doc.setFontSize(12);
        
        const totalCredit = calculations.reduce((sum, calc) => sum + calc.credit_amount, 0);
        
        doc.text(`Crédito Total Apurado: ${formatCurrency(totalCredit)}`, 14, 30);
        
        autoTable(doc, {
            startY: 40,
            head: [['Mês', 'Receita Total', 'Receita Monofásica', 'Crédito Apurado']],
            body: calculations.map(c => [
                c.competence_month,
                formatCurrency(c.total_revenue),
                formatCurrency(c.monofasico_revenue),
                formatCurrency(c.credit_amount),
            ]),
            theme: 'striped'
        });

        doc.save(`Relatorio_PIS-COFINS_${companyData.company.name}.pdf`);
    };


    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
                <p className="mt-1 text-md text-gray-600">Analise os resultados e exporte os dados consolidados.</p>
            </header>

             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex border border-gray-200 rounded-lg p-1 space-x-1 bg-gray-50">
                        <button onClick={() => setCurrentView('monthly')} className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${currentView === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>Mensal</button>
                        <button onClick={() => setCurrentView('yearly')} className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${currentView === 'yearly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>Anual</button>
                        <button onClick={() => setCurrentView('total')} className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${currentView === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>Período Total</button>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => handleGenerateReport('Excel')}
                            disabled={isGenerating || calculations.length === 0}
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                        >
                            {isGenerating ? '...' : 'Gerar Excel'}
                        </button>
                        <button
                            onClick={() => handleGenerateReport('PDF')}
                            disabled={isGenerating || calculations.length === 0}
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
                        >
                            {isGenerating ? '...' : 'Gerar PDF'}
                        </button>
                    </div>
                </div>
                 {isGenerating && (
                         <div className="text-center text-sm text-gray-600 flex items-center justify-center my-4">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Seu relatório está sendo preparado...
                         </div>
                    )}
                <BuiltInReport view={currentView} calculations={calculations} />
            </div>
        </div>
    );
};

export default ReportsGenerator;