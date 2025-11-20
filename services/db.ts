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
        super('PisCofinsDb_v3');

        // Version 1: Initial schema
        this.version(1).stores({
            companies: '++id',
            invoices: '++id, companyId, issue_date',
            files: '++id, companyId',
            calculations: '[companyId+competence_month]'
        });

        // Version 2: Add includeInReport field (migration handled automatically by Dexie)
        this.version(2).stores({
            companies: '++id',
            invoices: '++id, companyId, issue_date',
            files: '++id, companyId',
            calculations: '[companyId+competence_month]'
        }).upgrade(async tx => {
            // Set includeInReport to true for all existing records (default: include all months)
            const calculations = await tx.table('calculations').toArray();
            for (const calc of calculations) {
                await tx.table('calculations').update([calc.companyId, calc.competence_month], {
                    includeInReport: true
                });
            }
        });
    }
}

export const db = new PisCofinsDb();
