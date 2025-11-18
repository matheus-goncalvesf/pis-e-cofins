// Tabelas e Partilhas do Simples Nacional - Lei Complementar nº 123, de 2006.
// Valores e percentuais válidos a partir de 01/01/2018.

export type AnexoName = 'anexo1' | 'anexo2' | 'anexo3' | 'anexo4' | 'anexo5';

interface Faixa {
    de: number;
    ate: number;
    aliquota: number;
    valorADeduzir: number;
    partilha: Record<string, number>;
}

interface Anexo {
    nome: string;
    faixas: Faixa[];
}

export const simplesNacionalTables: Record<AnexoName, Anexo> = {
    anexo1: { // Comércio
        nome: "Anexo I - Comércio",
        faixas: [
            { de: 0, ate: 180000, aliquota: 0.04, valorADeduzir: 0, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'ICMS': 0.34 } },
            { de: 180000.01, ate: 360000, aliquota: 0.073, valorADeduzir: 5940, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'ICMS': 0.34 } },
            { de: 360000.01, ate: 720000, aliquota: 0.095, valorADeduzir: 13860, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'ICMS': 0.34 } },
            { de: 720000.01, ate: 1800000, aliquota: 0.107, valorADeduzir: 22500, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'ICMS': 0.34 } },
            { de: 1800000.01, ate: 3600000, aliquota: 0.143, valorADeduzir: 87300, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'ICMS': 0.34 } },
            { de: 3600000.01, ate: 4800000, aliquota: 0.19, valorADeduzir: 378000, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'ICMS': 0.34 } },
        ]
    },
    anexo2: { // Indústria
        nome: "Anexo II - Indústria",
        faixas: [
            { de: 0, ate: 180000, aliquota: 0.045, valorADeduzir: 0, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'IPI': 0.075, 'ICMS': 0.265 } },
            { de: 180000.01, ate: 360000, aliquota: 0.078, valorADeduzir: 5940, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'IPI': 0.075, 'ICMS': 0.265 } },
            { de: 360000.01, ate: 720000, aliquota: 0.1, valorADeduzir: 13860, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'IPI': 0.075, 'ICMS': 0.265 } },
            { de: 720000.01, ate: 1800000, aliquota: 0.112, valorADeduzir: 22500, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'IPI': 0.075, 'ICMS': 0.265 } },
            { de: 1800000.01, ate: 3600000, aliquota: 0.147, valorADeduzir: 85500, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'IPI': 0.075, 'ICMS': 0.265 } },
            { de: 3600000.01, ate: 4800000, aliquota: 0.3, valorADeduzir: 720000, partilha: { 'IRPJ': 0.055, 'CSLL': 0.035, 'COFINS': 0.1274, 'PIS/Pasep': 0.0276, 'CPP': 0.415, 'IPI': 0.075, 'ICMS': 0.265 } },
        ]
    },
    anexo3: { // Serviços e Locação de Bens Móveis
        nome: "Anexo III",
        faixas: [
            { de: 0, ate: 180000, aliquota: 0.06, valorADeduzir: 0, partilha: { 'IRPJ': 0.04, 'CSLL': 0.035, 'COFINS': 0.1282, 'PIS/Pasep': 0.0278, 'CPP': 0.434, 'ISS': 0.335 } },
            { de: 180000.01, ate: 360000, aliquota: 0.112, valorADeduzir: 9360, partilha: { 'IRPJ': 0.04, 'CSLL': 0.035, 'COFINS': 0.1282, 'PIS/Pasep': 0.0278, 'CPP': 0.434, 'ISS': 0.335 } },
            { de: 360000.01, ate: 720000, aliquota: 0.135, valorADeduzir: 17640, partilha: { 'IRPJ': 0.04, 'CSLL': 0.035, 'COFINS': 0.1282, 'PIS/Pasep': 0.0278, 'CPP': 0.434, 'ISS': 0.335 } },
            { de: 720000.01, ate: 1800000, aliquota: 0.16, valorADeduzir: 35640, partilha: { 'IRPJ': 0.04, 'CSLL': 0.035, 'COFINS': 0.1282, 'PIS/Pasep': 0.0278, 'CPP': 0.434, 'ISS': 0.335 } },
            { de: 1800000.01, ate: 3600000, aliquota: 0.21, valorADeduzir: 125640, partilha: { 'IRPJ': 0.04, 'CSLL': 0.035, 'COFINS': 0.1282, 'PIS/Pasep': 0.0278, 'CPP': 0.434, 'ISS': 0.335 } },
            { de: 3600000.01, ate: 4800000, aliquota: 0.33, valorADeduzir: 648000, partilha: { 'IRPJ': 0.04, 'CSLL': 0.035, 'COFINS': 0.1282, 'PIS/Pasep': 0.0278, 'CPP': 0.434, 'ISS': 0.335 } },
        ]
    },
    anexo4: { // Serviços (advocacia, arquitetura, etc.)
        nome: "Anexo IV",
        faixas: [
            { de: 0, ate: 180000, aliquota: 0.045, valorADeduzir: 0, partilha: { 'IRPJ': 0.188, 'CSLL': 0.155, 'COFINS': 0.2046, 'PIS/Pasep': 0.0444, 'ISS': 0.408 } },
            { de: 180000.01, ate: 360000, aliquota: 0.09, valorADeduzir: 8100, partilha: { 'IRPJ': 0.198, 'CSLL': 0.155, 'COFINS': 0.2046, 'PIS/Pasep': 0.0444, 'ISS': 0.398 } },
            { de: 360000.01, ate: 720000, aliquota: 0.102, valorADeduzir: 12420, partilha: { 'IRPJ': 0.208, 'CSLL': 0.15, 'COFINS': 0.2096, 'PIS/Pasep': 0.0454, 'ISS': 0.387 } },
            { de: 720000.01, ate: 1800000, aliquota: 0.14, valorADeduzir: 39780, partilha: { 'IRPJ': 0.178, 'CSLL': 0.15, 'COFINS': 0.1996, 'PIS/Pasep': 0.0434, 'ISS': 0.429 } },
            { de: 1800000.01, ate: 3600000, aliquota: 0.22, valorADeduzir: 183780, partilha: { 'IRPJ': 0.188, 'CSLL': 0.19, 'COFINS': 0.2046, 'PIS/Pasep': 0.0444, 'ISS': 0.373 } },
            { de: 3600000.01, ate: 4800000, aliquota: 0.33, valorADeduzir: 828000, partilha: { 'IRPJ': 0.35, 'CSLL': 0.15, 'COFINS': 0.1638, 'PIS/Pasep': 0.0362, 'ISS': 0.3 } },
        ]
    },
    anexo5: { // Serviços (Fator R)
        nome: "Anexo V",
        faixas: [
            { de: 0, ate: 180000, aliquota: 0.155, valorADeduzir: 0, partilha: { 'IRPJ': 0.25, 'CSLL': 0.15, 'COFINS': 0.141, 'PIS/Pasep': 0.0305, 'CPP': 0.2885, 'ISS': 0.135 } },
            { de: 180000.01, ate: 360000, aliquota: 0.18, valorADeduzir: 4500, partilha: { 'IRPJ': 0.23, 'CSLL': 0.15, 'COFINS': 0.1443, 'PIS/Pasep': 0.0312, 'CPP': 0.2785, 'ISS': 0.166 } },
            { de: 360000.01, ate: 720000, aliquota: 0.195, valorADeduzir: 9900, partilha: { 'IRPJ': 0.23, 'CSLL': 0.15, 'COFINS': 0.1443, 'PIS/Pasep': 0.0312, 'CPP': 0.2785, 'ISS': 0.166 } },
            { de: 720000.01, ate: 1800000, aliquota: 0.205, valorADeduzir: 17100, partilha: { 'IRPJ': 0.21, 'CSLL': 0.125, 'COFINS': 0.1476, 'PIS/Pasep': 0.032, 'CPP': 0.305, 'ISS': 0.1804 } },
            { de: 1800000.01, ate: 3600000, aliquota: 0.23, valorADeduzir: 62100, partilha: { 'IRPJ': 0.21, 'CSLL': 0.125, 'COFINS': 0.1476, 'PIS/Pasep': 0.032, 'CPP': 0.305, 'ISS': 0.1804 } },
            { de: 3600000.01, ate: 4800000, aliquota: 0.305, valorADeduzir: 540000, partilha: { 'IRPJ': 0.35, 'CSLL': 0.15, 'COFINS': 0.1638, 'PIS/Pasep': 0.0362, 'CPP': 0.235, 'ISS': 0.065 } },
        ]
    }
};