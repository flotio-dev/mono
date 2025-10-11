"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const { data: session } = useSession();
  const [apiResponse, setApiResponse] = useState<string | null>(null);

  const callGateway = async () => {
    try {
      const headers: HeadersInit = {};
      if (session?.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
      }

      const res = await fetch("http://localhost:8000/api/hello-world", {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        setApiResponse(`Erreur: ${res.status}`);
        return;
      }

      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      setApiResponse("Erreur réseau");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-sm text-center">
        {!session ? (
          <>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Connexion</h1>
            <button
              onClick={() => signIn("keycloak")}
              className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition mb-4"
            >
              Se connecter avec Keycloak
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
              Bienvenue {session.user?.name}
            </h1>
            <button
              onClick={() => signOut()}
              className="w-full mb-4 py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
            >
              Se déconnecter
            </button>
          </>
        )}

        {/* Bouton toujours affiché */}
        <button
          onClick={callGateway}
          className="w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
        >
          Appeler Gateway: Hello World
          {session ? " (avec token)" : " (sans token)"}
        </button>

        {apiResponse && (
          <pre className="mt-4 text-left bg-gray-100 text-black p-4 rounded text-sm">
            {apiResponse}
          </pre>
        )}
      </div>
    </div>
  );
}
