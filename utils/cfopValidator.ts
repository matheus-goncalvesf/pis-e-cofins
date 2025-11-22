/**
 * Validador de CFOP para Segregação de Receitas Monofásicas no Simples Nacional
 * 
 * CONTEXTO: Empresas do Simples Nacional que VENDERAM produtos monofásicos deveriam
 * ter SEGREGADO essas receitas no PGDAS (não recolher PIS/COFINS sobre elas).
 * 
 * Se NÃO segregaram, pagaram DAS a mais e têm direito a recuperar o crédito.
 * 
 * Portanto, validamos CFOPs de SAÍDA (vendas), não de entrada (compras).
 * Referência: Receita Federal - CFOPs de saída de mercadorias
 */

export const VALID_SALES_CFOPS = new Set([
    // Vendas dentro do estado (5.xxx)
    '5101', // Venda de produção do estabelecimento
    '5102', // Venda de mercadoria adquirida ou recebida de terceiros
    '5103', // Venda de produção do estabelecimento, efetuada fora do estabelecimento
    '5104', // Venda de mercadoria adquirida ou recebida de terceiros, efetuada fora do estabelecimento
    '5105', // Venda de produção do estabelecimento que não deva por ele transitar
    '5106', // Venda de mercadoria adquirida ou recebida de terceiros, que não deva por ele transitar
    '5109', // Venda de produção do estabelecimento, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio
    '5110', // Venda de mercadoria adquirida ou recebida de terceiros, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio
    '5116', // Venda de produção do estabelecimento originada de encomenda para entrega futura
    '5117', // Venda de mercadoria adquirida ou recebida de terceiros, originada de encomenda para entrega futura
    '5118', // Venda de produção do estabelecimento entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem
    '5119', // Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem
    '5120', // Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário pelo vendedor remetente, em venda à ordem

    // Vendas para outros estados (6.xxx)
    '6101', // Venda de produção do estabelecimento
    '6102', // Venda de mercadoria adquirida ou recebida de terceiros
    '6103', // Venda de produção do estabelecimento, efetuada fora do estabelecimento
    '6104', // Venda de mercadoria adquirida ou recebida de terceiros, efetuada fora do estabelecimento
    '6105', // Venda de produção do estabelecimento que não deva por ele transitar
    '6106', // Venda de mercadoria adquirida ou recebida de terceiros, que não deva por ele transitar
    '6107', // Venda de produção do estabelecimento, destinada a não contribuinte
    '6108', // Venda de mercadoria adquirida ou recebida de terceiros, destinada a não contribuinte
    '6109', // Venda de produção do estabelecimento, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio
    '6110', // Venda de mercadoria adquirida ou recebida de terceiros, destinada à Zona Franca de Manaus ou Áreas de Livre Comércio
    '6116', // Venda de produção do estabelecimento originada de encomenda para entrega futura
    '6117', // Venda de mercadoria adquirida ou recebida de terceiros, originada de encomenda para entrega futura
    '6118', // Venda de produção do estabelecimento entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem
    '6119', // Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário por conta e ordem do adquirente originário, em venda à ordem
    '6120', // Venda de mercadoria adquirida ou recebida de terceiros entregue ao destinatário pelo vendedor remetente, em venda à ordem

    // Vendas para exterior (7.xxx)
    '7101', // Venda de produção do estabelecimento
    '7102', // Venda de mercadoria adquirida ou recebida de terceiros
    '7105', // Venda de produção do estabelecimento, que não deva por ele transitar
    '7106', // Venda de mercadoria adquirida ou recebida de terceiros, que não deva por ele transitar

    // Outras saídas comuns
    '5405', // Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte-substituto
    '6404', // Venda de mercadoria sujeita ao regime de substituição tributária, cujo imposto já tenha sido retido anteriormente
    '6403', // Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte-substituído
]);

export interface CfopValidationResult {
    isValidForCredit: boolean;
    reason: string;
    cfopType: 'saida' | 'entrada' | 'ausente' | 'invalido';
}

/**
 * Valida se um CFOP representa uma operação de VENDA (saída) que deveria ter sido
 * segregada no PGDAS do Simples Nacional
 * 
 * @param cfop - Código CFOP da operação
 * @returns Resultado da validação indicando se deveria ter sido segregada
 */
export const validateCfopForCredit = (cfop: string): CfopValidationResult => {
    // CFOP ausente ou vazio
    if (!cfop || cfop.trim() === '') {
        return {
            isValidForCredit: false,
            reason: 'CFOP ausente. Não é possível determinar se a receita deveria ter sido segregada no PGDAS.',
            cfopType: 'ausente'
        };
    }

    // CFOP inválido (deve ter 4 dígitos)
    const cleanCfop = cfop.replace(/\D/g, '');
    if (cleanCfop.length !== 4) {
        return {
            isValidForCredit: false,
            reason: `CFOP "${cfop}" inválido (deve ter 4 dígitos).`,
            cfopType: 'invalido'
        };
    }

    // Verifica se é CFOP de venda válido para segregação
    if (VALID_SALES_CFOPS.has(cleanCfop)) {
        return {
            isValidForCredit: true,
            reason: `CFOP ${cleanCfop} é uma operação de VENDA. Receita monofásica deveria ter sido segregada no PGDAS.`,
            cfopType: 'saida'
        };
    }

    // CFOP não é de venda - verifica se é entrada
    const firstDigit = cleanCfop[0];
    if (firstDigit === '1' || firstDigit === '2' || firstDigit === '3') {
        return {
            isValidForCredit: false,
            reason: `CFOP ${cleanCfop} é uma operação de ENTRADA/COMPRA. No Simples Nacional, o crédito vem da segregação de VENDAS monofásicas, não de compras.`,
            cfopType: 'entrada'
        };
    }

    // CFOP de saída, mas não está na lista de vendas válidas
    return {
        isValidForCredit: false,
        reason: `CFOP ${cleanCfop} é uma saída, mas pode não gerar direito a crédito. Requer revisão humana.`,
        cfopType: 'saida'
    };
};
