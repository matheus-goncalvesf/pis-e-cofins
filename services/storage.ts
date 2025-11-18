import { CompanyData } from '../types';

const STORAGE_KEY = 'recuperaPisCofinsData';

export const saveData = (data: Record<string, CompanyData>): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serializedData);
  } catch (error) {
    console.error("Could not save data to localStorage", error);
  }
};

export const loadData = (): Record<string, CompanyData> => {
  try {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    if (serializedData === null) {
      return {};
    }
    const parsedData = JSON.parse(serializedData);

    if (typeof parsedData !== 'object' || parsedData === null) {
        return {};
    }

    const validatedData: Record<string, CompanyData> = {};
    for (const key in parsedData) {
        if (Object.prototype.hasOwnProperty.call(parsedData, key)) {
            const entry = parsedData[key];
            // A valid CompanyData object must have a `company` property which is an object with an `id`.
            if (entry && typeof entry.company === 'object' && entry.company !== null && typeof entry.company.id === 'string') {
                // It's a valid entry. Let's ensure other properties exist to prevent other potential crashes.
                validatedData[key] = {
                    company: entry.company,
                    uploadedFiles: Array.isArray(entry.uploadedFiles) ? entry.uploadedFiles : [],
                    invoices: Array.isArray(entry.invoices) ? entry.invoices : [],
                    calculation_inputs: (typeof entry.calculation_inputs === 'object' && entry.calculation_inputs !== null) ? entry.calculation_inputs : {},
                };
            }
        }
    }
    return validatedData;
  } catch (error) {
    console.error("Could not load data from localStorage", error);
    // If anything goes wrong during parsing or validation, return an empty object to prevent a crash.
    return {};
  }
};
