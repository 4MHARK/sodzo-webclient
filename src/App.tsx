import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { Toaster } from "react-hot-toast";
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Storage from './pages/Storage';
import Forms from './pages/Forms';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Emails from './pages/Emails';
import AdminSettings from './pages/AdminSettings';
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

function App() {
  return (
    <>
    {/* <Toaster position="top-right" /> */}
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
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
          <Route path="emails" element={<Emails />} />
          <Route path="storage" element={<Storage />} />
          <Route path="forms" element={<Forms />} />
          <Route path="projects" element={<Projects />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<AdminSettings />} />
        </Route>
      </Routes>
    </Router>
    </>
  );
}

export default App;