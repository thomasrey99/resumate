
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Skill = {
  id: string;
  name: string;
  category: string | null;
  proficiency: string | null;
  created_at: string;
};

type SkillForm = {
  name: string;
  category: string;
  proficiency: string;
};

const categories = [
  "Frontend",
  "Backend",
  "Bases de datos",
  "IA y automatización",
  "DevOps y herramientas",
  "Data y análisis",
  "Otros",
];

const proficiencyLevels = [
  "Básico",
  "Intermedio",
  "Avanzado",
  "Experto",
];

const emptyForm: SkillForm = {
  name: "",
  category: "Frontend",
  proficiency: "Intermedio",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [form, setForm] = useState<SkillForm>(emptyForm);
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

  const loadSkills = useCallback(async () => {
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
      .from("skills")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Error al cargar las habilidades: " + error.message);
      setMessageType("error");
    } else {
      setSkills(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  function handleChange<K extends keyof SkillForm>(
    field: K,
    value: SkillForm[K]
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

  function editSkill(skill: Skill) {
    setForm({
      name: skill.name,
      category: skill.category || "Otros",
      proficiency: skill.proficiency || "Intermedio",
    });

    setEditingId(skill.id);
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

    if (!form.name.trim()) {
      setMessage("Ingresá el nombre de la habilidad.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const skillData = {
      name: form.name.trim(),
      category: form.category,
      proficiency: form.proficiency,
    };

    const { error } = editingId
      ? await supabase
          .from("skills")
          .update(skillData)
          .eq("id", editingId)
          .eq("user_id", userId)
      : await supabase.from("skills").insert({
          ...skillData,
          user_id: userId,
        });

    if (error) {
      setMessage("No se pudo guardar la habilidad: " + error.message);
      setMessageType("error");
      setSaving(false);
      return;
    }

    const wasEditing = Boolean(editingId);

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);

    await loadSkills();

    setMessage(
      wasEditing
        ? "Habilidad actualizada correctamente."
        : "Habilidad agregada correctamente."
    );
    setMessageType("success");
    setSaving(false);
  }

  async function deleteSkill(id: string) {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés eliminar esta habilidad?"
    );

    if (!confirmed || !userId) return;

    setDeletingId(id);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("skills")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setMessage("No se pudo eliminar: " + error.message);
      setMessageType("error");
    } else {
      await loadSkills();
      setMessage("Habilidad eliminada correctamente.");
      setMessageType("success");
    }

    setDeletingId(null);
  }

  const groupedSkills = categories
    .map((category) => ({
      category,
      items: skills.filter((skill) => skill.category === category),
    }))
    .filter((group) => group.items.length > 0);

  const uncategorizedSkills = skills.filter(
    (skill) => !categories.includes(skill.category || "")
  );

  const proficiencyStyles: Record<string, string> = {
    Básico: "bg-slate-100 text-slate-600",
    Intermedio: "bg-blue-50 text-blue-700",
    Avanzado: "bg-violet-50 text-violet-700",
    Experto: "bg-green-50 text-green-700",
  };

  function renderSkill(skill: Skill) {
    return (
      <article
        key={skill.id}
        className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
      >
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{skill.name}</h3>

          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              proficiencyStyles[skill.proficiency || ""] ||
              "bg-slate-100 text-slate-600"
            }`}
          >
            {skill.proficiency || "Sin nivel"}
          </span>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => editSkill(skill)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Editar
          </button>

          <button
            onClick={() => deleteSkill(skill.id)}
            disabled={deletingId === skill.id}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deletingId === skill.id ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </article>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Cargando habilidades...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Habilidades
          </h1>

          <p className="mt-2 text-slate-500">
            Organizá tus conocimientos técnicos y profesionales.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={openNewForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span className="text-lg">+</span>
            Agregar habilidad
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

      {/* Resumen */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total de habilidades</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {skills.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Categorías utilizadas</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {groupedSkills.length +
              (uncategorizedSkills.length > 0 ? 1 : 0)}
          </p>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? "Editar habilidad" : "Nueva habilidad"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Indicá el conocimiento y tu nivel de dominio.
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
                <label className={labelClass}>Nombre de la habilidad *</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ej. React, Python, Docker..."
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Categoría</label>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Nivel de dominio</label>
                <select
                  className={inputClass}
                  value={form.proficiency}
                  onChange={(e) =>
                    handleChange("proficiency", e.target.value)
                  }
                >
                  {proficiencyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Agregar habilidad"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Listado */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Mis conocimientos
          </h2>

          <span className="text-sm text-slate-500">
            {skills.length} registros
          </span>
        </div>

        {skills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
              +
            </div>

            <h3 className="font-semibold text-slate-900">
              Todavía no agregaste habilidades
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Incorporá tus conocimientos técnicos y herramientas para
              completar tu perfil profesional.
            </p>

            {!showForm && (
              <button
                onClick={openNewForm}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Agregar primera habilidad
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedSkills.map((group) => (
              <div key={group.category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">
                    {group.category}
                  </h3>

                  <span className="text-xs text-slate-400">
                    {group.items.length} habilidades
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {group.items.map(renderSkill)}
                </div>
              </div>
            ))}

            {uncategorizedSkills.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800">
                  Otras habilidades
                </h3>

                <div className="grid gap-3 md:grid-cols-2">
                  {uncategorizedSkills.map(renderSkill)}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
