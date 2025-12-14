import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getLoginMode, setLoginMode, type LoginMode } from "../utils/loginMode";
import { User, Shield } from "lucide-react";
// We'll use login from AuthContext via useAuth()

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginModeState] = useState<LoginMode>(getLoginMode());
  // visibility handled by `open` prop; no separate internal visibility state needed
  const navigate = useNavigate();
  const { login } = useAuth();

  // Update login mode when it changes
  const handleModeChange = (mode: LoginMode) => {
    setLoginModeState(mode);
    setLoginMode(mode);
    if (import.meta.env.DEV) {
      console.log(`[AuthModal] Login mode changed to: ${mode}`);
    }
  };

  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setError("");
    }
  }, [open]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      setLoading(false);
      toast.success("Login successful!");
      onClose();
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message);
    }
  };

  if (!open) return null;

  const isAdminMode = loginMode === "admin";

  return (
    <AnimatePresence mode="wait">
      {/* Simple overlay */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}>
        {/* Modal Card */}
        <motion.div
          key={loginMode}
          className={`relative w-full max-w-md mx-4 p-8 rounded-xl ${
            isAdminMode
              ? "bg-slate-900 border border-slate-800"
              : "bg-white border border-gray-200"
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button
            className={`absolute top-4 right-4 text-xl font-light transition-colors ${
              isAdminMode
                ? "text-slate-500 hover:text-slate-300"
                : "text-gray-400 hover:text-gray-600"
            }`}
            onClick={onClose}
            aria-label="Close">
            ×
          </button>

          {/* Header - Simplified */}
          <div className="text-center mb-6">
            {isAdminMode ? (
              <>
                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-3 mx-auto">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-100 mb-1">
                  Admin Login
                </h2>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3 mx-auto">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Sign In
                </h2>
              </>
            )}
          </div>

          {/* Login Mode Toggle - Ultra Minimal */}
          <div className="mb-6">
            <div
              className={`flex gap-1 p-0.5 rounded-lg ${
                isAdminMode ? "bg-slate-800" : "bg-gray-100"
              }`}>
              <button
                type="button"
                onClick={() => handleModeChange("user")}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  loginMode === "user"
                    ? isAdminMode
                      ? "bg-slate-700 text-purple-400"
                      : "bg-white text-purple-600"
                    : isAdminMode
                    ? "text-slate-500 hover:text-slate-300"
                    : "text-gray-600 hover:text-gray-900"
                }`}>
                <User className="w-3 h-3" />
                <span>User</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("admin")}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  loginMode === "admin"
                    ? isAdminMode
                      ? "bg-slate-700 text-blue-400"
                      : "bg-white text-blue-600"
                    : isAdminMode
                    ? "text-slate-500 hover:text-slate-300"
                    : "text-gray-600 hover:text-gray-900"
                }`}>
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label
                className={`block text-xs font-medium mb-1.5 ${
                  isAdminMode ? "text-slate-400" : "text-gray-600"
                }`}>
                Email
              </label>
              <input
                type="email"
                required
                className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                  isAdminMode
                    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
                }`}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label
                className={`block text-xs font-medium mb-1.5 ${
                  isAdminMode ? "text-slate-400" : "text-gray-600"
                }`}>
                Password
              </label>
              <input
                type="password"
                required
                className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                  isAdminMode
                    ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
                }`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div
                className={`text-xs rounded p-2 border ${
                  isAdminMode
                    ? "text-red-400 bg-red-950/20 border-red-800/30"
                    : "text-red-600 bg-red-50 border-red-200"
                }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdminMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;