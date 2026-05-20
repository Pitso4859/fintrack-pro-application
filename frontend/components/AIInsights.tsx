import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Account } from '../types.ts';
import { analyzeFinances } from '../services/geminiService.ts';
import { Sparkles, BrainCircuit, Send, Loader2, FileSearch, Copy, Check } from 'lucide-react';

interface AIInsightsProps {
  transactions: Transaction[];
  accounts: Account[];
}

// Helper to format plain text responses with bold support
const formatResponse = (text: string): React.ReactNode[] => {
  if (!text) return [<p key="empty" className="text-xs text-slate-500">No response received.</p>];

  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines - add small spacing
    if (line.trim() === '') {
      result.push(<div key={`space-${i}`} className="h-2"></div>);
      continue;
    }

    // Headers with ** ** or * *
    if (line.startsWith('**') && line.endsWith('**')) {
      result.push(<h4 key={i} className="font-bold text-slate-800 text-sm mt-3 mb-2">{line.replace(/\*\*/g, '')}</h4>);
    }
    // Check for bold text (wrapped in **)
    else if (line.includes('**')) {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={idx}>{part}</span>;
      });
      result.push(<p key={i} className="text-sm text-slate-700 mb-2 leading-relaxed">{formattedParts}</p>);
    }
    // Separator lines
    else if (line.includes('────────────────') || line.includes('════════════')) {
      result.push(<hr key={i} className="my-4 border-t border-slate-200" />);
    }
    // Numbered list items
    else if (line.match(/^\d+\./)) {
      result.push(<p key={i} className="text-sm text-slate-700 mb-1 ml-5">{line}</p>);
    }
    // Bullet list items (starting with dash or *)
    else if (line.startsWith('-') || line.startsWith('•')) {
      result.push(<p key={i} className="text-sm text-slate-600 mb-1 ml-6">{line}</p>);
    }
    // Section headers with all caps
    else if (line === line.toUpperCase() && line.length > 5 && !line.includes(' ')) {
      result.push(<h3 key={i} className="font-black text-slate-800 text-xs uppercase tracking-wider mt-4 mb-2">{line}</h3>);
    }
    // Regular text
    else {
      result.push(<p key={i} className="text-sm text-slate-700 mb-2 leading-relaxed">{line}</p>);
    }
  }

  return result;
};

const AIInsights: React.FC<AIInsightsProps> = ({ transactions, accounts }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string, timestamp: Date}[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading, analysis]);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAnalysis = async (customQuery?: string) => {
    setLoading(true);
    const q = customQuery || "Provide a comprehensive audit of my current financial position.";

    if (customQuery) {
      setChatHistory(prev => [...prev, { role: 'user', text: customQuery, timestamp: new Date() }]);
    }

    try {
      const result = await analyzeFinances(transactions, accounts, q);
      console.log('AI Response:', result);

      if (customQuery) {
        setChatHistory(prev => [...prev, { role: 'ai', text: result || 'Unable to analyze. Please try again.', timestamp: new Date() }]);
      } else {
        setAnalysis(result || 'No analysis available. Please check your data.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMsg = 'Error connecting to AI service. Please check your backend connection.';
      if (customQuery) {
        setChatHistory(prev => [...prev, { role: 'ai', text: errorMsg, timestamp: new Date() }]);
      } else {
        setAnalysis(errorMsg);
      }
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-12rem)] animate-in fade-in duration-500">
        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-xl text-white">
            <BrainCircuit className="mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">SARS AI Auditor</h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              Gemini AI analyzes your ledger in real-time. It identifies trends, assesses risks, and provides optimization recommendations.
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
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Suggested Queries</h4>
            {['Tax optimization', 'Burn rate forecast', 'Unusual transactions', 'Profit margin analysis', 'Cash flow projection'].map(q => (
                <button
                    key={q}
                    onClick={() => handleAnalysis(q)}
                    className="w-full text-left text-xs font-medium text-slate-600 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
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
            {/* Initial Audit Report */}
            {analysis && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-slate-800 leading-relaxed shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-blue-600 font-black uppercase tracking-widest text-xs">
                      <Sparkles size={16} className="mr-2" /> INITIAL AUDIT REPORT
                    </div>
                    <button
                        onClick={() => copyToClipboard(analysis, -1)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-200"
                    >
                      {copiedIndex === -1 ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="prose prose-slate max-w-none space-y-2">
                    {formatResponse(analysis)}
                  </div>
                </div>
            )}

            {/* Chat History */}
            {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm ${
                      msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                        {msg.role === 'user' ? 'YOU' : 'GEMINI AI'}
                      </span>
                      {msg.role === 'ai' && (
                          <button
                              onClick={() => copyToClipboard(msg.text, idx)}
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-200"
                          >
                            {copiedIndex === idx ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                      )}
                    </div>
                    <div className="text-sm font-medium whitespace-pre-wrap space-y-2">
                      {msg.role === 'ai' ? formatResponse(msg.text) : <p className="text-sm">{msg.text}</p>}
                    </div>
                    <div className={`text-[9px] mt-2 ${msg.role === 'user' ? 'text-blue-300' : 'text-slate-400'}`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center space-x-3">
                    <Loader2 className="animate-spin text-blue-600" size={18} />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processing request...</span>
                  </div>
                </div>
            )}

            {/* Empty State */}
            {!analysis && chatHistory.length === 0 && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
                  <Sparkles size={48} className="text-blue-400 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Start a Financial Conversation</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Ask specific questions about your transactions or run a full audit to receive automated insights.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-2 justify-center">
                    <button onClick={() => handleAnalysis('VAT position summary')} className="px-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-600 hover:bg-slate-200 transition">
                      VAT Position
                    </button>
                    <button onClick={() => handleAnalysis('Top expense categories')} className="px-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-600 hover:bg-slate-200 transition">
                      Top Expenses
                    </button>
                    <button onClick={() => handleAnalysis('Profit margin calculation')} className="px-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-600 hover:bg-slate-200 transition">
                      Profit Margin
                    </button>
                    <button onClick={() => handleAnalysis('Cash flow analysis')} className="px-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-600 hover:bg-slate-200 transition">
                      Cash Flow
                    </button>
                  </div>
                </div>
            )}
          </div>

          {/* Input Area */}
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
                  className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition disabled:opacity-50 shadow-lg shadow-slate-200 active:scale-95"
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