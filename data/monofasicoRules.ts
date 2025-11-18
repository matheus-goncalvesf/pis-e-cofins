// Regras para NCMs monofásicos (PIS/COFINS) baseadas na Tabela 4.3.10 SPED.
// Estrutura:
// - RANGES: ranges de NCM de 8 dígitos para cobrir blocos de produtos.
// - EXCEPTIONS: NCMs pontuais dentro de um range que NÃO são monofásicos.
// - SPECIFIC: NCMs individuais monofásicos fora de qualquer range.

export const MONOFASICO_RULES = {
    // NCMs específicos que são exceção dentro de um range
    EXCEPTIONS: new Set([
        '30039056', // Farmacêuticos
        '30049046', // Farmacêuticos
        '22010100', // Bebidas frias - Águas Ex 01
        '22010200', // Bebidas frias - Águas Ex 02
        '34011190', // Perfumaria - Ex 01
        '38249029', // Biodiesel Ex 01
        '38260000'  // Biodiesel Ex 01
    ]),

    // Ranges de NCM (start e end) que cobrem blocos de produtos monofásicos
    RANGES: [
        // === Grupo 100 - Combustíveis ===
        { start: '27101159', end: '27101159' },
        { start: '27101259', end: '27101259' },
        { start: '27101921', end: '27101921' },
        { start: '27111910', end: '27111910' },
        { start: '27101911', end: '27101911' },
        { start: '38249029', end: '38249029' },
        { start: '38260000', end: '38260000' },
        { start: '22071000', end: '22071099' },
        { start: '22072000', end: '22072099' },
        { start: '22089000', end: '22089000' },

        // === Grupo 200 - Fármacos e Perfumaria ===
        { start: '30010000', end: '30019999' }, // Cap. 30.01
        { start: '30030000', end: '30039999' }, // Cap. 30.03
        { start: '30040000', end: '30049999' }, // Cap. 30.04

        // Subposições detalhadas para produtos farmacêuticos
        { start: '30021000', end: '30021999' }, // cobre 30021211
        { start: '30022000', end: '30022999' },
        { start: '30063010', end: '30063029' },
        { start: '30029020', end: '30029099' },
        { start: '30051010', end: '30051010' },
        { start: '30066000', end: '30066000' },

        // Perfumaria e Higiene Pessoal
        { start: '33030000', end: '33039999' },
        { start: '33040000', end: '33049999' },
        { start: '33050000', end: '33059999' },
        { start: '33070000', end: '33079999' },
        { start: '34011190', end: '34011190' },
        { start: '34012010', end: '34012010' },
        { start: '96032100', end: '96032100' },

        // === Grupo 300 - Veículos, Máquinas, Autopeças ===
        { start: '73090000', end: '73099999' },
        { start: '73102900', end: '73102999' },
        { start: '76129012', end: '76129012' },
        { start: '84248100', end: '84248199' },
        { start: '84290000', end: '84299999' },
        { start: '84306990', end: '84306990' },
        { start: '84320000', end: '84379999' },
        { start: '87010000', end: '87069999' },
        { start: '87162000', end: '87162000' },
        { start: '40110000', end: '40139999' },

        // === Grupo 400 - Bebidas Frias ===
        { start: '21069010', end: '21069010' },
        { start: '22010000', end: '22019999' }, // Águas minerais
        { start: '22020000', end: '22029999' }, // Bebidas não alcoólicas
        { start: '22030000', end: '22039999' }  // Cervejas
    ],

    // NCMs individuais que não estão em ranges
    SPECIFIC: new Set([
        '27101159', '27101259', '27101921', '27111910', '27101911',
        '38249029', '38260000', '21069010', '34011190', '34012010', '96032100'
    ])
};
