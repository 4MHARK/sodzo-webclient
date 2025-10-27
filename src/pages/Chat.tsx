import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, Users, Hash, Plus } from 'lucide-react';
import { mockProjects, mockChatMessages } from '../data/mockData';
import { getAvatarUrl } from "../utils/env";

export default function Chat() {
  const [selectedProject, setSelectedProject] = useState(mockProjects[0]);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(mockChatMessages);

  const projectMessages = messages.filter(msg => msg.projectId === selectedProject.id);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      userId: '1',
      userName: 'Sarah Johnson',
      message: newMessage,
      timestamp: new Date(),
      projectId: selectedProject.id
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <motion.div
      className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}>
      {/* Sidebar */}
      <motion.div
        className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Projects
            </h2>
            <motion.button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}>
              <Plus className="w-4 h-4 text-gray-500" />
            </motion.button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto">
          {mockProjects.map((project, index) => (
            <motion.button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                selectedProject.id === project.id
                  ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                  : ""
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ x: 5 }}>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Hash className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {project.team.length} members
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Online Users */}
        <motion.div
          className="p-4 border-t border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Online Team Members
          </h3>
          <div className="space-y-2">
            {selectedProject.team.slice(0, 3).map((member, index) => (
              <motion.div
                key={member.id}
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}>
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Chat Area */}
      <motion.div
        className="flex-1 flex flex-col"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}>
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg"
                whileHover={{ rotate: 5 }}>
                <Hash className="w-5 h-5 text-blue-600" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedProject.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedProject.team.length} members
                </p>
              </div>
            </div>
            <motion.button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}>
              <Users className="w-5 h-5 text-gray-500" />
            </motion.button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          <AnimatePresence>
            {projectMessages.map((message, index) => (
              <motion.div
                key={message.id}
                className="flex items-start space-x-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}>
                <>
                  <motion.img
                    src={getAvatarUrl()}
                    alt={message.userName}
                    className="w-10 h-10 rounded-full"
                    whileHover={{ scale: 1.1 }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {message.userName}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <motion.div
                      className="mt-1 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {message.message}
                      </p>
                    </motion.div>
                  </div>
                </>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Message Input */}
        <motion.div
          className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}>
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1">
              <motion.input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${selectedProject.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                whileFocus={{ scale: 1.02 }}
              />
            </div>
            <motion.button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!newMessage.trim()}>
              <Send className="w-5 h-5" />
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}