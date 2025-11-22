
export enum UploadStatus {
  Pending = 'AGUARDANDO',
  Failed = 'FALHA NO PROCESSAMENTO',
  Processed = 'PROCESSADO',
}

export interface UploadFile {
  id: number;
  name: string;
  type: 'XML' | 'PDF' | 'ZIP';
  status: UploadStatus;
  progress: number;
  size: number;
  content: string;
  uploadDate: string;
}

export interface InvoiceItem {
  id: number;
  product_code: string;
  ncm_code: string;
  cfop: string;
  cst_pis: string;
  cst_cofins: string;
  description: string;
  total_value: number;
  is_monofasico: boolean;
  classification_confidence: number;
  classification_rule: string;
  needs_human_review: boolean;
  manual_override?: boolean;
  human_reviewed?: boolean;

  // Validação de CFOP para crédito
  cfop_valid_for_credit?: boolean;        // Se o CFOP permite crédito
  cfop_validation_message?: string;       // Mensagem explicativa sobre o CFOP
  credit_blocked_reason?: string;         // Razão pela qual o crédito foi bloqueado (se aplicável)
}

export interface Invoice {
  id: number;
  access_key: string;
  issue_date: string; // "YYYY-MM-DD"
  total_value: number;
  items: InvoiceItem[];
}

export type AnexoType = 'anexo1' | 'anexo2' | 'anexo3' | 'anexo4' | 'anexo5';

export interface CalculationInput {
  das_paid?: number;
  anexo?: AnexoType;
  rbt12?: number; // Receita Bruta Total dos últimos 12 meses
  manual_effective_aliquot?: number; // Alíquota efetiva informada manualmente (0-100)
  includeInReport?: boolean; // Flag to include/exclude month from reports
}


export interface CalculationResult {
  competence_month: string; // "YYYY-MM"
  total_revenue: number;
  monofasico_revenue: number;
  das_paid: number;
  anexo_used: string; // Added field
  effective_aliquot: number;
  pis_cofins_share: number; // % of the DAS that corresponds to PIS/COFINS for the specific bracket
  recalculated_das_due: number;
  credit_amount: number;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  created_at: string;
}

export interface CompanyData {
  company: Company;
  uploadedFiles: UploadFile[];
  invoices: Invoice[];
  calculation_inputs: Record<string, CalculationInput>; // Keyed by competence_month "YYYY-MM"
}
