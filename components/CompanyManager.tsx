import React, { useState } from 'react';
import { Company } from '../types';
import { Building2, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface CompanyManagerProps {
  companies: Company[];
  onSelectCompany: (id: number) => void;
  onCreateCompany: (company: Omit<Company, 'id' | 'created_at'>) => void;
  onDeleteCompany: (id: number) => void;
}

const CompanyManager: React.FC<CompanyManagerProps> = ({ companies, onSelectCompany, onCreateCompany, onDeleteCompany }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCNPJ, setNewCompanyCNPJ] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompanyName && newCompanyCNPJ) {
      // Actually, looking at the props: onCreateCompany: (company: Omit<Company, 'id' | 'created_at'>) => void;
      // So we should NOT pass ID.
      onCreateCompany({
        name: newCompanyName,
        cnpj: newCompanyCNPJ,
      });

      setNewCompanyName('');
      setNewCompanyCNPJ('');
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Gerenciamento de Empresas
              </CardTitle>
              <CardDescription>Selecione uma empresa para iniciar ou cadastre uma nova.</CardDescription>
            </div>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isAdding ? (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-secondary/20 animate-in fade-in slide-in-from-top-2">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nome da Empresa</label>
                  <input
                    id="name"
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ex: Minha Loja LTDA"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="cnpj" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">CNPJ</label>
                  <input
                    id="cnpj"
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="00.000.000/0000-00"
                    value={newCompanyCNPJ}
                    onChange={(e) => setNewCompanyCNPJ(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                <Button type="submit">Cadastrar Empresa</Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {companies.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  Nenhuma empresa cadastrada. Clique em "Nova Empresa" para começar.
                </div>
              ) : (
                companies.map((company) => (
                  <div
                    key={company.id}
                    className="group flex flex-col justify-between rounded-lg border p-4 hover:bg-secondary/50 hover:border-primary/50 transition-all cursor-pointer relative"
                    onClick={() => onSelectCompany(company.id)}
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold leading-none tracking-tight text-lg group-hover:text-primary transition-colors">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">{company.cnpj}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">Criada em {new Date(company.created_at).toLocaleDateString()}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Tem certeza que deseja excluir esta empresa?')) {
                            onDeleteCompany(company.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyManager;
