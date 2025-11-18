import { MONOFASICO_RULES } from '../data/monofasicoRules';

export interface NcmMatchResult {
    isMonofasico: boolean;
    ruleDescription: string;
}

export const checkIsMonofasico = (ncm: string): NcmMatchResult => {
    const cleanNcm = ncm.replace(/\D/g, '');
    if (!cleanNcm || cleanNcm.length !== 8) {
        return { isMonofasico: false, ruleDescription: 'NCM INVÁLIDO/VAZIO' };
    }

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
