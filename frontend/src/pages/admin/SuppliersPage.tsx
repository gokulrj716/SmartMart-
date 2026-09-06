import React, { useState, useEffect } from 'react';
import { Building2, Plus, Phone, Mail, MapPin } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get<any>('/suppliers');
      if (res.success) setSuppliers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<any>('/suppliers', { name, contactPerson, email, phone, taxId });
      if (res.success) {
        setIsModalOpen(false);
        fetchSuppliers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add supplier');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Wholesale Suppliers Directory</h1>
            <p className="text-xs text-slate-500 mt-1">Manage FMCG distributor contacts, tax GSTIN credentials, and procurement history</p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Supplier
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{s.name}</h3>
                  <p className="text-xs text-slate-400">Contact: {s.contact_person || 'Representative'}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{s.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.email || 'N/A'}</span>
                </div>
                {s.tax_id && (
                  <p className="text-[11px] font-mono text-slate-400 pt-1">GSTIN: {s.tax_id}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add FMCG Supplier">
          <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
            <Input label="Supplier Business Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Contact Person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Input label="Tax ID / GSTIN" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" type="submit">Add Supplier</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};
