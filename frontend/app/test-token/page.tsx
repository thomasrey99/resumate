
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfessionalProfile = {
  profile: Record<string, unknown> | null;
  experiences: Record<string, unknown>[];
  education: Record<string, unknown>[];
  skills: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  certifications: Record<string, unknown>[];
  languages: Record<string, unknown>[];
};

export default function TestProfilePage() {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [status, setStatus] = useState("Esperando consulta...");

  async function loadProfile() {
    setStatus("Consultando perfil profesional completo...");
    setProfile(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      setStatus("No hay una sesión activa. Iniciá sesión nuevamente.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/profile/me/full`,
        {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setStatus(`Error ${response.status}: ${result.detail}`);
        return;
      }

      setProfile(result);
      setStatus("Perfil profesional completo recuperado correctamente.");
    } catch {
      setStatus("No se pudo conectar con FastAPI.");
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-bold">
        Prueba de perfil profesional completo
      </h1>

      <button
        onClick={loadProfile}
        className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-white"
      >
        Recuperar perfil completo
      </button>

      <p className="mt-4">{status}</p>

      {profile && (
        <div className="mt-6 space-y-4">
          <p>Experiencias: {profile.experiences.length}</p>
          <p>Educación: {profile.education.length}</p>
          <p>Habilidades: {profile.skills.length}</p>
          <p>Proyectos: {profile.projects.length}</p>
          <p>Certificaciones: {profile.certifications.length}</p>
          <p>Idiomas: {profile.languages.length}</p>

          <pre className="overflow-auto rounded-lg bg-slate-100 p-4 text-sm text-slate-900">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
