import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Save,
  Copy,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  saveApiKey,
  getApiKey,
  updateApiKeyCache,
  getAllApiKeys,
} from "../utils/apiKeyStorage";

export default function AdminSettings() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load API key from IndexedDB on mount
  useEffect(() => {
    const loadApiKey = async () => {
      setLoading(true);
      try {
        const stored = await getApiKey();
        if (stored) {
          setApiKey(stored);
          updateApiKeyCache(stored); // Update sync cache
        }
      } catch (error) {
        console.error("Failed to load API key:", error);
      } finally {
        setLoading(false);
      }
    };

    loadApiKey();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setSaving(true);
    try {
      await saveApiKey(apiKey.trim(), "Admin Configured", "production");
      updateApiKeyCache(apiKey.trim()); // Update sync cache immediately
      setSaved(true);
      toast.success(
        "API key saved to database! It will persist across all sessions and can sync with server."
      );

      // Reset saved indicator after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to save API key";
      toast.error(errorMessage);
      console.error("Failed to save API key:", error);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (!apiKey) {
      toast.error("No API key to copy");
      return;
    }
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Configure system integrations and security settings
            </p>
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
        transition={{ delay: 0.1 }}>
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Sensitive Configuration Area
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Changes made here affect the entire system. Please ensure you have
              proper backups before making modifications.
            </p>
          </div>
        </div>
      </motion.div>

      {/* API Key Configuration */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}>
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Global API Key
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This API key is stored securely in IndexedDB and will persist
                  across all sessions. Can sync with server for cross-device
                  access.
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Loading from database...
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setSaved(false);
                    }}
                    placeholder="Enter your API key"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {showApiKey ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <motion.button
                  type="button"
                  onClick={copyToClipboard}
                  disabled={!apiKey}
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}>
                  <Copy className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                The API key is stored securely in IndexedDB (browser database)
                and will persist permanently. Can sync with server on login for
                cross-device access.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                {saved && (
                  <motion.div
                    className="flex items-center space-x-2 text-green-600 dark:text-green-400"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}>
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Saved successfully
                    </span>
                  </motion.div>
                )}
              </div>
              <motion.button
                onClick={handleSave}
                disabled={saving || !apiKey.trim()}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                whileHover={{ scale: saving ? 1 : 1.05 }}
                whileTap={{ scale: saving ? 1 : 0.95 }}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save API Key
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
