import { GrantApplication } from '../types.ts';

const parseJsonbColumn = (item: any, key: string, defaultValue: any) => {
    try {
        if (typeof item[key] === 'string') return JSON.parse(item[key]);
        return item[key] || defaultValue;
    } catch {
        return defaultValue;
    }
};

export const parseGrantApplication = (app: any): GrantApplication => ({
    ...app,
    status_history: parseJsonbColumn(app, 'status_history', []),
    early_report_files: parseJsonbColumn(app, 'early_report_files', []),
    final_report_files: parseJsonbColumn(app, 'final_report_files', []),
});
