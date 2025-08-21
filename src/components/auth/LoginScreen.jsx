import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, LanguageToggle } from "../../context/LanguageContext";

const LoginScreen = () => {
  const { login, isLoading, error } = useAuth();
  const { t, currentLanguage } = useLanguage();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      // Redirect will be handled by App.jsx
      console.log("Login successful");
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-800 text-sm">{error}</span>
            </div>
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={currentLanguage === "np" ? "राम सिंह" : "ram.singh"}
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {t("password")}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
              {currentLanguage === "np" ? "मलाई सम्झनुहोस्" : "Remember Me"}
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition duration-200 font-medium"
          >
            {isLoading ? t("loading") : t("loginButton")}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {currentLanguage === "np" ? "डेमो खाताहरू:" : "Demo Accounts:"}
          </h3>
          <div className="space-y-2 text-sm">
            <button
              onClick={() => fillDemoCredentials("operator")}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              <div className="font-medium">Operator: ram.singh</div>
              <div className="text-gray-500">Password: password123</div>
            </button>
            <button
              onClick={() => fillDemoCredentials("supervisor")}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              <div className="font-medium">Supervisor: supervisor</div>
              <div className="text-gray-500">Password: super123</div>
            </button>
            <button
              onClick={() => fillDemoCredentials("management")}
              className="w-full text-left p-2 hover:bg-gray-100 rounded"
            >
              <div className="font-medium">Management: management</div>
              <div className="text-gray-500">Password: mgmt123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
