/**
 * InvoiceInbox.tsx
 *
 * Smart Inbox for uploading and processing invoices with AI text extraction.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Mail, PlusCircle, X, AlertCircle,
  Eye, Trash2, ArrowRight, DollarSign, Archive,
  Loader2, CheckCircle, Camera, Sparkles
} from 'lucide-react';
import { Bill, Currency, Account, Transaction } from '../types';
import api from '../services/api';

interface InvoiceInboxProps {
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  accounts: Account[];
  onAddTransaction: (tx: Transaction) => void;
  currency: Currency;
}

const InvoiceInbox: React.FC<InvoiceInboxProps> = ({
                                                     bills = [],
                                                     setBills,
                                                     accounts = [],
                                                     onAddTransaction,
                                                     currency,
                                                   }) => {
  const [showManualForm, setShowManualForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<Bill> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualBill, setManualBill] = useState({
    supplierName: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    totalVat: 0,
    lineItems: [{ id: Date.now(), description: '', quantity: 1, unitPrice: 0, total: 0, vatAmount: 0 }],
  });

  // Debug: Log accounts when component mounts
  useEffect(() => {
    console.log('=== InvoiceInbox Loaded ===');
    console.log('Accounts received:', accounts);
    console.log('Accounts count:', accounts.length);
    const tradeCreditors = accounts.find(a => a.code === '2100' || a.name === 'Trade Creditors');
    const operatingExpenses = accounts.find(a => a.code === '5100' || a.name === 'Operating Expenses');
    console.log('Trade Creditors found:', tradeCreditors);
    console.log('Operating Expenses found:', operatingExpenses);
  }, [accounts]);

  const formatCurrency = (amount: number): string => {
    const symbol = currency?.symbol || 'R';
    const safeAmount = amount || 0;
    return `${symbol}${safeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const aggregatePayable = (bills || [])
      .filter(b => b?.status === 'PENDING')
      .reduce((sum, b) => sum + (b?.totalAmount || 0), 0) || 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, or PDF');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setUploadPreview(base64String);
      await processUploadedImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const processUploadedImage = async (base64Image: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockExtracted = {
        supplierName: 'Sample Store',
        invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString().split('T')[0],
        totalAmount: 1250.00,
        totalVat: 163.04,
        lineItems: [{ id: Date.now(), description: 'Sample Product', quantity: 1, unitPrice: 1086.96, total: 1086.96, vatAmount: 163.04 }]
      };

      setExtractedData(mockExtracted);
      setSuccess('Receipt processed! Review and confirm the extracted data.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process receipt. Please enter manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmExtractedBill = async () => {
    if (!extractedData) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        supplier_name: extractedData.supplierName,
        invoice_number: extractedData.invoiceNumber,
        invoice_date: extractedData.date,
        total_amount: extractedData.totalAmount,
        total_vat: extractedData.totalVat,
        currency: 'ZAR',
        status: 'PENDING',
        document_data: uploadPreview,
      };

      const { data } = await api.post('/bills', payload);

      const newBill: Bill = {
        id: data.id,
        supplierName: data.supplier_name || data.supplierName,
        invoiceNumber: data.invoice_number || data.invoiceNumber || '',
        date: data.invoice_date || data.date,
        lineItems: extractedData.lineItems || [],
        totalAmount: data.total_amount || data.totalAmount,
        totalVat: data.total_vat || data.totalVat,
        currency: data.currency || 'ZAR',
        status: data.status || 'PENDING',
        documentData: data.document_data || data.documentData,
        depositRequired: data.deposit_required || data.depositRequired,
      };

      setBills(prev => [newBill, ...(prev || [])]);
      setUploadPreview(null);
      setExtractedData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess('Bill saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualInputChange = (field: string, value: any) => {
    setManualBill(prev => ({ ...prev, [field]: value }));
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    const newItems = [...manualBill.lineItems];
    newItems[index] = { ...newItems[index], [field]: value, id: newItems[index].id || Date.now() + index };

    const item = newItems[index];
    item.total = (item.quantity || 0) * (item.unitPrice || 0);
    item.vatAmount = (item.total || 0) * 0.15;

    const totalAmount = newItems.reduce((sum, i) => sum + (i.total || 0), 0);
    const totalVat = newItems.reduce((sum, i) => sum + (i.vatAmount || 0), 0);

    setManualBill(prev => ({
      ...prev,
      lineItems: newItems,
      totalAmount,
      totalVat
    }));
  };

  const addLineItem = () => {
    setManualBill(prev => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), { id: Date.now(), description: '', quantity: 1, unitPrice: 0, total: 0, vatAmount: 0 }]
    }));
  };

  const removeLineItem = (index: number) => {
    const newItems = [...(manualBill.lineItems || [])];
    newItems.splice(index, 1);
    const totalAmount = newItems.reduce((sum, i) => sum + (i.total || 0), 0);
    const totalVat = newItems.reduce((sum, i) => sum + (i.vatAmount || 0), 0);
    setManualBill(prev => ({
      ...prev,
      lineItems: newItems,
      totalAmount,
      totalVat
    }));
  };

  const handleManualSave = async () => {
    if (!manualBill.supplierName) {
      setError('Supplier name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        supplier_name: manualBill.supplierName,
        invoice_number: manualBill.invoiceNumber,
        invoice_date: manualBill.date,
        total_amount: manualBill.totalAmount,
        total_vat: manualBill.totalVat,
        currency: 'ZAR',
        status: 'PENDING',
      };

      const { data } = await api.post('/bills', payload);

      const newBill: Bill = {
        id: data.id,
        supplierName: data.supplier_name || data.supplierName,
        invoiceNumber: data.invoice_number || data.invoiceNumber || '',
        date: data.invoice_date || data.date,
        lineItems: [],
        totalAmount: data.total_amount || data.totalAmount,
        totalVat: data.total_vat || data.totalVat,
        currency: data.currency || 'ZAR',
        status: data.status || 'PENDING',
        documentData: data.document_data || data.documentData,
        depositRequired: data.deposit_required || data.depositRequired,
      };

      setBills(prev => [newBill, ...(prev || [])]);
      setShowManualForm(false);
      setManualBill({
        supplierName: '',
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        totalVat: 0,
        lineItems: [{ id: Date.now(), description: '', quantity: 1, unitPrice: 0, total: 0, vatAmount: 0 }],
      });
      setSuccess('Bill saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessBill = async (bill: Bill) => {
    console.log('=== Processing Bill ===');
    console.log('Bill:', bill);
    console.log('All accounts available:', accounts);

    // Find Trade Creditors account (code 2100)
    let creditorsAcc = accounts.find(a => a.code === '2100');
    if (!creditorsAcc) {
      creditorsAcc = accounts.find(a => a.name === 'Trade Creditors');
    }

    // Find Operating Expenses account (code 5100)
    let expenseAcc = accounts.find(a => a.code === '5100');
    if (!expenseAcc) {
      expenseAcc = accounts.find(a => a.name === 'Operating Expenses');
    }

    console.log('Found creditors account:', creditorsAcc);
    console.log('Found expense account:', expenseAcc);

    if (!creditorsAcc) {
      const availableCodes = accounts.map(a => `${a.code} - ${a.name} (${a.type})`).join('\n');
      setError(
          `Trade Creditors account not found.\n\nAvailable accounts:\n${availableCodes}\n\nPlease ensure an account with code '2100' or name 'Trade Creditors' exists.`
      );
      return;
    }

    if (!expenseAcc) {
      const availableCodes = accounts.map(a => `${a.code} - ${a.name} (${a.type})`).join('\n');
      setError(
          `Operating Expenses account not found.\n\nAvailable accounts:\n${availableCodes}\n\nPlease ensure an account with code '5100' or name 'Operating Expenses' exists.`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const newTxPayload = {
        transaction_date: bill.date || new Date().toISOString().split('T')[0],
        description: `Invoice ${bill.invoiceNumber} from ${bill.supplierName}`,
        amount: bill.totalAmount,
        vat_amount: bill.totalVat,
        vat_rate: 0.15,
        from_account_id: creditorsAcc.id,
        to_account_id: expenseAcc.id,
        category: 'Suppliers',
        type: 'EXPENSE',
        is_vat_claimed: true,
        bill_id: bill.id,
      };

      console.log('Sending transaction payload:', newTxPayload);
      const txRes = await api.post('/transactions', newTxPayload);
      console.log('Transaction response:', txRes.data);

      const newTx: Transaction = {
        id: txRes.data.id,
        date: txRes.data.transaction_date,
        description: txRes.data.description,
        amount: txRes.data.amount,
        vatAmount: txRes.data.vat_amount,
        vatRate: txRes.data.vat_rate,
        fromAccount: txRes.data.from_account_id,
        toAccount: txRes.data.to_account_id,
        category: txRes.data.category,
        type: txRes.data.type,
        isVatClaimed: txRes.data.is_vat_claimed,
        documentData: txRes.data.document_data,
        billId: txRes.data.bill_id,
      };
      onAddTransaction(newTx);

      await api.put(`/bills/${bill.id}`, { status: 'PROCESSED' });

      setBills(prev => prev.map(b => (b.id === bill.id ? { ...b, status: 'PROCESSED' } : b)));
      setSuccess(`Bill from ${bill.supplierName} processed successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Process error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to process bill. Please check the accounts exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    try {
      await api.delete(`/bills/${id}`);
      setBills(prev => prev.filter(b => b.id !== id));
      setSuccess('Bill deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete bill.');
    }
  };

  return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        {/* Document Viewer Modal */}
        {viewingDocument && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="relative max-w-5xl w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <Eye size={20} className="mr-2 text-blue-600" />
                    Document Viewer
                  </h3>
                  <button onClick={() => setViewingDocument(null)} className="p-2 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 overflow-auto bg-slate-50 p-8 flex justify-center">
                  <img src={viewingDocument} alt="Invoice Document" className="max-w-full h-auto shadow-2xl rounded-lg border border-slate-200" />
                </div>
                <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                  <button onClick={() => setViewingDocument(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition shadow-lg">
                    Close Viewer
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Upload Preview Modal */}
        {uploadPreview && extractedData && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="relative max-w-2xl w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <Sparkles size={20} className="mr-2 text-indigo-600" />
                    Extracted Receipt Data - Please Verify
                  </h3>
                  <button onClick={() => { setUploadPreview(null); setExtractedData(null); }} className="p-2 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                    <X size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Supplier</label><p className="text-sm font-bold text-slate-900">{extractedData.supplierName}</p></div>
                    <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Invoice #</label><p className="text-sm font-mono font-bold text-slate-900">{extractedData.invoiceNumber}</p></div>
                    <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Date</label><p className="text-sm font-bold text-slate-900">{extractedData.date}</p></div>
                    <div><label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Total Amount</label><p className="text-lg font-black text-emerald-600">{formatCurrency(extractedData.totalAmount || 0)}</p></div>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
                  <button onClick={() => { setUploadPreview(null); setExtractedData(null); }} className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-300 transition">Cancel</button>
                  <button onClick={confirmExtractedBill} disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition disabled:opacity-50 flex items-center">
                    {isSubmitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                    Confirm & Save
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Success Message */}
        {success && (
            <div className="fixed top-20 right-8 z-50 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center animate-in slide-in-from-right-5 duration-300">
              <CheckCircle size={20} className="mr-3" />
              <span className="text-sm font-bold">{success}</span>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Mail size={120} /></div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Smart Inbox</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Upload a receipt or enter invoice details manually.</p>

              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/jpeg,image/png,image/jpg,application/pdf" />

              <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl py-6 mb-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all group disabled:opacity-50">
                {isProcessing ? (
                    <><Loader2 size={32} className="text-blue-500 animate-spin mb-3" /><span className="text-sm font-black text-blue-600 uppercase tracking-widest">Processing Receipt...</span></>
                ) : (
                    <><div className="p-3 bg-slate-50 rounded-2xl mb-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors"><Camera size={22} /></div><span className="text-sm font-bold text-slate-900">Upload Receipt</span><span className="text-xs text-slate-400 font-medium mt-1">PNG, JPG, PDF (AI extracts text)</span></>
                )}
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-slate-400 font-bold uppercase tracking-wider">OR</span></div>
              </div>

              <button onClick={() => setShowManualForm(!showManualForm)} className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl py-6 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group">
                <div className="p-3 bg-slate-50 rounded-2xl mb-3 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors"><PlusCircle size={22} /></div>
                <span className="text-sm font-bold text-slate-900">Enter Manually</span>
                <span className="text-xs text-slate-400 font-medium mt-1">Create a bill from scratch</span>
              </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-700">
                  <div className="flex items-start"><AlertCircle size={18} className="mr-3 shrink-0 mt-0.5" /><p className="text-xs font-bold whitespace-pre-line">{error}</p></div>
                </div>
            )}

            {/* Manual Entry Form */}
            {showManualForm && (
                <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-y-auto max-h-[70vh]">
                  <div className="flex justify-between mb-6"><span className="text-[10px] font-black text-blue-400">Manual Invoice Entry</span><button onClick={() => setShowManualForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button></div>
                  <div className="space-y-4">
                    <div><label className="text-[10px] font-black text-slate-500 block mb-1">Supplier Name *</label><input type="text" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm" value={manualBill.supplierName} onChange={e => handleManualInputChange('supplierName', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black text-slate-500 block mb-1">Invoice #</label><input type="text" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm" value={manualBill.invoiceNumber} onChange={e => handleManualInputChange('invoiceNumber', e.target.value)} /></div><div><label className="text-[10px] font-black text-slate-500 block mb-1">Date</label><input type="date" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm" value={manualBill.date} onChange={e => handleManualInputChange('date', e.target.value)} /></div></div>
                    <div><label className="text-[10px] font-black text-slate-500 block mb-2">Line Items</label>
                      {(manualBill.lineItems || []).map((item, idx) => (
                          <div key={item.id || idx} className="mb-4 p-4 bg-white/5 rounded-xl space-y-2">
                            <input type="text" placeholder="Description" className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" value={item.description} onChange={e => handleLineItemChange(idx, 'description', e.target.value)} />
                            <div className="grid grid-cols-3 gap-2">
                              <input type="number" placeholder="Qty" className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" value={item.quantity} onChange={e => handleLineItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                              <input type="number" placeholder="Unit Price" className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" value={item.unitPrice} onChange={e => handleLineItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                              <input type="number" placeholder="Total" className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" value={item.total} readOnly />
                            </div>
                            <button onClick={() => removeLineItem(idx)} className="text-xs text-rose-400">Remove</button>
                          </div>
                      ))}
                      <button onClick={addLineItem} className="text-xs text-blue-400 flex items-center"><PlusCircle size={14} className="mr-1" /> Add Item</button>
                    </div>
                    <div className="pt-4 border-t-2 border-blue-500/30 flex justify-between">
                      <div><p className="text-[10px] font-black text-slate-500">Total (Incl. VAT)</p><p className="text-2xl font-black text-emerald-400">{formatCurrency(manualBill.totalAmount || 0)}</p></div>
                      <button onClick={handleManualSave} disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black">{isSubmitting ? 'Saving...' : 'Save Bill'}</button>
                    </div>
                  </div>
                </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Bills Payable Queue</h3>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full">{(bills || []).filter(b => b?.status === 'PENDING').length} TO PROCESS</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400">
                  <tr>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-4 py-4">Supplier / Ref</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4 text-right">Total</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {!bills || bills.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-32 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <Archive size={48} className="text-slate-300 mb-4" />
                            <p className="text-sm font-black text-slate-600">Your Inbox is Clear</p>
                            <p className="text-xs text-slate-400 mt-1">Upload a receipt or click "Enter Manually" to create a bill.</p>
                          </div>
                        </td>
                      </tr>
                  ) : (
                      bills.map((bill, index) => (
                          <tr key={bill.id || index} className="hover:bg-slate-50/50">
                            <td className="px-8 py-6">
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${bill.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {bill.status}
                          </span>
                            </td>
                            <td className="px-4 py-6">
                              <p className="text-sm font-bold text-slate-900">{bill.supplierName}</p>
                              <p className="text-[10px] text-slate-400">INV: {bill.invoiceNumber || 'N/A'}</p>
                            </td>
                            <td className="px-4 py-6 text-xs text-slate-500">{bill.date}</td>
                            <td className="px-4 py-6 text-right">
                              <p className="text-sm font-black text-slate-900">{formatCurrency(bill.totalAmount)}</p>
                              <p className="text-[10px] text-emerald-600">VAT: {formatCurrency(bill.totalVat)}</p>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-end space-x-2">
                                {bill.documentData && (
                                    <button onClick={() => setViewingDocument(bill.documentData!)} className="p-2 text-slate-400 hover:text-blue-600">
                                      <Eye size={16} />
                                    </button>
                                )}
                                {bill.status === 'PENDING' ? (
                                    <>
                                      <button onClick={() => handleProcessBill(bill)} disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black">
                                        Process <ArrowRight size={14} className="ml-2 inline" />
                                      </button>
                                      <button onClick={() => handleDeleteBill(bill.id)} className="p-2 text-slate-400 hover:text-rose-600">
                                        <Trash2 size={16} />
                                      </button>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-slate-400 italic">Ledgered</span>
                                )}
                              </div>
                            </td>
                          </tr>
                      ))
                  )}
                  </tbody>
                </table>
              </div>
              <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400">Aggregate Payable</p>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(aggregatePayable)}</p>
                </div>
                <button onClick={() => setShowManualForm(true)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black">
                  + New Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default InvoiceInbox;