import React, { useState, useMemo, useEffect } from 'react';
import { CompanyData, CalculationInput, AnexoType } from '../types';

interface Props {
  companyData: CompanyData;
  onSave: (inputs: Record<string, CalculationInput>) => void;
}

const CalculationsInput: React.FC<Props> = ({ companyData, onSave }) => {
  const [autoCalculateRbt12, setAutoCalculateRbt12] = useState(true);
  const [isNewCompany, setIsNewCompany] = useState(false);

  const monthlyRevenues = useMemo(() => {
    const data: Record<string, { total_revenue: number; monofasico_revenue: number }> = {};
    const VALID_SALES_CFOPS = new Set(['5102', '5405', '6102']);

    companyData.invoices.forEach(invoice => {
      const month = invoice.issue_date.slice(0, 7); // YYYY-MM
      invoice.items.forEach(item => {
        if (VALID_SALES_CFOPS.has(item.cfop)) {
           if (!data[month]) {
                data[month] = { total_revenue: 0, monofasico_revenue: 0 };
            }
            data[month].total_revenue += item.total_value;
            if (item.is_monofasico) {
                data[month].monofasico_revenue += item.total_value;
            }
        }
      });
    });
    return Object.entries(data)
      .map(([month, revenues]) => ({ month, ...revenues }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [companyData.invoices]);

  const [inputs, setInputs] = useState<Record<string, CalculationInput>>(() => companyData.calculation_inputs);

  useEffect(() => {
    if (!autoCalculateRbt12) return;

    const newRbt12Values: Record<string, number | undefined> = {};

    if (isNewCompany) {
      // Logic for companies with less than 12 months, based on proportional calculation.
      // For any given month 'N' of activity, the RBT12 is calculated by taking the
      // average revenue of all months from 1 to N, and then multiplying by 12.
      let cumulativeRevenue = 0;
      for (let i = 0; i < monthlyRevenues.length; i++) {
        const currentMonthData = monthlyRevenues[i];
        cumulativeRevenue += currentMonthData.total_revenue;
        
        const numberOfMonthsInPeriod = i + 1;
        const averageMonthlyRevenue = cumulativeRevenue / numberOfMonthsInPeriod;
        
        newRbt12Values[currentMonthData.month] = averageMonthlyRevenue * 12;
      }
    } else {
      // Existing company logic: sum of last 12 months (current month + 11 previous).
      monthlyRevenues.forEach(({ month }, index) => {
        if (index >= 11) {
          let rbt12Sum = 0;
          for (let i = 0; i < 12; i++) {
            rbt12Sum += monthlyRevenues[index - i].total_revenue;
          }
          newRbt12Values[month] = rbt12Sum;
        } else {
          newRbt12Values[month] = undefined; // Not enough history, leave for manual input
        }
      });
    }

    setInputs(prevInputs => {
      const updatedInputs = { ...prevInputs };
      monthlyRevenues.forEach(({ month }) => {
        const currentInputForMonth = updatedInputs[month] || {};
        const calculatedValue = newRbt12Values[month];
        updatedInputs[month] = {
          ...currentInputForMonth,
          // Ensure the value is either a number with 2 decimal places or undefined.
          rbt12: calculatedValue !== undefined ? Number(calculatedValue.toFixed(2)) : undefined,
        };
      });
      return updatedInputs;
    });

  }, [autoCalculateRbt12, isNewCompany, monthlyRevenues]);


  const handleInputChange = (month: string, field: 'das_paid' | 'rbt12', value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) && value !== '') return;

    setInputs(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: value === '' ? undefined : numericValue
      }
    }));
  };
  
  const handleAnexoChange = (month: string, value: AnexoType) => {
     setInputs(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        anexo: value
      }
    }));
  };
  
  const handleSave = () => {
    onSave(inputs);
  };
  
  const isSaveDisabled = useMemo(() => {
      return JSON.stringify(inputs) === JSON.stringify(companyData.calculation_inputs);
  }, [inputs, companyData.calculation_inputs]);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apuração & Cálculo</h1>
          <p className="mt-1 text-md text-gray-600">Informe os dados do Simples Nacional em cada competência para apurar o crédito.</p>
        </div>
         <button 
          onClick={handleSave} 
          disabled={isSaveDisabled}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Salvar Dados
        </button>
      </header>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-6 flex-wrap gap-y-4">
            <label htmlFor="auto-calc-toggle" className="flex items-center cursor-pointer group">
                <span className="text-sm font-medium text-gray-700 mr-3">Calcular RBT12 Automaticamente</span>
                <div className="relative">
                    <input type="checkbox" id="auto-calc-toggle" className="sr-only" checked={autoCalculateRbt12} onChange={() => setAutoCalculateRbt12(!autoCalculateRbt12)} />
                    <div className={`block w-14 h-8 rounded-full transition ${autoCalculateRbt12 ? 'bg-blue-600' : 'bg-gray-300 group-hover:bg-gray-400'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${autoCalculateRbt12 ? 'translate-x-6' : ''}`}></div>
                </div>
            </label>

            {autoCalculateRbt12 && (
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is-new-company-checkbox"
                        checked={isNewCompany}
                        onChange={(e) => setIsNewCompany(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is-new-company-checkbox" className="ml-2 block text-sm text-gray-900">
                        Empresa com menos de 12 meses de atividade
                    </label>
                </div>
            )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês/Ano</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Total (Vendas)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Monofásica</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anexo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RBT12 (R$)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DAS Pago (R$)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyRevenues.map(({ month, total_revenue, monofasico_revenue }) => (
                <tr key={month}>
                  <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-800">{month}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">{total_revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-blue-600 font-semibold">{monofasico_revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                   <td className="px-4 py-4 whitespace-nowrap">
                    <select
                      value={inputs[month]?.anexo ?? ''}
                      onChange={(e) => handleAnexoChange(month, e.target.value as AnexoType)}
                      className="p-2 border border-gray-300 rounded-md w-36 bg-white"
                    >
                        <option value="" disabled>Selecione</option>
                        <option value="anexo1">Anexo I (Comércio)</option>
                        <option value="anexo2">Anexo II (Indústria)</option>
                        <option value="anexo3">Anexo III</option>
                        <option value="anexo4">Anexo IV</option>
                        <option value="anexo5">Anexo V</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      placeholder="Calcular ou inserir..."
                      step="0.01"
                      value={inputs[month]?.rbt12 ?? ''}
                      onChange={(e) => handleInputChange(month, 'rbt12', e.target.value)}
                      className="p-2 border border-gray-300 rounded-md w-36 disabled:bg-gray-100 disabled:text-gray-500"
                      disabled={autoCalculateRbt12}
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={inputs[month]?.das_paid ?? ''}
                      onChange={(e) => handleInputChange(month, 'das_paid', e.target.value)}
                      className="p-2 border border-gray-300 rounded-md w-32"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {monthlyRevenues.length === 0 && (
             <div className="text-center p-8 text-gray-500">
                Nenhum faturamento encontrado. Faça o upload e processamento das notas fiscais primeiro.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculationsInput;