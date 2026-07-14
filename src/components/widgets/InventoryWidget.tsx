'use client';

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Upload,
  Minus,
  X,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetContainer, WidgetEmpty } from './WidgetContainer';
import { Button, Badge, Input, Label } from '@/components/ui';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  minStock: number;
  shoppingItemId: string | null;
  notes: string | null;
  purchasedAt: string | null;
  addedBy: { id: string; name: string; color: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface InventoryWidgetProps {
  className?: string;
  fullPage?: boolean;
}

function getStockStatus(qty: number, min: number): 'ok' | 'low' | 'critical' {
  if (min <= 0) return 'ok';
  if (qty <= 0) return 'critical';
  if (qty <= min) return 'low';
  return 'ok';
}

const statusColor: Record<string, string> = {
  ok: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
  low: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  critical: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
};

const categoryEmoji: Record<string, string> = {
  produce: '🥬', dairy: '🥛', meat: '🥩', bakery: '🥖',
  frozen: '🧊', pantry: '🥫', household: '🧴',
  spice: '🧂', beverage: '🧃', cleaning: '🧹',
};

function getCategoryIcon(cat?: string | null): string {
  return (cat && categoryEmoji[cat]) || '📦';
}

export const InventoryWidget = React.memo(function InventoryWidget({ className, fullPage }: InventoryWidgetProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formUnit, setFormUnit] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formMinStock, setFormMinStock] = useState('0');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(data.items || []);
      setError(null);
    } catch {
      setError('Gagal memuat stok');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setFormName('');
    setFormQty('1');
    setFormUnit('');
    setFormCategory('');
    setFormMinStock('0');
    setFormNotes('');
    setShowAdd(false);
    setEditId(null);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const isEdit = editId;
      const url = isEdit ? `/api/inventory/${editId}` : '/api/inventory';
      const method = isEdit ? 'PATCH' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          quantity: parseFloat(formQty) || 0,
          unit: formUnit || null,
          category: formCategory || null,
          minStock: parseFloat(formMinStock) || 0,
          notes: formNotes || null,
        }),
      });
      resetForm();
      await fetchItems();
    } catch {
      setError('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus ${name}?`)) return;
    try {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      await fetchItems();
    } catch {
      setError('Gagal menghapus');
    }
  };

  const handleQuickDecrement = async (item: InventoryItem) => {
    const newQty = Math.max(0, item.quantity - 1);
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) await fetchItems();
    } catch { /* ignore */ }
  };

  const startEdit = (item: InventoryItem) => {
    setEditId(item.id);
    setFormName(item.name);
    setFormQty(String(item.quantity));
    setFormUnit(item.unit || '');
    setFormCategory(item.category || '');
    setFormMinStock(String(item.minStock));
    setFormNotes(item.notes || '');
    setShowAdd(true);
  };

  const sorted = [...items].sort((a, b) => {
    const sa = getStockStatus(a.quantity, a.minStock);
    const sb = getStockStatus(b.quantity, b.minStock);
    const order = ['critical', 'low', 'ok'];
    return order.indexOf(sa) - order.indexOf(sb);
  });

  const headerActions = (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" onClick={() => setShowImport(true)} className="h-7 w-7" aria-label="Import from shopping">
        <ShoppingCart className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => setShowAdd(true)} className="h-7 w-7" aria-label="Add stock item">
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  const itemList = items.length === 0 ? (
    <WidgetEmpty icon={<Package className="h-8 w-8" />} message="Belum ada stok" action={
      <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>Tambah Barang</Button>
    } />
  ) : (
    <div className="overflow-auto h-full -mr-2 pr-2">
      <div className="space-y-1.5">
        {sorted.map((item) => {
          const status = getStockStatus(item.quantity, item.minStock);
          const qtyDisplay = `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`;
          return (
            <div key={item.id} className={cn('flex items-center gap-2 p-2 rounded-lg', 'hover:bg-accent/50 transition-colors', 'touch-action-manipulation cursor-pointer')}
              onClick={() => startEdit(item)}
            >
              <span className="text-base">{getCategoryIcon(item.category)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{item.name}</span>
                  <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border font-medium', statusColor[status], 'shrink-0')}>
                    {qtyDisplay}
                  </Badge>
                </div>
                {item.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.notes}</p>}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleQuickDecrement(item); }} className="h-6 w-6" aria-label="Kurangi">
                  <Minus className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }} className="h-6 w-6 text-destructive hover:text-destructive" aria-label="Hapus">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const addModal = showAdd ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => resetForm()}>
      <div className="bg-background rounded-xl p-5 w-80 shadow-lg border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{editId ? 'Edit Barang' : 'Tambah Barang'}</h3>
          <button onClick={resetForm}><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nama</Label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama barang" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Qty</Label><Input type="number" value={formQty} onChange={(e) => setFormQty(e.target.value)} /></div>
            <div><Label className="text-xs">Unit</Label><Input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="kg, pcs..." /></div>
          </div>
          <div>
            <Label className="text-xs">Kategori</Label>
            <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">—</option>
              <option value="produce">🥬 Sayur/Buah</option>
              <option value="dairy">🥛 Susu/Olahan</option>
              <option value="meat">🥩 Daging</option>
              <option value="bakery">🥖 Roti</option>
              <option value="frozen">🧊 Beku</option>
              <option value="pantry">🥫 Sembako</option>
              <option value="household">🧴 Rumah Tangga</option>
              <option value="beverage">🧃 Minuman</option>
              <option value="spice">🧂 Bumbu</option>
              <option value="cleaning">🧹 Pembersih</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Min. Stok (peringatan)</Label>
            <Input type="number" value={formMinStock} onChange={(e) => setFormMinStock(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Catatan</Label>
            <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Opsional" />
          </div>
          <Button onClick={handleSave} disabled={!formName.trim() || saving} className="w-full">
            {saving ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  const importModal = showImport ? (
    <ImportFromShopping onDone={fetchItems} onClose={() => setShowImport(false)} />
  ) : null;

  if (fullPage) {
    return (
      <div>
        {headerActions}
        {itemList}
        {addModal}
        {importModal}
      </div>
    );
  }

  return (
    <WidgetContainer
      title="Stock"
      icon={<Package className="h-4 w-4" />}
      size="medium"
      loading={loading}
      error={error}
      actions={headerActions}
      className={className}
    >
      {itemList}
      {addModal}
      {importModal}
    </WidgetContainer>
  );
});

function ImportFromShopping({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [shoppingItems, setShoppingItems] = useState<Array<{ id: string; name: string; checked: boolean }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/shopping-items?checked=true');
        const data = await res.json();
        setShoppingItems((data.items || []).map((i: { id: string; name: string; checked: boolean }) => ({ id: i.id, name: i.name, checked: i.checked })));
        setSelected(new Set((data.items || []).filter((i: { checked: boolean }) => i.checked).map((i: { id: string }) => i.id)));
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      await fetch('/api/inventory/import-from-shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shoppingItemIds: Array.from(selected) }),
      });
      onDone();
      onClose();
    } catch { /* ignore */ } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background rounded-xl p-5 w-80 shadow-lg border max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4" /> Import dari Shopping</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat...</p>
        ) : shoppingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada item yang diceklis</p>
        ) : (
          <>
            <div className="overflow-auto flex-1 -mr-2 pr-2 space-y-1.5 mb-3">
              {shoppingItems.map((item) => (
                <label key={item.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/50 cursor-pointer text-sm">
                  <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} className="rounded" />
                  {item.name}
                </label>
              ))}
            </div>
            <Button onClick={handleImport} disabled={selected.size === 0 || importing} className="w-full">
              {importing ? 'Mengimpor...' : `Import ${selected.size} item`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
