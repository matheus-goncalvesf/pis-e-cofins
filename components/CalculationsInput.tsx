import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, CalculationInput, AnexoType } from '../types';
import { Save, Calculator, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { cn } from '../utils/cn';

interface CalculationsInputProps {
  invoices: Invoice[];
  initialData: Record<string, CalculationInput>;
  onSave: (inputs: Record<string, CalculationInput>) => void;
  companyId: string;
}

const CalculationsInput: React.FC<CalculationsInputProps> = ({ invoices, initialData, onSave, companyId }) => {
  // Load settings from localStorage
  const [autoCalculateRbt12, setAutoCalculateRbt12] = useState(() => {
    const saved = localStorage.getItem(`autoCalculateRbt12_${companyId}`);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isNewCompany, setIsNewCompany] = useState(() => {
    const saved = localStorage.getItem(`isNewCompany_${companyId}`);
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [globalAnexo, setGlobalAnexo] = useState<AnexoType | ''>('');

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`autoCalculateRbt12_${companyId}`, JSON.stringify(autoCalculateRbt12));
  }, [autoCalculateRbt12, companyId]);

  useEffect(() => {
    localStorage.setItem(`isNewCompany_${companyId}`, JSON.stringify(isNewCompany));
  }, [isNewCompany, companyId]);

  const monthlyRevenues = useMemo(() => {
    const data: Record<string, { total_revenue: number; monofasico_revenue: number }> = {};
    const VALID_SALES_CFOPS = new Set(['5102', '5405', '6102']);

    invoices.forEach(invoice => {
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
  }, [invoices]);

  const [inputs, setInputs] = useState<Record<string, CalculationInput>>(() => initialData);

  useEffect(() => {
    if (!autoCalculateRbt12) return;

    const newRbt12Values: Record<string, number | undefined> = {};

    if (isNewCompany) {
      // Logic for companies with less than 12 months, based on proportional calculation.
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
          newRbt12Values[month] = undefined; // Not enough history
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
          rbt12: calculatedValue !== undefined ? Number(calculatedValue.toFixed(2)) : undefined,
        };
      });
      return updatedInputs;
    });

  }, [autoCalculateRbt12, isNewCompany, monthlyRevenues]);


  const handleInputChange = (month: string, field: 'das_paid' | 'rbt12' | 'manual_effective_aliquot', value: string) => {
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

  const handleApplyGlobalAnexo = () => {
    if (!globalAnexo) return;
    if (confirm(`Deseja aplicar o ${getAnexoLabel(globalAnexo)} para TODAS as competências listadas abaixo?`)) {
      setInputs(prev => {
        const next = { ...prev };
        monthlyRevenues.forEach(({ month }) => {
          next[month] = {
            ...next[month],
            anexo: globalAnexo
          };
        });
        return next;
      });
    }
  };

  const isMonthDataComplete = (month: string): boolean => {
    const data = inputs[month];
    return !!(data?.anexo && data?.rbt12 && data?.das_paid);
  };

  const getMissingFields = (month: string): string[] => {
    const data = inputs[month];
    const missing: string[] = [];
    if (!data?.anexo) missing.push('Anexo');
    if (!data?.rbt12) missing.push('RBT12');
    if (!data?.das_paid) missing.push('DAS Pago');
    return missing;
  };

  const handleToggleIncludeInReport = (month: string) => {
    setInputs(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        includeInReport: !(prev[month]?.includeInReport ?? true)
      }
    }));
  };


  const handleSave = () => {
    onSave(inputs);
  };

  const isSaveDisabled = useMemo(() => {
    return JSON.stringify(inputs) === JSON.stringify(initialData);
  }, [inputs, initialData]);

  const getAnexoLabel = (key: string) => {
    switch (key) {
      case 'anexo1': return 'Anexo I (Comércio)';
      case 'anexo2': return 'Anexo II (Indústria)';
      case 'anexo3': return 'Anexo III (Serviços)';
      case 'anexo4': return 'Anexo IV (Serviços)';
      case 'anexo5': return 'Anexo V (Serviços)';
      default: return 'Selecione';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Apuração & Cálculo</h1>
          <p className="mt-1 text-muted-foreground">Informe os dados do Simples Nacional em cada competência para apurar o crédito.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaveDisabled}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Dados
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 pb-6 border-b">

            <div className="flex items-center space-x-6 flex-wrap gap-y-2">
              <label htmlFor="auto-calc-toggle" className="flex items-center cursor-pointer group">
                <div className="relative mr-3">
                  <input type="checkbox" id="auto-calc-toggle" className="sr-only" checked={autoCalculateRbt12} onChange={() => setAutoCalculateRbt12(!autoCalculateRbt12)} />
                  <div className={cn("block w-10 h-6 rounded-full transition-colors", autoCalculateRbt12 ? 'bg-primary' : 'bg-muted')}></div>
                  <div className={cn("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", autoCalculateRbt12 ? 'translate-x-4' : '')}></div>
                </div>
                <span className="text-sm font-medium text-foreground">Calcular RBT12 Auto</span>
              </label>

              {autoCalculateRbt12 && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is-new-company-checkbox"
                    checked={isNewCompany}
                    onChange={(e) => setIsNewCompany(e.target.checked)}
                    className="h-4 w-4 text-primary border-input rounded focus:ring-primary"
                  />
                  <label htmlFor="is-new-company-checkbox" className="ml-2 block text-sm text-muted-foreground">
                    Empresa nova (menos de 12 meses)
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Definir Anexo para Todos:</span>
              <select
                value={globalAnexo}
                onChange={(e) => setGlobalAnexo(e.target.value as AnexoType)}
                className="h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Selecione...</option>
                <option value="anexo1">Anexo I</option>
                <option value="anexo2">Anexo II</option>
                <option value="anexo3">Anexo III</option>
                <option value="anexo4">Anexo IV</option>
                <option value="anexo5">Anexo V</option>
              </select>
              <Button
                onClick={handleApplyGlobalAnexo}
                disabled={!globalAnexo}
                variant="secondary"
                size="sm"
              >
                Aplicar
              </Button>
            </div>

          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">Incluir no Relatório</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mês/Ano</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Receita Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rec. Monofásica</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-48">Anexo Selecionado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">RBT12 (R$)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">DAS Pago (R$)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">Alíquota Efetiva (%)</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {monthlyRevenues.map(({ month, total_revenue, monofasico_revenue }) => {
                  const isComplete = isMonthDataComplete(month);
                  const missingFields = getMissingFields(month);
                  const isIncluded = inputs[month]?.includeInReport ?? true;

                  return (
                    <tr key={month} className={cn("hover:bg-muted/20 transition-colors", !isIncluded && "opacity-60")}>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="checkbox"
                            checked={isIncluded}
                            onChange={() => handleToggleIncludeInReport(month)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          />
                          {!isComplete && (
                            <div className="relative group">
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                                <p className="font-semibold mb-1">Dados incompletos:</p>
                                <ul className="list-disc list-inside">
                                  {missingFields.map(field => (
                                    <li key={field}>{field}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-foreground">{month}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{total_revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-primary font-semibold">{monofasico_revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={inputs[month]?.anexo ?? ''}
                          onChange={(e) => handleAnexoChange(month, e.target.value as AnexoType)}
                          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" disabled>Selecione o Anexo</option>
                          <option value="anexo1">Anexo I (Comércio)</option>
                          <option value="anexo2">Anexo II (Indústria)</option>
                          <option value="anexo3">Anexo III</option>
                          <option value="anexo4">Anexo IV</option>
                          <option value="anexo5">Anexo V</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Input
                          type="number"
                          placeholder="RBT12..."
                          step="0.01"
                          value={inputs[month]?.rbt12 ?? ''}
                          onChange={(e) => handleInputChange(month, 'rbt12', e.target.value)}
                          className="w-32"
                          disabled={autoCalculateRbt12}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Input
                          type="number"
                          placeholder="Valor Pago"
                          step="0.01"
                          value={inputs[month]?.das_paid ?? ''}
                          onChange={(e) => handleInputChange(month, 'das_paid', e.target.value)}
                          className="w-32"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="relative group">
                          <Input
                            type="number"
                            placeholder="Opcional"
                            step="0.01"
                            min="0"
                            max="100"
                            value={inputs[month]?.manual_effective_aliquot ?? ''}
                            onChange={(e) => handleInputChange(month, 'manual_effective_aliquot', e.target.value)}
                            className="w-32"
                          />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-lg">
                            <p className="font-semibold mb-1">💡 Alíquota Efetiva Manual</p>
                            <p className="mb-2">Use este campo se sua alíquota real for diferente do calculado automaticamente (DAS/Faturamento).</p>
                            <p className="text-amber-200">Deixe vazio para cálculo automático.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {monthlyRevenues.length === 0 && (
              <div className="text-center p-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum faturamento encontrado. Faça o upload e processamento das notas fiscais primeiro.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculationsInput;
