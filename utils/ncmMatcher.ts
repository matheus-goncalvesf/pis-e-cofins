import { MONOFASICO_RULES } from '../data/monofasicoRules';
import spedProducts from '../data/sped_products.json';

export interface NcmMatchResult {
    isMonofasico: boolean;
    ruleDescription: string;
}


export const checkIsMonofasico = (ncm: string): NcmMatchResult => {
    const cleanNcm = ncm.replace(/\D/g, '');
    if (!cleanNcm || cleanNcm.length !== 8) {
        return { isMonofasico: false, ruleDescription: 'NCM INVÁLIDO/VAZIO' };
    }

    // 1. Check Official SPED Table Data (Highest Priority)
    // We need to iterate because we now support prefixes (e.g. "3003" matches "30039056")
    const spedMatch = spedProducts.find(p => {
        if (p.is_prefix) {
            return cleanNcm.startsWith(p.ncm);
        }
        return p.ncm === cleanNcm;
    });

    if (spedMatch) {
        let rule = `MONOFÁSICO (Tabela SPED): ${spedMatch.description.substring(0, 40)}...`;
        let isMono = true;

        if (spedMatch.has_exception) {
            rule += " [ATENÇÃO: Verificar Exceções na Tabela]";
            // We still flag as true to catch attention, but the description warns.
            // Alternatively, we could flag as false if we were sure, but "has_exception" is vague.
        }

        return {
            isMonofasico: isMono,
            ruleDescription: rule
        };
    }

    // 2. Check Hardcoded Rules (Fallback/Legacy)
    if (MONOFASICO_RULES.EXCEPTIONS.has(cleanNcm)) {
        return { isMonofasico: false, ruleDescription: 'EXCEÇÃO: Não é monofásico' };
    }

    if (MONOFASICO_RULES.SPECIFIC.has(cleanNcm)) {
        return { isMonofasico: true, ruleDescription: 'MONOFÁSICO: Código específico' };
    }

    for (const range of MONOFASICO_RULES.RANGES) {
        if (cleanNcm >= range.start && cleanNcm <= range.end) {
            return { isMonofasico: true, ruleDescription: `MONOFÁSICO: Dentro do range ${range.start}-${range.end}` };
        }
    }

    return { isMonofasico: false, ruleDescription: 'NÃO MONOFÁSICO' };
};
