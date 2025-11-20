import Dexie, { Table } from 'dexie';
import { Company, Invoice, UploadFile, CalculationInput } from '../types';

export interface CompanyEntity extends Omit<Company, 'id'> {
    id?: string; // Optional because Dexie auto-generates it
}

export interface InvoiceEntity extends Invoice {
    companyId: string; // Foreign key to Company
}

export interface UploadFileEntity extends UploadFile {
    companyId: string;
}

export interface CalculationInputEntity extends CalculationInput {
    companyId: string;
    competence_month: string; // Primary key part or indexed
}

export type CalculationEntity = CalculationInputEntity;

export class PisCofinsDb extends Dexie {
    companies!: Table<CompanyEntity, string>;
    invoices!: Table<InvoiceEntity, number>;
    files!: Table<UploadFileEntity, number>;
    calculations!: Table<CalculationInputEntity, [string, string]>; // Compound key: [companyId, competence_month]

    constructor() {
        // Using new database name to avoid migration issues
        super('PisCofinsDb_Supabase');

        // Version 1: New schema with UUID support from the start
        this.version(1).stores({
            companies: 'id', // UUID provided by Supabase, not auto-increment
            invoices: '++id, companyId, issue_date',
            files: '++id, companyId',
            calculations: '[companyId+competence_month]'
        });
    }
}

export const db = new PisCofinsDb();
