
"use client";

import { useEffect, useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string;
  professional_title: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  github_url: string;
  professional_summary: string;
};

const initialProfile: Profile = {
  full_name: "",
  professional_title: "",
  email: "",
  phone: "",
  location: "",
  linkedin_url: "",
  portfolio_url: "",
  github_url: "",
  professional_summary: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setMessage("No se pudo identificar al usuario. Iniciá sesión nuevamente.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setUserId(userData.user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (error) {
        setMessage("No se pudo cargar el perfil: " + error.message);
        setMessageType("error");
      } else if (data) {
        setProfile({
          full_name: data.full_name ?? "",
          professional_title: data.professional_title ?? "",
          email: data.email ?? userData.user.email ?? "",
          phone: data.phone ?? "",
          location: data.location ?? "",
          linkedin_url: data.linkedin_url ?? "",
          portfolio_url: data.portfolio_url ?? "",
          github_url: data.github_url ?? "",
          professional_summary: data.professional_summary ?? "",
        });
      } else {
        setProfile({
          ...initialProfile,
          email: userData.user.email ?? "",
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  function handleChange(
    field: keyof Profile,
    value: string
  ) {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setMessage("No se pudo identificar al usuario.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    // Comprobar si el perfil ya existe
    const { data: existingProfile, error: searchError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (searchError) {
      setMessage("Error al verificar el perfil: " + searchError.message);
      setMessageType("error");
      setSaving(false);
      return;
    }

    const profileData = {
      ...profile,
      user_id: userId,
    };

    // Actualizar si existe o insertar si es nuevo
    const { error } = existingProfile
      ? await supabase
          .from("profiles")
          .update(profile)
          .eq("user_id", userId)
      : await supabase
          .from("profiles")
          .insert(profileData);

    if (error) {
      setMessage("No se pudieron guardar los cambios: " + error.message);
      setMessageType("error");
    } else {
      setMessage("¡Tu perfil se guardó correctamente!");
      setMessageType("success");
    }

    setSaving(false);
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-700";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Cargando tu perfil...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Mi perfil
        </h1>
        <p className="mt-2 text-slate-500">
          Administrá tu información profesional. La utilizaremos
          para personalizar y adaptar tus CVs a cada oportunidad laboral.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Datos personales */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Datos personales
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Tu información básica de contacto.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Nombre completo</label>
              <input
                className={inputClass}
                value={profile.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Título profesional</label>
              <input
                className={inputClass}
                value={profile.professional_title}
                onChange={(e) =>
                  handleChange("professional_title", e.target.value)
                }
                placeholder="Ej. Full Stack Developer"
              />
            </div>

            <div>
              <label className={labelClass}>Correo electrónico</label>
              <input
                className={inputClass}
                type="email"
                value={profile.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Teléfono</label>
              <input
                className={inputClass}
                type="tel"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Ubicación</label>
              <input
                className={inputClass}
                value={profile.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Ej. Buenos Aires, Argentina"
              />
            </div>
          </div>
        </section>

        {/* Enlaces profesionales */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Enlaces profesionales
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Compartí tus perfiles y trabajos online.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className={labelClass}>LinkedIn</label>
              <input
                className={inputClass}
                type="url"
                value={profile.linkedin_url}
                onChange={(e) => handleChange("linkedin_url", e.target.value)}
                placeholder="https://linkedin.com/in/tu-perfil"
              />
            </div>

            <div>
              <label className={labelClass}>GitHub</label>
              <input
                className={inputClass}
                type="url"
                value={profile.github_url}
                onChange={(e) => handleChange("github_url", e.target.value)}
                placeholder="https://github.com/tu-usuario"
              />
            </div>

            <div>
              <label className={labelClass}>Portfolio personal</label>
              <input
                className={inputClass}
                type="url"
                value={profile.portfolio_url}
                onChange={(e) => handleChange("portfolio_url", e.target.value)}
                placeholder="https://tuportfolio.com"
              />
            </div>
          </div>
        </section>

        {/* Resumen profesional */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Resumen profesional
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Contanos brevemente sobre tu experiencia, conocimientos y objetivos.
            </p>
          </div>

          <textarea
            className={`${inputClass} min-h-40 resize-y`}
            value={profile.professional_summary}
            onChange={(e) =>
              handleChange("professional_summary", e.target.value)
            }
            placeholder="Escribí una descripción de tu perfil profesional..."
          />
        </section>

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

        {/* Guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar perfil"}
          </button>
        </div>
      </form>
    </main>
  );
}
