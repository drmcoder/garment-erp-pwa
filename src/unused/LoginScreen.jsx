import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, LanguageToggle } from "../../context/LanguageContext";
import { db } from "../../services/firebase";
import { collection, getDocs } from "firebase/firestore";

const LoginScreen = () => {
  const { login, isLoading, error } = useAuth();
  const { t, currentLanguage } = useLanguage();

  const [loginMode, setLoginMode] = useState("visual"); // "visual" or "manual"
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  // Load available users from Firebase for visual login
  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log("📊 Loading users for visual login...");
      
      // Load users from all collections
      const [operatorsSnapshot, supervisorsSnapshot, managementSnapshot] = await Promise.all([
        getDocs(collection(db, 'OPERATORS')),
        getDocs(collection(db, 'SUPERVISORS')),
        getDocs(collection(db, 'MANAGEMENT'))
      ]);

      const users = [];

      // Process operators
      operatorsSnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          name: userData.name,
          username: userData.username,
          role: 'operator',
          machine: userData.machine,
          photo: userData.photo || null,
          roleDisplay: currentLanguage === "np" ? "कामदार" : "Worker",
          icon: "👷"
        });
      });

      // Process supervisors
      supervisorsSnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          name: userData.name,
          username: userData.username,
          role: 'supervisor',
          photo: userData.photo || null,
          roleDisplay: currentLanguage === "np" ? "सुपरभाइजर" : "Supervisor",
          icon: "👤"
        });
      });

      // Process management
      managementSnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          name: userData.name,
          username: userData.username,
          role: 'management',
          photo: userData.photo || null,
          roleDisplay: currentLanguage === "np" ? "व्यवस्थापक" : "Manager",
          icon: "👔"
        });
      });

      // Sort by name
      users.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log("✅ Users loaded for visual login:", users.length);
      setAvailableUsers(users);
    } catch (error) {
      console.error("❌ Error loading users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = async (user) => {
    console.log("👤 User selected for login:", user.name);
    
    // For demo purposes, use simple passwords
    // In production, you'd implement proper authentication
    const result = await login({
      username: user.username,
      password: getDefaultPassword(user.role) // Simple default passwords
    });
    
    if (result.success) {
      console.log("✅ Visual login successful");
    }
  };

  const getDefaultPassword = (role) => {
    // Simple default passwords - in production use proper authentication
    switch (role) {
      case 'operator': return 'password123';
      case 'supervisor': return 'super123';
      case 'management': return 'mgmt123';
      default: return 'password123';
    }
  };

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
      console.log("Login successful");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-red-200 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-pink-200 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-purple-200 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-red-100 rounded-full opacity-30 animate-bounce"></div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 border-4 border-red-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white p-8 text-center relative overflow-hidden">
          {/* Logo Integration */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-red-200 relative overflow-hidden">
              <img 
                src="data:image/png;base64,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"
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">
            {currentLanguage === "np" ? "गार्मेन्ट फैक्ट्री" : "GARMENT FACTORY"}
          </h1>
          <p className="text-xl text-red-100 drop-shadow">
            {currentLanguage === "np" ? "आफ्नो नाम छान्नुहोस्" : "Choose Your Name"}
          </p>
          
          {/* Language Toggle */}
          <div className="flex justify-center mt-4">
            <LanguageToggle />
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 w-8 h-8 border-2 border-red-200 rounded-full animate-ping"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-red-300 rounded-full animate-pulse"></div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-100 border-2 border-red-300 rounded-2xl">
            <div className="flex items-center justify-center space-x-3">
              <div className="text-3xl">❌</div>
              <span className="text-red-800 text-lg font-semibold">{error}</span>
            </div>
          </div>
        )}

        <div className="p-8">
          {/* Interactive Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-red-50 rounded-2xl p-2 flex shadow-inner border-2 border-red-100">
              <button
                onClick={() => setLoginMode("visual")}
                className={`px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 ${
                  loginMode === "visual"
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-105"
                    : "text-red-600 hover:bg-red-100 hover:shadow-md"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">👤</span>
                  <span>{currentLanguage === "np" ? "नाम छान्नुहोस्" : "Choose Name"}</span>
                </div>
              </button>
              <button
                onClick={() => setLoginMode("manual")}
                className={`px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 ${
                  loginMode === "manual"
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-105"
                    : "text-red-600 hover:bg-red-100 hover:shadow-md"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⌨️</span>
                  <span>{currentLanguage === "np" ? "टाइप गर्नुहोस्" : "Type Login"}</span>
                </div>
              </button>
            </div>
          </div>

          {loginMode === "visual" ? (
            /* Visual Login Mode */
            <div>
              {loadingUsers ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⏳</div>
                  <div className="text-2xl font-semibold text-gray-600">
                    {currentLanguage === "np" ? "कामदारहरू लोड हुँदै..." : "Loading Workers..."}
                  </div>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <div className="text-2xl font-semibold text-gray-600 mb-4">
                    {currentLanguage === "np" ? "कुनै कामदार भेटिएन" : "No Workers Found"}
                  </div>
                  <button
                    onClick={() => setLoginMode("manual")}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl text-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg transform hover:scale-105"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">⌨️</span>
                      <span>{currentLanguage === "np" ? "म्यानुअल लगइन प्रयोग गर्नुहोस्" : "Use Manual Login"}</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      disabled={isLoading}
                      className="bg-gradient-to-br from-white via-red-50 to-pink-50 border-4 border-red-200 rounded-3xl p-6 hover:shadow-2xl hover:scale-110 hover:border-red-400 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:rotate-1 relative overflow-hidden group"
                    >
                      {/* Animated Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
                      
                      {/* Sparkle Effects */}
                      <div className="absolute top-2 right-2 w-3 h-3 bg-red-300 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                      <div className="absolute top-4 left-3 w-2 h-2 bg-pink-300 rounded-full opacity-0 group-hover:opacity-100 animate-pulse"></div>
                      
                      {/* User Avatar */}
                      <div className="text-center mb-4 relative z-10">
                        {user.photo ? (
                          <div className="relative">
                            <img 
                              src={user.photo} 
                              alt={user.name}
                              className="w-24 h-24 rounded-full mx-auto border-4 border-red-300 shadow-lg group-hover:border-red-500 transition-all duration-300"
                            />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-lg animate-bounce">
                              {user.icon}
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-400 via-red-500 to-red-600 flex items-center justify-center text-4xl text-white border-4 border-red-300 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                            {user.icon}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="text-center relative z-10">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-red-800 transition-colors duration-300">
                          {user.name}
                        </h3>
                        <div className="text-lg font-bold mb-2 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                          {user.roleDisplay}
                        </div>
                        {user.machine && (
                          <div className="text-sm text-red-700 bg-red-100 rounded-full px-4 py-2 border-2 border-red-200 group-hover:bg-red-200 group-hover:border-red-300 transition-all duration-300">
                            <span className="text-lg mr-1">🔧</span>
                            {user.machine}
                          </div>
                        )}
                      </div>

                      {/* Interactive Tap Indicator */}
                      <div className="mt-4 relative z-10">
                        <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-100 rounded-2xl py-3 px-4 border-2 border-red-200 group-hover:bg-red-200 group-hover:border-red-400 group-hover:text-red-800 transition-all duration-300">
                          <span className="text-3xl animate-bounce">👆</span>
                          <span className="font-bold text-lg">
                            {currentLanguage === "np" ? "यहाँ ट्याप गर्नुहोस्!" : "TAP HERE!"}
                          </span>
                          <span className="text-3xl animate-bounce animation-delay-150">👆</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Manual Login Mode */
            <div className="max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div>
                  <label className="block text-xl font-semibold text-gray-700 mb-3">
                    {currentLanguage === "np" ? "प्रयोगकर्ता नाम" : "Username"}
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full p-4 text-xl border-4 border-red-200 rounded-2xl focus:ring-4 focus:ring-red-200 focus:border-red-500 bg-red-50 focus:bg-white transition-all duration-300 shadow-inner"
                    placeholder={currentLanguage === "np" ? "राम.सिंह" : "ram.singh"}
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xl font-semibold text-gray-700 mb-3">
                    {currentLanguage === "np" ? "पासवर्ड" : "Password"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full p-4 text-xl border-4 border-red-200 rounded-2xl focus:ring-4 focus:ring-red-200 focus:border-red-500 bg-red-50 focus:bg-white transition-all duration-300 shadow-inner"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white text-2xl font-bold py-6 px-8 rounded-2xl hover:from-red-600 hover:via-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-2xl transform hover:scale-105 hover:shadow-3xl border-4 border-red-300 hover:border-red-500"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mr-4"></div>
                      <span className="text-xl animate-pulse">
                        {currentLanguage === "np" ? "प्रवेश हुँदै..." : "LOGGING IN..."}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-4">
                      <span className="text-4xl animate-bounce">🔐</span>
                      <span className="tracking-wide">
                        {currentLanguage === "np" ? "प्रवेश गर्नुहोस्!" : "LOGIN NOW!"}
                      </span>
                      <span className="text-4xl animate-bounce animation-delay-150">🚪</span>
                    </div>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
