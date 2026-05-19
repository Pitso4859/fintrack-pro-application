/**
 * AssetRegister.tsx
 * 
 * Manages the fixed asset register: view, create, edit, delete assets.
 * Now fully connected to the backend API with proper camelCase/snake_case conversion.
 */

import React, { useState, useMemo } from 'react';
import {
  Package, ShieldCheck, MapPin, Plus, Trash2, Edit2,
  Search, Filter, AlertCircle, ChevronRight, HardDrive, X, Link as LinkIcon
} from 'lucide-react';
import { AssetRecord, Currency, Transaction } from '../types.ts';
import api from '../services/api'; 

interface AssetRegisterProps {
  assets: AssetRecord[];
  setAssets: React.Dispatch<React.SetStateAction<AssetRecord[]>>;
  transactions: Transaction[];
  currency: Currency;
}

const ASSET_CATEGORIES = ['Computer Equipment', 'Office Furniture', 'Vehicles', 'Machinery', 'Software Licences', 'Land & Buildings'];

const AssetRegister: React.FC<AssetRegisterProps> = ({ assets, setAssets, transactions, currency }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AssetRecord>>({
    name: '',
    category: ASSET_CATEGORIES[0],
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    supplierName: '',
    status: 'ACTIVE',
    location: '',
    serialNumber: '',
    warrantyExpiry: '',
    transactionId: ''
  });

  // Filter assets based on search query
  const filteredAssets = useMemo(() => {
    return assets.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery]);

  // Transactions that could be linked to an asset (non‑invoice)
  const availableTransactions = useMemo(() => {
    return transactions.filter(t => t.type !== 'INVOICE').slice(0, 50);
  }, [transactions]);

  // --------------------------------------------------------------------------
  // Create / Update asset
  // --------------------------------------------------------------------------
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Convert camelCase form data to snake_case for backend
      const payload = {
        name: formData.name,
        category: formData.category,
        purchase_date: formData.purchaseDate,
        purchase_price: formData.purchasePrice,
        supplier_name: formData.supplierName,
        status: formData.status,
        location: formData.location,
        serial_number: formData.serialNumber,
        warranty_expiry: formData.warrantyExpiry,
        transaction_id: formData.transactionId || null,
      };

      if (editingId) {
        // Update existing asset
        const { data } = await api.put(`/assets/${editingId}`, payload);
        // Convert snake_case response back to camelCase for local state
        const updatedAsset: AssetRecord = {
          id: data.id,
          name: data.name,
          category: data.category,
          purchaseDate: data.purchase_date,
          purchasePrice: data.purchase_price,
          supplierName: data.supplier_name,
          status: data.status,
          location: data.location,
          serialNumber: data.serial_number,
          warrantyExpiry: data.warranty_expiry,
          transactionId: data.transaction_id,
          documentData: data.document_data,
        };
        setAssets(prev => prev.map(a => a.id === editingId ? updatedAsset : a));
        setEditingId(null);
      } else {
        // Create new asset
        const { data } = await api.post('/assets', payload);
        const newAsset: AssetRecord = {
          id: data.id,
          name: data.name,
          category: data.category,
          purchaseDate: data.purchase_date,
          purchasePrice: data.purchase_price,
          supplierName: data.supplier_name,
          status: data.status,
          location: data.location,
          serialNumber: data.serial_number,
          warrantyExpiry: data.warranty_expiry,
          transactionId: data.transaction_id,
          documentData: data.document_data,
        };
        setAssets(prev => [...prev, newAsset]);
      }

      // Close modal and reset form
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ 
        name: '', 
        category: ASSET_CATEGORIES[0], 
        purchaseDate: new Date().toISOString().split('T')[0], 
        purchasePrice: 0, 
        supplierName: '', 
        status: 'ACTIVE',
        transactionId: ''
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save asset. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Delete asset
  // --------------------------------------------------------------------------
  const deleteAsset = async (id: string) => {
    if (!confirm('Permanently remove this asset from the register? Ledger transactions will remain unaffected.')) return;
    
    try {
      await api.delete(`/assets/${id}`);
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to delete asset.');
    }
  };

  // --------------------------------------------------------------------------
  // Warranty status helper
  // --------------------------------------------------------------------------
  const getWarrantyStatus = (expiry?: string) => {
    if (!expiry) return null;
    const now = new Date();
    const exp = new Date(expiry);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Expired', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: AlertCircle };
    if (diffDays < 90) return { label: `${diffDays} days left`, color: 'text-amber-600 bg-amber-50 border-amber-100', icon: AlertCircle };
    return { label: 'Covered', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: ShieldCheck };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Fixed Assets</p>
            <p className="text-2xl font-black text-slate-900">{assets.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-6">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Book Value</p>
            <p className="text-2xl font-black text-slate-900">{currency.symbol}{assets.reduce((s, a) => s + a.purchasePrice, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Plus size={20} />
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Add New Asset</span>
          </div>
          <button 
            onClick={() => { setIsModalOpen(true); setEditingId(null); setError(null); }}
            className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl transition-all shadow-lg active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start text-rose-700 animate-in shake duration-300">
          <AlertCircle size={18} className="mr-3 mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Register Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, supplier, or serial..." 
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white text-sm font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex space-x-3">
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Asset Description</th>
                <th className="px-4 py-5">Category / Serial</th>
                <th className="px-4 py-5">Purchase Details</th>
                <th className="px-4 py-5">Audit Link</th>
                <th className="px-4 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <HardDrive size={48} className="text-slate-300 mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">Asset Register is Empty</p>
                      <p className="text-xs font-medium mt-1">Track fixed equipment and warranty coverage here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const warranty = getWarrantyStatus(asset.warrantyExpiry);
                  const linkedTx = transactions.find(t => t.id === asset.transactionId);
                  
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{asset.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 flex items-center">
                              <MapPin size={10} className="mr-1" /> {asset.location || 'Not Specified'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-200 uppercase tracking-tighter">
                          {asset.category}
                        </span>
                        <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">S/N: {asset.serialNumber || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-6">
                        <p className="text-sm font-black text-slate-900">{currency.symbol}{asset.purchasePrice.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">from {asset.supplierName}</p>
                        <p className="text-[9px] text-slate-300 italic">{asset.purchaseDate}</p>
                      </td>
                      <td className="px-4 py-6">
                        {linkedTx ? (
                          <div className="flex flex-col space-y-1">
                             <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 text-[9px] font-black uppercase tracking-tighter w-fit">
                                <LinkIcon size={10} className="mr-1" /> Linked to Ledger
                             </div>
                             <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]" title={linkedTx.description}>
                               {linkedTx.description}
                             </p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">No Financial Link</span>
                        )}
                        <div className="mt-2">
                           {warranty && (
                             <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${warranty.color}`}>
                               {warranty.label}
                             </span>
                           )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => { setEditingId(asset.id); setFormData(asset); setIsModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            disabled={isSubmitting}
                            title="Edit asset"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteAsset(asset.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                            disabled={isSubmitting}
                            title="Delete asset"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center">
                <Package size={24} className="mr-3 text-blue-600" />
                {editingId ? 'Edit Asset Record' : 'Log New Fixed Asset'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Asset Description</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. MacBook Pro 16-inch 2024" 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold bg-slate-50/50"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                  <select 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold bg-slate-50/50 appearance-none cursor-pointer"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    disabled={isSubmitting}
                  >
                    {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Serial Number</label>
                  <input 
                    type="text" 
                    placeholder="Enter OEM S/N" 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-mono font-bold bg-slate-50/50"
                    value={formData.serialNumber}
                    onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-span-2 p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center">
                      <LinkIcon size={14} className="mr-2" /> Financial Transaction Link
                    </label>
                    <span className="text-[9px] font-black text-slate-400 uppercase">Audit Compliance</span>
                  </div>
                  
                  <select 
                    className="w-full px-5 py-3 rounded-xl border border-blue-100 focus:ring-4 focus:ring-blue-500/10 outline-none text-xs font-bold bg-white appearance-none cursor-pointer"
                    value={formData.transactionId || ''}
                    onChange={e => {
                      const txId = e.target.value;
                      const tx = transactions.find(t => t.id === txId);
                      setFormData({
                        ...formData,
                        transactionId: txId,
                        purchasePrice: tx ? tx.amount : formData.purchasePrice,
                        supplierName: tx ? (tx.description.split('from ')[1] || tx.description) : formData.supplierName,
                        purchaseDate: tx ? tx.date : formData.purchaseDate
                      });
                    }}
                    disabled={isSubmitting}
                  >
                    <option value="">-- No Ledger Link (Stand-alone Record) --</option>
                    {availableTransactions.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.date}] {t.description.slice(0, 30)}... ({currency.symbol}{t.amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-blue-500 font-medium leading-tight">
                    * Linking will automatically populate Date, Price, and Supplier from the ledger.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Supplier Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Digicape" 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold bg-slate-50/50"
                    value={formData.supplierName}
                    onChange={e => setFormData({...formData, supplierName: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Purchase Price ({currency.symbol})</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-black bg-slate-50/50"
                    value={formData.purchasePrice || ''}
                    onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Purchase Date</label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold bg-slate-50/50"
                    value={formData.purchaseDate}
                    onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-rose-500">Warranty Expiry</label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-4 rounded-2xl border border-rose-200 focus:ring-4 focus:ring-rose-500/10 outline-none text-sm font-bold bg-rose-50/30"
                    value={formData.warrantyExpiry}
                    onChange={e => setFormData({...formData, warrantyExpiry: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Location / Department</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Head Office - IT Lab" 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold bg-slate-50/50"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end space-x-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Record' : 'Log Asset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetRegister;