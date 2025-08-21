import React, { useState, useEffect } from "react";
import {
  Factory,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, LanguageToggle } from "../../context/LanguageContext";

const LoginScreen = ({ onLoginSuccess }) => {
  // Contexts
  const { login, isLoading, error, clearError, loginAttempts } = useAuth();
  const { t, currentLanguage, formatTime } = useLanguage();

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo credentials state
  const [showDemoCredentials, setShowDemoCredentials] = useState(true);

  // Clear errors when form changes
  useEffect(() => {
    if (error) {
      clearError();
    }
    setValidationErrors({});
  }, [formData, clearError, error]);

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = t("required");
    } else if (formData.username.length < 3) {
      errors.username =
        currentLanguage === "np"
          ? "कम्तीमा ३ अक्षर चाहिन्छ"
          : "Minimum 3 characters required";
    }

    if (!formData.password) {
      errors.password = t("required");
    } else if (formData.password.length < 6) {
      errors.password =
        currentLanguage === "np"
          ? "कम्तीमा ६ अक्षर चाहिन्छ"
          : "Minimum 6 characters required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (loginAttempts >= 5) {
      setValidationErrors({
        general:
          currentLanguage === "np"
            ? "धेरै गलत प्रयासहरू। केही समय पछि प्रयास गर्नुहोस्।"
            : "Too many failed attempts. Please try again later.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(formData);

      if (result.success) {
        setSuccessMessage(t("loginSuccess"));

        // Call success callback after a short delay
        setTimeout(() => {
          onLoginSuccess && onLoginSuccess(result);
        }, 1000);
      }
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fill demo credentials
  const fillDemoCredentials = (type) => {
    const credentials = {
      operator: { username: "ram.singh", password: "password123" },
      supervisor: { username: "supervisor", password: "super123" },
      management: { username: "management", password: "mgmt123" },
    };

    const cred = credentials[type];
    if (cred) {
      setFormData((prev) => ({
        ...prev,
        username: cred.username,
        password: cred.password,
      }));
    }
  };

  // Loading state
  if (isLoading && isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {t("pleaseWait")}
          </h2>
          <p className="text-gray-600">
            {currentLanguage === "np"
              ? "लगइन प्रक्रिया चलिरहेको छ..."
              : "Authenticating..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Factory className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t("appTitle")}
          </h1>
          <p className="text-gray-600 mb-4">{t("subtitle")}</p>

          {/* Language Toggle */}
          <div className="flex justify-center">
            <LanguageToggle />
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-green-800 text-sm">{successMessage}</span>
          </div>
        )}

        {/* Error Messages */}
        {(error || validationErrors.general) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-800 text-sm">
              {validationErrors.general || error}
            </span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("username")}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                validationErrors.username
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
              placeholder={currentLanguage === "np" ? "राम सिंह" : "ram.singh"}
              autoComplete="username"
              disabled={isSubmitting}
            />
            {validationErrors.username && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{validationErrors.username}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  validationErrors.password
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{validationErrors.password}</span>
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-sm text-gray-600"
              >
                {t("rememberMe")}
              </label>
            </div>

            {/* Login Attempts Warning */}
            {loginAttempts > 0 && (
              <div className="text-xs text-orange-600">
                {currentLanguage === "np"
                  ? `${loginAttempts}/५ प्रयास`
                  : `${loginAttempts}/5 attempts`}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-200 font-medium flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>{t("pleaseWait")}</span>
              </>
            ) : (
              <span>{t("loginButton")}</span>
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        {showDemoCredentials && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                {currentLanguage === "np" ? "डेमो खाताहरू:" : "Demo Accounts:"}
              </h3>
              <button
                onClick={() => setShowDemoCredentials(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <button
                onClick={() => fillDemoCredentials("operator")}
                className="w-full text-left p-2 hover:bg-gray-100 rounded transition-colors"
                disabled={isSubmitting}
              >
                <div className="font-medium text-gray-700">
                  {t("operator")}: ram.singh
                </div>
                <div className="text-gray-500">
                  {currentLanguage === "np" ? "पासवर्ड" : "Password"}:
                  password123
                </div>
              </button>

              <button
                onClick={() => fillDemoCredentials("supervisor")}
                className="w-full text-left p-2 hover:bg-gray-100 rounded transition-colors"
                disabled={isSubmitting}
              >
                <div className="font-medium text-gray-700">
                  {t("supervisor")}: supervisor
                </div>
                <div className="text-gray-500">
                  {currentLanguage === "np" ? "पासवर्ड" : "Password"}: super123
                </div>
              </button>

              <button
                onClick={() => fillDemoCredentials("management")}
                className="w-full text-left p-2 hover:bg-gray-100 rounded transition-colors"
                disabled={isSubmitting}
              >
                <div className="font-medium text-gray-700">
                  {t("management")}: management
                </div>
                <div className="text-gray-500">
                  {currentLanguage === "np" ? "पासवर्ड" : "Password"}: mgmt123
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>{t("version")} 1.0 - PWA Ready</p>
          <p className="mt-1">
            {currentLanguage === "np"
              ? `समय: ${formatTime(new Date())}`
              : `Time: ${formatTime(new Date())}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
