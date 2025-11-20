import React from 'react';
import { LayoutDashboard, Upload, FileText, Calculator, Menu, X, LogOut, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../utils/cn';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activePage: string;
    onNavigate: (page: any) => void;
    onExitCompany: () => void;
    companyName?: string;
}

const SidebarItem = ({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
    >
        <Icon className="h-4 w-4" />
        {label}
    </button>
);

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    companyName,
    activePage,
    onNavigate,
    onExitCompany
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                    !isSidebarOpen && "-translate-x-full md:hidden"
                )}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b">
                        <div className="flex items-center gap-2 font-bold text-xl">
                            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <span>Recupera<span className="text-primary">Tax</span></span>
                        </div>
                    </div>

                    <div className="flex-1 py-6 px-3 space-y-1">
                        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Principal
                        </div>
                        <SidebarItem
                            icon={LayoutDashboard}
                            label="Visão Geral"
                            isActive={activePage === 'dashboard'}
                            onClick={() => onNavigate('dashboard')}
                        />
                        <SidebarItem
                            icon={Upload}
                            label="Importar XMLs"
                            isActive={activePage === 'upload'}
                            onClick={() => onNavigate('upload')}
                        />
                        <SidebarItem
                            icon={FileText}
                            label="Revisão Fiscal"
                            isActive={activePage === 'review'}
                            onClick={() => onNavigate('review')}
                        />

                        <div className="px-3 mt-6 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Relatórios
                        </div>
                        <SidebarItem
                            icon={Calculator}
                            label="Cálculos"
                            isActive={activePage === 'calculations'}
                            onClick={() => onNavigate('calculations')}
                        />
                        <Button
                            variant={activePage === 'reports' ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => onNavigate('reports')}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Relatórios
                        </Button>
                    </div>

                    <div className="p-4 border-t border-border">
                        {companyName && (
                            <div className="mb-4 px-2">
                                <p className="text-xs text-muted-foreground">Empresa Ativa</p>
                                <p className="font-medium truncate">{companyName}</p>
                            </div>
                        )}
                        <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={onExitCompany}>
                            <LogOut className="h-4 w-4" />
                            Sair da Empresa
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b bg-card/50 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h1 className="text-lg font-semibold">
                            {activePage === 'dashboard' && 'Visão Geral'}
                            {activePage === 'upload' && 'Importação de Arquivos'}
                            {activePage === 'review' && 'Revisão e Classificação'}
                            {activePage === 'calculations' && 'Cálculo do Simples'}
                            {activePage === 'reports' && 'Relatórios e Exportação'}
                        </h1>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
