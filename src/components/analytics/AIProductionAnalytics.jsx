// src/components/analytics/AIProductionAnalytics.jsx
// AI-Powered Production Analytics with Predictive Insights

import React, { useState, useEffect } from "react";
import BackButton from '../common/BackButton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Award,
  DollarSign,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const AIProductionAnalytics = ({ onBack }) => {
  const { t, currentLanguage } = useLanguage();

  // State Management
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");
  const selectedMetric = "efficiency";
  const [activeInsight, setActiveInsight] = useState("predictions");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analytics Data
  const [analyticsData, setAnalyticsData] = useState({
    predictions: [],
    trends: [],
    bottlenecks: [],
    opportunities: [],
    correlations: [],
    anomalies: [],
    recommendations: [],
  });

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe, selectedMetric]);

  const loadAnalyticsData = async () => {
    setIsAnalyzing(true);

    // Simulate AI analysis
    setTimeout(() => {
      setAnalyticsData({
        predictions: [
          {
            date: "आज",
            predictedEfficiency: 87,
            actualEfficiency: 85,
            confidence: 92,
            factors: ["मौसम", "ऑपरेटर उपस्थिति", "मेसिन स्थिति"],
          },
          {
            date: "भोलि",
            predictedEfficiency: 89,
            confidence: 88,
            factors: ["राम्रो मौसम", "पूर्ण टिम", "नयाँ मेसिन"],
          },
          {
            date: "पर्सि",
            predictedEfficiency: 83,
            confidence: 85,
            factors: ["छुट्टीको दिन", "कम ऑपरेटर"],
          },
        ],
        trends: [
          {
            week: "हप्ता 1",
            efficiency: 82,
            quality: 94,
            production: 4500,
            prediction: 85,
          },
          {
            week: "हप्ता 2",
            efficiency: 85,
            quality: 96,
            production: 4750,
            prediction: 87,
          },
          {
            week: "हप्ता 3",
            efficiency: 88,
            quality: 95,
            production: 4920,
            prediction: 89,
          },
          {
            week: "हप्ता 4",
            efficiency: 85,
            quality: 97,
            production: 4680,
            prediction: 87,
          },
          {
            week: "हप्ता 5",
            efficiency: 90,
            quality: 98,
            production: 5100,
            prediction: 91,
          },
          {
            week: "हप्ता 6",
            efficiency: 87,
            quality: 96,
            production: 4850,
            prediction: 89,
          },
        ],
        bottlenecks: [
          {
            station: "ओभरलक स्टेसन २",
            impact: "उच्च",
            waitTime: 15,
            frequency: 85,
            recommendation: "अतिरिक्त ऑपरेटर थप्नुहोस्",
            potentialGain: "12% दक्षता वृद्धि",
          },
          {
            station: "बटनहोल मेसिन",
            impact: "मध्यम",
            waitTime: 8,
            frequency: 60,
            recommendation: "मेसिन मर्मत गर्नुहोस्",
            potentialGain: "7% दक्षता वृद्धि",
          },
          {
            station: "आइरनिङ स्टेसन",
            impact: "कम",
            waitTime: 5,
            frequency: 40,
            recommendation: "कार्यप्रवाह सुधार गर्नुहोस्",
            potentialGain: "3% दक्षता वृद्धि",
          },
        ],
        opportunities: [
          {
            type: "efficiency",
            title: "दक्षता सुधार अवसर",
            description:
              "राम सिंह र सीता देवीलाई फ्ल्यालक ट्रेनिङ दिएर 8% दक्षता बढाउन सकिन्छ",
            impact: "उच्च",
            effort: "मध्यम",
            timeline: "२ हप्ता",
            roi: "15%",
          },
          {
            type: "quality",
            title: "गुणस्तर सुधार",
            description:
              "नयाँ गुणस्तर चेक प्रणाली लागू गरेर दोष 25% कम गर्न सकिन्छ",
            impact: "उच्च",
            effort: "उच्च",
            timeline: "१ महिना",
            roi: "22%",
          },
          {
            type: "cost",
            title: "लागत कटौती",
            description:
              "कपडाको बर्बादी कम गरेर मासिक रु. 15,000 बचत गर्न सकिन्छ",
            impact: "मध्यम",
            effort: "कम",
            timeline: "१ हप्ता",
            roi: "18%",
          },
        ],
        correlations: [
          { factor: "मौसम", efficiency: 0.72, quality: 0.45, production: 0.68 },
          {
            factor: "उपस्थिति",
            efficiency: 0.89,
            quality: 0.67,
            production: 0.91,
          },
          {
            factor: "मेसिन आयु",
            efficiency: -0.34,
            quality: -0.56,
            production: -0.41,
          },
          {
            factor: "ऑपरेटर अनुभव",
            efficiency: 0.78,
            quality: 0.82,
            production: 0.74,
          },
          {
            factor: "कपडाको गुणस्तर",
            efficiency: 0.45,
            quality: 0.89,
            production: 0.52,
          },
        ],
        anomalies: [
          {
            date: "२०८२/०४/०८",
            type: "दक्षता ड्रप",
            value: 65,
            expected: 85,
            cause: "मेसिन बिग्रिएको",
            resolved: true,
          },
          {
            date: "२०८२/०४/१०",
            type: "गुणस्तर समस्या",
            value: 88,
            expected: 96,
            cause: "कपडाको समस्या",
            resolved: true,
          },
          {
            date: "२०८२/०४/१२",
            type: "उत्पादन स्पाइक",
            value: 125,
            expected: 100,
            cause: "ओभरटाइम काम",
            resolved: false,
          },
        ],
        recommendations: [
          {
            id: 1,
            priority: "उच्च",
            category: "दक्षता",
            title: "ओभरलक स्टेसन २ मा अतिरिक्त ऑपरेटर",
            description: "मुख्य बाटलनेक हटाउन अतिरिक्त ऑपरेटर राख्नुहोस्",
            impact: "+12% दक्षता",
            cost: "रु. 25,000/महिना",
            timeframe: "तुरुन्त",
          },
          {
            id: 2,
            priority: "मध्यम",
            category: "गुणस्तर",
            title: "गुणस्तर ट्रेनिङ कार्यक्रम",
            description: "सबै ऑपरेटरलाई गुणस्तर ट्रेनिङ दिनुहोस्",
            impact: "+5% गुणस्तर",
            cost: "रु. 15,000",
            timeframe: "२ हप्ता",
          },
          {
            id: 3,
            priority: "कम",
            category: "लागत",
            title: "मेसिन मर्मत कार्यक्रम",
            description: "नियमित मेसिन मर्मत गर्नुहोस्",
            impact: "+3% दक्षता",
            cost: "रु. 8,000/महिना",
            timeframe: "१ महिना",
          },
        ],
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  // AI Insight Components
  const PredictiveInsights = () => (
    <div className="space-y-6">
      {/* Predictions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analyticsData.predictions.map((prediction, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {prediction.date}
              </h3>
              <div className="flex items-center text-blue-600">
                <Brain className="w-5 h-5 mr-1" />
                <span className="text-sm">{prediction.confidence}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">पूर्वानुमान दक्षता:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {prediction.predictedEfficiency}%
                </span>
              </div>

              {prediction.actualEfficiency && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">वास्तविक दक्षता:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {prediction.actualEfficiency}%
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  प्रभावकारी तत्वहरू:
                </p>
                <div className="flex flex-wrap gap-1">
                  {prediction.factors.map((factor, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Prediction Chart */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          दक्षता ट्रेन्ड र पूर्वानुमान
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={analyticsData.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="#3B82F6"
              strokeWidth={2}
              name="वास्तविक दक्षता"
            />
            <Line
              type="monotone"
              dataKey="prediction"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="AI पूर्वानुमान"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const BottleneckAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bottleneck List */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            मुख्य बाटलनेकहरू
          </h3>
          <div className="space-y-4">
            {analyticsData.bottlenecks.map((bottleneck, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">
                    {bottleneck.station}
                  </h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      bottleneck.impact === "उच्च"
                        ? "bg-red-100 text-red-700"
                        : bottleneck.impact === "मध्यम"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {bottleneck.impact} प्रभाव
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">प्रतीक्षा समय:</p>
                    <p className="font-semibold">{bottleneck.waitTime} मिनेट</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">आवृत्ति:</p>
                    <p className="font-semibold">{bottleneck.frequency}%</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded p-3">
                  <p className="text-sm text-blue-800 font-medium">सुझाव:</p>
                  <p className="text-sm text-blue-700">
                    {bottleneck.recommendation}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    सम्भावित लाभ: {bottleneck.potentialGain}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Correlation Matrix */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            कारक सह-सम्बन्ध विश्लेषण
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">कारक</th>
                  <th className="text-center py-2">दक्षता</th>
                  <th className="text-center py-2">गुणस्तर</th>
                  <th className="text-center py-2">उत्पादन</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.correlations.map((correlation, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 font-medium">{correlation.factor}</td>
                    <td className="text-center py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          correlation.efficiency > 0.7
                            ? "bg-green-100 text-green-700"
                            : correlation.efficiency > 0.3
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {correlation.efficiency.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          correlation.quality > 0.7
                            ? "bg-green-100 text-green-700"
                            : correlation.quality > 0.3
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {correlation.quality.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          correlation.production > 0.7
                            ? "bg-green-100 text-green-700"
                            : correlation.production > 0.3
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {correlation.production.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const OpportunityAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {analyticsData.opportunities.map((opportunity, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-2 rounded-lg ${
                  opportunity.type === "efficiency"
                    ? "bg-blue-100"
                    : opportunity.type === "quality"
                    ? "bg-purple-100"
                    : "bg-green-100"
                }`}
              >
                {opportunity.type === "efficiency" ? (
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                ) : opportunity.type === "quality" ? (
                  <Award className="w-5 h-5 text-purple-600" />
                ) : (
                  <DollarSign className="w-5 h-5 text-green-600" />
                )}
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  opportunity.impact === "उच्च"
                    ? "bg-red-100 text-red-700"
                    : opportunity.impact === "मध्यम"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {opportunity.impact} प्रभाव
              </span>
            </div>

            <h4 className="font-semibold text-gray-800 mb-2">
              {opportunity.title}
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              {opportunity.description}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">समयसीमा:</span>
                <span className="font-medium">{opportunity.timeline}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">प्रयास:</span>
                <span className="font-medium">{opportunity.effort}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ROI:</span>
                <span className="font-medium text-green-600">
                  {opportunity.roi}
                </span>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              कार्यान्वयन गर्नुहोस्
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const AnomalyDetection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          असामान्य घटनाहरू
        </h3>
        <div className="space-y-4">
          {analyticsData.anomalies.map((anomaly, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                anomaly.resolved
                  ? "border-green-200 bg-green-50"
                  : "border-orange-200 bg-orange-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <AlertTriangle
                    className={`w-5 h-5 mr-2 ${
                      anomaly.resolved ? "text-green-600" : "text-orange-600"
                    }`}
                  />
                  <span className="font-medium">{anomaly.type}</span>
                </div>
                <span className="text-sm text-gray-600">{anomaly.date}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600">वास्तविक मान:</p>
                  <p className="font-semibold">{anomaly.value}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">अपेक्षित मान:</p>
                  <p className="font-semibold">{anomaly.expected}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">भिन्नता:</p>
                  <p
                    className={`font-semibold ${
                      anomaly.value > anomaly.expected
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {anomaly.value > anomaly.expected ? "+" : ""}
                    {anomaly.value - anomaly.expected}%
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-700">
                <strong>कारण:</strong> {anomaly.cause}
              </p>

              <div className="mt-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    anomaly.resolved
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {anomaly.resolved ? "समाधान भयो" : "पेन्डिङ"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const RecommendationEngine = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          AI सिफारिसहरू
        </h3>
        <div className="space-y-4">
          {analyticsData.recommendations.map((rec) => (
            <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                      rec.priority === "उच्च"
                        ? "bg-red-100 text-red-700"
                        : rec.priority === "मध्यम"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {rec.priority} प्राथमिकता
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {rec.category}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{rec.timeframe}</span>
              </div>

              <h4 className="font-semibold text-gray-800 mb-2">{rec.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{rec.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">प्रभाव:</p>
                  <p className="font-semibold text-green-600">{rec.impact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">लागत:</p>
                  <p className="font-semibold">{rec.cost}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">समयसीमा:</p>
                  <p className="font-semibold">{rec.timeframe}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                  स्वीकार गर्नुहोस्
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  थप विवरण
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                  पछि गर्नुहोस्
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center space-x-4">
            {onBack && (
              <BackButton 
                onClick={onBack} 
                text={currentLanguage === "np" ? 'फिर्ता' : 'Back'} 
              />
            )}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Brain className="w-8 h-8 mr-3 text-blue-600" />
                🧠 {currentLanguage === "np" ? "AI उत्पादन विश्लेषण" : "AI Production Analytics"}
              </h1>
              <p className="text-gray-600">
                {currentLanguage === "np" 
                  ? "कृत्रिम बुद्धिमत्ता संचालित उत्पादन अन्तर्दृष्टि र पूर्वानुमान"
                  : "AI-powered production insights and predictions"
                }
              </p>
            </div>
          </div>

          <div className="flex space-x-3 mt-4 lg:mt-0">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">{currentLanguage === "np" ? "दैनिक" : "Daily"}</option>
              <option value="week">{currentLanguage === "np" ? "साप्ताहिक" : "Weekly"}</option>
              <option value="month">{currentLanguage === "np" ? "मासिक" : "Monthly"}</option>
              <option value="quarter">{currentLanguage === "np" ? "त्रैमासिक" : "Quarterly"}</option>
            </select>

            <button
              onClick={loadAnalyticsData}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isAnalyzing ? "animate-spin" : ""}`}
              />
              {isAnalyzing 
                ? (currentLanguage === "np" ? "विश्लेषण हुँदै..." : "Analyzing...")
                : (currentLanguage === "np" ? "नवीकरण गर्नुहोस्" : "Refresh")
              }
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { key: "predictions", label: currentLanguage === "np" ? "पूर्वानुमान" : "Predictions", icon: TrendingUp },
            { key: "bottlenecks", label: currentLanguage === "np" ? "बाटलनेक" : "Bottlenecks", icon: AlertTriangle },
            { key: "opportunities", label: currentLanguage === "np" ? "अवसरहरू" : "Opportunities", icon: Target },
            { key: "anomalies", label: currentLanguage === "np" ? "असामान्यता" : "Anomalies", icon: Eye },
            { key: "recommendations", label: currentLanguage === "np" ? "सिफारिसहरू" : "Recommendations", icon: Brain },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveInsight(tab.key)}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                activeInsight === tab.key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Brain className="w-12 h-12 animate-pulse text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">AI विश्लेषण चलिरहेको छ...</p>
              <p className="text-gray-500 text-sm">कृपया पर्खनुहोस्</p>
            </div>
          </div>
        ) : (
          <>
            {activeInsight === "predictions" && <PredictiveInsights />}
            {activeInsight === "bottlenecks" && <BottleneckAnalysis />}
            {activeInsight === "opportunities" && <OpportunityAnalysis />}
            {activeInsight === "anomalies" && <AnomalyDetection />}
            {activeInsight === "recommendations" && <RecommendationEngine />}
          </>
        )}
      </div>
    </div>
  );
};

export default AIProductionAnalytics;
