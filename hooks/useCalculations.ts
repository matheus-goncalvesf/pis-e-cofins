
import { useMemo } from 'react';
import { Invoice, CalculationInput, CalculationResult, AnexoType } from '../types';
import { simplesNacionalTables } from '../data/simplesNacionalTables';

// CFOPs que caracterizam receita de venda para empresas do Simples Nacional (revenda).
const VALID_SALES_CFOPS = new Set(['5102', '5405', '6102']);

const findFaixa = (anexo: AnexoType, rbt12: number) => {
  if (!simplesNacionalTables[anexo]) return null;
  const table = simplesNacionalTables[anexo];
  // CORREÇÃO: Usar >= para incluir o limite inferior (essencial para RBT12 = 0 ou início exato da faixa)
  return table.faixas.find(f => rbt12 >= f.de && rbt12 <= f.ate);
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
      .filter(([month]) => {
        // Only include months where includeInReport is not explicitly false
        const userInput = calculationInputs[month];
        return userInput?.includeInReport !== false;
      })
      .map(([month, data]) => {
        const userInput = calculationInputs[month];
        const dasPaid = userInput?.das_paid ?? 0;
        const anexo = userInput?.anexo;
        const rbt12 = userInput?.rbt12 ?? 0;
        const manualAliquot = userInput?.manual_effective_aliquot; // em porcentagem (0-100)

        const baseResult = {
          competence_month: month,
          total_revenue: data.total_revenue,
          monofasico_revenue: data.monofasico_revenue,
          das_paid: dasPaid,
          anexo_used: anexo ? simplesNacionalTables[anexo]?.nome ?? anexo : 'N/A',
          effective_aliquot: 0,
          pis_cofins_share: 0,
          recalculated_das_due: dasPaid,
          credit_amount: 0,
        };

        // Validações básicas
        if (!anexo || dasPaid <= 0 || data.total_revenue <= 0) {
          return baseResult;
        }

        // 1. Encontrar a faixa correta no Anexo selecionado baseada no RBT12
        const faixa = findFaixa(anexo, rbt12);

        if (!faixa) {
          return baseResult;
        }

        // 2. Calcular a Alíquota Efetiva
        // Se o usuário forneceu uma alíquota manual, usa ela
        // Caso contrário, calcula baseado no DAS pago / Faturamento 
        let realEffectiveAliquot: number;

        if (manualAliquot !== undefined && manualAliquot > 0) {
          // Converte de porcentagem para decimal (ex: 5% -> 0.05)
          realEffectiveAliquot = manualAliquot / 100;
        } else {
          // Cálculo automático: DAS Pago / Faturamento Total do Mês
          realEffectiveAliquot = dasPaid / data.total_revenue;
        }

        // 3. Identificar a porcentagem de repartição (Partilha) para PIS e COFINS na faixa específica
        // Proteção extra contra chaves indefinidas
        const partilhaPis = faixa.partilha['PIS/Pasep'] ?? 0;
        const partilhaCofins = faixa.partilha['COFINS'] ?? 0;

        const somaPartilhaPisCofins = partilhaPis + partilhaCofins;

        // 4. Calcular a Alíquota Incidente de PIS/COFINS
        // Quanto do DAS pago efetivamente corresponde a PIS/COFINS?
        const aliquotaPisCofinsIncidente = realEffectiveAliquot * somaPartilhaPisCofins;

        // 5. Calcular o Crédito
        // O crédito é o valor pago indevidamente sobre a receita monofásica.
        const creditAmount = data.monofasico_revenue * aliquotaPisCofinsIncidente;

        // 6. Novo DAS Devido (Segregação de Receitas)
        const recalculatedDasDue = dasPaid - creditAmount;

        return {
          ...baseResult,
          effective_aliquot: realEffectiveAliquot,
          pis_cofins_share: somaPartilhaPisCofins,
          recalculated_das_due: recalculatedDasDue > 0 ? recalculatedDasDue : 0,
          credit_amount: creditAmount > 0 ? creditAmount : 0,
        };
      })
      .sort((a, b) => a.competence_month.localeCompare(b.competence_month));

  }, [invoices, calculationInputs]);
}
