import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from "react";
import Layout from './components/Layout/Layout';
import { Toaster } from "react-hot-toast";
import { AuthProvider } from '../src/contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import Dashboard from './pages/Dashboard';
import Storage from "./pages/Storage";
import Projects from "./pages/Projects";
import FormRenderer from "./pages/FormRenderer";
import Settings from "./pages/Settings";
import Emails from "./pages/Emails";
import AdminSettings from "./pages/AdminSettings";
import Landing from "./pages/Landing";
import Network from "./pages/Network";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import { initializeDatabase } from "./utils/dbService";
import { getApiKey, updateApiKeyCache } from "./utils/apiKeyStorage";

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database on app startup
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();

        // Load API key into cache for immediate use
        const apiKey = await getApiKey();
        if (apiKey) {
          updateApiKeyCache(apiKey);
        }

        setDbInitialized(true);
      } catch (error) {
        console.error("[App] Failed to initialize database:", error);
        // Continue anyway - app can work without database
        setDbInitialized(true);
      }
    };

    init();
  }, []);

  // Show loading state while database initializes
  if (!dbInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Initializing database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <AuthProvider>
        <UserProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/landing" element={<Landing />} />
              <Route
                path="/about"
                element={
                  <div className="flex items-center justify-center min-h-screen text-3xl font-bold">
                    About Page (Coming Soon)
                  </div>
                }
              />
              <Route
                path="/policy"
                element={
                  <div className="flex items-center justify-center min-h-screen text-3xl font-bold">
                    Policy Page (Coming Soon)
                  </div>
                }
              />

              {/* Protected app routes under Layout */}
              <Route path="/" element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="network" element={<Network />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="emails" element={<Emails />} />
                <Route path="storage" element={<Storage />} />
                <Route path="reports" element={<Reports />} />
                <Route path="forms/:formId" element={<FormRenderer />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<AdminSettings />} />
              </Route>
            </Routes>
          </Router>
        </UserProvider>
      </AuthProvider>
    </>
  );
}

export default App;