import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportData {
    headers: string[];
    rows: any[][];
    sheetName: string;
    fileName: string;
}

export const exportService = {
    exportToExcel(data: ExportData) {
        const worksheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, data.sheetName);

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${data.fileName}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
    },

    exportAccounts(accounts: any[], currencySymbol: string) {
        const headers = ['Code', 'Account Name', 'Type', `Balance (${currencySymbol})`, 'Created Date'];
        const rows = accounts.map(acc => [
            acc.code,
            acc.name,
            acc.type,
            acc.balance?.toFixed(2) || '0.00',
            new Date(acc.createdAt).toLocaleDateString()
        ]);
        this.exportToExcel({ headers, rows, sheetName: 'Accounts', fileName: 'chart_of_accounts' });
    },

    exportTransactions(transactions: any[], currencySymbol: string) {
        const headers = ['ID', 'Date', 'Description', 'Type', 'Category', `Amount (${currencySymbol})`, `VAT (${currencySymbol})`, `Gross (${currencySymbol})`];
        const rows = transactions.map(tx => [
            tx.id,
            tx.date,
            tx.description,
            tx.type,
            tx.category,
            (tx.amount - tx.vatAmount).toFixed(2),
            tx.vatAmount?.toFixed(2) || '0.00',
            tx.amount?.toFixed(2) || '0.00'
        ]);
        this.exportToExcel({ headers, rows, sheetName: 'Transactions', fileName: 'transactions' });
    },

    exportAssets(assets: any[], currencySymbol: string) {
        const headers = ['Name', 'Category', 'Purchase Date', `Purchase Price (${currencySymbol})`, 'Supplier', 'Serial Number', 'Location', 'Status', 'Warranty Expiry'];
        const rows = assets.map(asset => [
            asset.name,
            asset.category,
            asset.purchaseDate,
            asset.purchasePrice?.toFixed(2) || '0.00',
            asset.supplierName,
            asset.serialNumber || 'N/A',
            asset.location || 'N/A',
            asset.status,
            asset.warrantyExpiry || 'N/A'
        ]);
        this.exportToExcel({ headers, rows, sheetName: 'Assets', fileName: 'asset_register' });
    },

    exportVAT201(outputVat: number, inputVat: number, netVat: number, currencySymbol: string) {
        const headers = ['Field', 'Description', `Amount (${currencySymbol})`];
        const rows = [
            ['1A', 'Output VAT (Sales)', outputVat.toFixed(2)],
            ['14A', 'Input VAT (Expenses)', inputVat.toFixed(2)],
            ['', 'Net VAT Payable/Refundable', netVat.toFixed(2)]
        ];
        this.exportToExcel({ headers, rows, sheetName: 'VAT201', fileName: 'vat201_report' });
    },

    exportLedger(transactions: any[], accounts: any[], currencySymbol: string) {
        const headers = ['Date', 'Description', 'Debit Account', 'Credit Account', `Debit (${currencySymbol})`, `Credit (${currencySymbol})`, 'Category', 'Type'];
        const rows = transactions.map(tx => {
            const fromAcc = accounts.find(a => a.id === tx.fromAccount)?.name || '';
            const toAcc = accounts.find(a => a.id === tx.toAccount)?.name || '';
            return [
                tx.date,
                tx.description,
                toAcc,
                fromAcc,
                tx.type === 'EXPENSE' ? (tx.amount - tx.vatAmount).toFixed(2) : '—',
                tx.type === 'INVOICE' ? (tx.amount - tx.vatAmount).toFixed(2) : '—',
                tx.category,
                tx.type
            ];
        });
        this.exportToExcel({ headers, rows, sheetName: 'Ledger', fileName: 'audit_ledger' });
    },

    exportTrialBalance(accounts: any[], currencySymbol: string) {
        const headers = ['Account Code', 'Account Name', 'Account Type', `Debit (${currencySymbol})`, `Credit (${currencySymbol})`];
        const rows = accounts.map(acc => {
            let debit = 0, credit = 0;
            if (acc.type === 'Asset' || acc.type === 'Expense') {
                debit = acc.balance;
            } else {
                credit = acc.balance;
            }
            return [acc.code, acc.name, acc.type, debit.toFixed(2), credit.toFixed(2)];
        });
        this.exportToExcel({ headers, rows, sheetName: 'Trial Balance', fileName: 'trial_balance' });
    }
};