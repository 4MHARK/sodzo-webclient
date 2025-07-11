import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Key, 
  Globe, 
  Mail, 
  MessageSquare, 
  Phone, 
  Smartphone,
  Server,
  Database,
  Webhook,
  Eye,
  EyeOff,
  Save,
  TestTube,
  AlertTriangle,
  CheckCircle,
  Copy,
  RefreshCw,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';

interface ApiConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  enabled: boolean;
  lastTested?: Date;
  status: 'active' | 'inactive' | 'error';
}

interface CommunicationConfig {
  id: string;
  platform: string;
  icon: React.ReactNode;
  enabled: boolean;
  config: Record<string, any>;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('api-keys');
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [testingApi, setTestingApi] = useState<string | null>(null);

  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([
    {
      id: '1',
      name: 'OpenAI API',
      endpoint: 'https://api.openai.com/v1',
      apiKey: 'sk-proj-1234567890abcdef',
      enabled: true,
      lastTested: new Date(),
      status: 'active'
    },
    {
      id: '2',
      name: 'Stripe API',
      endpoint: 'https://api.stripe.com/v1',
      apiKey: 'sk_live_1234567890abcdef',
      enabled: true,
      lastTested: new Date(Date.now() - 86400000),
      status: 'active'
    },
    {
      id: '3',
      name: 'SendGrid API',
      endpoint: 'https://api.sendgrid.com/v3',
      apiKey: 'SG.1234567890abcdef',
      enabled: false,
      status: 'inactive'
    }
  ]);

  const [communicationConfigs, setCommunicationConfigs] = useState<CommunicationConfig[]>([
    {
      id: 'email',
      platform: 'Email (SMTP)',
      icon: <Mail className="w-5 h-5" />,
      enabled: true,
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        username: 'admin@businessgrow.com',
        password: '••••••••••••',
        encryption: 'TLS'
      }
    },
    {
      id: 'whatsapp',
      platform: 'WhatsApp Business',
      icon: <MessageSquare className="w-5 h-5" />,
      enabled: false,
      config: {
        phoneNumberId: '',
        accessToken: '',
        webhookVerifyToken: '',
        businessAccountId: ''
      }
    },
    {
      id: 'telegram',
      platform: 'Telegram Bot',
      icon: <Phone className="w-5 h-5" />,
      enabled: false,
      config: {
        botToken: '',
        chatId: '',
        webhookUrl: ''
      }
    },
    {
      id: 'sms',
      platform: 'SMS (Twilio)',
      icon: <Smartphone className="w-5 h-5" />,
      enabled: false,
      config: {
        accountSid: '',
        authToken: '',
        fromNumber: '',
        webhookUrl: ''
      }
    }
  ]);

  const [webhookConfigs, setWebhookConfigs] = useState([
    {
      id: '1',
      name: 'Form Submissions',
      url: 'https://api.businessgrow.com/webhooks/forms',
      events: ['form.submitted', 'form.updated'],
      enabled: true,
      secret: 'whsec_1234567890abcdef'
    },
    {
      id: '2',
      name: 'Payment Events',
      url: 'https://api.businessgrow.com/webhooks/payments',
      events: ['payment.succeeded', 'payment.failed'],
      enabled: true,
      secret: 'whsec_abcdef1234567890'
    }
  ]);

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const testApiConnection = async (id: string) => {
    setTestingApi(id);
    // Simulate API test
    setTimeout(() => {
      setApiConfigs(prev => prev.map(api => 
        api.id === id 
          ? { ...api, lastTested: new Date(), status: 'active' }
          : api
      ));
      setTestingApi(null);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateNewApiKey = (id: string) => {
    const newKey = 'sk-proj-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiConfigs(prev => prev.map(api => 
      api.id === id ? { ...api, apiKey: newKey } : api
    ));
  };

  const tabs = [
    { id: 'api-keys', name: 'API Keys', icon: Key },
    { id: 'communications', name: 'Communications', icon: MessageSquare },
    { id: 'webhooks', name: 'Webhooks', icon: Webhook },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  const renderApiKeysTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Configuration</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage external API integrations and endpoints</p>
        </div>
        <motion.button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Add New API
        </motion.button>
      </div>

      <div className="space-y-4">
        {apiConfigs.map((api) => (
          <motion.div
            key={api.id}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  api.status === 'active' ? 'bg-green-100 dark:bg-green-900/20' :
                  api.status === 'error' ? 'bg-red-100 dark:bg-red-900/20' :
                  'bg-gray-100 dark:bg-gray-600'
                }`}>
                  <Server className={`w-5 h-5 ${
                    api.status === 'active' ? 'text-green-600 dark:text-green-400' :
                    api.status === 'error' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{api.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{api.endpoint}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  api.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                  api.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                }`}>
                  {api.status}
                </div>
                <button
                  onClick={() => setApiConfigs(prev => prev.map(a => 
                    a.id === api.id ? { ...a, enabled: !a.enabled } : a
                  ))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    api.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    api.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  value={api.endpoint}
                  onChange={(e) => setApiConfigs(prev => prev.map(a => 
                    a.id === api.id ? { ...a, endpoint: e.target.value } : a
                  ))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKeys[api.id] ? 'text' : 'password'}
                      value={api.apiKey}
                      onChange={(e) => setApiConfigs(prev => prev.map(a => 
                        a.id === api.id ? { ...a, apiKey: e.target.value } : a
                      ))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => toggleApiKeyVisibility(api.id)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKeys[api.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <motion.button
                    onClick={() => copyToClipboard(api.apiKey)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </motion.button>
                  <motion.button
                    onClick={() => generateNewApiKey(api.id)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {api.lastTested ? (
                  <span>Last tested: {api.lastTested.toLocaleString()}</span>
                ) : (
                  <span>Never tested</span>
                )}
              </div>
              <motion.button
                onClick={() => testApiConnection(api.id)}
                disabled={testingApi === api.id}
                className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {testingApi === api.id ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderCommunicationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Communication Channels</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure email, SMS, WhatsApp, and other messaging platforms</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {communicationConfigs.map((comm) => (
          <motion.div
            key={comm.id}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  {comm.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{comm.platform}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {comm.enabled ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCommunicationConfigs(prev => prev.map(c => 
                  c.id === comm.id ? { ...c, enabled: !c.enabled } : c
                ))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  comm.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  comm.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(comm.config).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type={key.toLowerCase().includes('password') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret') ? 'password' : 'text'}
                    value={value}
                    onChange={(e) => setCommunicationConfigs(prev => prev.map(c => 
                      c.id === comm.id 
                        ? { ...c, config: { ...c.config, [key]: e.target.value } }
                        : c
                    ))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter ${key.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <motion.button
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Test Configuration
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderWebhooksTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Webhook Configuration</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage webhook endpoints for real-time notifications</p>
        </div>
        <motion.button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Add Webhook
        </motion.button>
      </div>

      <div className="space-y-4">
        {webhookConfigs.map((webhook) => (
          <motion.div
            key={webhook.id}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Webhook className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{webhook.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{webhook.url}</p>
                </div>
              </div>
              <button
                onClick={() => setWebhookConfigs(prev => prev.map(w => 
                  w.id === webhook.id ? { ...w, enabled: !w.enabled } : w
                ))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  webhook.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  webhook.enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhook.url}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secret Key
                </label>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    value={webhook.secret}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <motion.button
                    onClick={() => copyToClipboard(webhook.secret)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Events
              </label>
              <div className="flex flex-wrap gap-2">
                {webhook.events.map((event) => (
                  <span
                    key={event}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderDatabaseTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Database Configuration</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage database connections and settings</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Database Host
            </label>
            <input
              type="text"
              defaultValue="localhost"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Port
            </label>
            <input
              type="number"
              defaultValue="5432"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Database Name
            </label>
            <input
              type="text"
              defaultValue="businessgrow"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              defaultValue="admin"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              defaultValue="••••••••••••"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <motion.button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Test Connection
          </motion.button>
          <motion.button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Backup Database
          </motion.button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure security policies and access controls</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Access Control</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">Require 2FA for admin access</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">IP Whitelist</h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">Restrict access to specific IP addresses</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-600">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">Session Timeout</h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">Auto-logout after inactivity</p>
              </div>
              <select className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>2 hours</option>
                <option>Never</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">API Security</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate Limiting (requests per minute)
              </label>
              <input
                type="number"
                defaultValue="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CORS Origins (comma-separated)
              </label>
              <input
                type="text"
                defaultValue="https://businessgrow.com, https://app.businessgrow.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Configure system integrations and security settings</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-full text-sm font-medium">
            Admin Only
          </div>
        </div>
      </motion.div>

      {/* Warning Banner */}
      <motion.div 
        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Sensitive Configuration Area
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Changes made here affect the entire system. Please ensure you have proper backups before making modifications.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className="w-4 h-4 mr-3" />
                  {tab.name}
                </motion.button>
              ))}
            </nav>
          </motion.div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {activeTab === 'api-keys' && renderApiKeysTab()}
            {activeTab === 'communications' && renderCommunicationsTab()}
            {activeTab === 'webhooks' && renderWebhooksTab()}
            {activeTab === 'database' && renderDatabaseTab()}
            {activeTab === 'security' && renderSecurityTab()}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last saved: {new Date().toLocaleString()}
                </p>
                <motion.button 
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save All Changes
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}