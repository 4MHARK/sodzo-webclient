import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Cloud, FileText, Settings, Home, Mail, ShieldCheck } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { mockUser } from '../../data/mockData';


const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Email Center', href: '/emails', icon: Mail },
  { name: 'Cloud Storage', href: '/storage', icon: Cloud },
  { name: 'Forms', href: '/forms', icon: FileText },
  // { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin', href: '/admin', icon: ShieldCheck, ownerOnly: true},
];

// const futureFeatures = [
//   { name: 'Notifications', href: '/notifications', icon: Bell },
//   { name: 'Analytics', href: '/analytics', icon: BarChart3 },
//   { name: 'Access Control', href: '/access', icon: Shield },
//   { name: 'Advanced Reports', href: '/reports', icon: TrendingUp },
// ];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' }
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.div 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors
          lg:relative lg:translate-x-0 lg:z-0
        `}
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
<motion.div 
  className="flex items-center px-10 h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
  <div className="flex items-center space-x-2">
    {/* Logo Container */}
      <motion.div 
        className="rounded-lg flex items-center justify-center"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <img 
          src="/logo.png" 
          alt="Sword of the Spirit Ministries Logo" 
          className="w-auto h-12 object-cover"
        />
      </motion.div>
      
      {/* Ministry Name */}
      <span className="text-sm md:text-sm font-bold text-gray-900 dark:text-white tracking-wide">
        Sword of the Spirit Ministries
      </span>
    </div>
    </motion.div>


          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 bg-white dark:bg-gray-800">
            <div className="space-y-1">
              {navigation.map((item, index) => {
                // TEMPORARY: show ownerOnly (Admin) items regardless of isSuper until privileges are granted
                // TODO: revert this gating once admin privileges are restored by senior dev
                // if (item.ownerOnly) {
                //   ... gating logic removed intentionally
                // }

                const isActive = location.pathname === item.href;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Link
                      to={item.href}
                      className={`
                        flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                        }
                      `}
                      onClick={onClose}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                      </motion.div>
                      {item.name}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Future Features
            <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="px-3 mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Coming Soon
                </p>
              </div>
              <div className="space-y-1">
                {futureFeatures.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </motion.div>
                ))}
              </div>
            </div> */}
          </nav>

          {/* User Profile */}
          <motion.div 
            className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* <div className="flex items-center space-x-3">
              <img
                src={user?.avatar || "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1"}
                alt={`${user?.firstname} ${user?.lastname}`}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.firstname} {user?.lastname}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.roles?.[0] || 'Project Manager'}
                </p>
              </div>
            </div> */}
            <div className="flex items-center space-x-3">
              <img
                src={user?.avatar || authUser?.avatarUrl || mockUser[0]?.avatar || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'}
                alt={`${user ? `${user.firstname} ${user.lastname}` : authUser ? authUser.name ?? 'User' : `${mockUser[0]?.firstname} ${mockUser[0]?.lastname}`}`}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user ? `${user.firstname} ${user.lastname}` : authUser ? authUser.name ?? 'User' : `${mockUser[0]?.firstname} ${mockUser[0]?.lastname}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.roles?.[0] || (Array.isArray(authUser?.metadata?.roles) ? String(authUser?.metadata?.roles[0]) : mockUser[0]?.roles?.[0] || 'Project Manager')}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </>
  );
}