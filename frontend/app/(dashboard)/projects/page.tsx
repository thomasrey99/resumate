
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Project = {
  id: string;
  name: string;
  description: string | null;
  technologies: string[];
  project_url: string | null;
  repository_url: string | null;
  start_date: string | null;
  end_date: string | null;
};

type ProjectForm = {
  name: string;
  description: string;
  technologies: string;
  project_url: string;
  repository_url: string;
  start_date: string;
  end_date: string;
};

const emptyForm: ProjectForm = {
  name: "",
  description: "",
  technologies: "",
  project_url: "",
  repository_url: "",
  start_date: "",
  end_date: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-medium text-slate-700";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
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

  const loadProjects = useCallback(async () => {
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
      .from("projects")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("start_date", { ascending: false, nullsFirst: false });

    if (error) {
      setMessage("Error al cargar los proyectos: " + error.message);
      setMessageType("error");
    } else {
      setProjects((data ?? []) as Project[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function handleChange<K extends keyof ProjectForm>(
    field: K,
    value: ProjectForm[K]
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

  function editProject(project: Project) {
    setForm({
      name: project.name,
      description: project.description ?? "",
      technologies: Array.isArray(project.technologies)
        ? project.technologies.join(", ")
        : "",
      project_url: project.project_url ?? "",
      repository_url: project.repository_url ?? "",
      start_date: project.start_date ?? "",
      end_date: project.end_date ?? "",
    });

    setEditingId(project.id);
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

  function isValidUrl(value: string) {
    if (!value.trim()) return true;

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setMessage("No se pudo identificar al usuario.");
      setMessageType("error");
      return;
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      setMessage(
        "La fecha de finalización no puede ser anterior a la fecha de inicio."
      );
      setMessageType("error");
      return;
    }

    if (
      !isValidUrl(form.project_url) ||
      !isValidUrl(form.repository_url)
    ) {
      setMessage("Ingresá URLs válidas que comiencen con https:// o http://.");
      setMessageType("error");
      return;
    }

    const technologies = [
      ...new Set(
        form.technologies
          .split(",")
          .map((technology) => technology.trim())
          .filter(Boolean)
      ),
    ];

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const projectData = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      technologies,
      project_url: form.project_url.trim() || null,
      repository_url: form.repository_url.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = editingId
      ? await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editingId)
          .eq("user_id", userId)
      : await supabase.from("projects").insert({
          ...projectData,
          user_id: userId,
        });

    if (error) {
      setMessage("No se pudo guardar el proyecto: " + error.message);
      setMessageType("error");
      setSaving(false);
      return;
    }

    const wasEditing = Boolean(editingId);

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);

    await loadProjects();

    setMessage(
      wasEditing
        ? "Proyecto actualizado correctamente."
        : "Proyecto agregado correctamente."
    );
    setMessageType("success");
    setSaving(false);
  }

  async function deleteProject(id: string) {
    const confirmed = window.confirm(
      "¿Estás seguro de que querés eliminar este proyecto?"
    );

    if (!confirmed || !userId) return;

    setDeletingId(id);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setMessage("No se pudo eliminar el proyecto: " + error.message);
      setMessageType("error");
    } else {
      await loadProjects();
      setMessage("Proyecto eliminado correctamente.");
      setMessageType("success");
    }

    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Cargando proyectos...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Proyectos
          </h1>

          <p className="mt-2 text-slate-500">
            Mostrá los proyectos en los que aplicaste tus conocimientos.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={openNewForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span className="text-lg">+</span>
            Agregar proyecto
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
          <p className="text-sm text-slate-500">Proyectos registrados</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {projects.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Tecnologías utilizadas</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {new Set(projects.flatMap((project) => project.technologies ?? []))
              .size}
          </p>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? "Editar proyecto" : "Nuevo proyecto"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Completá la información de tu proyecto.
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
            <div>
              <label className={labelClass}>Nombre del proyecto *</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ej. Sistema de gestión de cargas"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Descripción</label>
              <textarea
                className={`${inputClass} min-h-36 resize-y`}
                value={form.description}
                onChange={(e) =>
                  handleChange("description", e.target.value)
                }
                placeholder="Describí el objetivo, las funcionalidades y los problemas que resuelve el proyecto..."
              />
            </div>

            <div>
              <label className={labelClass}>Tecnologías utilizadas</label>
              <input
                className={inputClass}
                value={form.technologies}
                onChange={(e) =>
                  handleChange("technologies", e.target.value)
                }
                placeholder="Python, FastAPI, React, PostgreSQL..."
              />
              <p className="mt-2 text-xs text-slate-400">
                Separá cada tecnología con una coma.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  URL del proyecto o demostración
                </label>
                <input
                  type="url"
                  className={inputClass}
                  value={form.project_url}
                  onChange={(e) =>
                    handleChange("project_url", e.target.value)
                  }
                  placeholder="https://mi-proyecto.com"
                />
              </div>

              <div>
                <label className={labelClass}>Repositorio</label>
                <input
                  type="url"
                  className={inputClass}
                  value={form.repository_url}
                  onChange={(e) =>
                    handleChange("repository_url", e.target.value)
                  }
                  placeholder="https://github.com/usuario/proyecto"
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
                    : "Agregar proyecto"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Listado */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Mis proyectos
          </h2>

          <span className="text-sm text-slate-500">
            {projects.length} registros
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
              +
            </div>

            <h3 className="font-semibold text-slate-900">
              Todavía no agregaste proyectos
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Incorporá tus proyectos personales y profesionales para
              destacar tu experiencia práctica.
            </p>

            {!showForm && (
              <button
                onClick={openNewForm}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Agregar primer proyecto
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {project.name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {project.start_date
                        ? formatDate(project.start_date)
                        : "Fecha sin especificar"}
                      {" — "}
                      {project.end_date
                        ? formatDate(project.end_date)
                        : project.start_date
                          ? "En curso / sin fecha de finalización"
                          : "Sin especificar"}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => editProject(project)}
                      className="h-fit rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deleteProject(project.id)}
                      disabled={deletingId === project.id}
                      className="h-fit rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === project.id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {project.description}
                  </p>
                )}

                {project.technologies?.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.technologies.map((technology) => (
                      <span
                        key={technology}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                )}

                {(project.project_url || project.repository_url) && (
                  <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4">
                    {project.project_url && (
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Ver proyecto ↗
                      </a>
                    )}

                    {project.repository_url && (
                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Ver repositorio ↗
                      </a>
                    )}
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
