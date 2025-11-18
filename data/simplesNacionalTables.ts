
// Tabelas e Partilhas do Simples Nacional - Lei Complementar nº 123, de 2006.
// Valores e percentuais de partilha atualizados (Vigência 2018+).

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
            // 1ª Faixa
            { de: 0, ate: 180000, aliquota: 0.04, valorADeduzir: 0, partilha: { 'COFINS': 0.1274, 'PIS/Pasep': 0.0276 } }, // Total: 15.50%
            // 2ª Faixa
            { de: 180000.01, ate: 360000, aliquota: 0.073, valorADeduzir: 5940, partilha: { 'COFINS': 0.1274, 'PIS/Pasep': 0.0276 } }, // Total: 15.50%
            // 3ª Faixa
            { de: 360000.01, ate: 720000, aliquota: 0.095, valorADeduzir: 13860, partilha: { 'COFINS': 0.1274, 'PIS/Pasep': 0.0276 } }, // Total: 15.03%
            // 4ª Faixa
            { de: 720000.01, ate: 1800000, aliquota: 0.107, valorADeduzir: 22500, partilha: { 'COFINS': 0.1274, 'PIS/Pasep': 0.0276 } }, // Total: 14.60%
            // 5ª Faixa
            { de: 1800000.01, ate: 3600000, aliquota: 0.143, valorADeduzir: 87300, partilha: { 'COFINS': 0.1274, 'PIS/Pasep': 0.0276 } }, // Total: 13.20%
            // 6ª Faixa
            { de: 3600000.01, ate: 4800000, aliquota: 0.19, valorADeduzir: 378000, partilha: { 'COFINS': 0.2827, 'PIS/Pasep': 0.0613 } }, // Total: 13.20%
        ]
    },
    anexo2: { // Indústria
        nome: "Anexo II - Indústria",
        faixas: [
            // 1ª Faixa
            { de: 0, ate: 180000, aliquota: 0.045, valorADeduzir: 0, partilha: { 'COFINS': 0.1151, 'PIS/Pasep': 0.0249 } }, // Total: 15.50%
            // 2ª Faixa
            { de: 180000.01, ate: 360000, aliquota: 0.078, valorADeduzir: 5940, partilha: { 'COFINS': 0.1151, 'PIS/Pasep': 0.0249 } }, // Total: 15.50%
            // 3ª Faixa (O caso que você mencionou: 11.51 + 2.49 = 14.00%)
            { de: 360000.01, ate: 720000, aliquota: 0.1, valorADeduzir: 13860, partilha: { 'COFINS': 0.1151, 'PIS/Pasep': 0.0249 } }, // Total: 14.00%
            // 4ª Faixa
            { de: 720000.01, ate: 1800000, aliquota: 0.112, valorADeduzir: 22500, partilha: { 'COFINS': 0.1151, 'PIS/Pasep': 0.0249 } }, // Total: 14.00%
            // 5ª Faixa
            { de: 1800000.01, ate: 3600000, aliquota: 0.147, valorADeduzir: 85500, partilha: { 'COFINS': 0.1151, 'PIS/Pasep': 0.0249 } }, // Total: 12.93%
            // 6ª Faixa
            { de: 3600000.01, ate: 4800000, aliquota: 0.3, valorADeduzir: 720000, partilha: { 'COFINS': 0.2096, 'PIS/Pasep': 0.0454 } }, // Total: 11.31%
        ]
    },
    anexo3: { // Serviços e Locação
        nome: "Anexo III - Serviços",
        faixas: [
            // 1ª Faixa
            { de: 0, ate: 180000, aliquota: 0.06, valorADeduzir: 0, partilha: { 'COFINS': 0.1282, 'PIS/Pasep': 0.0278 } }, // Total: 15.60%
            // 2ª Faixa
            { de: 180000.01, ate: 360000, aliquota: 0.112, valorADeduzir: 9360, partilha: { 'COFINS': 0.1405, 'PIS/Pasep': 0.0305  } }, // Total: 15.60%
            // 3ª Faixa
            { de: 360000.01, ate: 720000, aliquota: 0.135, valorADeduzir: 17640, partilha: { 'COFINS': 0.1364, 'PIS/Pasep': 0.0296   } }, // Total: 15.25%
            // 4ª Faixa
            { de: 720000.01, ate: 1800000, aliquota: 0.16, valorADeduzir: 35640, partilha: { 'COFINS': 0.1364, 'PIS/Pasep': 0.0296 } }, // Total: 14.82%
            // 5ª Faixa
            { de: 1800000.01, ate: 3600000, aliquota: 0.21, valorADeduzir: 125640, partilha: { 'COFINS': 0.1282, 'PIS/Pasep': 0.0278} }, // Total: 14.41%
            // 6ª Faixa
            { de: 3600000.01, ate: 4800000, aliquota: 0.33, valorADeduzir: 648000, partilha: { 'COFINS': 0.1603, 'PIS/Pasep': 0.0347 } }, // Total: 13.61%
        ]
    },
    anexo4: { // Serviços (Advocacia, limpeza, obras)
        nome: "Anexo IV - Serviços",
        faixas: [
            // 1ª Faixa
            { de: 0, ate: 180000, aliquota: 0.045, valorADeduzir: 0, partilha: { 'COFINS': 0.1767, 'PIS/Pasep': 0.0383 } }, // Total: 24.90%
            // 2ª Faixa
            { de: 180000.01, ate: 360000, aliquota: 0.09, valorADeduzir: 8100, partilha: { 'COFINS': 0.2055, 'PIS/Pasep': 0.0445 } }, // Total: 24.90%
            // 3ª Faixa
            { de: 360000.01, ate: 720000, aliquota: 0.102, valorADeduzir: 12420, partilha: { 'COFINS': 0.1973, 'PIS/Pasep': 0.0427 } }, // Total: 25.50%
            // 4ª Faixa
            { de: 720000.01, ate: 1800000, aliquota: 0.14, valorADeduzir: 39780, partilha: { 'COFINS': 0.1890, 'PIS/Pasep': 0.0410 } }, // Total: 24.30%
            // 5ª Faixa
            { de: 1800000.01, ate: 3600000, aliquota: 0.22, valorADeduzir: 183780, partilha: { 'COFINS': 0.1808, 'PIS/Pasep': 0.0392 } }, // Total: 24.90%
            // 6ª Faixa
            { de: 3600000.01, ate: 4800000, aliquota: 0.33, valorADeduzir: 828000, partilha: { 'COFINS': 0.2055, 'PIS/Pasep': 0.0445 } }, // Total: 20.00%
        ]
    },
    anexo5: { // Serviços (Fator R, jornalismo, tecnologia)
        nome: "Anexo V - Serviços",
        faixas: [
            // 1ª Faixa
            { de: 0, ate: 180000, aliquota: 0.155, valorADeduzir: 0, partilha: { 'COFINS': 0.1410, 'PIS/Pasep': 0.0305 } }, // Total: 17.15%
            // 2ª Faixa
            { de: 180000.01, ate: 360000, aliquota: 0.18, valorADeduzir: 4500, partilha: { 'COFINS': 0.1410, 'PIS/Pasep': 0.0305 } }, // Total: 17.55%
            // 3ª Faixa
            { de: 360000.01, ate: 720000, aliquota: 0.195, valorADeduzir: 9900, partilha: { 'COFINS': 0.1492, 'PIS/Pasep': 0.0323 } }, // Total: 17.55%
            // 4ª Faixa
            { de: 720000.01, ate: 1800000, aliquota: 0.205, valorADeduzir: 17100, partilha: { 'COFINS': 0.1574, 'PIS/Pasep': 0.0341 } }, // Total: 17.96%
            // 5ª Faixa
            { de: 1800000.01, ate: 3600000, aliquota: 0.23, valorADeduzir: 62100, partilha: { 'COFINS': 0.1410, 'PIS/Pasep': 0.0305 } }, // Total: 17.96%
            // 6ª Faixa
            { de: 3600000.01, ate: 4800000, aliquota: 0.305, valorADeduzir: 540000, partilha: { 'COFINS': 0.1644, 'PIS/Pasep': 0.0356 } }, // Total: 20.00%
        ]
    }
};
