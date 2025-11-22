import { Invoice, InvoiceItem } from '../types';
import { checkIsMonofasico } from './ncmMatcher';
import { validateCfopForCredit } from './cfopValidator';

// Helper to find a direct child element by its local name (ignores namespace prefixes)
const findChild = (parent: Element | undefined | null, localName: string): Element | undefined => {
    if (!parent) return undefined;
    // Use `children` which contains only Element nodes
    return Array.from(parent.children).find(child => child.localName === localName);
};

// Helper to get text content from a direct child
const getChildText = (parent: Element | undefined | null, localName: string, defaultValue: string = ''): string => {
    const child = findChild(parent, localName);
    return child?.textContent ?? defaultValue;
};

// Helper to get a number from a direct child
const getChildNumber = (parent: Element | undefined, localName: string, defaultValue: number = 0): number => {
    const text = getChildText(parent, localName, '');
    return parseFloat(text) || defaultValue;
};

// Helper to find CST for PIS or COFINS
const findCst = (impostoEl: Element | undefined, taxName: 'PIS' | 'COFINS'): string => {
    if (!impostoEl) return '';
    const taxEl = findChild(impostoEl, taxName);
    if (!taxEl) return '';

    // NFe can have different groups like PISAliq, PISNT, PISOutr, etc.
    // We get the first child of PIS/COFINS which contains the CST
    const taxGroupEl = taxEl.firstElementChild;
    return getChildText(taxGroupEl, 'CST', '');
}

/**
 * Normaliza o XML da NF-e removendo namespaces que podem causar problemas no parsing
 * 
 * O XML da NF-e usa namespace padrão (http://www.portalfiscal.inf.br/nfe), fazendo com que
 * tags sejam lidas como {namespace}tag. Esta função remove os namespaces para facilitar o parsing.
 */
const normalizeXmlNamespaces = (xmlString: string): string => {
    // Remove TODAS as declarações de namespace conhecidas
    let normalized = xmlString
        // Namespace principal da NFe
        .replace(/\s*xmlns="[^"]*"/g, '')
        .replace(/\s*xmlns:nfe="[^"]*"/g, '')
        .replace(/\s*xmlns:sig="[^"]*"/g, '')
        // Outros namespaces comuns
        .replace(/\s*xmlns:xsi="[^"]*"/g, '')
        .replace(/\s*xsi:schemaLocation="[^"]*"/g, '')
        .replace(/\s*versao="[^"]*"/g, '');

    // Remove TODOS os prefixos de namespace das tags
    // Ex: <nfe:tag> vira <tag>, </nfe:tag> vira </tag>
    normalized = normalized.replace(/<(\/?)[a-zA-Z0-9]+:/g, '<$1');

    return normalized;
};


export const parseNFeXML = (xmlString: string, fileName?: string): Invoice | null => {
    try {
        // Normalizar XML removendo namespaces antes de fazer o parsing
        const normalizedXml = normalizeXmlNamespaces(xmlString);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(normalizedXml, "application/xml");

        const errorNode = xmlDoc.querySelector("parsererror");
        if (errorNode) {
            console.error("Error parsing XML:", errorNode.textContent);
            return null;
        }

        const rootEl = xmlDoc.documentElement;
        console.log("Root element:", rootEl.localName, rootEl.tagName);

        let infNFe: Element | undefined | null = null;

        // Handle both <nfeProc><NFe><infNFe>...</NFe></nfeProc> and <NFe><infNFe>...</infNFe></NFe> structures
        if (rootEl.localName === 'nfeProc') {
            const nfeNode = findChild(rootEl, 'NFe');
            console.log("nfeProc -> NFe found:", !!nfeNode);
            infNFe = findChild(nfeNode, 'infNFe');
        } else if (rootEl.localName === 'NFe') {
            infNFe = findChild(rootEl, 'infNFe');
        }

        console.log("infNFe found:", !!infNFe);

        if (!infNFe) {
            console.error("Tag <infNFe> not found. Root element was:", rootEl.localName);
            console.error("Root children:", Array.from(rootEl.children).map(c => c.localName));
            return null;
        }

        const ide = findChild(infNFe, 'ide');
        const totalEl = findChild(infNFe, 'total');
        const icmsTot = findChild(totalEl, 'ICMSTot');
        const detNodes = Array.from(infNFe.children).filter(child => child.localName === 'det');

        console.log("Tags found -> ide:", !!ide, "totalEl:", !!totalEl, "icmsTot:", !!icmsTot, "detNodes:", detNodes.length);
        console.log("infNFe children:", Array.from(infNFe.children).map(c => c.localName));

        if (!ide || !icmsTot || detNodes.length === 0) {
            console.error("Essential tags for parsing are missing (<ide>, <ICMSTot>, or <det>).");
            return null;
        }

        const items: InvoiceItem[] = detNodes.map((det) => {
            const prod = findChild(det, "prod");
            const imposto = findChild(det, "imposto");
            return {
                id: Date.now() + Math.random(), // Generate a unique ID
                product_code: getChildText(prod, "cProd"),
                ncm_code: getChildText(prod, "NCM"),
                cfop: getChildText(prod, "CFOP"),
                description: getChildText(prod, "xProd"),
                total_value: getChildNumber(prod, "vProd"),
                cst_pis: findCst(imposto, 'PIS'),
                cst_cofins: findCst(imposto, 'COFINS'),
                is_monofasico: false, // Will be set after classification
                classification_confidence: 1.0,
                classification_rule: 'N/A',
                needs_human_review: false, // Will be set after classification
            };
        });

        // Classificar cada item considerando NCM + CFOP
        const classifiedItems: InvoiceItem[] = items.map(item => {
            // 1. Validar NCM (verifica se o produto é monofásico)
            const ncmResult = checkIsMonofasico(item.ncm_code);

            // 2. Validar CFOP (verifica se a operação gera direito a crédito)
            const cfopResult = validateCfopForCredit(item.cfop);

            // 3. Determinar se há direito ao crédito
            // Para ter direito ao crédito, AMBOS devem ser verdadeiros:
            // - NCM deve ser monofásico
            // - CFOP deve ser válido para crédito (venda no SN)
            const canHaveCredit = ncmResult.isMonofasico && cfopResult.isValidForCredit;

            // 4. Determinar se precisa revisão humana
            // Casos que precisam revisão:
            // a) NCM monofásico MAS CFOP não é válido para crédito (principal caso!)
            // b) CFOP ausente ou inválido em produto monofásico
            const needsReview = ncmResult.isMonofasico && !cfopResult.isValidForCredit;

            // 5. Montar mensagem explicativa sobre bloqueio de crédito (se aplicável)
            let creditBlockedReason: string | undefined = undefined;
            if (ncmResult.isMonofasico && !cfopResult.isValidForCredit) {
                // Produto É monofásico, mas o CFOP impede o crédito
                creditBlockedReason = `Produto monofásico (NCM ${item.ncm_code}), porém ${cfopResult.reason}`;
            }

            // Log para debug
            console.log(`Item: ${item.description}`);
            console.log(`  NCM ${item.ncm_code} monofásico: ${ncmResult.isMonofasico}`);
            console.log(`  CFOP ${item.cfop} válido: ${cfopResult.isValidForCredit}`);
            console.log(`  Crédito permitido (is_monofasico): ${canHaveCredit}`);

            return {
                ...item,
                // CRÍTICO: is_monofasico deve ser FALSE se NCM é monofásico mas CFOP é inválido
                // Isso garante que o checkbox vem DESMARCADO
                is_monofasico: canHaveCredit,  // Será FALSE se CFOP for inválido, mesmo com NCM monofásico
                classification_rule: ncmResult.ruleDescription,
                classification_confidence: ncmResult.isMonofasico ? 1.0 : 0.0,
                needs_human_review: needsReview,
                cfop_valid_for_credit: cfopResult.isValidForCredit,
                cfop_validation_message: cfopResult.reason,
                credit_blocked_reason: creditBlockedReason,
            };
        });

        const accessKey = infNFe.getAttribute("Id")?.replace("NFe", "") ?? `INV_${Date.now()}`;
        const issueDateString = getChildText(ide, "dhEmi");

        const invoice: Invoice = {
            id: Date.now() + Math.random(),
            access_key: accessKey,
            issue_date: new Date(issueDateString).toISOString().split('T')[0], // "YYYY-MM-DD"
            total_value: getChildNumber(icmsTot, "vNF"),
            items: classifiedItems, // Usar items classificados
        };

        return invoice;
    } catch (e) {
        console.error(`Failed to parse NFe XML ${fileName || ''}`, e);
        return null;
    }
};