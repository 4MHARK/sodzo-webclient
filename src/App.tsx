import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
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
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="network"
              element={
                <ProtectedRoute>
                  <Network />
                </ProtectedRoute>
              }
            />
            <Route
              path="calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="emails"
              element={
                <ProtectedRoute>
                  <Emails />
                </ProtectedRoute>
              }
            />
            <Route
              path="storage"
              element={
                <ProtectedRoute>
                  <Storage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="forms/:formId"
              element={
                <ProtectedRoute>
                  <FormRenderer />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
