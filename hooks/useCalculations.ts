import { useMemo } from 'react';
import { Invoice, CalculationInput, CalculationResult, AnexoType } from '../types';
import { simplesNacionalTables } from '../data/simplesNacionalTables';

// CFOPs que caracterizam receita de venda para empresas do Simples Nacional (revenda).
const VALID_SALES_CFOPS = new Set(['5102', '5405', '6102']);

const findFaixa = (anexo: AnexoType, rbt12: number) => {
  if (!simplesNacionalTables[anexo]) return null;
  const table = simplesNacionalTables[anexo];
  // Faixas são de 'maior que' (de) até 'menor ou igual que' (ate)
  return table.faixas.find(f => rbt12 > f.de && rbt12 <= f.ate);
};

export function useCalculations(invoices: Invoice[], calculationInputs: Record<string, CalculationInput>): CalculationResult[] {
  return useMemo(() => {
    const monthlyData: Record<string, { total_revenue: number; monofasico_revenue: number }> = {};

    invoices.forEach(invoice => {
      const month = invoice.issue_date.slice(0, 7); // YYYY-MM
      
      invoice.items.forEach(item => {
        // Apenas considera itens cuja operação (CFOP) representa uma venda geradora de receita.
        if (VALID_SALES_CFOPS.has(item.cfop)) {
          if (!monthlyData[month]) {
            monthlyData[month] = { total_revenue: 0, monofasico_revenue: 0 };
          }
          monthlyData[month].total_revenue += item.total_value;
          if (item.is_monofasico) {
            monthlyData[month].monofasico_revenue += item.total_value;
          }
        }
      });
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => {
        const userInput = calculationInputs[month];
        const dasPaid = userInput?.das_paid ?? 0;
        const anexo = userInput?.anexo;
        const rbt12 = userInput?.rbt12 ?? 0;

        if (!anexo || !rbt12 || rbt12 <= 0 || dasPaid <= 0) {
          return {
            competence_month: month,
            total_revenue: data.total_revenue,
            monofasico_revenue: data.monofasico_revenue,
            das_paid: dasPaid,
            effective_aliquot: 0,
            recalculated_das_due: 0,
            credit_amount: 0,
          };
        }
        
        const faixa = findFaixa(anexo, rbt12);
        
        if (!faixa) {
             return { // Retorna zerado se RBT12 estiver fora das faixas
                competence_month: month,
                total_revenue: data.total_revenue,
                monofasico_revenue: data.monofasico_revenue,
                das_paid: dasPaid,
                effective_aliquot: 0,
                recalculated_das_due: 0,
                credit_amount: 0,
            };
        }

        const { aliquota: aliquotaNominal, valorADeduzir, partilha } = faixa;

        // Fórmula Alíquota Efetiva: ((RBT12 × Alíquota Nominal) - Parcela a Deduzir) / RBT12
        const effectiveAliquot = ((rbt12 * aliquotaNominal) - valorADeduzir) / rbt12;

        // Fator PIS/COFINS é a soma das partilhas dos dois tributos na faixa correspondente
        const fatorPisCofins = (partilha['PIS/Pasep'] ?? 0) + (partilha.COFINS ?? 0);

        // Fórmula do Crédito (conforme instrução do usuário): DAS Pago * Fator PIS/COFINS
        const creditAmount = dasPaid * fatorPisCofins;
        
        const nonMonofasicoRevenue = data.total_revenue - data.monofasico_revenue;
        const recalculatedDasDue = nonMonofasicoRevenue * effectiveAliquot;

        return {
          competence_month: month,
          total_revenue: data.total_revenue,
          monofasico_revenue: data.monofasico_revenue,
          das_paid: dasPaid,
          effective_aliquot: effectiveAliquot,
          recalculated_das_due: recalculatedDasDue > 0 ? recalculatedDasDue : 0,
          credit_amount: creditAmount > 0 ? creditAmount : 0,
        };
      })
      .sort((a, b) => a.competence_month.localeCompare(b.competence_month));

  }, [invoices, calculationInputs]);
}