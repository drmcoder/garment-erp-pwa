// src/components/operator/SelfServiceModule.jsx
// Advanced Operator Self-Service with Voice Commands and Smart Features

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Package,
  TrendingUp,
  Award,
  Calendar,
  Settings,
  HelpCircle,
  Smartphone,
  Users,
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  Volume2,
  VolumeX,
  Camera,
  Image,
  FileText,
  Send,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";

const OperatorSelfService = () => {
  const { user, getUserDisplayInfo } = useAuth();
  const { t, currentLanguage, formatNumber, formatTime } = useLanguage();
  const { addNotification } = useNotifications();

  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState("");
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Self-Service State
  const [activeTab, setActiveTab] = useState("workSelection");
  const [selectedOperation, setSelectedOperation] = useState("");
  const [availableWork, setAvailableWork] = useState([]);
  const [currentWork, setCurrentWork] = useState(null);
  const [workTimer, setWorkTimer] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [qualityCheck, setQualityCheck] = useState({});
  const [photoCapture, setPhotoCapture] = useState(null);

  // Performance Data
  const [operatorStats, setOperatorStats] = useState({
    todayPieces: 0,
    todayEarnings: 0,
    efficiency: 0,
    qualityScore: 0,
    weeklyTrend: [],
    achievements: [],
  });

  const userInfo = getUserDisplayInfo();

  // Initialize Voice Recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang =
        currentLanguage === "np" ? "ne-NP" : "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript =
          event.results[event.results.length - 1][0].transcript;
        setVoiceCommand(transcript);
        processVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }

    // Initialize Speech Synthesis
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }

    loadOperatorData();
    loadAvailableWork();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Work Timer
  useEffect(() => {
    let interval = null;
    if (isWorking) {
      interval = setInterval(() => {
        setWorkTimer((timer) => timer + 1);
      }, 1000);
    } else if (!isWorking && workTimer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isWorking, workTimer]);

  // Load operator data
  const loadOperatorData = async () => {
    // Simulate API call
    setOperatorStats({
      todayPieces: 85,
      todayEarnings: 212.5,
      efficiency: 88,
      qualityScore: 96,
      weeklyTrend: [
        { day: "आइत", pieces: 95, efficiency: 90 },
        { day: "सोम", pieces: 88, efficiency: 85 },
        { day: "मंगल", pieces: 92, efficiency: 88 },
        { day: "बुध", pieces: 85, efficiency: 88 },
        { day: "बिहि", pieces: 0, efficiency: 0 },
        { day: "शुक्र", pieces: 0, efficiency: 0 },
        { day: "शनि", pieces: 0, efficiency: 0 },
      ],
      achievements: [
        {
          title: "गुणस्तर च्याम्पियन",
          description: "98% गुणस्तर स्कोर",
          date: "आज",
          icon: Award,
        },
        {
          title: "दक्षता मास्टर",
          description: "७ दिन लगातार ९०%+ दक्षता",
          date: "यो हप्ता",
          icon: TrendingUp,
        },
        {
          title: "समय पञ्चिउलिटी",
          description: "३० दिन 100% उपस्थिति",
          date: "यो महिना",
          icon: Clock,
        },
      ],
    });
  };

  // Load available work
  const loadAvailableWork = async () => {
    // Simulate API call for available work based on operator's machine type
    setAvailableWork([
      {
        id: "bundle-001",
        article: "8085",
        articleName: "Polo T-Shirt",
        color: "नीलो",
        size: "XL",
        operation: "साइड सिम",
        operationEn: "Side Seam",
        pieces: 30,
        rate: 2.5,
        estimatedTime: 45,
        priority: "सामान्य",
        difficulty: "सजिलो",
      },
      {
        id: "bundle-002",
        article: "2233",
        articleName: "Basic T-Shirt",
        color: "हरियो",
        size: "2XL",
        operation: "आर्महोल जोइन",
        operationEn: "Armhole Join",
        pieces: 25,
        rate: 3.0,
        estimatedTime: 50,
        priority: "उच्च",
        difficulty: "मध्यम",
      },
      {
        id: "bundle-003",
        article: "6635",
        articleName: "Premium Shirt",
        color: "सेतो",
        size: "L",
        operation: "कलर अट्याच",
        operationEn: "Collar Attach",
        pieces: 20,
        rate: 4.0,
        estimatedTime: 60,
        priority: "सामान्य",
        difficulty: "कठिन",
      },
    ]);
  };

  // Voice Command Processing
  const processVoiceCommand = (command) => {
    const lowerCommand = command.toLowerCase();

    // Nepali voice commands
    if (
      lowerCommand.includes("काम सुरु") ||
      lowerCommand.includes("start work")
    ) {
      if (currentWork) {
        startWork();
        speak("काम सुरु गरिएको छ");
      } else {
        speak("पहिले काम छान्नुहोस्");
      }
    } else if (
      lowerCommand.includes("काम बन्द") ||
      lowerCommand.includes("stop work")
    ) {
      if (isWorking) {
        pauseWork();
        speak("काम रोकिएको छ");
      }
    } else if (
      lowerCommand.includes("काम पूरा") ||
      lowerCommand.includes("complete work")
    ) {
      if (currentWork && isWorking) {
        completeWork();
        speak("काम पूरा भयो");
      }
    } else if (
      lowerCommand.includes("नयाँ काम") ||
      lowerCommand.includes("new work")
    ) {
      setActiveTab("workSelection");
      speak("नयाँ काम छान्नुहोस्");
    } else if (
      lowerCommand.includes("प्रदर्शन") ||
      lowerCommand.includes("performance")
    ) {
      setActiveTab("performance");
      speak(`आजको कमाई ${operatorStats.todayEarnings} रुपैयाँ छ`);
    }
  };

  // Text-to-Speech function
  const speak = (text) => {
    if (speechEnabled && synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLanguage === "np" ? "ne-NP" : "en-US";
      utterance.rate = 0.8;
      synthRef.current.speak(utterance);
    }
  };

  // Toggle voice recognition
  const toggleVoiceRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Work Management Functions
  const selectWork = (work) => {
    setCurrentWork(work);
    setSelectedOperation(work.operation);
    speak(`${work.article} नम्बर ${work.operation} काम छानिएको छ`);
    addNotification({
      type: "info",
      message: `काम छानिएको: ${work.article}# ${work.operation}`,
      duration: 3000,
    });
  };

  const startWork = () => {
    if (currentWork) {
      setIsWorking(true);
      setWorkTimer(0);
      speak("काम सुरु गरिएको छ। राम्रो काम गर्नुहोस्।");
      addNotification({
        type: "success",
        message: "काम सुरु भयो",
        duration: 3000,
      });
    }
  };

  const pauseWork = () => {
    setIsWorking(false);
    speak("काम रोकिएको छ। विश्राम गर्नुहोस्।");
  };

  const completeWork = async () => {
    if (!currentWork) return;

    // Auto quality check
    const autoQualityScore = Math.random() > 0.9 ? "खराब" : "राम्रो";

    setQualityCheck({
      status: autoQualityScore,
      pieces: currentWork.pieces,
      defects:
        autoQualityScore === "खराब" ? Math.floor(Math.random() * 3) + 1 : 0,
      completedTime: workTimer,
    });

    // Update stats
    setOperatorStats((prev) => ({
      ...prev,
      todayPieces: prev.todayPieces + currentWork.pieces,
      todayEarnings: prev.todayEarnings + currentWork.pieces * currentWork.rate,
    }));

    setIsWorking(false);
    setWorkTimer(0);

    speak(`काम पूरा भयो। ${currentWork.pieces} टुक्रा सकियो।`);
    addNotification({
      type: "success",
      message: `काम पूरा! ${currentWork.pieces} टुक्रा - रु. ${
        currentWork.pieces * currentWork.rate
      }`,
      duration: 5000,
    });

    // Reset for next work
    setTimeout(() => {
      setCurrentWork(null);
      setQualityCheck({});
    }, 3000);
  };

  // Smart Work Recommendation
  const getRecommendedWork = () => {
    return availableWork.reduce((best, current) => {
      const currentScore =
        (current.rate * current.pieces) / current.estimatedTime;
      const bestScore = (best.rate * best.pieces) / best.estimatedTime;
      return currentScore > bestScore ? current : best;
    });
  };

  // Work Selection Tab
  const WorkSelectionTab = () => (
    <div className="space-y-6">
      {/* Smart Recommendation */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">🤖 AI सिफारिस</h3>
            <p className="text-blue-100">तपाईंको लागि सबैभन्दा फाइदाजनक काम</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              रु.{" "}
              {(
                ((getRecommendedWork().rate * getRecommendedWork().pieces) /
                  getRecommendedWork().estimatedTime) *
                60
              ).toFixed(0)}
            </div>
            <div className="text-blue-200 text-sm">प्रति घण्टा</div>
          </div>
        </div>

        <div className="mt-4 bg-white bg-opacity-20 rounded p-3">
          <div className="flex justify-between items-center">
            <span>
              {getRecommendedWork().article}# {getRecommendedWork().operation}
            </span>
            <button
              onClick={() => selectWork(getRecommendedWork())}
              className="px-4 py-2 bg-white text-blue-600 rounded font-medium hover:bg-blue-50 transition-colors"
            >
              यो काम लिनुहोस्
            </button>
          </div>
        </div>
      </div>

      {/* Available Work List */}
      <div className="grid grid-cols-1 gap-4">
        {availableWork.map((work) => (
          <div
            key={work.id}
            className={`bg-white rounded-lg shadow-md border-2 p-4 cursor-pointer transition-all ${
              currentWork?.id === work.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => selectWork(work)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    work.priority === "उच्च"
                      ? "bg-red-100"
                      : work.priority === "मध्यम"
                      ? "bg-yellow-100"
                      : "bg-green-100"
                  }`}
                >
                  <Package
                    className={`w-5 h-5 ${
                      work.priority === "उच्च"
                        ? "text-red-600"
                        : work.priority === "मध्यम"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {work.article}# {work.articleName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {work.color} • {work.size} • {work.operation}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  रु. {(work.pieces * work.rate).toFixed(0)}
                </div>
                <div className="text-sm text-gray-500">
                  {work.pieces} टुक्रा × रु. {work.rate}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">समय:</span>
                <div className="font-medium">{work.estimatedTime} मिनेट</div>
              </div>
              <div>
                <span className="text-gray-600">कठिनाई:</span>
                <div
                  className={`font-medium ${
                    work.difficulty === "कठिन"
                      ? "text-red-600"
                      : work.difficulty === "मध्यम"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {work.difficulty}
                </div>
              </div>
              <div>
                <span className="text-gray-600">प्राथमिकता:</span>
                <div
                  className={`font-medium ${
                    work.priority === "उच्च"
                      ? "text-red-600"
                      : work.priority === "मध्यम"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {work.priority}
                </div>
              </div>
            </div>

            {currentWork?.id === work.id && (
              <div className="mt-4 pt-3 border-t border-blue-200">
                <div className="flex space-x-3">
                  {!isWorking ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startWork();
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      काम सुरु गर्नुहोस्
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pauseWork();
                        }}
                        className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        रोक्नुहोस्
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          completeWork();
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        पूरा गर्नुहोस्
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Performance Tab
  const PerformanceTab = () => (
    <div className="space-y-6">
      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">आजका टुक्रा</p>
              <p className="text-2xl font-bold text-gray-900">
                {operatorStats.todayPieces}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">आजको कमाई</p>
              <p className="text-2xl font-bold text-gray-900">
                रु. {operatorStats.todayEarnings}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">दक्षता</p>
              <p className="text-2xl font-bold text-gray-900">
                {operatorStats.efficiency}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">गुणस्तर</p>
              <p className="text-2xl font-bold text-gray-900">
                {operatorStats.qualityScore}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          साप्ताहिक प्रगति
        </h3>
        <div className="space-y-3">
          {operatorStats.weeklyTrend.map((day, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-gray-600 w-16">{day.day}</span>
              <div className="flex-1 mx-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>{day.pieces} टुक्रा</span>
                  <span>{day.efficiency}% दक्षता</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(day.pieces / 100) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">उपलब्धिहरू</h3>
        <div className="space-y-3">
          {operatorStats.achievements.map((achievement, index) => (
            <div
              key={index}
              className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <div className="p-2 bg-yellow-100 rounded-lg">
                <achievement.icon className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="font-medium text-gray-800">
                  {achievement.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {achievement.description}
                </p>
              </div>
              <span className="text-sm text-gray-500">{achievement.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Current Work Status
  const CurrentWorkStatus = () => {
    if (!currentWork) return null;

    return (
      <div className="bg-white rounded-lg shadow-md border border-blue-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {isWorking ? "🔄 चलिरहेको काम" : "⏸️ रोकिएको काम"}
          </h3>
          <div className="text-sm text-gray-600">
            समय: {Math.floor(workTimer / 60)}:
            {(workTimer % 60).toString().padStart(2, "0")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">लेख:</p>
            <p className="font-semibold">
              {currentWork.article}# {currentWork.articleName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">काम:</p>
            <p className="font-semibold">{currentWork.operation}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">टुक्रा:</p>
            <p className="font-semibold">{currentWork.pieces} टुक्रा</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">दर:</p>
            <p className="font-semibold">रु. {currentWork.rate}/टुक्रा</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded p-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-800 font-medium">कुल कमाई:</span>
            <span className="text-2xl font-bold text-blue-600">
              रु. {(currentWork.pieces * currentWork.rate).toFixed(0)}
            </span>
          </div>
        </div>

        {qualityCheck.status && (
          <div
            className={`mt-4 p-3 rounded border ${
              qualityCheck.status === "राम्रो"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center">
              <CheckCircle
                className={`w-5 h-5 mr-2 ${
                  qualityCheck.status === "राम्रो"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              />
              <span
                className={`font-medium ${
                  qualityCheck.status === "राम्रो"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                गुणस्तर जाँच: {qualityCheck.status}
              </span>
            </div>
            {qualityCheck.defects > 0 && (
              <p className="text-sm text-red-700 mt-2">
                {qualityCheck.defects} टुक्रामा दोष फेला परेको
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Voice Control Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">🎤 स्मार्ट सेल्फ सर्भिस</h1>
            <p className="text-blue-100 text-sm">आवाज वा टच प्रयोग गर्नुहोस्</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`p-2 rounded-lg ${
                speechEnabled ? "bg-white bg-opacity-20" : "bg-gray-500"
              }`}
            >
              {speechEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={toggleVoiceRecognition}
              className={`p-2 rounded-lg ${
                isListening
                  ? "bg-red-500 animate-pulse"
                  : "bg-white bg-opacity-20"
              }`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {voiceCommand && (
          <div className="mt-2 p-2 bg-white bg-opacity-20 rounded text-sm">
            सुनिएको: "{voiceCommand}"
          </div>
        )}
      </div>

      {/* Current Work Status */}
      <div className="p-4">
        <CurrentWorkStatus />
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 mb-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("workSelection")}
            className={`flex-1 flex items-center justify-center py-3 rounded-md transition-all ${
              activeTab === "workSelection"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            <Package className="w-4 h-4 mr-2" />
            काम छान्नुहोस्
          </button>

          <button
            onClick={() => setActiveTab("performance")}
            className={`flex-1 flex items-center justify-center py-3 rounded-md transition-all ${
              activeTab === "performance"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600"
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            प्रदर्शन
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {activeTab === "workSelection" && <WorkSelectionTab />}
        {activeTab === "performance" && <PerformanceTab />}
      </div>

      {/* Voice Commands Help */}
      <div className="fixed bottom-4 right-4">
        <button className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Voice Commands Modal - Could be added */}
      {/* Quick Voice Commands:
      - "काम सुरु" - Start work
      - "काम बन्द" - Stop work  
      - "काम पूरा" - Complete work
      - "नयाँ काम" - New work
      - "प्रदर्शन" - Show performance
      */}
    </div>
  );
};

export default OperatorSelfService;
