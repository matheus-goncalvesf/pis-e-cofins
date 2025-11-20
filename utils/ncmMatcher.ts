import { MONOFASICO_RULES } from '../data/monofasicoRules';
import spedProducts from '../data/sped_products.json';
import spedExceptions from '../data/sped_exceptions.json';

export interface NcmMatchResult {
    isMonofasico: boolean;
    ruleDescription: string;
}


export const checkIsMonofasico = (ncm: string): NcmMatchResult => {
    const cleanNcm = ncm.replace(/\D/g, '');
    if (!cleanNcm || cleanNcm.length !== 8) {
        return { isMonofasico: false, ruleDescription: 'NCM INVÁLIDO/VAZIO' };
    }

    // 1. Check SPED Exceptions FIRST (Highest Priority)
    // These NCMs are explicitly excluded even if they match a prefix
    const exceptionMatch = spedExceptions.find(ex => ex.ncm === cleanNcm);
    if (exceptionMatch) {
        return {
            isMonofasico: false,
            ruleDescription: `EXCEÇÃO SPED: ${exceptionMatch.description}`
        };
    }

    // 2. Check Official SPED Table Data (Prefix and Exact Matches)
    // Prefixes indicate that ALL NCMs starting with those digits are monofásico
    // EXCEPT the ones listed in exceptions above
    const spedMatch = spedProducts.find(p => {
        if (p.is_prefix) {
            // Prefix match: NCM "30031234" matches prefix "3003"
            return cleanNcm.startsWith(p.ncm);
        }
        // Exact match
        return p.ncm === cleanNcm;
    });

    if (spedMatch) {
        let rule = `MONOFÁSICO (Tabela SPED): ${spedMatch.description.substring(0, 40)}...`;

        // Note: has_exception flag indicates there are exceptions for this prefix
        // but we already checked them above, so if we got here, this specific NCM is valid
        if (spedMatch.has_exception) {
            rule += " [Prefixo com exceções - este NCM específico é válido]";
        }

        return {
            isMonofasico: true,
            ruleDescription: rule
        };
    }

    // 3. Check Hardcoded Rules (Fallback/Legacy)
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
