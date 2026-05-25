import React, { useRef, useState } from 'react';
import api from '../../services/api';

interface Message {
  role: 'user' | 'ai';
  content: string;
  ts: Date;
}

const quickPrompts = [
  'What are my biggest expense categories this month?',
  'How is my cash flow trending?',
  'Am I on track to meet my revenue targets?',
  'Which transactions should I review for VAT?',
  'What can I do to reduce costs?',
];

const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>
    <path d="M5 3l.8 2.2L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8z"/>
    <path d="M19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2-2.2-.8 2.2-.8z"/>
  </svg>
);

const ScanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
    <rect x="7" y="7" width="10" height="10" rx="1"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

export default function AIInsights() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState<'chat' | 'ocr'>('chat');

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult]   = useState<Record<string, unknown> | null>(null);
  const [ocrError, setOcrError]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const send = async (query: string) => {
    if (!query.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: query, ts: new Date() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/analyze', { query });
      setMessages(m => [...m, { role: 'ai', content: data.result, ts: new Date() }]);
    } catch {
      setMessages(m => [...m, {
        role: 'ai',
        content: 'Unable to reach the AI service right now. Please check that your Gemini API key is configured.',
        ts: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrResult(null);
    setOcrError('');

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data } = await api.post('/ai/process-invoice', { base64Image: base64 });
      setOcrResult(data);
    } catch {
      setOcrError('Invoice processing failed. Ensure the image is clear and your Gemini API key is configured.');
    } finally {
      setOcrLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-purple-950/60 border border-purple-900/60 rounded-lg flex items-center justify-center text-purple-400">
            <SparkleIcon />
          </div>
          <h1 className="text-xl font-semibold text-slate-100">AI Financial Insights</h1>
        </div>
        <p className="text-slate-500 text-sm">Powered by Gemini 1.5 Flash — ask anything about your finances</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
        {(['chat', 'ocr'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t === 'chat' ? 'Financial chat' : 'Invoice OCR'}
          </button>
        ))}
      </div>

      {/* ---- CHAT TAB ---- */}
      {tab === 'chat' && (
        <div className="card space-y-4">
          {/* Messages */}
          {messages.length === 0 && (
            <div className="py-4">
              <p className="text-sm text-slate-400 mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 bg-purple-950/60 border border-purple-900/60 rounded-full flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>
                      </svg>
                    </div>
                  )}
                  <div className={`max-w-sm rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                  }`}>
                    {msg.content}
                    <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                      {msg.ts.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  Gemini is thinking…
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
              placeholder="Ask anything about your finances…"
              className="input-field flex-1 text-sm"
              disabled={loading}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="btn-primary px-4 flex items-center gap-1.5"
            >
              <SendIcon /> Send
            </button>
          </div>
        </div>
      )}

      {/* ---- OCR TAB ---- */}
      {tab === 'ocr' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="text-blue-400"><ScanIcon /></div>
              <div>
                <h3 className="font-medium text-slate-200 text-sm">Invoice OCR</h3>
                <p className="text-xs text-slate-500">Upload an invoice image to extract data automatically</p>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-700 rounded-xl p-8 cursor-pointer transition-colors group">
              <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleOcr} className="hidden" />
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-950/50 transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              {ocrLoading ? (
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Processing with Gemini Vision…</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-300 font-medium">Drop invoice here or click to upload</p>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG, or PDF — max 10 MB</p>
                </>
              )}
            </label>

            {ocrError && (
              <div className="mt-3 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{ocrError}</div>
            )}
          </div>

          {/* OCR Result */}
          {ocrResult && (
            <div className="card animate-fade-in space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Invoice data extracted
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Supplier', String(ocrResult.supplierName ?? '—')],
                  ['Invoice no.', String(ocrResult.invoiceNumber ?? '—')],
                  ['Date', String(ocrResult.date ?? '—')],
                  ['Currency', String(ocrResult.currency ?? 'ZAR')],
                  ['Total amount', `${ocrResult.currency ?? 'ZAR'} ${Number(ocrResult.totalAmount ?? 0).toFixed(2)}`],
                  ['VAT amount',   `${ocrResult.currency ?? 'ZAR'} ${Number(ocrResult.totalVat   ?? 0).toFixed(2)}`],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-800/60 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-medium text-slate-200 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

              {Array.isArray(ocrResult.lineItems) && (ocrResult.lineItems as unknown[]).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Line items</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {['Description','Qty','Unit price','Total','VAT'].map(h => (
                            <th key={h} className="text-left text-slate-500 font-medium pb-1.5 pr-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {(ocrResult.lineItems as Record<string, unknown>[]).map((item, i) => (
                          <tr key={i}>
                            <td className="py-1.5 pr-3 text-slate-300">{String(item.description ?? '')}</td>
                            <td className="py-1.5 pr-3 text-slate-400 tabular-nums">{String(item.quantity ?? 1)}</td>
                            <td className="py-1.5 pr-3 text-slate-400 tabular-nums">{Number(item.unitPrice ?? 0).toFixed(2)}</td>
                            <td className="py-1.5 pr-3 text-slate-200 font-medium tabular-nums">{Number(item.total ?? 0).toFixed(2)}</td>
                            <td className="py-1.5 text-slate-400 tabular-nums">{Number(item.vatAmount ?? 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  // In production: pre-populate the transaction create form
                  alert('This would open the Create Transaction form pre-filled with the extracted data.');
                }}
                className="btn-primary w-full text-sm"
              >
                Import as transaction
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
