
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Pencil,
  Trash2,
  BriefcaseBusiness,
  ExternalLink,
  X,
  Save,
  Loader2,
  Search,
  CalendarDays,
  Building2,
} from "lucide-react";

type Application = {
  id: string;
  user_id: string;
  company: string | null;
  position: string;
  job_url: string | null;
  job_description: string | null;
  status: string;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

type ApplicationForm = {
  company: string;
  position: string;
  job_url: string;
  job_description: string;
  status: string;
  notes: string;
  applied_at: string;
};

const emptyForm: ApplicationForm = {
  company: "",
  position: "",
  job_url: "",
  job_description: "",
  status: "saved",
  notes: "",
  applied_at: "",
};

const statuses = [
  { value: "saved", label: "Guardada" },
  { value: "applied", label: "Postulada" },
  { value: "interview", label: "Entrevista" },
  { value: "offer", label: "Oferta" },
  { value: "rejected", label: "Rechazada" },
  { value: "discarded", label: "Descartada" },
];

const statusStyles: Record<string, string> = {
  saved: "bg-slate-100 text-slate-700",
  applied: "bg-blue-100 text-blue-700",
  interview: "bg-violet-100 text-violet-700",
  offer: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  discarded: "bg-orange-100 text-orange-700",
};

export default function ApplicationsPage() {
  const supabase = createClient();

  const [applications, setApplications] = useState<Application[]>([]);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
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
      .from("job_applications")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError("No se pudieron cargar las postulaciones.");
      setLoading(false);
      return;
    }

    setApplications(data ?? []);
    setLoading(false);
  }

  function updateField(field: keyof ApplicationForm, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEditForm(application: Application) {
    setEditingId(application.id);
    setForm({
      company: application.company ?? "",
      position: application.position,
      job_url: application.job_url ?? "",
      job_description: application.job_description ?? "",
      status: application.status,
      notes: application.notes ?? "",
      applied_at: application.applied_at
        ? application.applied_at.slice(0, 10)
        : "",
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("No se pudo identificar al usuario.");
      return;
    }

    if (!form.position.trim()) {
      setError("El puesto de trabajo es obligatorio.");
      return;
    }

    if (form.job_url.trim()) {
      try {
        const url = new URL(form.job_url.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("URL inválida");
        }
      } catch {
        setError("Ingresá una URL válida para la vacante.");
        return;
      }
    }

    if (form.status === "applied" && !form.applied_at) {
      setError("Indicá la fecha en la que te postulaste.");
      return;
    }

    setSaving(true);

    const payload = {
      company: form.company.trim() || null,
      position: form.position.trim(),
      job_url: form.job_url.trim() || null,
      job_description: form.job_description.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
      applied_at: form.applied_at
        ? new Date(`${form.applied_at}T12:00:00`).toISOString()
        : null,
      user_id: userId,
    };

    const result = editingId
      ? await supabase
          .from("job_applications")
          .update({
            company: payload.company,
            position: payload.position,
            job_url: payload.job_url,
            job_description: payload.job_description,
            status: payload.status,
            notes: payload.notes,
            applied_at: payload.applied_at,
          })
          .eq("id", editingId)
          .eq("user_id", userId)
      : await supabase.from("job_applications").insert(payload);

    if (result.error) {
      setError("No se pudo guardar la postulación. " + result.error.message);
      setSaving(false);
      return;
    }

    closeForm();
    await loadApplications();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés eliminar esta postulación?"
    );

    if (!confirmed || !userId) return;

    const { error: deleteError } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      setError("No se pudo eliminar la postulación.");
      return;
    }

    setApplications((previous) =>
      previous.filter((application) => application.id !== id)
    );
  }

  function getStatusLabel(status: string) {
    return statuses.find((item) => item.value === status)?.label ?? status;
  }

  function formatDate(date: string | null) {
    if (!date) return "No especificada";

    return new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const filteredApplications = applications.filter((application) => {
    const matchesFilter =
      filter === "all" || application.status === filter;

    const term = search.toLowerCase();

    const matchesSearch =
      application.position.toLowerCase().includes(term) ||
      (application.company ?? "").toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: applications.length,
    saved: applications.filter((a) => a.status === "saved").length,
    applied: applications.filter((a) => a.status === "applied").length,
    interview: applications.filter((a) => a.status === "interview").length,
    offer: applications.filter((a) => a.status === "offer").length,
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">
          Cargando postulaciones...
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Postulaciones
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organizá y seguí tus oportunidades laborales.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Nueva postulación
        </button>
      </div>

      {error && !showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total", value: counts.all },
          { label: "Guardadas", value: counts.saved },
          { label: "Postuladas", value: counts.applied },
          { label: "Entrevistas", value: counts.interview },
          { label: "Ofertas", value: counts.offer },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Editar postulación" : "Nueva postulación"}
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
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Puesto *
              </label>
              <input
                required
                value={form.position}
                onChange={(e) => updateField("position", e.target.value)}
                placeholder="Ej. Full Stack Developer"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Empresa
              </label>
              <input
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                placeholder="Nombre de la empresa"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fecha de postulación
              </label>
              <input
                type="date"
                value={form.applied_at}
                onChange={(e) => updateField("applied_at", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                URL de la vacante
              </label>
              <input
                type="url"
                value={form.job_url}
                onChange={(e) => updateField("job_url", e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Descripción de la vacante
              </label>
              <textarea
                rows={7}
                value={form.job_description}
                onChange={(e) =>
                  updateField("job_description", e.target.value)
                }
                placeholder="Pegá acá la descripción completa de la oferta laboral..."
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Notas personales
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Contacto, observaciones, próximos pasos..."
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              {saving ? "Guardando..." : "Guardar postulación"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por puesto o empresa..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">Todos los estados</option>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 font-semibold text-slate-800">
            {applications.length === 0
              ? "Todavía no tenés postulaciones"
              : "No se encontraron resultados"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {applications.length === 0
              ? "Agregá una vacante para comenzar a organizar tu búsqueda laboral."
              : "Probá cambiando los filtros o el término de búsqueda."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <article
              key={application.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="flex min-w-0 gap-3">
                  <div className="h-fit rounded-lg bg-blue-50 p-3 text-blue-600">
                    <BriefcaseBusiness size={22} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">
                      {application.position}
                    </h3>

                    {application.company && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <Building2 size={15} />
                        {application.company}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          statusStyles[application.status] ??
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {getStatusLabel(application.status)}
                      </span>

                      {application.applied_at && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <CalendarDays size={13} />
                          {formatDate(application.applied_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-end gap-2">
                  {application.job_url && (
                    <a
                      href={application.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                      title="Abrir vacante"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}

                  <button
                    onClick={() => openEditForm(application)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                    aria-label="Editar postulación"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(application.id)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Eliminar postulación"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {application.job_description && (
                <details className="mt-4 border-t border-slate-100 pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                    Ver descripción de la vacante
                  </summary>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {application.job_description}
                  </p>
                </details>
              )}

              {application.notes && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notas
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {application.notes}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
