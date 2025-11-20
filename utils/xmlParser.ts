import { Invoice, InvoiceItem } from '../types';

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


export const parseNFeXML = (xmlString: string, fileName?: string): Invoice | null => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");

        const errorNode = xmlDoc.querySelector("parsererror");
        if (errorNode) {
            console.error("Error parsing XML:", errorNode.textContent);
            return null;
        }

        const rootEl = xmlDoc.documentElement;
        let infNFe: Element | undefined | null = null;

        // Handle both <nfeProc><NFe><infNFe>...</NFe></nfeProc> and <NFe><infNFe>...</infNFe></NFe> structures
        if (rootEl.localName === 'nfeProc') {
            const nfeNode = findChild(rootEl, 'NFe');
            infNFe = findChild(nfeNode, 'infNFe');
        } else if (rootEl.localName === 'NFe') {
            infNFe = findChild(rootEl, 'infNFe');
        }

        if (!infNFe) {
            console.error("Tag <infNFe> not found. Root element was:", rootEl.localName);
            return null;
        }

        const ide = findChild(infNFe, 'ide');
        const totalEl = findChild(infNFe, 'total');
        const icmsTot = findChild(totalEl, 'ICMSTot');
        const detNodes = Array.from(infNFe.children).filter(child => child.localName === 'det');

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
                is_monofasico: false, // Default value, will be classified later
                classification_confidence: 1.0,
                classification_rule: 'N/A',
                needs_human_review: false, // Default value
            };
        });

        const accessKey = infNFe.getAttribute("Id")?.replace("NFe", "") ?? `INV_${Date.now()}`;
        const issueDateString = getChildText(ide, "dhEmi");

        const invoice: Invoice = {
            id: Date.now() + Math.random(),
            access_key: accessKey,
            issue_date: new Date(issueDateString).toISOString().split('T')[0], // "YYYY-MM-DD"
            total_value: getChildNumber(icmsTot, "vNF"),
            items: items,
        };

        return invoice;
    } catch (e) {
        console.error(`Failed to parse NFe XML ${fileName || ''}`, e);
        return null;
    }
};