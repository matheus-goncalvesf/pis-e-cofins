import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceItem } from '../types';

const ReviewTable: React.FC<{ invoices: Invoice[]; onSaveChanges: (editedItems: Record<number, Partial<InvoiceItem>>) => void }> = ({ invoices, onSaveChanges }) => {
  const [editedItems, setEditedItems] = useState<Record<number, Partial<InvoiceItem>>>({});

  const invoicesToReview = useMemo(() => {
    return invoices.map(invoice => ({
        ...invoice,
        itemsToReview: invoice.items.filter(item => item.needs_human_review)
    })).filter(invoice => invoice.itemsToReview.length > 0);
  }, [invoices]);

  const handleInputChange = (id: number, field: 'ncm_code' | 'description', value: string) => {
    setEditedItems(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleToggleChange = (id: number, field: 'is_monofasico', value: boolean) => {
    setEditedItems(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };
  
  const handleSaveAllChanges = () => {
      // Mesmo que editedItems esteja vazio, chamamos save para "confirmar" a revisão dos itens não alterados
      onSaveChanges(editedItems);
      setEditedItems({});
      alert('Itens validados e alterações salvas com sucesso!');
  };

  const getItemValue = <K extends keyof InvoiceItem>(id: number, key: K, defaultValue: InvoiceItem[K]): InvoiceItem[K] => {
    return editedItems[id]?.[key] as InvoiceItem[K] ?? defaultValue;
  };
  
  const calculateMonofasicoTotal = (invoice: Invoice): number => {
    return invoice.items.reduce((total, item) => {
        const isMonofasico = getItemValue(item.id, 'is_monofasico', item.is_monofasico);
        return isMonofasico ? total + item.total_value : total;
    }, 0);
  };

  const getRulePill = (rule: string) => {
    if (rule.includes('SIM (Automático)')) {
        return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">{rule}</span>;
    }
    if (rule.includes('Divergência')) {
        return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">{rule}</span>;
    }
    if (rule.includes('SUGESTÃO: NÃO')) {
         return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">{rule}</span>;
    }
    return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{rule}</span>
  }


  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Revisão Manual Obrigatória</h1>
            <p className="mt-1 text-md text-gray-600">Confirme a classificação dos itens abaixo. O sistema pré-selecionou os monofásicos baseado nos NCMs.</p>
        </div>
        <button 
          onClick={handleSaveAllChanges} 
          // Sempre habilitado se houver itens para revisar, para permitir "Aceitar Tudo"
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          Validar e Salvar Lista
        </button>
      </header>

      <div className="space-y-6">
        {invoicesToReview.map(invoice => (
            <div key={invoice.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                        <h3 className="font-bold text-gray-800">Nota Fiscal: <span className="font-mono text-sm text-gray-600">{invoice.access_key}</span></h3>
                        <p className="text-sm text-gray-500">Emissão: {new Date(invoice.issue_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-sm text-gray-500">Valor Total da Nota</p>
                        <p className="font-bold text-lg text-gray-800">{invoice.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                     <div className="text-left md:text-right">
                        <p className="text-sm text-gray-500">Total Monofásico (Prévia)</p>
                        <p className="font-bold text-lg text-blue-600">{calculateMonofasicoTotal(invoice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Produto</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NCM</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CFOP / CST</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sugestão do Sistema</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monofásico?</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {invoice.itemsToReview.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={getItemValue(item.id, 'description', item.description)}
                                  onChange={(e) => handleInputChange(item.id, 'description', e.target.value)}
                                  className="p-1 border border-gray-300 rounded-md w-full text-sm font-medium text-gray-900"
                                />
                                <div className="text-xs text-gray-500 mt-1">Código: {item.product_code}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input 
                                type="text" 
                                value={getItemValue(item.id, 'ncm_code', item.ncm_code)}
                                onChange={(e) => handleInputChange(item.id, 'ncm_code', e.target.value)}
                                className="p-1 border border-gray-300 rounded-md w-28 font-mono"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                {item.cfop} / {item.cst_pis}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                {getRulePill(item.classification_rule)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={getItemValue(item.id, 'is_monofasico', item.is_monofasico)}
                                        onChange={(e) => handleToggleChange(item.id, 'is_monofasico', e.target.checked)}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </td>
                           
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        ))}
        {invoicesToReview.length === 0 && <div className="text-center p-8 text-gray-500 bg-white rounded-lg shadow-md">Lista de revisão vazia.</div>}
      </div>
    </div>
  );
};

export default ReviewTable;