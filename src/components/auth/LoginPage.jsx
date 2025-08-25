import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Smartphone,
  Users,
  Shield,
} from "lucide-react";
import { useLanguage, LanguageToggle } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { db, collection, getDocs, COLLECTIONS } from "../../config/firebase";

const LoginPage = () => {
  const { t, currentLanguage } = useLanguage();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("operator");
  const [errors, setErrors] = useState({});

  // Load users from localStorage
  const [availableUsers, setAvailableUsers] = useState({
    operator: [],
    supervisor: [],
    management: []
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersByRole = {
          operator: [],
          supervisor: [],
          management: []
        };

        // Load from Firestore
        const operatorsSnapshot = await getDocs(collection(db, COLLECTIONS.OPERATORS));
        operatorsSnapshot.forEach((doc) => {
          const userData = doc.data();
          usersByRole.operator.push({
            username: userData.username,
            password: 'password123', // Default password for demo
            name: userData.nameNepali || userData.name,
            machine: userData.machine || userData.assignedMachine,
          });
        });

        const supervisorsSnapshot = await getDocs(collection(db, COLLECTIONS.SUPERVISORS));
        supervisorsSnapshot.forEach((doc) => {
          const userData = doc.data();
          usersByRole.supervisor.push({
            username: userData.username,
            password: 'password123', // Default password for demo
            name: userData.nameNepali || userData.name,
          });
        });

        const managementSnapshot = await getDocs(collection(db, COLLECTIONS.MANAGEMENT));
        managementSnapshot.forEach((doc) => {
          const userData = doc.data();
          usersByRole.management.push({
            username: userData.username,
            password: 'password123', // Default password for demo
            name: userData.nameNepali || userData.name,
          });
        });

        setAvailableUsers(usersByRole);
      } catch (error) {
        console.error('Error loading users from Firestore:', error);
        // No fallback - set empty users
        setAvailableUsers({
          operator: [],
          supervisor: [],
          management: []
        });
      }
    };

    loadUsers();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = t("required");
    }

    if (!formData.password.trim()) {
      newErrors.password = t("required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await login(formData.username, formData.password, selectedRole);
    } catch (error) {
      setErrors({ general: t("loginError") });
    }
  };

  const handleDemoLogin = (user) => {
    setFormData({
      username: user.username,
      password: user.password,
      rememberMe: false,
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "operator":
        return <Smartphone className="w-5 h-5" />;
      case "supervisor":
        return <Users className="w-5 h-5" />;
      case "management":
        return <Shield className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Toggle */}
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("appTitle")}</h1>
            <p className="text-blue-100">{t("subtitle")}</p>
          </div>

          {/* Role Selection */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-2">
              {["operator", "supervisor", "management"].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedRole === role
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                      : "bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100"
                  }`}
                >
                  {getRoleIcon(role)}
                  <span className="hidden sm:inline">{t(role)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedRole === "operator"
                  ? t("operatorName")
                  : t("username")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.username
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder={
                    currentLanguage === "np" ? "राम सिंह" : "ram.singh"
                  }
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) =>
                  handleInputChange("rememberMe", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-sm text-gray-600"
              >
                {t("rememberMe")}
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  {t("loginButton")}
                </>
              )}
            </button>
          </form>

          {/* Demo Users Section */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {currentLanguage === "np" ? "डेमो यूजरहरू:" : "Demo Users:"}
            </h3>
            <div className="space-y-2">
              {availableUsers[selectedRole].length > 0 ? (
                availableUsers[selectedRole].map((user, index) => (
                  <button
                    key={index}
                    onClick={() => handleDemoLogin(user)}
                    className="w-full text-left p-2 rounded bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {currentLanguage === "np" && user.name
                            ? user.name
                            : user.username}
                        </div>
                        {user.machine && (
                          <div className="text-xs text-gray-500">
                            {t(user.machine)} {t("operator")}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{user.username}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  {currentLanguage === "np" 
                    ? `कुनै ${selectedRole} फेला परेन। पहिले User Management मा गएर यूजर बनाउनुहोस्।`
                    : `No ${selectedRole} users found. Please create users in User Management first.`
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center mt-4 text-sm text-gray-500">
          {t("version")} 1.0.0 | PWA Ready
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
