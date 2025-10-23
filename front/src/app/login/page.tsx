"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Icônes locales
const EnvelopeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

const LockClosedIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data: session } = useSession();
  const router = useRouter();

  // Redirection si déjà connecté
  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);

    const res = await signIn("credentials", {
      redirect: false,
      username: form.username,
      password: form.password,
    });

    if (res?.error) {
      setMessage(res.error);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-purple-100 bg-cover bg-center bg-no-repeat"
         style={{ backgroundImage: "url('/tttt.svg')" }}>
      <div className="flex w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Colonne gauche */}
        <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50">
          <div className="p-8 w-full max-w-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Sign In</h2>

            <div className="space-y-4">
              {/* Username */}
              <div className="relative">
                <EnvelopeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <LockClosedIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-6 py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

            <p className="mt-6 text-sm text-gray-600 text-center">
              New here?{" "}
              <a href="/register" className="text-indigo-600 hover:underline">
                Create an Account
              </a>
            </p>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-600 to-indigo-700 text-white items-center justify-center p-12 relative">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome back!</h1>
            <p className="text-lg">
              Sign in to access your account and continue where you left off.
            </p>
          </div>
          <div className="absolute top-8 left-8 w-20 h-20 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-16 right-16 w-32 h-32 bg-white/10 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
