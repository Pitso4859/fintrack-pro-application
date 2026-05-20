/**
 * AssetRegister.tsx
 *
 * Manages the fixed asset register: view, create, edit, delete assets.
 */

import React, { useState, useEffect } from 'react';
import {
  Package, ShieldCheck, MapPin, Plus, Trash2, Edit2,
  Search, Filter, AlertCircle, ChevronRight, HardDrive, X, Link as LinkIcon, Loader2, CheckCircle
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

const AssetRegister: React.FC<AssetRegisterProps> = ({
                                                       assets = [],
                                                       setAssets,
                                                       transactions = [],
                                                       currency
                                                     }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
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

  // Safe currency symbol with fallback
  const currencySymbol = currency?.symbol || 'R';

  // Debug logging
  useEffect(() => {
    console.log('=== AssetRegister Debug ===');
    console.log('Assets received:', assets);
    console.log('Assets length:', assets?.length || 0);
    console.log('Currency:', currency);
    console.log('Currency symbol:', currencySymbol);
  }, [assets, currency, currencySymbol]);

  // Filter assets based on search query
  const filteredAssets = assets.filter(a =>
      a?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a?.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a?.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total book value with safe number conversion
  const totalBookValue = assets.reduce((sum, a) => sum + (a?.purchasePrice || 0), 0);

  const resetForm = () => {
    setFormData({
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
  };

  // Safe number formatter
  const formatNumber = (value: number): string => {
    if (value === undefined || value === null) return '0.00';
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!formData.name || !formData.supplierName) {
      setError('Asset Name and Supplier Name are required');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        purchase_date: formData.purchaseDate,
        purchase_price: formData.purchasePrice,
        supplier_name: formData.supplierName,
        status: formData.status || 'ACTIVE',
        location: formData.location || '',
        serial_number: formData.serialNumber || '',
        warranty_expiry: formData.warrantyExpiry || null,
        transaction_id: formData.transactionId || null,
      };

      console.log('Saving asset:', payload);

      if (editingId) {
        const { data } = await api.put(`/assets/${editingId}`, payload);
        setAssets(prev => prev.map(a => a.id === editingId ? {
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
        } : a));
        setEditingId(null);
        setSuccess('Asset updated!');
      } else {
        const { data } = await api.post('/assets', payload);
        setAssets(prev => [...prev, {
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
        }]);
        setSuccess('Asset created!');
      }

      setIsModalOpen(false);
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save asset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      setAssets(prev => prev.filter(a => a.id !== id));
      setSuccess('Asset deleted!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete asset.');
    }
  };

  const handleEdit = (asset: AssetRecord) => {
    setEditingId(asset.id);
    setFormData({
      name: asset.name,
      category: asset.category,
      purchaseDate: asset.purchaseDate,
      purchasePrice: asset.purchasePrice,
      supplierName: asset.supplierName,
      status: asset.status,
      location: asset.location || '',
      serialNumber: asset.serialNumber || '',
      warrantyExpiry: asset.warrantyExpiry || '',
      transactionId: asset.transactionId || ''
    });
    setIsModalOpen(true);
  };

  const getWarrantyStatus = (expiry?: string) => {
    if (!expiry) return null;
    const exp = new Date(expiry);
    const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Expired', color: 'text-rose-600 bg-rose-50' };
    if (daysLeft < 90) return { label: `${daysLeft} days left`, color: 'text-amber-600 bg-amber-50' };
    return { label: 'Covered', color: 'text-emerald-600 bg-emerald-50' };
  };

  return (
      <div className="space-y-8 pb-20">
        {/* Success Message */}
        {success && (
            <div className="fixed top-20 right-8 z-50 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center">
              <CheckCircle size={20} className="mr-3" />
              <span className="text-sm font-bold">{success}</span>
            </div>
        )}

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
              <p className="text-2xl font-black text-slate-900">
                {currencySymbol}{formatNumber(totalBookValue)}
              </p>
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
                onClick={() => { setIsModalOpen(true); setEditingId(null); resetForm(); setError(null); }}
                className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl transition-all shadow-lg active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-700">
              <div className="flex items-start">
                <AlertCircle size={18} className="mr-3 mt-0.5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="text"
                placeholder="Search by name, supplier, or serial..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white text-sm font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Assets List */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Asset Register</h3>
            <p className="text-xs text-slate-400">Manage your fixed assets and warranty information</p>
          </div>

          {assets.length === 0 ? (
              <div className="px-8 py-32 text-center">
                <div className="flex flex-col items-center opacity-40">
                  <HardDrive size={48} className="text-slate-300 mb-4" />
                  <p className="text-sm font-black uppercase tracking-widest text-slate-600">Asset Register is Empty</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">Click "Add New Asset" to get started.</p>
                </div>
              </div>
          ) : filteredAssets.length === 0 ? (
              <div className="px-8 py-32 text-center">
                <p className="text-sm text-slate-400">No matching assets found.</p>
              </div>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Asset Description</th>
                    <th className="px-4 py-5">Category / Serial</th>
                    <th className="px-4 py-5">Purchase Details</th>
                    <th className="px-4 py-5">Warranty</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {filteredAssets.map(asset => {
                    const warranty = getWarrantyStatus(asset.warrantyExpiry);
                    const purchasePrice = asset.purchasePrice || 0;
                    return (
                        <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                <Package size={18} className="text-slate-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{asset.name || 'Unnamed'}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{asset.location || 'No location'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-6">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">
                          {asset.category || 'Uncategorized'}
                        </span>
                            <p className="text-[10px] font-mono text-slate-400 mt-1">S/N: {asset.serialNumber || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-6">
                            <p className="text-sm font-black text-slate-900">{currencySymbol}{formatNumber(purchasePrice)}</p>
                            <p className="text-[10px] text-slate-400">from {asset.supplierName || 'Unknown'}</p>
                            <p className="text-[9px] text-slate-300">{asset.purchaseDate || 'No date'}</p>
                          </td>
                          <td className="px-4 py-6">
                            {warranty && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black ${warranty.color}`}>
                            {warranty.label}
                          </span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                  onClick={() => handleEdit(asset)}
                                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                  title="Edit asset"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                  onClick={() => deleteAsset(asset.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Delete asset"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
              <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xl font-black text-slate-900 flex items-center">
                    <Package size={24} className="mr-3 text-blue-600" />
                    {editingId ? 'Edit Asset' : 'Add New Asset'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                  {/* Asset Name */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Asset Name *</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. MacBook Pro 16-inch"
                        className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Category</label>
                      <select
                          className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none text-sm font-bold"
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          disabled={isSubmitting}
                      >
                        {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Serial Number</label>
                      <input
                          type="text"
                          placeholder="Enter serial number"
                          className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none text-sm"
                          value={formData.serialNumber}
                          onChange={e => setFormData({...formData, serialNumber: e.target.value})}
                          disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Supplier Name *</label>
                      <input
                          type="text"
                          required
                          placeholder="Supplier name"
                          className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none text-sm font-bold"
                          value={formData.supplierName}
                          onChange={e => setFormData({...formData, supplierName: e.target.value})}
                          disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Purchase Price ({currencySymbol})</label>
                      <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none text-sm font-black"
                          value={formData.purchasePrice || ''}
                          onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                          disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Purchase Date</label>
                      <input
                          type="date"
                          className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none text-sm"
                          value={formData.purchaseDate}
                          onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
                          disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 text-rose-500">Warranty Expiry</label>
                      <input
                          type="date"
                          className="w-full px-5 py-3 rounded-2xl border border-rose-200 outline-none text-sm"
                          value={formData.warrantyExpiry}
                          onChange={e => setFormData({...formData, warrantyExpiry: e.target.value})}
                          disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Location</label>
                    <input
                        type="text"
                        placeholder="e.g. Head Office - IT Dept"
                        className="w-full px-5 py-3 rounded-2xl border border-slate-200 outline-none text-sm"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        disabled={isSubmitting}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="pt-4 flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase hover:bg-slate-200 transition"
                        disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase hover:bg-slate-800 transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                      {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
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