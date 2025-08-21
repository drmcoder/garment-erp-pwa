import React, { createContext, useContext, useState, useEffect } from "react";
import { Globe } from "lucide-react";

// Complete language translations for Garment ERP
const languages = {
  np: {
    // App Info
    appTitle: "गारमेन्ट ERP",
    subtitle: "उत्पादन व्यवस्थापन",
    version: "संस्करण",

    // Navigation & Menu
    dashboard: "ड्यासबोर्ड",
    workQueue: "कामको लाइन",
    performance: "प्रदर्शन",
    notifications: "सूचनाहरू",
    settings: "सेटिङ्स",
    logout: "लगआउट",
    menu: "मेनु",
    back: "फिर्ता",
    next: "अर्को",
    close: "बन्द गर्नुहोस्",

    // Authentication
    login: "लगइन",
    operatorLogin: "ऑपरेटर लगइन",
    supervisorLogin: "सुपरभाइजर लगइन",
    operatorName: "ऑपरेटर नाम",
    username: "प्रयोगकर्ता नाम",
    password: "पासवर्ड",
    rememberMe: "मलाई सम्झनुहोस्",
    loginButton: "लगइन गर्नुहोस्",
    loginError: "गलत प्रमाणहरू",
    loginSuccess: "सफलतापूर्वक लगइन भयो",

    // User Roles
    operator: "ऑपरेटर",
    supervisor: "सुपरभाइजर",
    management: "व्यवस्थापन",
    admin: "प्रशासक",

    // Greetings & Time
    welcome: "नमस्कार",
    goodMorning: "शुभ प्रभात",
    goodAfternoon: "शुभ दिन",
    goodEvening: "शुभ साँझ",
    today: "आज",
    yesterday: "हिजो",
    tomorrow: "भोलि",
    thisWeek: "यो हप्ता",
    thisMonth: "यो महिना",
    minutes: "मिनेट",
    hours: "घण्टा",
    days: "दिन",

    // Work Management
    currentWork: "हालको काम",
    nextWork: "अर्को काम",
    pendingWork: "बाँकी काम",
    completedWork: "सकिएको काम",
    workQueue: "कामको लाइन",
    workAssignment: "काम बाँडफाँड",
    workProgress: "कामको प्रगति",
    workStatus: "कामको स्थिति",

    // Production Terms
    article: "लेख",
    bundle: "बन्डल",
    lot: "लट",
    operation: "काम",
    process: "प्रक्रिया",
    machine: "मेसिन",
    station: "स्टेसन",
    color: "रङ",
    size: "साइज",
    fabric: "कपडा",

    // Quantities & Measurements
    pieces: "टुक्रा",
    totalPieces: "जम्मा टुक्रा",
    completedPieces: "सकिएको टुक्रा",
    remainingPieces: "बाँकी टुक्रा",
    assigned: "तोकिएको",
    completed: "पूरा",
    remaining: "बाँकी",
    quantity: "मात्रा",
    weight: "तौल",
    kg: "केजी",
    meter: "मिटर",

    // Quality Control
    quality: "गुणस्तर",
    qualityCheck: "गुणस्तर जाँच",
    qualityGood: "राम्रो",
    qualityBad: "समस्या छ",
    qualityScore: "गुणस्तर अंक",
    defective: "दोषयुक्त",
    defects: "दोषहरू",
    rework: "पुनः काम",
    approved: "स्वीकृत",
    rejected: "अस्वीकृत",

    // Common Defect Types
    fabricHole: "कपडामा प्वाल",
    brokenStitch: "बिग्रिएको सिलाई",
    wrongColor: "गलत रङ",
    wrongSize: "गलत साइज",
    machineStain: "मेसिनको दाग",
    cutFabric: "काटिएको कपडा",
    burnMark: "जलेको निशान",

    // Machines & Equipment
    overlock: "ओभरलक",
    flatlock: "फ्ल्यालक",
    singleNeedle: "एकल सुई",
    buttonhole: "बटनहोल",
    buttonAttach: "बटन अट्याच",
    iron: "आइरन",
    cutting: "काट्ने",
    pressing: "प्रेसिङ",

    // Operations
    shoulderJoin: "काँध जोड्ने",
    sideSeam: "साइड सिम",
    armholeJoin: "आर्महोल जोइन",
    hemFold: "हेम फोल्ड",
    topStitch: "माथिल्लो सिलाई",
    placket: "प्लाकेट",
    collar: "कलर",
    sleeve: "स्लिभ",
    finishing: "फिनिसिङ",
    packing: "प्याकिङ",

    // Financial
    earnings: "कमाई",
    totalEarnings: "जम्मा कमाई",
    dailyEarnings: "दैनिक कमाई",
    monthlyEarnings: "मासिक कमाई",
    rate: "दर",
    ratePerPiece: "दर/टुक्रा",
    wage: "ज्याला",
    salary: "तलब",
    bonus: "बोनस",
    overtime: "ओभरटाइम",
    cost: "लागत",
    profit: "नाफा",
    rupees: "रुपैयाँ",

    // Performance Metrics
    efficiency: "दक्षता",
    productivity: "उत्पादकता",
    performance: "प्रदर्शन",
    target: "लक्ष्य",
    achievement: "उपलब्धि",
    average: "औसत",
    ranking: "श्रेणी",
    comparison: "तुलना",
    improvement: "सुधार",

    // Status & States
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    inProgress: "चलिरहेको",
    pending: "पेन्डिङ",
    completed: "सकिएको",
    cancelled: "रद्द गरिएको",
    onHold: "होल्डमा",
    ready: "तयार",
    waiting: "पर्खिरहेको",
    busy: "व्यस्त",
    available: "उपलब्ध",

    // Actions & Buttons
    start: "सुरु गर्नुहोस्",
    stop: "रोक्नुहोस्",
    pause: "पज गर्नुहोस्",
    resume: "फेरि सुरु गर्नुहोस्",
    complete: "पूरा गर्नुहोस्",
    submit: "पेश गर्नुहोस्",
    save: "सेभ गर्नुहोस्",
    cancel: "रद्द गर्नुहोस्",
    delete: "मेटाउनुहोस्",
    edit: "सम्पादन गर्नुहोस्",
    view: "हेर्नुहोस्",
    refresh: "रिफ्रेस गर्नुहोस्",
    load: "लोड गर्नुहोस्",
    assign: "असाइन गर्नुहोस्",
    send: "पठाउनुहोस्",
    receive: "लिनुहोस्",

    // Work Actions
    startWork: "काम सुरु गर्नुहोस्",
    completeWork: "काम पूरा गर्नुहोस्",
    pauseWork: "काम पज गर्नुहोस्",
    resumeWork: "काम फेरि सुरु गर्नुहोस्",
    reportIssue: "समस्या रिपोर्ट गर्नुहोस्",
    requestWork: "काम माग्नुहोस्",
    sendToNext: "अर्को चरणमा पठाउनुहोस्",
    acceptWork: "काम स्वीकार गर्नुहोस्",

    // Notifications
    newWork: "नयाँ काम",
    workReady: "काम तयार छ",
    workCompleted: "काम सकियो",
    qualityIssue: "गुणस्तर समस्या",
    urgent: "तत्काल",
    reminder: "सम्झना",
    alert: "चेतावनी",

    // Messages
    workAssigned: "काम तोकिएको छ",
    workInProgress: "काम चलिरहेको छ",
    workCompleted: "काम सकिएको छ",
    noWorkAvailable: "काम उपलब्ध छैन",
    waitingForWork: "काम पर्खिरहेको",
    excellentWork: "उत्कृष्ट काम",
    goodWork: "राम्रो काम",
    needsImprovement: "सुधार चाहिन्छ",

    // Time & Schedule
    shift: "शिफ्ट",
    morningShift: "बिहानको शिफ्ट",
    eveningShift: "साँझको शिफ्ट",
    nightShift: "रातको शिफ्ट",
    breakTime: "विश्राम समय",
    workingHours: "काम गर्ने समय",
    overtime: "ओभरटाइम",

    // Reports & Analytics
    report: "रिपोर्ट",
    dailyReport: "दैनिक रिपोर्ट",
    weeklyReport: "साप्ताहिक रिपोर्ट",
    monthlyReport: "मासिक रिपोर्ट",
    summary: "सारांश",
    details: "विस्तार",
    analytics: "विश्लेषण",
    trends: "प्रवृत्ति",
    statistics: "तथ्याङ्क",

    // Supervisor Terms
    lineMonitoring: "लाइन मनिटरिङ",
    workAssignment: "काम असाइनमेन्ट",
    efficiencyOptimization: "दक्षता अप्टिमाइजेसन",
    capacityPlanning: "क्षमता योजना",
    resourceAllocation: "संसाधन बाँडफाँड",

    // Common Phrases
    pleaseWait: "कृपया पर्खनुहोस्",
    loading: "लोड हुँदै छ",
    processing: "प्रशोधन हुँदै छ",
    success: "सफल",
    error: "त्रुटि",
    warning: "चेतावनी",
    information: "जानकारी",
    confirmation: "पुष्टिकरण",

    // Form Fields
    required: "आवश्यक",
    optional: "वैकल्पिक",
    selectOption: "विकल्प छान्नुहोस्",
    enterValue: "मान राख्नुहोस्",
    searchPlaceholder: "खोज्नुहोस्...",

    // Navigation Terms
    home: "गृह",
    profile: "प्रोफाइल",
    help: "सहायता",
    about: "बारेमा",
    contact: "सम्पर्क",

    // Offline/Online
    online: "अनलाइन",
    offline: "अफलाइन",
    connected: "जडान भएको",
    disconnected: "जडान नभएको",
    sync: "सिंक",
    syncComplete: "सिंक सकियो",

    // Additional terms used in dashboard
    dailyTarget: "दैनिक लक्ष्य",
    earned: "कमाईएको",
    time: "समय",
    noWorkInQueue: "लाइनमा काम छैन",
    myStats: "मेरो तथ्याङ्क",
    all: "सबै",
    vs: "विरुद्ध",
  },

  en: {
    // App Info
    appTitle: "Garment ERP",
    subtitle: "Production Management",
    version: "Version",

    // Navigation & Menu
    dashboard: "Dashboard",
    workQueue: "Work Queue",
    performance: "Performance",
    notifications: "Notifications",
    settings: "Settings",
    logout: "Logout",
    menu: "Menu",
    back: "Back",
    next: "Next",
    close: "Close",

    // Authentication
    login: "Login",
    operatorLogin: "Operator Login",
    supervisorLogin: "Supervisor Login",
    operatorName: "Operator Name",
    username: "Username",
    password: "Password",
    rememberMe: "Remember Me",
    loginButton: "Login",
    loginError: "Invalid credentials",
    loginSuccess: "Successfully logged in",

    // User Roles
    operator: "Operator",
    supervisor: "Supervisor",
    management: "Management",
    admin: "Admin",

    // Greetings & Time
    welcome: "Welcome",
    goodMorning: "Good Morning",
    goodAfternoon: "Good Afternoon",
    goodEvening: "Good Evening",
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",
    thisWeek: "This Week",
    thisMonth: "This Month",
    minutes: "Minutes",
    hours: "Hours",
    days: "Days",

    // Work Management
    currentWork: "Current Work",
    nextWork: "Next Work",
    pendingWork: "Pending Work",
    completedWork: "Completed Work",
    workQueue: "Work Queue",
    workAssignment: "Work Assignment",
    workProgress: "Work Progress",
    workStatus: "Work Status",

    // Production Terms
    article: "Article",
    bundle: "Bundle",
    lot: "Lot",
    operation: "Operation",
    process: "Process",
    machine: "Machine",
    station: "Station",
    color: "Color",
    size: "Size",
    fabric: "Fabric",

    // Quantities & Measurements
    pieces: "Pieces",
    totalPieces: "Total Pieces",
    completedPieces: "Completed Pieces",
    remainingPieces: "Remaining Pieces",
    assigned: "Assigned",
    completed: "Completed",
    remaining: "Remaining",
    quantity: "Quantity",
    weight: "Weight",
    kg: "KG",
    meter: "Meter",

    // Quality Control
    quality: "Quality",
    qualityCheck: "Quality Check",
    qualityGood: "Good",
    qualityBad: "Has Issues",
    qualityScore: "Quality Score",
    defective: "Defective",
    defects: "Defects",
    rework: "Rework",
    approved: "Approved",
    rejected: "Rejected",

    // Common Defect Types
    fabricHole: "Fabric Hole",
    brokenStitch: "Broken Stitch",
    wrongColor: "Wrong Color",
    wrongSize: "Wrong Size",
    machineStain: "Machine Stain",
    cutFabric: "Cut Fabric",
    burnMark: "Burn Mark",

    // Machines & Equipment
    overlock: "Overlock",
    flatlock: "Flatlock",
    singleNeedle: "Single Needle",
    buttonhole: "Buttonhole",
    buttonAttach: "Button Attach",
    iron: "Iron",
    cutting: "Cutting",
    pressing: "Pressing",

    // Operations
    shoulderJoin: "Shoulder Join",
    sideSeam: "Side Seam",
    armholeJoin: "Armhole Join",
    hemFold: "Hem Fold",
    topStitch: "Top Stitch",
    placket: "Placket",
    collar: "Collar",
    sleeve: "Sleeve",
    finishing: "Finishing",
    packing: "Packing",

    // Financial
    earnings: "Earnings",
    totalEarnings: "Total Earnings",
    dailyEarnings: "Daily Earnings",
    monthlyEarnings: "Monthly Earnings",
    rate: "Rate",
    ratePerPiece: "Rate/Piece",
    wage: "Wage",
    salary: "Salary",
    bonus: "Bonus",
    overtime: "Overtime",
    cost: "Cost",
    profit: "Profit",
    rupees: "Rupees",

    // Performance Metrics
    efficiency: "Efficiency",
    productivity: "Productivity",
    performance: "Performance",
    target: "Target",
    achievement: "Achievement",
    average: "Average",
    ranking: "Ranking",
    comparison: "Comparison",
    improvement: "Improvement",

    // Status & States
    active: "Active",
    inactive: "Inactive",
    inProgress: "In Progress",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    onHold: "On Hold",
    ready: "Ready",
    waiting: "Waiting",
    busy: "Busy",
    available: "Available",

    // Actions & Buttons
    start: "Start",
    stop: "Stop",
    pause: "Pause",
    resume: "Resume",
    complete: "Complete",
    submit: "Submit",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    refresh: "Refresh",
    load: "Load",
    assign: "Assign",
    send: "Send",
    receive: "Receive",

    // Work Actions
    startWork: "Start Work",
    completeWork: "Complete Work",
    pauseWork: "Pause Work",
    resumeWork: "Resume Work",
    reportIssue: "Report Issue",
    requestWork: "Request Work",
    sendToNext: "Send to Next",
    acceptWork: "Accept Work",

    // Notifications
    newWork: "New Work",
    workReady: "Work Ready",
    workCompleted: "Work Completed",
    qualityIssue: "Quality Issue",
    urgent: "Urgent",
    reminder: "Reminder",
    alert: "Alert",

    // Messages
    workAssigned: "Work Assigned",
    workInProgress: "Work In Progress",
    workCompleted: "Work Completed",
    noWorkAvailable: "No Work Available",
    waitingForWork: "Waiting for Work",
    excellentWork: "Excellent Work",
    goodWork: "Good Work",
    needsImprovement: "Needs Improvement",

    // Time & Schedule
    shift: "Shift",
    morningShift: "Morning Shift",
    eveningShift: "Evening Shift",
    nightShift: "Night Shift",
    breakTime: "Break Time",
    workingHours: "Working Hours",
    overtime: "Overtime",

    // Reports & Analytics
    report: "Report",
    dailyReport: "Daily Report",
    weeklyReport: "Weekly Report",
    monthlyReport: "Monthly Report",
    summary: "Summary",
    details: "Details",
    analytics: "Analytics",
    trends: "Trends",
    statistics: "Statistics",

    // Supervisor Terms
    lineMonitoring: "Line Monitoring",
    workAssignment: "Work Assignment",
    efficiencyOptimization: "Efficiency Optimization",
    capacityPlanning: "Capacity Planning",
    resourceAllocation: "Resource Allocation",

    // Common Phrases
    pleaseWait: "Please Wait",
    loading: "Loading",
    processing: "Processing",
    success: "Success",
    error: "Error",
    warning: "Warning",
    information: "Information",
    confirmation: "Confirmation",

    // Form Fields
    required: "Required",
    optional: "Optional",
    selectOption: "Select Option",
    enterValue: "Enter Value",
    searchPlaceholder: "Search...",

    // Navigation Terms
    home: "Home",
    profile: "Profile",
    help: "Help",
    about: "About",
    contact: "Contact",

    // Offline/Online
    online: "Online",
    offline: "Offline",
    connected: "Connected",
    disconnected: "Disconnected",
    sync: "Sync",
    syncComplete: "Sync Complete",

    // Additional terms used in dashboard
    dailyTarget: "Daily Target",
    earned: "Earned",
    time: "Time",
    noWorkInQueue: "No Work in Queue",
    myStats: "My Stats",
    all: "All",
    vs: "vs",
  },
};

// Language Context
const LanguageContext = createContext();

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Check localStorage for saved language preference
    const savedLanguage = localStorage.getItem("garment-erp-language");
    return savedLanguage || "np"; // Default to Nepali
  });

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem("garment-erp-language", currentLanguage);

    // Apply font family based on language
    if (currentLanguage === "np") {
      document.documentElement.classList.add("font-nepali");
    } else {
      document.documentElement.classList.remove("font-nepali");
    }
  }, [currentLanguage]);

  // Translation function
  const t = (key) => {
    return languages[currentLanguage][key] || key;
  };

  // Switch language
  const switchLanguage = (lang) => {
    if (languages[lang]) {
      setCurrentLanguage(lang);
    }
  };

  // Toggle between Nepali and English
  const toggleLanguage = () => {
    const newLang = currentLanguage === "np" ? "en" : "np";
    setCurrentLanguage(newLang);
  };

  // Format time based on language
  const formatTime = (date) => {
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: currentLanguage === "en",
    };

    return date.toLocaleTimeString(
      currentLanguage === "np" ? "ne-NP" : "en-US",
      options
    );
  };

  // Format date based on language
  const formatDate = (date) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    return date.toLocaleDateString(
      currentLanguage === "np" ? "ne-NP" : "en-US",
      options
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (currentLanguage === "np") {
      return `रु. ${amount.toLocaleString("ne-NP")}`;
    } else {
      return `Rs. ${amount.toLocaleString("en-US")}`;
    }
  };

  // Format numbers
  const formatNumber = (number) => {
    return number.toLocaleString(currentLanguage === "np" ? "ne-NP" : "en-US");
  };

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return t("goodMorning");
    } else if (hour < 17) {
      return t("goodAfternoon");
    } else {
      return t("goodEvening");
    }
  };

  // Get relative time (e.g., "2 minutes ago")
  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return currentLanguage === "np" ? "अहिले" : "now";
    } else if (minutes < 60) {
      return currentLanguage === "np"
        ? `${minutes} मिनेट अगाडि`
        : `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (hours < 24) {
      return currentLanguage === "np"
        ? `${hours} घण्टा अगाडि`
        : `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      return currentLanguage === "np"
        ? `${days} दिन अगाडि`
        : `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  // Get day of week
  const getDayOfWeek = (date = new Date()) => {
    const days = {
      np: [
        "आइतबार",
        "सोमबार",
        "मंगलबार",
        "बुधबार",
        "बिहिबार",
        "शुक्रबार",
        "शनिबार",
      ],
      en: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    };

    return days[currentLanguage][date.getDay()];
  };

  // Get month name
  const getMonthName = (date = new Date()) => {
    const months = {
      np: [
        "जनवरी",
        "फेब्रुअरी",
        "मार्च",
        "अप्रिल",
        "मे",
        "जुन",
        "जुलाई",
        "अगस्त",
        "सेप्टेम्बर",
        "अक्टोबर",
        "नोभेम्बर",
        "डिसेम्बर",
      ],
      en: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
    };

    return months[currentLanguage][date.getMonth()];
  };

  // Check if current language is RTL
  const isRTL = () => {
    // Nepali is LTR, but keeping this for future RTL language support
    return false;
  };

  // Get text direction
  const getTextDirection = () => {
    return isRTL() ? "rtl" : "ltr";
  };

  const value = {
    currentLanguage,
    setCurrentLanguage,
    switchLanguage,
    toggleLanguage,
    t,
    formatTime,
    formatDate,
    formatCurrency,
    formatNumber,
    getTimeBasedGreeting,
    getRelativeTime,
    getDayOfWeek,
    getMonthName,
    isRTL,
    getTextDirection,
    languages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
};

// Language Toggle Component
export const LanguageToggle = ({ showText = true, className = "" }) => {
  const { currentLanguage, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${className}`}
      aria-label="Toggle Language"
    >
      <Globe className="w-4 h-4" />
      {showText && (
        <span className="text-sm font-medium">
          {currentLanguage === "np" ? "English" : "नेपाली"}
        </span>
      )}
      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
        {currentLanguage === "np" ? "🇳🇵" : "🇺🇸"}
      </span>
    </button>
  );
};

export default LanguageContext;
