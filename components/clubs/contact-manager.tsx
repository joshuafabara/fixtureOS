"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, Star, Loader2, AlertTriangle, Phone, X, Check,
} from "lucide-react";

type Contact = {
  id: string;
  contactName: string;
  contactRole: string | null;
  whatsappNumber: string | null;
  isPrimary: boolean;
  notes: string | null;
};

type Props = { clubId: string; initialContacts: Contact[] };

const WHATSAPP_RE = /^[0-9]{10,15}$/;

function formatWhatsApp(num: string) {
  return `+${num}`;
}

function whatsAppLink(num: string) {
  return `https://wa.me/${num}`;
}

const EMPTY_FORM = { contactName: "", contactRole: "", whatsappNumber: "", isPrimary: false, notes: "" };
type FormState = typeof EMPTY_FORM;

export function ContactManager({ clubId, initialContacts }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(c: Contact) {
    setForm({
      contactName: c.contactName,
      contactRole: c.contactRole ?? "",
      whatsappNumber: c.whatsappNumber ?? "",
      isPrimary: c.isPrimary,
      notes: c.notes ?? "",
    });
    setEditingId(c.id);
    setError("");
    setShowForm(true);
  }

  function validate() {
    if (!form.contactName.trim()) return "El nombre es requerido.";
    if (form.whatsappNumber && !WHATSAPP_RE.test(form.whatsappNumber))
      return "Número de WhatsApp inválido. Solo dígitos, entre 10 y 15 caracteres (incluir código de país).";
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError("");

    const payload = {
      contactName: form.contactName.trim(),
      contactRole: form.contactRole.trim() || null,
      whatsappNumber: form.whatsappNumber.trim() || null,
      isPrimary: form.isPrimary,
      notes: form.notes.trim() || null,
    };

    try {
      const url = editingId
        ? `/api/clubs/${clubId}/contacts/${editingId}`
        : `/api/clubs/${clubId}/contacts`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Error al guardar");

      if (editingId) {
        setContacts((prev) => {
          let updated = prev.map((c) => c.id === editingId ? data : c);
          if (payload.isPrimary) updated = updated.map((c) => ({ ...c, isPrimary: c.id === editingId }));
          return updated;
        });
      } else {
        setContacts((prev) => {
          let updated = payload.isPrimary ? prev.map((c) => ({ ...c, isPrimary: false })) : prev;
          return [...updated, data];
        });
      }
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/clubs/${clubId}/contacts/${id}`, { method: "DELETE" });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPrimary(id: string) {
    const res = await fetch(`/api/clubs/${clubId}/contacts/${id}/primary`, { method: "POST" });
    if (res.ok) {
      setContacts((prev) => prev.map((c) => ({ ...c, isPrimary: c.id === id })));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Contactos</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <Card className="border-foreground/20">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Nombre *</label>
                <input
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Rol</label>
                <input
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
                  value={form.contactRole}
                  onChange={(e) => setForm((f) => ({ ...f, contactRole: e.target.value }))}
                  placeholder="Delegado, Técnico…"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">WhatsApp (solo dígitos con código de país)</label>
              <input
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background font-mono"
                value={form.whatsappNumber}
                onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value.replace(/\D/g, "") }))}
                placeholder="593998375914"
              />
              <p className="text-xs text-muted-foreground">Ej: 593998375914 (Ecuador +593)</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Notas</label>
              <input
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Disponible lunes a viernes…"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
              />
              Marcar como contacto principal
            </label>
            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />{error}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editingId ? "Guardar cambios" : "Agregar contacto"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {contacts.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground">Sin contactos registrados.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-start gap-3 rounded-lg border bg-muted/20 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{c.contactName}</span>
                  {c.isPrimary && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-xs">
                      <Star className="h-3 w-3 mr-1" /> Principal
                    </Badge>
                  )}
                  {c.contactRole && (
                    <span className="text-xs text-muted-foreground">{c.contactRole}</span>
                  )}
                </div>
                {c.whatsappNumber && (
                  <a
                    href={whatsAppLink(c.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="h-3 w-3" />
                    {formatWhatsApp(c.whatsappNumber)}
                  </a>
                )}
                {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!c.isPrimary && (
                  <Button variant="ghost" size="sm" title="Marcar como principal" onClick={() => handleSetPrimary(c.id)}>
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="text-red-500 hover:text-red-700"
                >
                  {deletingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
