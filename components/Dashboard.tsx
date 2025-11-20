import React, { useMemo } from 'react';
import { CompanyData } from '../types';
import { useCalculations } from '../hooks/useCalculations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { DollarSign, TrendingUp, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface DashboardProps {
    data: CompanyData;
    onNavigate: (page: 'upload' | 'review' | 'calculations' | 'reports') => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
    const calculations = useCalculations(data.invoices, data.calculation_inputs);

    const stats = useMemo(() => {
        const totalCredit = calculations.reduce((sum, calc) => sum + calc.credit_amount, 0);
        const totalMonofasico = calculations.reduce((sum, calc) => sum + calc.monofasico_revenue, 0);
        const totalRevenue = calculations.reduce((sum, calc) => sum + calc.total_revenue, 0);
        const invoiceCount = data.invoices.length;
        const pendingReviewCount = data.invoices.reduce((acc, inv) => acc + inv.items.filter(i => i.needs_human_review).length, 0);

        return {
            totalCredit,
            totalMonofasico,
            totalRevenue,
            invoiceCount,
            pendingReviewCount
        };
    }, [calculations, data.invoices]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Visão Geral</h1>
                <p className="mt-1 text-muted-foreground">Resumo da recuperação de créditos para {data.company.name}.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Crédito Estimado</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCredit)}</div>
                        <p className="text-xs text-muted-foreground">Recuperável PIS/COFINS</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Monofásica</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalMonofasico)}</div>
                        <p className="text-xs text-muted-foreground">Identificada nos XMLs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Notas Processadas</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.invoiceCount}</div>
                        <p className="text-xs text-muted-foreground">Arquivos XML importados</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendências</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.pendingReviewCount}</div>
                        <p className="text-xs text-muted-foreground">Itens aguardando revisão</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Próximos Passos</CardTitle>
                        <CardDescription>Siga o fluxo para completar a recuperação.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                            <div className="space-y-1">
                                <p className="font-medium">1. Importar Notas Fiscais</p>
                                <p className="text-sm text-muted-foreground">Carregue os arquivos XML para análise.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onNavigate('upload')}>Ir para Upload <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                            <div className="space-y-1">
                                <p className="font-medium">2. Revisar Classificação</p>
                                <p className="text-sm text-muted-foreground">Valide os produtos monofásicos identificados.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onNavigate('review')}>Ir para Revisão <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                            <div className="space-y-1">
                                <p className="font-medium">3. Calcular Créditos</p>
                                <p className="text-sm text-muted-foreground">Informe dados do Simples Nacional e apure.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onNavigate('calculations')}>Ir para Cálculo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Status do Processo</CardTitle>
                        <CardDescription>Progresso atual da recuperação.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Importação</span>
                                {stats.invoiceCount > 0 ? <Badge variant="success" className="bg-green-100 text-green-800">Concluído</Badge> : <Badge variant="secondary">Pendente</Badge>}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Revisão</span>
                                {stats.pendingReviewCount === 0 && stats.invoiceCount > 0 ? <Badge variant="success" className="bg-green-100 text-green-800">Concluído</Badge> : <Badge variant="warning" className="bg-orange-100 text-orange-800">Em Andamento</Badge>}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Cálculo</span>
                                {stats.totalCredit > 0 ? <Badge variant="success" className="bg-green-100 text-green-800">Concluído</Badge> : <Badge variant="secondary">Pendente</Badge>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
