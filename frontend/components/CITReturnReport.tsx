
import React, { useState } from 'react';
import { Transaction, Currency } from '../types.ts';
import { SARS_CIT_RATE } from '../constants.ts';
import { ArrowLeft, Printer, Download, ShieldCheck, Landmark, Calculator, AlertTriangle } from 'lucide-react';

interface CITReturnReportProps {
  transactions: Transaction[];
  currency: Currency;
  onBack: () => void;
}

const CITReturnReport: React.FC<CITReturnReportProps> = ({ transactions, currency, onBack }) => {
  const [period, setPeriod] = useState<'1st' | '2nd'>('1st');

  // SARS Field Calculations for IRP6
  const totalRevenue = transactions
    .filter(t => t.type === 'INVOICE')
    .reduce((sum, t) => sum + (t.amount - t.vatAmount), 0);

  const totalDeductibleExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (t.amount - t.vatAmount), 0);

  const estimatedTaxableIncome = Math.max(0, totalRevenue - totalDeductibleExpenses);
  const taxLiability = estimatedTaxableIncome * SARS_CIT_RATE;
  
  // Provisional payment calculation logic
  const provisionalPayment = period === '1st' ? (taxLiability / 2) : taxLiability;

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
          <div className="bg-white border border-slate-200 rounded-xl flex p-1 shadow-sm">
            <button 
              onClick={() => setPeriod('1st')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === '1st' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              1st Period
            </button>
            <button 
              onClick={() => setPeriod('2nd')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === '2nd' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              2nd Period
            </button>
          </div>
          <button className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200 transition">
            <Printer size={16} className="mr-2" /> Print IRP6
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-12 font-serif overflow-hidden relative">
        {/* Formal Header */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 mb-2">
              <Landmark size={32} />
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">SARS</h2>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">IRP6 Provisional Tax Return</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Tax Year</p>
            <p className="text-lg font-bold text-slate-900">2024</p>
            <span className="inline-block mt-2 px-3 py-1 bg-amber-50 text-amber-700 text-[9px] font-black rounded-lg uppercase tracking-widest border border-amber-200">
              Provisional Status: {period} Payment
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-12">
          {/* Section 1: Income Calculation */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest bg-slate-100 p-3 rounded-lg text-slate-900 mb-6 flex justify-between items-center">
              <span>Part 1: Estimated Taxable Income</span>
              <span className="text-[9px] font-medium text-slate-500">Based on YTD Performance</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-slate-400 mr-4">RE01</span>
                  <span className="text-sm font-medium text-slate-700">Gross Estimated Revenue (Excl. VAT)</span>
                </div>
                <div className="w-48 text-right font-mono text-sm font-bold text-slate-900">
                  {currency.symbol}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-slate-400 mr-4">EX01</span>
                  <span className="text-sm font-medium text-slate-700">Deductible Operating Expenses</span>
                </div>
                <div className="w-48 text-right font-mono text-sm font-bold text-rose-600">
                  -{currency.symbol}{totalDeductibleExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 bg-blue-50/30 -mx-4 px-4 rounded-t-lg pt-2">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-blue-600 mr-4">TI01</span>
                  <span className="text-sm font-bold text-slate-900 uppercase">Estimated Taxable Income</span>
                </div>
                <div className="w-48 text-right font-mono text-base font-black text-blue-600">
                  {currency.symbol}{estimatedTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Tax Computation */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest bg-slate-100 p-3 rounded-lg text-slate-900 mb-6 flex justify-between items-center">
              <span>Part 2: Tax Liability Computation</span>
              <span className="text-[9px] font-medium text-slate-500">Corporate Rate (27%)</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-slate-400 mr-4">TX01</span>
                  <span className="text-sm font-medium text-slate-700">Tax on Estimated Taxable Income</span>
                </div>
                <div className="w-48 text-right font-mono text-sm font-bold text-slate-900">
                  {currency.symbol}{taxLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mt-12 bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Calculator size={80} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-slate-400">
                     Current Payment Required
                   </p>
                   <h4 className="text-4xl font-black italic tracking-tighter">
                     {currency.symbol}{provisionalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </h4>
                   <p className="mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                     <ShieldCheck size={12} className="mr-1.5 text-blue-400" /> 
                     {period === '1st' ? '50% of Total Estimated Tax' : '100% of Total Estimated Tax'}
                   </p>
                </div>
                <div className="flex flex-col justify-end border-l border-white/10 pl-8">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400">SBC Reduction</span>
                      <span>{currency.symbol}0.00</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400">Foreign Tax Credits</span>
                      <span>{currency.symbol}0.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Declaration */}
        <div className="mt-16 p-6 border-l-4 border-amber-500 bg-amber-50 rounded-r-2xl">
           <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center">
             <AlertTriangle size={14} className="mr-2" /> Declaration
           </h5>
           <p className="text-[11px] text-amber-700 leading-relaxed italic">
             I declare that the information provided in this return is true and correct to the best of my knowledge. I understand that the Commissioner may require the taxpayer to provide proof of any estimates provided herein.
           </p>
        </div>

        {/* Footer info */}
        <div className="mt-12 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Official System Transcript</span>
          <span>Generated via FinTrack Pro AI-Verify</span>
        </div>

        {/* Security Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[35deg] pointer-events-none opacity-[0.03] text-[12rem] font-black whitespace-nowrap">
           IRP6 DRAFT
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[2rem] flex items-center justify-between text-white shadow-2xl">
        <div className="flex items-center space-x-6">
          <div className="bg-blue-600 p-3 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-bold">SARS eFiling Sync Ready</h4>
            <p className="text-xs text-slate-400">This estimate is based on verified double-entry transactions.</p>
          </div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3 rounded-2xl transition-all uppercase tracking-tighter text-xs shadow-lg shadow-blue-900/40">
           Submit to eFiling
        </button>
      </div>
    </div>
  );
};

export default CITReturnReport;
