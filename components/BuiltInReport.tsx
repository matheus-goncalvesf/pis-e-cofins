
import React, { useMemo } from 'react';
import { CalculationResult } from '../types';

interface Props {
  view: 'monthly' | 'yearly' | 'total';
  calculations: CalculationResult[];
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatPercent = (value: number) => (value * 100).toFixed(2) + '%';

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
);

const BuiltInReport: React.FC<Props> = ({ view, calculations }) => {

  const aggregatedData = useMemo(() => {
    if (view === 'yearly') {
      const yearlyData: Record<string, Omit<CalculationResult, 'competence_month' | 'effective_aliquot' | 'pis_cofins_share' | 'anexo_used'> & { effective_aliquot_avg: number, pis_cofins_share_avg: number, count: number }> = {};
      calculations.forEach(c => {
        const year = c.competence_month.slice(0, 4);
        if (!yearlyData[year]) {
          yearlyData[year] = { total_revenue: 0, monofasico_revenue: 0, das_paid: 0, recalculated_das_due: 0, credit_amount: 0, effective_aliquot_avg: 0, pis_cofins_share_avg: 0, count: 0 };
        }
        yearlyData[year].total_revenue += c.total_revenue;
        yearlyData[year].monofasico_revenue += c.monofasico_revenue;
        yearlyData[year].das_paid += c.das_paid;
        yearlyData[year].recalculated_das_due += c.recalculated_das_due;
        yearlyData[year].credit_amount += c.credit_amount;
        yearlyData[year].effective_aliquot_avg += c.effective_aliquot;
        yearlyData[year].pis_cofins_share_avg += c.pis_cofins_share;
        yearlyData[year].count += 1;
      });
      return Object.entries(yearlyData).map(([year, data]) => ({ 
          period: year, 
          ...data,
          anexo_used: 'Múltiplos', // Aggregated
          effective_aliquot: data.effective_aliquot_avg / data.count,
          pis_cofins_share: data.pis_cofins_share_avg / data.count
      }));
    }
    return []; // Monthly and total are handled differently
  }, [view, calculations]);

  if (calculations.length === 0) {
      return <div className="text-center p-8 text-gray-500">Dados insuficientes para gerar o relatório. Preencha os valores na tela de "Apuração & Cálculo".</div>;
  }
  
  if (view === 'total') {
    const total = calculations.reduce((acc, c) => ({
        total_revenue: acc.total_revenue + c.total_revenue,
        monofasico_revenue: acc.monofasico_revenue + c.monofasico_revenue,
        das_paid: acc.das_paid + c.das_paid,
        recalculated_das_due: acc.recalculated_das_due + c.recalculated_das_due,
        credit_amount: acc.credit_amount + c.credit_amount,
    }), { total_revenue: 0, monofasico_revenue: 0, das_paid: 0, recalculated_das_due: 0, credit_amount: 0 });

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Sumário do Período Completo</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard title="Crédito Total Apurado" value={formatCurrency(total.credit_amount)} />
                <StatCard title="Total DAS Pago" value={formatCurrency(total.das_paid)} />
                <StatCard title="Total Faturamento" value={formatCurrency(total.total_revenue)} />
                <StatCard title="Total Receita Monofásica" value={formatCurrency(total.monofasico_revenue)} />
                <StatCard title="Total Novo DAS Devido" value={formatCurrency(total.recalculated_das_due)} />
            </div>
        </div>
    );
  }

  const dataToRender = view === 'monthly' 
    ? calculations.map(c => ({...c, period: c.competence_month})) 
    : aggregatedData;

  const headers = view === 'monthly' 
    ? ['Mês/Ano', 'Anexo', 'Receita Total', 'Rec. Monofásica', 'DAS Pago', 'Aliq. Efetiva', '% PIS/COFINS (Faixa)', 'Novo DAS', 'Crédito'] 
    : ['Ano', 'Anexo', 'Receita Total', 'Rec. Monofásica', 'DAS Pago', 'Aliq. Efetiva Média', '% Média PIS/COFINS', 'Novo DAS', 'Crédito'];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map(h => <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {dataToRender.map((row) => (
            <tr key={row.period}>
              <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{row.period}</td>
               <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{row.anexo_used}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(row.total_revenue)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(row.monofasico_revenue)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(row.das_paid)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatPercent(row.effective_aliquot)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatPercent(row.pis_cofins_share)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(row.recalculated_das_due)}</td>
              <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-600">{formatCurrency(row.credit_amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BuiltInReport;
