"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Leaf, AlertCircle, LogIn, Loader2 } from "lucide-react";

// Kredensial hardcode untuk autentikasi sederhana
const VALID_USERNAME = "admin";
const VALID_PASSWORD = "xplorepinang2026";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulasi delay kecil agar terasa natural
    await new Promise((res) => setTimeout(res, 600));

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      localStorage.setItem("isAuthenticated", "true");
      router.push("/dashboard");
    } else {
      setError("Username atau password salah. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar — branding */}
      <div className="border-b border-gray-100 px-8 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-green-600">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-gray-900">XplorePinang</span>
        <span className="text-gray-300">·</span>
        <span className="text-sm text-gray-400">Admin CMS</span>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Masuk ke Dashboard
            </h1>
            <p className="text-sm text-gray-400">
              Gunakan kredensial admin untuk melanjutkan.
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="flex items-center gap-2 border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full px-0 py-2 border-b border-gray-200 bg-transparent text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-green-600 transition-colors"
              />
            </div>

            {/* Field Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2"
              >
                Password
              </label>
              <div className="relative border-b border-gray-200 focus-within:border-green-600 transition-colors">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-0 py-2 pr-8 bg-transparent text-gray-900 text-sm placeholder-gray-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Tombol Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 text-sm transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Masuk
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100 px-8 py-4">
        <p className="text-xs text-gray-400 text-center">
          &copy; {new Date().getFullYear()} XplorePinang. All rights reserved.
        </p>
      </div>
    </div>
  );
}
