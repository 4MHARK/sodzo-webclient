import React, { useState, useEffect } from "react";
import { login } from "../utils/auth";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { loginMock } from "../utils/mockauth";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setError("");
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // const res = await login(email, password, setUser, setToken); // ✅ pass setUser/setToken
      const res = await loginMock(setUser, setToken); // Use mock login for testing
      setLoading(false);
      toast.success("Login successful!");
      onClose();
      navigate("/dashboard");
      // console.log("Logged in user:", res.user);
    } catch (err: any) {
      setLoading(false);
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-30 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full opacity-30 blur-xl"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md mx-4 p-8 overflow-hidden"
          initial={{ scale: 0.8, opacity: 0, y: 50, rotateX: -15 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50, rotateX: -15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}>
          {/* Decorative gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 via-blue-100/50 to-purple-100/50 rounded-3xl -z-10" />

          {/* Close button */}
          <motion.button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors duration-200 z-10"
            onClick={onClose}
            aria-label="Close"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}>
            ×
          </motion.button>

          {/* Header */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}>
            <div className="text-center">
              <motion.div
                className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}>
                <motion.svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5, type: "spring" }}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </motion.svg>
              </motion.div>
              <motion.h2
                className="text-3xl font-bold gradient-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}>
                Welcome Back
              </motion.h2>
              <motion.p
                className="text-gray-500 text-sm mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}>
                Sign in to your account
              </motion.p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            key="login"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
            onSubmit={handleLogin}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Email Address
              </label>
              <motion.input
                type="email"
                required
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400 transition-all duration-200"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Password
              </label>
              <motion.input
                type="password"
                required
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400 transition-all duration-200"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                whileFocus={{ scale: 1.02 }}
              />
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              disabled={loading}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}>
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700"
                initial={{ x: "-100%" }}
                whileHover={{ x: "0%" }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </span>
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}>
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{" "}
              <a
                href="#"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                Privacy Policy
              </a>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;