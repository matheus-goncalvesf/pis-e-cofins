import React, { useState } from 'react';
import { Company } from '../types';
import { Building2, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface CompanyManagerProps {
  companies: Company[];
  onSelectCompany: (id: string) => void;
  onCreateCompany: (company: Omit<Company, 'id' | 'created_at'>) => void;
  onDeleteCompany: (id: string) => void;
}

const CompanyManager: React.FC<CompanyManagerProps> = ({ companies, onSelectCompany, onCreateCompany, onDeleteCompany }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCNPJ, setNewCompanyCNPJ] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompanyName && newCompanyCNPJ) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Logo and Branding */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <img
            src="/assets/logo.png"
            alt="RecuperaTax"
            className="h-48 mx-auto mb-4"
          />
          <p className="text-lg text-muted-foreground font-medium">
            Recuperação de Créditos PIS/COFINS
          </p>
          <div className="mt-2 h-1 w-24 mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  Gerenciamento de Empresas
                </CardTitle>
                <CardDescription className="mt-2">
                  Selecione uma empresa para iniciar ou cadastre uma nova.
                </CardDescription>
              </div>
              {!isAdding && (
                <Button
                  onClick={() => setIsAdding(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Empresa
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isAdding ? (
              <form onSubmit={handleSubmit} className="space-y-6 p-6 border-2 border-blue-100 rounded-xl bg-gradient-to-br from-blue-50/30 to-indigo-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Nome da Empresa
                    </label>
                    <input
                      id="name"
                      type="text"
                      className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
                      placeholder="Ex: Minha Loja LTDA"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="grid gap-3">
                    <label htmlFor="cnpj" className="text-sm font-semibold text-gray-700">
                      CNPJ
                    </label>
                    <input
                      id="cnpj"
                      type="text"
                      className="flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
                      placeholder="00.000.000/0000-00"
                      value={newCompanyCNPJ}
                      onChange={(e) => setNewCompanyCNPJ(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAdding(false)}
                    className="border-2"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                  >
                    Cadastrar Empresa
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {companies.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500 mb-2">
                      Nenhuma empresa cadastrada
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Clique em "Nova Empresa" para começar
                    </p>
                  </div>
                ) : (
                  companies.map((company) => (
                    <div
                      key={company.id}
                      className="group relative flex flex-col justify-between rounded-xl border-2 border-gray-200 p-5 bg-white hover:border-blue-400 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                      onClick={() => onSelectCompany(company.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-tight text-gray-900 group-hover:text-blue-700 transition-colors">
                            {company.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 font-medium">
                            {company.cnpj}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500 font-medium">
                          {new Date(company.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Tem certeza que deseja excluir "${company.name}"?`)) {
                              onDeleteCompany(company.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500 animate-in fade-in duration-1000">
          <p>Sistema profissional de recuperação tributária</p>
        </div>
      </div>
    </div>
  );
};

export default CompanyManager;
