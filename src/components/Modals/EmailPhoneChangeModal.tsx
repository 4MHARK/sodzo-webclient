import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, Shield, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

interface EmailPhoneChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "email" | "phone";
  currentValue: string;
  onSuccess: () => void;
}

export default function EmailPhoneChangeModal({
  isOpen,
  onClose,
  type,
  currentValue,
  onSuccess,
}: EmailPhoneChangeModalProps) {
  const { api, logout } = useAuth();
  const [step, setStep] = useState<"password" | "otp" | "newValue">("password");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newValue, setNewValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handlePasswordVerification = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      // Verify password by attempting to refresh token or verify credentials
      // For now, we'll send a request to verify password
      // This endpoint should verify the password before proceeding
      await api.post("/auth/verify-password", { password });

      // If password is verified, request OTP
      await requestOTP();
      setStep("otp");
      setOtpSent(true);
      toast.success(
        `Verification code sent to your ${type === "email" ? "email" : "phone"}`
      );
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
      } else {
        toast.error(err.response?.data?.message || "Invalid password");
      }
    } finally {
      setLoading(false);
    }
  };

  const requestOTP = async () => {
    try {
      // Request OTP to be sent to current email/phone
      await api.post(`/auth/request-${type}-change-otp`, {
        currentValue,
      });
    } catch (err: any) {
      console.error("OTP request failed:", err);
      // Continue anyway - backend should handle this
    }
  };

  const handleOTPVerification = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP
      await api.post("/auth/verify-otp", {
        otp,
        type: type === "email" ? "email_change" : "phone_change",
      });

      setStep("newValue");
      toast.success("Verification successful");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitChange = async () => {
    if (!newValue) {
      toast.error(
        `Please enter your new ${
          type === "email" ? "email address" : "phone number"
        }`
      );
      return;
    }

    // Validate format
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newValue)) {
        toast.error("Please enter a valid email address");
        return;
      }
    } else {
      // Basic phone validation
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(newValue) || newValue.length < 10) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }

    setLoading(true);
    try {
      // Update email/phone
      const endpoint =
        type === "email" ? "/users/change-email" : "/users/change-phone";
      await api.patch(endpoint, {
        [type]: newValue,
        otp, // Include OTP for verification
      });

      toast.success(
        `${type === "email" ? "Email" : "Phone number"} updated successfully!`
      );
      onSuccess();
      handleClose();
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
      } else {
        toast.error(
          err.response?.data?.message ||
            `Failed to update ${type === "email" ? "email" : "phone number"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("password");
    setPassword("");
    setOtp("");
    setNewValue("");
    setShowPassword(false);
    setOtpSent(false);
    setLoading(false);
    onClose();
  };

  const resendOTP = async () => {
    setLoading(true);
    try {
      await requestOTP();
      toast.success("Verification code resent!");
    } catch (err: any) {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    {type === "email" ? (
                      <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Change {type === "email" ? "Email" : "Phone Number"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Secure verification required
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target">
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Security Notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Security Verification
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        For your security, we need to verify your identity
                        before changing your{" "}
                        {type === "email" ? "email" : "phone number"}. You'll
                        need your password and a verification code.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 1: Password Verification */}
                {step === "password" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-target">
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handlePasswordVerification}
                      disabled={loading || !password}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        loading || !password
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}>
                      {loading ? "Verifying..." : "Continue"}
                    </button>
                  </motion.div>
                )}

                {/* Step 2: OTP Verification */}
                {step === "otp" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Verification Code
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        Enter the 6-digit code sent to your{" "}
                        {type === "email" ? "email" : "phone"}
                      </p>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                          setOtp(value);
                        }}
                        placeholder="000000"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center text-2xl font-mono tracking-widest text-base"
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                    {otpSent && (
                      <button
                        onClick={resendOTP}
                        disabled={loading}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        Resend code
                      </button>
                    )}
                    <button
                      onClick={handleOTPVerification}
                      disabled={loading || otp.length !== 6}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        loading || otp.length !== 6
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}>
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>
                  </motion.div>
                )}

                {/* Step 3: New Value */}
                {step === "newValue" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New{" "}
                        {type === "email" ? "Email Address" : "Phone Number"}
                      </label>
                      <input
                        type={type === "email" ? "email" : "tel"}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder={
                          type === "email"
                            ? "newemail@example.com"
                            : "+1 (555) 123-4567"
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Current {type}: {currentValue}
                      </p>
                    </div>
                    <button
                      onClick={handleSubmitChange}
                      disabled={loading || !newValue}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                        loading || !newValue
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}>
                      {loading
                        ? "Updating..."
                        : `Update ${type === "email" ? "Email" : "Phone"}`}
                    </button>
                  </motion.div>
                )}

                {/* Progress Steps */}
                <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {["password", "otp", "newValue"].map((s, index) => (
                    <div
                      key={s}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        step === s
                          ? "bg-blue-600 w-8"
                          : ["password", "otp", "newValue"].indexOf(step) >
                            index
                          ? "bg-blue-400"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
