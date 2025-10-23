"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getTranslations } from "../../lib/clientTranslations";

// Icônes locales
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
    <path d="M4 20a8 8 0 0116 0" />
  </svg>
);
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

export default function RegisterPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [translations, setTranslations] = useState<Record<string, any> | null>(null);

  // ... tes hooks de locale et translations ici ...

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/login");
      } else {
        const err = await res.json();
        setMessage(err.message || "Error while registering");
      }
    } catch {
      setMessage("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-purple-100 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/tttt.svg')" }}
    >
      {/* Fenêtre blanche */}
      <div className="flex w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Colonne gauche violet */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-600 to-indigo-700 text-white items-center justify-center p-12 relative">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-4">Welcome!</h1>
            <p className="text-lg">Create your account and join our platform to access all features.</p>
          </div>
          {/* Décorations */}
          <div className="absolute top-8 left-8 w-20 h-20 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-16 right-16 w-32 h-32 bg-white/10 rounded-full"></div>
        </div>

        {/* Colonne droite formulaire */}
        <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50">
          <div className="p-8 w-full max-w-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Account</h2>

            <div className="space-y-4">
              {/* Username */}
              <div className="relative">
                <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <EnvelopeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
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
              onClick={handleRegister}
              disabled={loading}
              className="w-full mt-6 py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>

            {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

            <p className="mt-6 text-sm text-gray-600 text-center">
              Already have an account?{" "}
              <a href="/login" className="text-indigo-600 hover:underline">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
