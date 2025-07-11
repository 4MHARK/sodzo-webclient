import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Storage from './pages/Storage';
import Forms from './pages/Forms';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import Emails from './pages/Emails';
import AdminSettings from './pages/AdminSettings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
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
  );
}

export default App;