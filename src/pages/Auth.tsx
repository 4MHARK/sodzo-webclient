import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../components/UI/ThemeToggle";
import { Link } from "react-router-dom";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden px-4 transition-colors">
      {/* Animated Geometric SVG Background */}
      <svg
        className="absolute left-0 top-0 w-full h-full pointer-events-none z-0"
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <motion.polygon
          points="0,0 600,0 0,600"
          fill="#1e3a8a"
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 0.18, y: 0 }}
          transition={{ duration: 1.2 }}
        />
        <motion.circle
          cx="1200"
          cy="200"
          r="180"
          fill="#2563eb"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ delay: 0.3, duration: 1.2 }}
        />
        <motion.rect
          x="900"
          y="600"
          width="400"
          height="400"
          rx="80"
          fill="#0ea5e9"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 0.1, x: 0 }}
          transition={{ delay: 0.5, duration: 1.2 }}
        />
        <motion.polygon
          points="1440,900 900,900 1440,400"
          fill="#1e293b"
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 0.13, y: 0 }}
          transition={{ delay: 0.7, duration: 1.2 }}
        />
        <motion.circle
          cx="300"
          cy="800"
          r="180"
          fill="#0ea5e9"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ delay: 0.9, duration: 1.2 }}
        />
      </svg>

      {/* Navbar */}
      <nav className="relative z-10 w-full max-w-5xl flex items-center justify-between px-4 py-6 mb-8">
        <div className="flex items-center space-x-2">
          <motion.div
            className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="url(#paint0_linear)" />
              <defs>
                <linearGradient
                  id="paint0_linear"
                  x1="2"
                  y1="2"
                  x2="22"
                  y2="22"
                  gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563eb" />
                  <stop offset="1" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
          <span className="text-2xl font-bold text-white tracking-tight">
            BusinessGrow
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Link
            to="/"
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-blue-500 transition">
            Back Home
          </Link>
        </div>
      </nav>

      {/* Auth Card */}
      <motion.div
        className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-900/20 p-8"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7 }}>
        <div className="flex justify-center mb-8">
          <button
            className={`px-6 py-2 rounded-l-lg font-semibold text-lg transition-colors border-b-2 ${
              mode === "login"
                ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white border-blue-400 shadow"
                : "bg-white/10 text-blue-100 border-transparent hover:bg-blue-900/10"
            }`}
            onClick={() => setMode("login")}>
            Login
          </button>
          <button
            className={`px-6 py-2 rounded-r-lg font-semibold text-lg transition-colors border-b-2 ${
              mode === "signup"
                ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white border-blue-400 shadow"
                : "bg-white/10 text-blue-100 border-transparent hover:bg-blue-900/10"
            }`}
            onClick={() => setMode("signup")}>
            Signup
          </button>
        </div>
        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-blue-900/30 rounded-lg bg-black/40 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-blue-200/60"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-blue-900/30 rounded-lg bg-black/40 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-blue-200/60"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-blue-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition">
                Login
              </button>
              <div className="text-center text-sm text-blue-100 mt-4">
                Don't have an account?{" "}
                <span
                  className="text-blue-400 cursor-pointer hover:underline"
                  onClick={() => setMode("signup")}>
                  Sign up
                </span>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4 }}
              className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-blue-900/30 rounded-lg bg-black/40 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-blue-200/60"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-blue-900/30 rounded-lg bg-black/40 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-blue-200/60"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-blue-900/30 rounded-lg bg-black/40 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder:text-blue-200/60"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-blue-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition">
                Sign Up
              </button>
              <div className="text-center text-sm text-blue-100 mt-4">
                Already have an account?{" "}
                <span
                  className="text-blue-400 cursor-pointer hover:underline"
                  onClick={() => setMode("login")}>
                  Login
                </span>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
