import Dexie, { Table } from 'dexie';
import { Company, Invoice, UploadFile, CalculationInput } from '../types';

export interface CompanyEntity extends Omit<Company, 'id'> {
    id?: number; // Optional because Dexie auto-generates it
}

export interface InvoiceEntity extends Invoice {
    companyId: number; // Foreign key to Company
}

export interface UploadFileEntity extends UploadFile {
    companyId: number;
}

export interface CalculationInputEntity extends CalculationInput {
    companyId: number;
    competence_month: string; // Primary key part or indexed
}

export type CalculationEntity = CalculationInputEntity;

export class PisCofinsDb extends Dexie {
    companies!: Table<CompanyEntity, number>;
    invoices!: Table<InvoiceEntity, number>;
    files!: Table<UploadFileEntity, number>;
    calculations!: Table<CalculationInputEntity, [number, string]>; // Compound key: [companyId, competence_month]

    constructor() {
        super('PisCofinsDb_v2');
        this.version(1).stores({
            companies: '++id',
            invoices: '++id, companyId, issue_date',
            files: '++id, companyId',
            calculations: '[companyId+competence_month]'
        });
    }
}

export const db = new PisCofinsDb();
