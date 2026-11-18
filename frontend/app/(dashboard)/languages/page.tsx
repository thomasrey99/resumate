
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Pencil,
  Trash2,
  Languages,
  X,
  Save,
  Loader2,
} from "lucide-react";

type Language = {
  id: string;
  user_id: string;
  name: string;
  proficiency: string | null;
  certification: string | null;
  created_at: string;
};

type LanguageForm = {
  name: string;
  proficiency: string;
  certification: string;
};

const emptyForm: LanguageForm = {
  name: "",
  proficiency: "",
  certification: "",
};

const proficiencyLevels = [
  "Básico (A1)",
  "Elemental (A2)",
  "Intermedio (B1)",
  "Intermedio alto (B2)",
  "Avanzado (C1)",
  "Proficiente (C2)",
  "Nativo",
];

export default function LanguagesPage() {
  const supabase = createClient();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [form, setForm] = useState<LanguageForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLanguages();
  }, []);

  async function loadLanguages() {
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
      .from("languages")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("name", { ascending: true });

    if (queryError) {
      setError("No se pudieron cargar los idiomas.");
      setLoading(false);
      return;
    }

    setLanguages(data ?? []);
    setLoading(false);
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEditForm(language: Language) {
    setEditingId(language.id);
    setForm({
      name: language.name,
      proficiency: language.proficiency ?? "",
      certification: language.certification ?? "",
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

  function updateField(field: keyof LanguageForm, value: string) {
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
      setError("El nombre del idioma es obligatorio.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      proficiency: form.proficiency || null,
      certification: form.certification.trim() || null,
      user_id: userId,
    };

    const result = editingId
      ? await supabase
          .from("languages")
          .update({
            name: payload.name,
            proficiency: payload.proficiency,
            certification: payload.certification,
          })
          .eq("id", editingId)
          .eq("user_id", userId)
      : await supabase.from("languages").insert(payload);

    if (result.error) {
      setError("No se pudo guardar el idioma. " + result.error.message);
      setSaving(false);
      return;
    }

    closeForm();
    await loadLanguages();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés eliminar este idioma?"
    );

    if (!confirmed || !userId) return;

    const { error: deleteError } = await supabase
      .from("languages")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      setError("No se pudo eliminar el idioma.");
      return;
    }

    setLanguages((previous) =>
      previous.filter((language) => language.id !== id)
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">
          Cargando idiomas...
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Idiomas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registrá los idiomas que hablás y tu nivel de dominio.
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Agregar idioma
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
              {editingId ? "Editar idioma" : "Nuevo idioma"}
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
                Idioma *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ej. Inglés"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nivel de dominio
              </label>
              <select
                value={form.proficiency}
                onChange={(e) => updateField("proficiency", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Seleccionar nivel</option>
                {proficiencyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Certificación o acreditación
              </label>
              <input
                value={form.certification}
                onChange={(e) =>
                  updateField("certification", e.target.value)
                }
                placeholder="Ej. Cambridge English B2"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                Podés indicar el examen o certificado que acredita tu nivel.
              </p>
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
              {saving ? "Guardando..." : "Guardar idioma"}
            </button>
          </div>
        </form>
      )}

      {languages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Languages className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 font-semibold text-slate-800">
            Todavía no agregaste idiomas
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Incorporá los idiomas que dominás para completar tu perfil.
          </p>
          <button
            onClick={openNewForm}
            className="mt-5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Agregar el primer idioma
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {languages.map((language) => (
            <article
              key={language.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <Languages size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {language.name}
                  </h3>

                  {language.proficiency ? (
                    <span className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {language.proficiency}
                    </span>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">
                      Nivel no especificado
                    </p>
                  )}
                </div>
              </div>

              {language.certification && (
                <p className="mt-4 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">
                    Certificación:
                  </span>{" "}
                  {language.certification}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => openEditForm(language)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                  aria-label="Editar idioma"
                >
                  <Pencil size={17} />
                </button>

                <button
                  onClick={() => handleDelete(language.id)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  aria-label="Eliminar idioma"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
