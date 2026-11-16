
"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Education = {
  id: string;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
};

type EducationForm = {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
};

const emptyForm: EducationForm = {
  institution: "",
  degree: "",
  field_of_study: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";

export default function EducationPage() {
  const [education, setEducation] = useState<Education[]>([]);
  const [form, setForm] = useState<EducationForm>(emptyForm);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const loadEducation = useCallback(async () => {
    const supabase = createClient();

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      setMessage("No se pudo identificar al usuario.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    setUserId(userData.user.id);

    const { data, error } = await supabase
      .from("education")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("start_date", { ascending: false, nullsFirst: false });

    if (error) {
      setMessage("Error al cargar los estudios: " + error.message);
      setMessageType("error");
    } else {
      setEducation(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadEducation();
  }, [loadEducation]);

  function handleChange<K extends keyof EducationForm>(
    field: K,
    value: EducationForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function openNewForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setShowForm(true);
  }

  function editEducation(item: Education) {
    setForm({
      institution: item.institution ?? "",
      degree: item.degree ?? "",
      field_of_study: item.field_of_study ?? "",
      start_date: item.start_date ?? "",
      end_date: item.end_date ?? "",
      is_current: item.is_current,
      description: item.description ?? "",
    });

    setEditingId(item.id);
    setMessage("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setMessage("No se pudo identificar al usuario.");
      setMessageType("error");
      return;
    }

    if (!form.is_current && !form.end_date) {
      setMessage(
        "Indicá la fecha de finalización o marcá que el estudio está en curso."
      );
      setMessageType("error");
      return;
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date &&
      !form.is_current
    ) {
      setMessage(
        "La fecha de finalización no puede ser anterior a la de inicio."
      );
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const educationData = {
      institution: form.institution.trim(),
      degree: form.degree.trim() || null,
      field_of_study: form.field_of_study.trim() || null,
      start_date: form.start_date || null,
      end_date: form.is_current ? null : form.end_date || null,
      is_current: form.is_current,
      description: form.description.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = editingId
      ? await supabase
          .from("education")
          .update(educationData)
          .eq("id", editingId)
          .eq("user_id", userId)
      : await supabase.from("education").insert({
          ...educationData,
          user_id: userId,
        });

    if (error) {
      setMessage("No se pudo guardar el estudio: " + error.message);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);

    await loadEducation();

    setMessage(
      editingId
        ? "Estudios actualizados correctamente."
        : "Estudios agregados correctamente."
    );
    setMessageType("success");
    setSaving(false);
  }

  async function deleteEducation(id: string) {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés eliminar este estudio?"
    );

    if (!confirmed || !userId) return;

    setDeletingId(id);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("education")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setMessage("No se pudo eliminar: " + error.message);
      setMessageType("error");
    } else {
      await loadEducation();
      setMessage("Estudio eliminado correctamente.");
      setMessageType("success");
    }

    setDeletingId(null);
  }

  function formatDate(date: string | null) {
    if (!date) return "";

    const [year, month] = date.split("-").map(Number);

    return new Intl.DateTimeFormat("es-AR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Cargando formación académica...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Educación
          </h1>
          <p className="mt-2 text-slate-500">
            Registrá tu formación académica, estudios y capacitaciones.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={openNewForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span className="text-lg">+</span>
            Agregar estudio
          </button>
        )}
      </div>

      {/* Mensajes */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            messageType === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? "Editar estudio" : "Nuevo estudio"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Completá los datos de tu formación.
              </p>
            </div>

            <button
              type="button"
              onClick={cancelForm}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Institución *</label>
                <input
                  className={inputClass}
                  value={form.institution}
                  onChange={(e) =>
                    handleChange("institution", e.target.value)
                  }
                  placeholder="Ej. Universidad Tecnológica Nacional"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Título o certificación</label>
                <input
                  className={inputClass}
                  value={form.degree}
                  onChange={(e) => handleChange("degree", e.target.value)}
                  placeholder="Ej. Ingeniería en Sistemas"
                />
              </div>

              <div>
                <label className={labelClass}>Área de estudio</label>
                <input
                  className={inputClass}
                  value={form.field_of_study}
                  onChange={(e) =>
                    handleChange("field_of_study", e.target.value)
                  }
                  placeholder="Ej. Tecnología e Informática"
                />
              </div>

              <div>
                <label className={labelClass}>Fecha de inicio</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.start_date}
                  onChange={(e) =>
                    handleChange("start_date", e.target.value)
                  }
                />
              </div>

              {!form.is_current && (
                <div>
                  <label className={labelClass}>Fecha de finalización</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.end_date}
                    onChange={(e) =>
                      handleChange("end_date", e.target.value)
                    }
                  />
                </div>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={form.is_current}
                onChange={(e) => {
                  handleChange("is_current", e.target.checked);

                  if (e.target.checked) {
                    handleChange("end_date", "");
                  }
                }}
                className="h-4 w-4 accent-blue-600"
              />

              <span className="text-sm font-medium text-slate-700">
                Actualmente estoy cursando este estudio
              </span>
            </label>

            <div>
              <label className={labelClass}>Descripción adicional</label>
              <textarea
                className={`${inputClass} min-h-32 resize-y`}
                value={form.description}
                onChange={(e) =>
                  handleChange("description", e.target.value)
                }
                placeholder="Podés agregar materias relevantes, especializaciones, logros académicos o información adicional..."
              />
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Agregar estudio"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Listado */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Mi formación académica
          </h2>

          <span className="text-sm text-slate-500">
            {education.length}{" "}
            {education.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {education.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
              <span>+</span>
            </div>

            <h3 className="font-semibold text-slate-900">
              Todavía no agregaste estudios
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Incorporá tu formación académica y capacitaciones para
              completar tu perfil profesional.
            </p>

            {!showForm && (
              <button
                onClick={openNewForm}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Agregar primer estudio
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {education.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {item.degree || item.field_of_study || item.institution}
                      </h3>

                      {item.is_current && (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          En curso
                        </span>
                      )}
                    </div>

                    <p className="mt-1 font-medium text-blue-600">
                      {item.institution}
                    </p>

                    {item.field_of_study && (
                      <p className="mt-1 text-sm text-slate-500">
                        {item.field_of_study}
                      </p>
                    )}

                    <p className="mt-3 text-sm text-slate-500">
                      {formatDate(item.start_date)}
                      {" — "}
                      {item.is_current
                        ? "Actualidad"
                        : item.end_date
                          ? formatDate(item.end_date)
                          : "Sin especificar"}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => editEducation(item)}
                      className="h-fit rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deleteEducation(item.id)}
                      disabled={deletingId === item.id}
                      className="h-fit rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === item.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </div>
                </div>

                {item.description && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
