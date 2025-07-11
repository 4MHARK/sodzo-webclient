import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../components/UI/ThemeToggle";

const avatars = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/45.jpg",
  "https://randomuser.me/api/portraits/women/46.jpg",
];

const partnerLogos = [
  {
    name: "The New School",
    src: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Logo_placeholder.png",
  },
  {
    name: "freeda",
    src: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Bitmap_Logo.png",
  },
  {
    name: "Frankfurt School",
    src: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Meet_logo.png",
  },
  {
    name: "Harvard Business School",
    src: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Png_logo.png",
  },
  {
    name: "BSE",
    src: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Logo_placeholder.png",
  },
];

function AuthModal({ open, onClose, initialTab = "login" }) {
  const [mode, setMode] = useState(initialTab);
  React.useEffect(() => {
    if (open) setMode(initialTab);
  }, [open, initialTab]);
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}>
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 p-8"
          initial={{ scale: 0.95, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}>
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl font-bold"
            onClick={onClose}
            aria-label="Close">
            ×
          </button>
          <div className="flex justify-center mb-8">
            <button
              className={`px-6 py-2 rounded-l-lg font-semibold text-lg transition-colors border-b-2 ${
                mode === "login"
                  ? "bg-black text-white border-black shadow"
                  : "bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200"
              }`}
              onClick={() => setMode("login")}>
              Login
            </button>
            <button
              className={`px-6 py-2 rounded-r-lg font-semibold text-lg transition-colors border-b-2 ${
                mode === "signup"
                  ? "bg-black text-white border-black shadow"
                  : "bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white rounded-lg font-semibold text-lg shadow hover:bg-gray-800 transition">
                  Login
                </button>
                <div className="text-center text-sm text-gray-500 mt-4">
                  Don't have an account?{" "}
                  <span
                    className="text-black cursor-pointer hover:underline"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-black text-white rounded-lg font-semibold text-lg shadow hover:bg-gray-800 transition">
                  Sign Up
                </button>
                <div className="text-center text-sm text-gray-500 mt-4">
                  Already have an account?{" "}
                  <span
                    className="text-black cursor-pointer hover:underline"
                    onClick={() => setMode("login")}>
                    Login
                  </span>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  return (
    <div className="min-h-screen bg-[#f5f6fa] w-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* SVG Dotted Lines */}
      <svg
        className="absolute left-0 top-0 w-full h-full pointer-events-none z-0"
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M40 40 Q 200 100 400 40"
          stroke="#bbb"
          strokeWidth="2"
          strokeDasharray="8 8"
          fill="none"
        />
        <path
          d="M1200 860 Q 900 800 600 860"
          stroke="#bbb"
          strokeWidth="2"
          strokeDasharray="8 8"
          fill="none"
        />
      </svg>

      {/* Full-width Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-12 py-8 md:py-12">
        {/* Navbar */}
        <nav className="flex items-center justify-between w-full mb-8">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold flex items-center gap-2">
              <span className="inline-block w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-bold">
                E
              </span>{" "}
              EduConnect
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-gray-700 font-medium">
            <a href="#" className="hover:text-black transition">
              Home
            </a>
            <a href="#" className="hover:text-black transition">
              Features
            </a>
            <a href="#" className="hover:text-black transition">
              Pricing
            </a>
            <a href="#" className="hover:text-black transition">
              Reviews
            </a>
            <a href="#" className="hover:text-black transition">
              Contact us
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => {
                setAuthTab("login");
                setAuthOpen(true);
              }}
              className="text-gray-700 hover:text-black font-medium transition border-r pr-4 hidden md:inline-block">
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthTab("signup");
                setAuthOpen(true);
              }}
              className="px-5 py-2 bg-black text-white rounded-xl font-semibold shadow hover:bg-gray-800 transition">
              Sign Up
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center py-8">
          {/* Avatars and names */}
          <div className="flex items-center justify-center mb-4 gap-1">
            {avatars.map((src, i) => (
              <img
                key={src}
                src={src}
                alt="User avatar"
                className="w-8 h-8 rounded-full border-2 border-white -ml-2 first:ml-0 shadow"
                style={{ zIndex: 10 - i }}
              />
            ))}
            <span className="ml-2 text-xs text-gray-500">
              Alex, Taylor, Jordan, Casey{" "}
              <span className="font-semibold">+12 others</span>
            </span>
          </div>
          <motion.h1
            className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}>
            Effortless Parent-Teacher
            <br />
            Communication, Anytime, Anywhere
          </motion.h1>
          <motion.p
            className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}>
            Bridge the gap between home and school with real-time updates,
            progress tracking, and easy access to your child’s educational
            journey.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
            <button
              onClick={() => {
                setAuthTab("signup");
                setAuthOpen(true);
              }}
              className="px-7 py-3 bg-black text-white rounded-xl font-semibold text-lg shadow hover:bg-gray-800 transition flex items-center gap-2">
              Get Started for Free <span className="text-xl">→</span>
            </button>
            <button
              onClick={() => {
                setAuthTab("login");
                setAuthOpen(true);
              }}
              className="px-7 py-3 border border-black rounded-xl font-semibold text-lg hover:bg-gray-100 transition">
              Learn More
            </button>
          </div>
        </section>

        {/* Partners Section */}
        <section className="mt-6">
          <div className="text-center text-xs font-bold text-gray-700 mb-4 tracking-widest">
            PARTNERS SCHOOLS
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {partnerLogos.map((logo) => (
              <img
                key={logo.name}
                src={logo.src}
                alt={logo.name}
                className="h-10 w-auto grayscale opacity-90 hover:opacity-100 transition"
              />
            ))}
          </div>
        </section>
      </div>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab={authTab}
      />
    </div>
  );
}
