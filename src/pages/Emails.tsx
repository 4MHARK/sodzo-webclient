import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Search, 
  Star, 
  Archive, 
  Trash2, 
  MoreVertical, 
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter
} from 'lucide-react';
import { mockEmails } from '../data/mockData';
import { EmailMessage } from '../types';

export default function Emails() {
  const [emails, setEmails] = useState(mockEmails);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.preview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || email.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const unreadCount = emails.filter(email => !email.read).length;
  const starredCount = emails.filter(email => email.starred).length;

  const markAsRead = (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, read: true } : email
    ));
  };

  const toggleStar = (emailId: string) => {
    setEmails(prev => prev.map(email => 
      email.id === emailId ? { ...email, starred: !email.starred } : email
    ));
  };

  const deleteEmail = (emailId: string) => {
    setEmails(prev => prev.filter(email => email.id !== emailId));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'project':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'form':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'notification':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Email List Sidebar */}
      <motion.div 
        className={`${selectedEmail ? 'hidden lg:block' : 'block'} w-full lg:w-96 border-r border-gray-200 dark:border-gray-700 flex flex-col`}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Mail className="w-6 h-6 mr-2 text-blue-600" />
              Email Center
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {unreadCount} unread
              </span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
            >
              <option value="all">All Categories</option>
              <option value="system">System</option>
              <option value="project">Projects</option>
              <option value="form">Forms</option>
              <option value="notification">Notifications</option>
            </select>
            <motion.button 
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter className="w-4 h-4 text-gray-500" />
            </motion.button>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {filteredEmails.map((email, index) => (
              <motion.div
                key={email.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedEmail?.id === email.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                } ${!email.read ? 'bg-blue-25 dark:bg-blue-950/10' : ''}`}
                onClick={() => {
                  setSelectedEmail(email);
                  markAsRead(email.id);
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 5 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      {getPriorityIcon(email.priority)}
                      {!email.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <span className={`text-sm truncate ${!email.read ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                      {email.from}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(email.id);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Star className={`w-4 h-4 ${email.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    </motion.button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {email.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <h3 className={`text-sm mb-1 truncate ${!email.read ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-800 dark:text-gray-200'}`}>
                  {email.subject}
                </h3>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
                  {email.preview}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(email.category)}`}>
                    {email.category}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {email.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Email Content */}
      <motion.div 
        className={`${selectedEmail ? 'block' : 'hidden lg:block'} flex-1 flex flex-col`}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <motion.button
                  onClick={() => setSelectedEmail(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </motion.button>
                
                <div className="flex items-center space-x-3">
                  <motion.button
                    onClick={() => toggleStar(selectedEmail.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Star className={`w-5 h-5 ${selectedEmail.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </motion.button>
                  <motion.button
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Archive className="w-5 h-5 text-gray-500" />
                  </motion.button>
                  <motion.button
                    onClick={() => deleteEmail(selectedEmail.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-5 h-5 text-gray-500" />
                  </motion.button>
                  <motion.button
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {selectedEmail.subject}
                </h1>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {selectedEmail.from.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedEmail.from}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedEmail.fromEmail}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedEmail.timestamp.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getPriorityIcon(selectedEmail.priority)}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedEmail.category)}`}>
                        {selectedEmail.category}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Email Content */}
            <motion.div 
              className="flex-1 overflow-y-auto p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div 
                className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
              />
            </motion.div>
            
            {/* Reply Section */}
            <motion.div 
              className="p-6 border-t border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex space-x-3">
                <motion.button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reply
                </motion.button>
                <motion.button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Forward
                </motion.button>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Mail className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Email Selected
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Select an email from the list to view its content
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}