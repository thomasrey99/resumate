
"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Experience = {
  id: string;
  company: string;
  position: string;
  location: string;
  employment_type: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  created_at: string;
};

type ExperienceForm = {
  company: string;
  position: string;
  location: string;
  employment_type: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
};

const emptyForm: ExperienceForm = {
  company: "",
  position: "",
  location: "",
  employment_type: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [form, setForm] = useState<ExperienceForm>(emptyForm);
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

  const supabase = createClient();

  const loadExperiences = useCallback(async () => {
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
      .from("experiences")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("start_date", { ascending: false, nullsFirst: false });

    if (error) {
      setMessage("Error al cargar experiencias: " + error.message);
      setMessageType("error");
    } else {
      setExperiences(data ?? []);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  function handleChange<K extends keyof ExperienceForm>(
    field: K,
    value: ExperienceForm[K]
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

  function editExperience(experience: Experience) {
    setForm({
      company: experience.company ?? "",
      position: experience.position ?? "",
      location: experience.location ?? "",
      employment_type: experience.employment_type ?? "",
      start_date: experience.start_date ?? "",
      end_date: experience.end_date ?? "",
      is_current: experience.is_current,
      description: experience.description ?? "",
    });

    setEditingId(experience.id);
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
      setMessage("Indicá la fecha de finalización o marcá que trabajás actualmente.");
      setMessageType("error");
      return;
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date &&
      !form.is_current
    ) {
      setMessage("La fecha de finalización no puede ser anterior a la de inicio.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    const experienceData = {
      company: form.company.trim(),
      position: form.position.trim(),
      location: form.location.trim() || null,
      employment_type: form.employment_type || null,
      start_date: form.start_date || null,
      end_date: form.is_current ? null : form.end_date || null,
      is_current: form.is_current,
      description: form.description.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = editingId
      ? await supabase
          .from("experiences")
          .update(experienceData)
          .eq("id", editingId)
          .eq("user_id", userId)
      : await supabase.from("experiences").insert({
          ...experienceData,
          user_id: userId,
        });

    if (error) {
      setMessage("No se pudo guardar la experiencia: " + error.message);
      setMessageType("error");
      setSaving(false);
      return;
    }

    setMessage(
      editingId
        ? "Experiencia actualizada correctamente."
        : "Experiencia agregada correctamente."
    );
    setMessageType("success");

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);

    await loadExperiences();
    setSaving(false);
  }

  async function deleteExperience(id: string) {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés eliminar esta experiencia?"
    );

    if (!confirmed || !userId) return;

    setDeletingId(id);
    setMessage("");

    const { error } = await supabase
      .from("experiences")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setMessage("No se pudo eliminar: " + error.message);
      setMessageType("error");
    } else {
      setMessage("Experiencia eliminada correctamente.");
      setMessageType("success");
      await loadExperiences();
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
        Cargando experiencias...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Experiencia laboral
          </h1>
          <p className="mt-2 text-slate-500">
            Registrá tu trayectoria profesional y destacá tus responsabilidades
            y logros.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={openNewForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span className="text-lg">+</span>
            Agregar experiencia
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
                {editingId ? "Editar experiencia" : "Nueva experiencia"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Completá los datos de tu puesto de trabajo.
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
                <label className={labelClass}>Empresa *</label>
                <input
                  className={inputClass}
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  placeholder="Ej. Seemple"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Puesto *</label>
                <input
                  className={inputClass}
                  value={form.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  placeholder="Ej. Full Stack Developer"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Ubicación</label>
                <input
                  className={inputClass}
                  value={form.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="Ej. Buenos Aires, Argentina"
                />
              </div>

              <div>
                <label className={labelClass}>Tipo de empleo</label>
                <select
                  className={inputClass}
                  value={form.employment_type}
                  onChange={(e) =>
                    handleChange("employment_type", e.target.value)
                  }
                >
                  <option value="">Seleccionar</option>
                  <option value="Tiempo completo">Tiempo completo</option>
                  <option value="Medio tiempo">Medio tiempo</option>
                  <option value="Contrato">Contrato</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Pasantía">Pasantía</option>
                  <option value="Prácticas">Prácticas</option>
                  <option value="Temporal">Temporal</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Fecha de inicio</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                />
              </div>

              {!form.is_current && (
                <div>
                  <label className={labelClass}>Fecha de finalización</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.end_date}
                    onChange={(e) => handleChange("end_date", e.target.value)}
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
                Actualmente trabajo en esta empresa
              </span>
            </label>

            <div>
              <label className={labelClass}>
                Responsabilidades y logros
              </label>
              <textarea
                className={`${inputClass} min-h-40 resize-y`}
                value={form.description}
                onChange={(e) =>
                  handleChange("description", e.target.value)
                }
                placeholder={
                  "Describí tus principales responsabilidades, tecnologías utilizadas y logros obtenidos..."
                }
              />
              <p className="mt-2 text-xs text-slate-400">
                Podés utilizar saltos de línea para separar responsabilidades y logros.
              </p>
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
                    : "Agregar experiencia"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Listado */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Mis experiencias
          </h2>
          <span className="text-sm text-slate-500">
            {experiences.length}{" "}
            {experiences.length === 1 ? "experiencia" : "experiencias"}
          </span>
        </div>

        {experiences.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
              <span>+</span>
            </div>

            <h3 className="font-semibold text-slate-900">
              Todavía no agregaste experiencias
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Comenzá agregando tus trabajos anteriores o tu empleo actual.
              Esta información será utilizada para generar tus CVs.
            </p>

            {!showForm && (
              <button
                onClick={openNewForm}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Agregar primera experiencia
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((experience) => (
              <article
                key={experience.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {experience.position}
                      </h3>

                      {experience.is_current && (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          Actual
                        </span>
                      )}
                    </div>

                    <p className="mt-1 font-medium text-blue-600">
                      {experience.company}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                      {experience.location && (
                        <span>{experience.location}</span>
                      )}

                      {experience.employment_type && (
                        <span>{experience.employment_type}</span>
                      )}
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      {formatDate(experience.start_date)}
                      {" — "}
                      {experience.is_current
                        ? "Actualidad"
                        : experience.end_date
                          ? formatDate(experience.end_date)
                          : "Sin especificar"}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => editExperience(experience)}
                      className="h-fit rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deleteExperience(experience.id)}
                      disabled={deletingId === experience.id}
                      className="h-fit rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === experience.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </div>
                </div>

                {experience.description && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                      {experience.description}
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
