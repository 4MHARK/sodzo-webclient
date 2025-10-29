import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import {
  DataProvider,
  IntelligentUserProvider,
  IntelligentUserProfileProvider,
  IntelligentNodeProvider,
  IntelligentNodeProfileProvider,
  IntelligentProjectFormProvider,
  IntelligentStorageProvider,
  IntelligentInmailProvider,
} from "./contexts/IntelligentContexts";
import RequireAuth, { AuthErrorBoundary } from "./components/RequireAuth";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Storage from "./pages/Storage";
import Forms from "./pages/Forms";
import Projects from "./pages/Projects";
import Calendar from "./pages/Calendar";
import FormRenderer from "./pages/FormRenderer";
import Settings from "./pages/Settings";
import Emails from "./pages/Emails";
import AdminSettings from "./pages/AdminSettings";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import DataManagementTest from "./pages/DataManagementTest";

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <AuthErrorBoundary>
        <DataProvider>
          <AuthProvider>
            <IntelligentUserProvider>
              <IntelligentUserProfileProvider>
                <IntelligentNodeProvider>
                  <IntelligentNodeProfileProvider>
                    <IntelligentProjectFormProvider>
                      <IntelligentStorageProvider>
                        <IntelligentInmailProvider>
                          <UserProvider>
                            <Router>
                              <Routes>
                                {/* Public routes */}
                                <Route path="/" element={<Landing />} />
                                <Route path="/landing" element={<Landing />} />
                                <Route path="/auth" element={<Auth />} />
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
                                <Route
                                  path="/"
                                  element={
                                    <RequireAuth>
                                      <Layout />
                                    </RequireAuth>
                                  }>
                                  <Route
                                    path="dashboard"
                                    element={<Dashboard />}
                                  />
                                  <Route path="chat" element={<Chat />} />
                                  <Route
                                    path="calendar"
                                    element={<Calendar />}
                                  />
                                  <Route path="emails" element={<Emails />} />
                                  <Route path="storage" element={<Storage />} />
                                  <Route path="forms" element={<Forms />} />
                                  <Route
                                    path="projects"
                                    element={<Projects />}
                                  />
                                  <Route
                                    path="forms/:formId"
                                    element={<FormRenderer />}
                                  />
                                  <Route
                                    path="settings"
                                    element={<Settings />}
                                  />
                                  <Route
                                    path="admin"
                                    element={<AdminSettings />}
                                  />
                                  <Route
                                    path="data-test"
                                    element={<DataManagementTest />}
                                  />
                                </Route>
                              </Routes>
                            </Router>
                          </UserProvider>
                        </IntelligentInmailProvider>
                      </IntelligentStorageProvider>
                    </IntelligentProjectFormProvider>
                  </IntelligentNodeProfileProvider>
                </IntelligentNodeProvider>
              </IntelligentUserProfileProvider>
            </IntelligentUserProvider>
          </AuthProvider>
        </DataProvider>
      </AuthErrorBoundary>
    </>
  );
}

export default App;
