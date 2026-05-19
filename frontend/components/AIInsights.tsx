
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Account } from '../types.ts';
import { analyzeFinances } from '../services/geminiService.ts';
import { Sparkles, BrainCircuit, Send, Loader2, FileSearch } from 'lucide-react';

interface AIInsightsProps {
  transactions: Transaction[];
  accounts: Account[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions, accounts }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleAnalysis = async (customQuery?: string) => {
    setLoading(true);
    const q = customQuery || "Provide a comprehensive audit of my current financial position.";
    
    if (customQuery) {
      setChatHistory(prev => [...prev, { role: 'user', text: customQuery }]);
    }

    const result = await analyzeFinances(transactions, accounts, q);
    
    if (customQuery) {
      setChatHistory(prev => [...prev, { role: 'ai', text: result || 'I was unable to analyze that. Please try again.' }]);
    } else {
      setAnalysis(result || '');
    }
    setLoading(false);
    setQuery('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-12rem)] animate-in fade-in duration-500">
      <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-xl text-white">
          <BrainCircuit className="mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">AI Auditor</h3>
          <p className="text-blue-100 text-sm leading-relaxed">
            Gemini is analyzing your ledger in real-time. It can spot trends, identify risks, and help you optimize cash flow.
          </p>
          <button 
            onClick={() => handleAnalysis()}
            disabled={loading}
            className="mt-6 w-full bg-white text-blue-600 font-bold py-3 rounded-2xl flex items-center justify-center hover:bg-blue-50 transition shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <FileSearch size={18} className="mr-2" />}
            Run Full Audit
          </button>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Ask Gemini about:</h4>
          {['Tax optimization?', 'Burn rate forecast?', 'Unusual transactions?'].map(q => (
            <button 
              key={q} 
              onClick={() => handleAnalysis(q)}
              className="w-full text-left text-xs font-bold text-slate-600 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
             style={{backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6 relative" ref={scrollRef}>
          {analysis && (
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-slate-800 leading-relaxed shadow-sm">
              <div className="flex items-center text-blue-600 font-black uppercase tracking-widest text-xs mb-4">
                <Sparkles size={16} className="mr-2" /> Initial Audit Report
              </div>
              <div className="prose prose-slate max-w-none">
                {analysis.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
          )}

          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-5 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
              }`}>
                <p className="text-sm font-medium whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center space-x-3">
                <Loader2 className="animate-spin text-blue-600" size={18} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gemini is thinking...</span>
              </div>
            </div>
          )}

          {!analysis && chatHistory.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
              <Sparkles size={48} className="text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Start a Financial Conversation</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Ask specific questions about your transactions, or run a full audit to see automated insights.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <form 
            onSubmit={(e) => { e.preventDefault(); if(query.trim()) handleAnalysis(query); }}
            className="flex items-center space-x-3"
          >
            <input 
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask anything about your finances..."
              className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium shadow-inner"
            />
            <button 
              type="submit"
              disabled={loading || !query.trim()}
              className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition disabled:opacity-50 shadow-lg shadow-slate-200"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
