// CompanyManager.tsx — versão corrigida

import React, { useState } from 'react';
import { Company } from '../types';
import { LogoIcon, TrashIcon } from './icons';

interface Props {
  companies: Company[];
  onSelectCompany: (companyId: string) => void;
  onAddCompany: (company: Company) => void;
  onDeleteCompany: (companyId: string) => void;
}

const CompanyManager: React.FC<Props> = ({ companies, onSelectCompany, onAddCompany, onDeleteCompany }) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && cnpj) {
      const newCompany: Company = {
        id: `comp_${Date.now()}`,
        name,
        cnpj
      };
      onAddCompany(newCompany);
      setName('');
      setCnpj('');
      setShowForm(false);
    }
  };
  
  const handleCardClick = (companyId: string) => {
      onSelectCompany(companyId);
  };

  const handleDeleteClick = (e: React.MouseEvent, companyId: string) => {
      e.stopPropagation();
      e.preventDefault();

      if (window.confirm('Tem certeza que deseja excluir esta empresa? Todos os dados e apurações serão perdidos permanentemente.')) {
          onDeleteCompany(companyId);
      }
  };

  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex justify-center items-center mb-8">
            <LogoIcon />
            <h1 className="text-3xl font-bold text-gray-800 ml-3">Recupera PIS/COFINS</h1>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Selecione uma Empresa</h2>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              {showForm ? 'Cancelar' : '+ Nova Empresa'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAdd} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                  <input
                    type="text"
                    id="company_name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="company_cnpj" className="block text-sm font-medium text-gray-700">CNPJ</label>
                  <input
                    type="text"
                    id="company_cnpj"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="00.000.000/0001-00"
                    required
                  />
                </div>
              </div>
              <div className="text-right mt-4">
                <button type="submit" className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">
                  Salvar Empresa
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(company => (
              <div 
                key={company.id} 
                className="relative p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white group cursor-pointer" 
                onClick={() => handleCardClick(company.id)}
              >
                <button 
                    type="button"
                    onClick={() => onDeleteCompany(company.id)}
                    className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all shadow-sm z-50 hover:scale-110"
                    title="Excluir empresa"
                >
                   <TrashIcon />
                </button>

                <h3 className="text-lg font-bold text-gray-800 truncate pr-6">{company.name}</h3>
                <p className="text-gray-500 font-mono my-2">{company.cnpj}</p>
                <div className="mt-4 text-blue-600 font-semibold text-sm">
                  Clique para selecionar
                </div>
              </div>
            ))}
             {companies.length === 0 && !showForm && (
                <div className="col-span-full text-center py-8 text-gray-500">
                    <p>Nenhuma empresa cadastrada.</p>
                    <p>Clique em "+ Nova Empresa" para começar.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyManager;
