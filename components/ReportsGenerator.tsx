import React, { useState } from 'react';
import { Company, Invoice, CalculationInput } from '../types';
import { useCalculations } from '../hooks/useCalculations';
import BuiltInReport from './BuiltInReport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, FileText, Loader2, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';

// Helper to format currency
const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatPercent = (value: number) => (value * 100).toFixed(2) + '%';

type ReportView = 'monthly' | 'yearly' | 'total';

interface ReportsGeneratorProps {
    company: Company;
    invoices: Invoice[];
    calculationInputs: Record<string, CalculationInput>;
}

const ReportsGenerator: React.FC<ReportsGeneratorProps> = ({ company, invoices, calculationInputs }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentView, setCurrentView] = useState<ReportView>('monthly');

    const calculations = useCalculations(invoices, calculationInputs);

    const handleGenerateReport = (format: 'Excel' | 'PDF') => {
        if (calculations.length === 0) {
            // alert('Não há dados calculados para gerar relatórios. Preencha os dados na tela de Apuração & Cálculo.');
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
            "Anexo": c.anexo_used,
            "Receita Total": c.total_revenue,
            "Receita Monofásica": c.monofasico_revenue,
            "DAS Pago": c.das_paid,
            "Alíquota Efetiva": c.effective_aliquot,
            "Partilha PIS/COFINS": c.pis_cofins_share,
            "Novo DAS Devido": c.recalculated_das_due,
            "Crédito Apurado": c.credit_amount
        }));
        const wsMonthly = XLSX.utils.json_to_sheet(monthly_details);
        XLSX.utils.book_append_sheet(wb, wsMonthly, "Apuração Mensal");

        // Items Sheet
        const detailedItems = invoices.flatMap(inv =>
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

        XLSX.writeFile(wb, `Relatorio_PIS-COFINS_${company.name}.xlsx`);
    };

    const generatePdf = () => {
        const doc = new jsPDF();

        doc.text(`Relatório de Créditos - ${company.name}`, 14, 20);
        doc.setFontSize(12);

        const totalCredit = calculations.reduce((sum, calc) => sum + calc.credit_amount, 0);

        doc.text(`Crédito Total Apurado: ${formatCurrency(totalCredit)}`, 14, 30);

        autoTable(doc, {
            startY: 40,
            head: [['Mês', 'Anexo', 'Receita', 'Monofásica', '% PIS/COF', 'Crédito']],
            body: calculations.map(c => [
                c.competence_month,
                c.anexo_used.replace('Anexo ', '').split(' - ')[0], // Shorten for PDF
                formatCurrency(c.total_revenue),
                formatCurrency(c.monofasico_revenue),
                formatPercent(c.pis_cofins_share),
                formatCurrency(c.credit_amount),
            ]),
            theme: 'striped'
        });

        doc.save(`Relatorio_PIS-COFINS_${company.name}.pdf`);
    };


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Relatórios</h1>
                    <p className="mt-1 text-muted-foreground">Analise os resultados e exporte os dados consolidados.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
                            <Button
                                variant={currentView === 'monthly' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setCurrentView('monthly')}
                                className="h-8"
                            >
                                Mensal
                            </Button>
                            <Button
                                variant={currentView === 'yearly' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setCurrentView('yearly')}
                                className="h-8"
                            >
                                Anual
                            </Button>
                            <Button
                                variant={currentView === 'total' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setCurrentView('total')}
                                className="h-8"
                            >
                                Período Total
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleGenerateReport('Excel')}
                                disabled={isGenerating || calculations.length === 0}
                                variant="outline"
                                className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                                Excel
                            </Button>
                            <Button
                                onClick={() => handleGenerateReport('PDF')}
                                disabled={isGenerating || calculations.length === 0}
                                variant="outline"
                                className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                                PDF
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {calculations.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Não há dados calculados para gerar relatórios. Preencha os dados na tela de Apuração & Cálculo.</p>
                        </div>
                    ) : (
                        <BuiltInReport view={currentView} calculations={calculations} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportsGenerator;
