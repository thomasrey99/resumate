
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestTokenPage() {
  const [status, setStatus] = useState("Sin consultar");

  async function checkSession() {
    const supabase = createClient();

    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      setStatus("No hay una sesión activa");
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/health/protected`,
      {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    const result = await response.json();

    setStatus(
      response.ok
        ? `Autenticación correcta. Usuario: ${result.user_id}`
        : `Error ${response.status}: ${result.detail}`
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold">Prueba de autenticación</h1>

      <button
        onClick={checkSession}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
      >
        Verificar sesión con FastAPI
      </button>

      <p className="mt-4">{status}</p>
    </main>
  );
}
