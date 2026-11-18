
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Pencil,
  Trash2,
  Award,
  ExternalLink,
  X,
  Save,
  Loader2,
} from "lucide-react";

type Certification = {
  id: string;
  user_id: string;
  name: string;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  credential_url: string | null;
  credential_id: string | null;
  created_at: string;
};

type CertificationForm = {
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string;
  credential_url: string;
  credential_id: string;
};

const emptyForm: CertificationForm = {
  name: "",
  issuing_organization: "",
  issue_date: "",
  expiration_date: "",
  credential_url: "",
  credential_id: "",
};

export default function CertificationsPage() {
  const supabase = createClient();

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [form, setForm] = useState<CertificationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCertifications();
  }, []);

  async function loadCertifications() {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError("No se pudo identificar al usuario.");
      setLoading(false);
      return;
    }

    setUserId(authData.user.id);

    const { data, error: queryError } = await supabase
      .from("certifications")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("issue_date", { ascending: false, nullsFirst: false });

    if (queryError) {
      setError("No se pudieron cargar las certificaciones.");
      setLoading(false);
      return;
    }

    setCertifications(data ?? []);
    setLoading(false);
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEditForm(certification: Certification) {
    setEditingId(certification.id);
    setForm({
      name: certification.name,
      issuing_organization: certification.issuing_organization ?? "",
      issue_date: certification.issue_date ?? "",
      expiration_date: certification.expiration_date ?? "",
      credential_url: certification.credential_url ?? "",
      credential_id: certification.credential_id ?? "",
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function updateField(
    field: keyof CertificationForm,
    value: string
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("No se pudo identificar al usuario.");
      return;
    }

    if (!form.name.trim()) {
      setError("El nombre de la certificación es obligatorio.");
      return;
    }

    if (
      form.issue_date &&
      form.expiration_date &&
      form.expiration_date < form.issue_date
    ) {
      setError("La fecha de vencimiento no puede ser anterior a la emisión.");
      return;
    }

    if (form.credential_url.trim()) {
      try {
        const url = new URL(form.credential_url.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("URL inválida");
        }
      } catch {
        setError("Ingresá una URL de credencial válida (https://...).");
        return;
      }
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      issuing_organization:
        form.issuing_organization.trim() || null,
      issue_date: form.issue_date || null,
      expiration_date: form.expiration_date || null,
      credential_url: form.credential_url.trim() || null,
      credential_id: form.credential_id.trim() || null,
      user_id: userId,
    };

    const result = editingId
      ? await supabase
          .from("certifications")
          .update({
            name: payload.name,
            issuing_organization: payload.issuing_organization,
            issue_date: payload.issue_date,
            expiration_date: payload.expiration_date,
            credential_url: payload.credential_url,
            credential_id: payload.credential_id,
          })
          .eq("id", editingId)
          .eq("user_id", userId)
      : await supabase.from("certifications").insert(payload);

    if (result.error) {
      setError("No se pudo guardar la certificación. " + result.error.message);
      setSaving(false);
      return;
    }

    closeForm();
    await loadCertifications();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés eliminar esta certificación?"
    );

    if (!confirmed || !userId) return;

    const { error: deleteError } = await supabase
      .from("certifications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      setError("No se pudo eliminar la certificación.");
      return;
    }

    setCertifications((previous) =>
      previous.filter((item) => item.id !== id)
    );
  }

  function formatDate(date: string | null) {
    if (!date) return "No especificada";

    return new Date(`${date}T00:00:00`).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">
          Cargando certificaciones...
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Certificaciones
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Registrá tus certificaciones y credenciales profesionales.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Agregar certificación
        </button>
      </div>

      {error && !showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Editar certificación" : "Nueva certificación"}
            </h2>

            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Cerrar formulario"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nombre de la certificación *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ej. AWS Certified Cloud Practitioner"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Organización emisora
              </label>
              <input
                value={form.issuing_organization}
                onChange={(e) =>
                  updateField("issuing_organization", e.target.value)
                }
                placeholder="Ej. Amazon Web Services"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ID de credencial
              </label>
              <input
                value={form.credential_id}
                onChange={(e) => updateField("credential_id", e.target.value)}
                placeholder="Identificador de la certificación"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fecha de emisión
              </label>
              <input
                type="date"
                value={form.issue_date}
                onChange={(e) => updateField("issue_date", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fecha de vencimiento
              </label>
              <input
                type="date"
                value={form.expiration_date}
                onChange={(e) =>
                  updateField("expiration_date", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                Dejalo vacío si no tiene vencimiento.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                URL de verificación
              </label>
              <input
                type="url"
                value={form.credential_url}
                onChange={(e) => updateField("credential_url", e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Guardando..." : "Guardar certificación"}
            </button>
          </div>
        </form>
      )}

      {certifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Award className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 font-semibold text-slate-800">
            Todavía no agregaste certificaciones
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Incorporá tus cursos y certificaciones para completar tu perfil.
          </p>
          <button
            onClick={openNewForm}
            className="mt-5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Agregar la primera certificación
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certifications.map((certification) => (
            <article
              key={certification.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <Award size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {certification.name}
                  </h3>
                  {certification.issuing_organization && (
                    <p className="mt-1 text-sm text-slate-500">
                      {certification.issuing_organization}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {certification.issue_date && (
                  <p>
                    <span className="font-medium text-slate-700">
                      Emisión:
                    </span>{" "}
                    {formatDate(certification.issue_date)}
                  </p>
                )}

                {certification.expiration_date && (
                  <p>
                    <span className="font-medium text-slate-700">
                      Vencimiento:
                    </span>{" "}
                    {formatDate(certification.expiration_date)}
                  </p>
                )}

                {certification.credential_id && (
                  <p>
                    <span className="font-medium text-slate-700">ID:</span>{" "}
                    {certification.credential_id}
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                {certification.credential_url ? (
                  <a
                    href={certification.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Ver credencial <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">
                    Sin enlace de verificación
                  </span>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(certification)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                    aria-label="Editar certificación"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => handleDelete(certification.id)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Eliminar certificación"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
