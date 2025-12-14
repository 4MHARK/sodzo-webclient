import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import MobileHeader from "./MobileHeader";
import BottomNavigation from "./BottomNavigation";
import Sidebar from "./Sidebar";
import MoreDrawer from "../Mobile/MoreDrawer";

export default function MobileLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} showBack={false} />

      {/* Mobile Sidebar (Drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* More Drawer */}
      <MoreDrawer
        isOpen={moreDrawerOpen}
        onClose={() => setMoreDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-20 safe-area-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="min-h-full">
            {/* Content padding - responsive */}
            <div className="p-4 max-w-full">
              <Outlet />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation onMoreClick={() => setMoreDrawerOpen(true)} />
    </div>
  );
}
