'use client';

import { useState } from 'react';
import { CalendarHeart, Plus, Pencil, Trash2, X } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { useBirthdays } from '@/lib/hooks/useBirthdays';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import type { Birthday } from '@/lib/hooks/useBirthdays';

const TYPE_ICONS: Record<string, string> = {
  birthday: '🎂',
  anniversary: '💍',
  milestone: '⭐',
};
const TYPE_LABELS: Record<string, string> = {
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  milestone: 'Milestone',
};

type FormData = {
  name: string;
  birthDate: string;
  eventType: string;
  giftIdeas: string;
};

const emptyForm = (): FormData => ({ name: '', birthDate: '', eventType: 'birthday', giftIdeas: '' });

export function EventsView() {
  const { birthdays, loading, error, refresh } = useBirthdays({ limit: 200 });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Birthday | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);

  function openNew() {
    setForm(emptyForm());
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(b: Birthday) {
    setForm({ name: b.name, birthDate: b.birthDate, eventType: b.eventType, giftIdeas: b.giftIdeas || '' });
    setEditing(b);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.birthDate) return;
    setSaving(true);
    try {
      const isEdit = !!editing;
      const url = isEdit ? `/api/birthdays/${editing!.id}` : '/api/birthdays';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          birthDate: form.birthDate,
          eventType: form.eventType,
          giftIdeas: form.giftIdeas.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      toast({ title: isEdit ? 'Event updated' : 'Event created' });
      setShowForm(false);
      refresh();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(b: Birthday) {
    if (!confirm(`Delete ${b.name}?`)) return;
    try {
      const res = await fetch(`/api/birthdays/${b.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Event deleted' });
      refresh();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  }

  return (
    <PageWrapper>
      <div className="p-4 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarHeart className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Events</h1>
          </div>
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Event
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing ? 'Edit Event' : 'New Event'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Name (e.g. Mom's Birthday)"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))}
                  className="flex-1"
                  required
                />
                <Select value={form.eventType} onValueChange={v => setForm(p => ({ ...p, eventType: v }))}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Gift ideas (optional)"
                value={form.giftIdeas}
                onChange={e => setForm(p => ({ ...p, giftIdeas: e.target.value }))}
                className="sm:col-span-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        )}

        {/* Error */}
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : birthdays.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarHeart className="h-12 w-12 mx-auto mb-2 opacity-40" />
            <p>No events yet. Add your first birthday or anniversary!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {birthdays.map(b => (
              <div key={b.id} className="flex items-center gap-3 bg-card border rounded-lg px-4 py-3 hover:bg-accent/50 transition-colors">
                <span className="text-lg">{TYPE_ICONS[b.eventType] || '⭐'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{b.name}</div>
                  <div className="text-xs text-muted-foreground flex gap-3">
                    <span>{TYPE_LABELS[b.eventType] || b.eventType}</span>
                    {b.age != null && <span>{b.age} yrs</span>}
                    <span className={b.daysUntil === 0 ? 'text-primary font-semibold' : ''}>
                      {b.daysUntil === 0 ? 'Today!' : `${b.daysUntil} days`}
                    </span>
                    <span>{new Date(b.nextBirthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(b)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
