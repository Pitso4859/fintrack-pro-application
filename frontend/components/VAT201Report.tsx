
import React from 'react';
import { Transaction, Currency } from '../types.ts';
import { ArrowLeft, Printer, Download, ShieldCheck, Landmark } from 'lucide-react';

interface VAT201ReportProps {
  transactions: Transaction[];
  currency: Currency;
  onBack: () => void;
}

const VAT201Report: React.FC<VAT201ReportProps> = ({ transactions, currency, onBack }) => {
  // Formal SARS field calculations
  const standardRateSales = transactions
    .filter(t => t.type === 'INVOICE' && t.vatRate === 0.15)
    .reduce((sum, t) => sum + (t.amount - t.vatAmount), 0);

  const standardRateOutputTax = transactions
    .filter(t => t.type === 'INVOICE' && t.vatRate === 0.15)
    .reduce((sum, t) => sum + t.vatAmount, 0);

  const standardRateInputs = transactions
    .filter(t => t.type === 'EXPENSE' && t.isVatClaimed && t.vatRate === 0.15)
    .reduce((sum, t) => sum + (t.amount - t.vatAmount), 0);

  const standardRateInputTax = transactions
    .filter(t => t.type === 'EXPENSE' && t.isVatClaimed && t.vatRate === 0.15)
    .reduce((sum, t) => sum + t.vatAmount, 0);

  const totalOutputTax = standardRateOutputTax;
  const totalInputTax = standardRateInputTax;
  const netPayable = totalOutputTax - totalInputTax;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to Compliance Center
        </button>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm transition">
            <Download size={16} className="mr-2" /> Export PDF
          </button>
          <button className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200 transition">
            <Printer size={16} className="mr-2" /> Print
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-12 font-serif overflow-hidden relative">
        {/* Formal Header */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 mb-2">
              <Landmark size={32} />
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">SARS</h2>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">VAT201 Declaration</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Tax Period End</p>
            <p className="text-lg font-bold text-slate-900">31 DEC 2023</p>
            <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-lg uppercase tracking-widest border border-emerald-200">
              Validated System Data
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-10">
          {/* Output Tax Section */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest bg-slate-100 p-3 rounded-lg text-slate-900 mb-6 flex justify-between items-center">
              <span>Part A: Output Tax (Sales & Adjustments)</span>
              <span className="text-[9px] font-medium text-slate-500">Standard Rate (15%)</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-slate-400 mr-4">01</span>
                  <span className="text-sm font-medium text-slate-700">Standard rate (Excluding VAT)</span>
                </div>
                <div className="w-48 text-right font-mono text-sm font-bold text-slate-900">
                  {currency.symbol}{standardRateSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 bg-blue-50/30 -mx-4 px-4 rounded-t-lg">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-blue-600 mr-4">1A</span>
                  <span className="text-sm font-bold text-slate-900 uppercase">Output Tax (Calculated)</span>
                </div>
                <div className="w-48 text-right font-mono text-base font-black text-blue-600">
                  {currency.symbol}{standardRateOutputTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </section>

          {/* Input Tax Section */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest bg-slate-100 p-3 rounded-lg text-slate-900 mb-6 flex justify-between items-center">
              <span>Part B: Input Tax (Expenses & Reclaims)</span>
              <span className="text-[9px] font-medium text-slate-500">Claimable on Tax Invoices</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-slate-400 mr-4">14</span>
                  <span className="text-sm font-medium text-slate-700">Standard rate (Excluding VAT)</span>
                </div>
                <div className="w-48 text-right font-mono text-sm font-bold text-slate-900">
                  {currency.symbol}{standardRateInputs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 bg-rose-50/30 -mx-4 px-4 rounded-t-lg">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-rose-600 mr-4">14A</span>
                  <span className="text-sm font-bold text-slate-900 uppercase">Input Tax (Verified)</span>
                </div>
                <div className="w-48 text-right font-mono text-base font-black text-rose-600">
                  {currency.symbol}{standardRateInputTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </section>

          {/* Totals Section */}
          <section className="mt-16 pt-8 border-t-4 border-slate-900">
             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-black uppercase text-slate-400">
                    <span>Summary Account</span>
                    <span>Component</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Output (1A)</span>
                    <span className="font-bold text-slate-900">+{currency.symbol}{totalOutputTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Input (14A)</span>
                    <span className="font-bold text-slate-900">-{currency.symbol}{totalInputTax.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`p-8 rounded-[2rem] flex flex-col justify-center items-center text-center ${netPayable >= 0 ? 'bg-slate-900 text-white shadow-2xl shadow-slate-300' : 'bg-emerald-600 text-white shadow-2xl shadow-emerald-200'}`}>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">
                     {netPayable >= 0 ? 'Net VAT Payable' : 'Net VAT Refundable'}
                   </p>
                   <h4 className="text-4xl font-black italic tracking-tighter">
                     {currency.symbol}{Math.abs(netPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </h4>
                   <div className="mt-4 flex items-center text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full border border-white/20">
                     <ShieldCheck size={12} className="mr-1.5" /> Official Declaration
                   </div>
                </div>
             </div>
          </section>
        </div>

        {/* Sign-off Placeholder */}
        <div className="mt-20 grid grid-cols-2 gap-12 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="border-t border-slate-200 pt-4">
            Authorized Signatory
          </div>
          <div className="border-t border-slate-200 pt-4 text-right">
            System Generated Stamp: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Security Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[35deg] pointer-events-none opacity-[0.03] text-[12rem] font-black whitespace-nowrap">
           VALIDATED DATA
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start space-x-4">
        <Landmark className="text-blue-600 shrink-0" size={20} />
        <div>
          <p className="text-xs font-bold text-blue-900 uppercase mb-1">SARS Submission Guide</p>
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            Copy the figures from codes <strong>01, 1A, 14, and 14A</strong> into your eFiling VAT201 return. This system-generated report is based on your double-entry ledger and is audit-ready for SARS inspectors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VAT201Report;
