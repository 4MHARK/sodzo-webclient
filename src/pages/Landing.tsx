import { useState } from "react";
import { motion } from "framer-motion";
import AuthModal from "../components/AuthModal";
import ThemeToggle from "../components/UI/ThemeToggle";

const avatars = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/45.jpg",
  "https://randomuser.me/api/portraits/women/46.jpg",
];

export default function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");

  return (
    <div className="min-h-screen w-full flex flex-col justify-center relative overflow-hidden">
      {/* Full-width Content */}
      <div className="relative z-10 w-full min-h-screen max-w-7xl mx-auto px-4 md:px-12 py-8 md:py-12">
        {/* Navbar */}
        <nav className="flex items-center justify-between w-full mb-8 relative">
          {/* Left side (empty spacer for balance) */}
          <div className="flex-1"></div>

          {/* Logo centered */}
          <div className="flex flex-col items-center space-x-3">
            <img
              src="/logo.png" // <-- replace with your logo path
              alt="Sword of the Spirit Ministries Logo"
              className="h-20 w-auto"
            />
            <p className="text-base font-semibold text-gray-800">
              Sword of the Spirit Ministries
            </p>
          </div>
          

          {/* Right side */}
          <div className="flex items-center space-x-4 flex-1 justify-end">
            {/* <ThemeToggle /> */}
            {/* <button
              onClick={() => {
                setAuthTab("signup");
                setAuthOpen(true);
              }}
              className="px-5 py-2 bg-purple-800 text-white rounded-xl font-semibold shadow hover:bg-purple-900 transition"
            >
              Login
            </button> */}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="h-full flex flex-col items-center justify-center text-center py-8">
          {/* Avatars and team */}
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
              Believers, Ministers, Departments{" "}
              <span className="font-semibold">+20 others</span>
            </span>
          </div>

          {/* <div className="mb-6">
            <img
              src="/logo.png"
              alt="Sword of the Spirit Ministries Logo"
              className="h-40 w-auto mx-auto "
            />
          </div> */}

          <motion.h1
            className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight text-purple-900"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Empowered by the Word. <br />
            Led by the Spirit.
          </motion.h1>

          

          <motion.p
            className="text-gray-700 text-lg mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            Welcome to Sword of the Spirit Ministries’ submission portal — securely submit your data, stay organized, and support the work of the ministry.
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
            <button
              onClick={() => {
                setAuthTab("signup");
                setAuthOpen(true);
              }}
              className="px-7 py-3 bg-yellow-500 text-white rounded-xl font-semibold text-lg shadow hover:bg-yellow-600 transition flex items-center gap-2"
            >
              Login <span className="text-xl">→</span>
            </button>
            {/* <button
              onClick={() => {
                setAuthTab("login");
                setAuthOpen(true);
              }}
              className="px-7 py-3 border border-purple-800 text-purple-800 rounded-xl font-semibold text-lg hover:bg-purple-50 transition"
            >
              Give / Partner
            </button> */}
          </div>
        </section>
      </div>

      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
