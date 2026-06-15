"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, AlertTriangle, X, Check, User } from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

type Props = { initialUsers: UserRow[] };

const ROLE_LABEL: Record<string, string> = { admin: "Admin", editor: "Editor", viewer: "Lector" };
const ROLE_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default", editor: "secondary", viewer: "outline",
};

const EMPTY_FORM: { name: string; email: string; password: string; role: "admin" | "editor" | "viewer" } = { name: "", email: "", password: "", role: "editor" };

export function UsersManager({ initialUsers }: Props) {
  const router = useRouter();
  const [userList, setUserList] = useState<UserRow[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Todos los campos son requeridos.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Error al crear");
      setUserList((prev) => [...prev, data]);
      setShowForm(false);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setShowForm(true); setError(""); setForm(EMPTY_FORM); }}>
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      {showForm && (
        <Card className="border-foreground/20">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Nombre *</label>
                <input
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ana García"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Correo electrónico *</label>
                <input
                  type="email"
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="ana@club.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Contraseña *</label>
                <input
                  type="password"
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "admin" | "editor" | "viewer" }))}
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Lector</option>
                </select>
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />{error}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Crear usuario
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {userList.map((u) => (
          <div key={u.id} className="flex items-center gap-4 rounded-lg border bg-muted/20 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={ROLE_BADGE[u.role] ?? "outline"} className="text-xs">
                {ROLE_LABEL[u.role] ?? u.role}
              </Badge>
              {!u.isActive && <Badge variant="secondary" className="text-xs">Inactivo</Badge>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
