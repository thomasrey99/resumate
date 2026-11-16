
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TestResult = {
  usuarioAutenticado: string | null;
  perfilesVisibles: {
    user_id: string;
    email: string | null;
  }[] | null;
  error: string | null;
};

export default function TestRLSPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testRLS() {
      const supabase = createClient();

      // Obtener el usuario de la sesión actual
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setResult({
          usuarioAutenticado: null,
          perfilesVisibles: null,
          error: userError?.message ?? "No hay un usuario autenticado",
        });
        setLoading(false);
        return;
      }

      // Consultar los perfiles visibles para esta sesión
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email");

      setResult({
        usuarioAutenticado: userData.user.id,
        perfilesVisibles: data,
        error: error?.message ?? null,
      });

      setLoading(false);
    }

    testRLS();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-slate-900">
          Prueba de seguridad RLS
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Comprobación del aislamiento de perfiles entre usuarios.
        </p>

        {loading ? (
          <p className="mt-6">Comprobando permisos...</p>
        ) : (
          <pre className="mt-6 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-green-400">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
