// src/components/management/AdvancedManagementDashboard.jsx
// Enhanced Management Dashboard with Advanced Analytics and Visualizations

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Clock,
  AlertTriangle,
  Target,
  Award,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  DollarSign,
  Factory,
  Zap,
  BarChart3,
  Activity,
  Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AdvancedManagementDashboard = () => {
  const { user } = useAuth();
  const { t, currentLanguage, formatNumber, formatTime } = useLanguage();

  // State Management
  const [activeView, setActiveView] = useState("overview");
  const [dateRange, setDateRange] = useState("thisMonth");
  const [selectedMetric, setSelectedMetric] = useState("production");
  const [timeFilter, setTimeFilter] = useState("daily");
  const [isLoading, setIsLoading] = useState(false);

  // Data States
  const [dashboardData, setDashboardData] = useState({
    kpis: {},
    productionTrends: [],
    operatorPerformance: [],
    qualityMetrics: [],
    financialData: [],
    efficiencyData: [],
    lineComparison: [],
    hourlyProduction: [],
  });

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [dateRange, timeFilter]);

  const loadDashboardData = async () => {
    setIsLoading(true);

    // Simulate API call - replace with real data service
    setTimeout(() => {
      setDashboardData({
        kpis: {
          totalProduction: 12750,
          targetProduction: 15000,
          efficiency: 85,
          qualityScore: 96.2,
          activeOperators: 48,
          totalOperators: 50,
          revenue: 425000,
          profit: 127500,
          costPerPiece: 18.5,
          onTimeDelivery: 94,
        },
        productionTrends: [
          { date: "१ गते", planned: 500, actual: 485, efficiency: 97 },
          { date: "२ गते", planned: 520, actual: 510, efficiency: 98 },
          { date: "३ गते", planned: 480, actual: 465, efficiency: 97 },
          { date: "४ गते", planned: 600, actual: 520, efficiency: 87 },
          { date: "५ गते", planned: 550, actual: 540, efficiency: 98 },
          { date: "६ गते", planned: 500, actual: 495, efficiency: 99 },
          { date: "७ गते", planned: 580, actual: 575, efficiency: 99 },
        ],
        operatorPerformance: [
          {
            name: "राम सिंह",
            pieces: 125,
            efficiency: 98,
            quality: 99,
            earnings: 312,
          },
          {
            name: "सीता देवी",
            pieces: 120,
            efficiency: 96,
            quality: 97,
            earnings: 300,
          },
          {
            name: "हरि बहादुर",
            pieces: 118,
            efficiency: 94,
            quality: 98,
            earnings: 295,
          },
          {
            name: "गीता शर्मा",
            pieces: 115,
            efficiency: 92,
            quality: 96,
            earnings: 287,
          },
          {
            name: "कमल थापा",
            pieces: 110,
            efficiency: 88,
            quality: 94,
            earnings: 275,
          },
        ],
        qualityMetrics: [
          { defectType: "कपडामा प्वाल", count: 12, percentage: 35 },
          { defectType: "सिलाई दोष", count: 8, percentage: 23 },
          { defectType: "रङ मिलेन", count: 6, percentage: 18 },
          { defectType: "साइज गलत", count: 5, percentage: 15 },
          { defectType: "अन्य", count: 3, percentage: 9 },
        ],
        financialData: [
          { month: "फागुन", revenue: 380000, cost: 285000, profit: 95000 },
          { month: "चैत्र", revenue: 425000, cost: 297500, profit: 127500 },
          { month: "बैशाख", revenue: 465000, cost: 320000, profit: 145000 },
          { month: "जेठ", revenue: 520000, cost: 364000, profit: 156000 },
        ],
        efficiencyData: [
          { hour: "८ बजे", efficiency: 65, operators: 45 },
          { hour: "९ बजे", efficiency: 78, operators: 48 },
          { hour: "१० बजे", efficiency: 85, operators: 50 },
          { hour: "११ बजे", efficiency: 88, operators: 50 },
          { hour: "१२ बजे", efficiency: 72, operators: 48 },
          { hour: "१ बजे", efficiency: 45, operators: 25 },
          { hour: "२ बजे", efficiency: 82, operators: 48 },
          { hour: "३ बजे", efficiency: 87, operators: 50 },
          { hour: "४ बजे", efficiency: 85, operators: 49 },
        ],
        lineComparison: [
          { line: "लाइन A", target: 200, achieved: 185, efficiency: 92.5 },
          { line: "लाइन B", target: 180, achieved: 175, efficiency: 97.2 },
          { line: "लाइन C", target: 150, achieved: 138, efficiency: 92.0 },
          { line: "लाइन D", target: 120, achieved: 118, efficiency: 98.3 },
        ],
        hourlyProduction: [
          { time: "८:०० AM", pieces: 45 },
          { time: "९:०० AM", pieces: 68 },
          { time: "१०:०० AM", pieces: 85 },
          { time: "११:०० AM", pieces: 92 },
          { time: "१२:०० PM", pieces: 78 },
          { time: "१:०० PM", pieces: 42 },
          { time: "२:०० PM", pieces: 88 },
          { time: "३:०० PM", pieces: 95 },
          { time: "४:०० PM", pieces: 89 },
        ],
      });
      setIsLoading(false);
    }, 1000);
  };

  // KPI Card Component
  const KPICard = ({
    title,
    value,
    target,
    icon,
    color,
    trend,
    isPercentage = false,
  }) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {value}
              {isPercentage ? "%" : ""}
            </p>
            {target && (
              <p className="text-xs text-gray-500">
                {currentLanguage === "np" ? "लक्ष्य" : "Target"}: {target}
                {isPercentage ? "%" : ""}
              </p>
            )}
          </div>
        </div>
        {trend && (
          <div
            className={`flex items-center ${
              trend > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );

  // Chart Colors
  const chartColors = {
    primary: "#3B82F6",
    secondary: "#10B981",
    tertiary: "#F59E0B",
    quaternary: "#EF4444",
    accent: "#8B5CF6",
  };

  const pieColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  // Overview Dashboard
  const OverviewDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title={
            currentLanguage === "np" ? "आजको उत्पादन" : "Today's Production"
          }
          value={formatNumber(dashboardData.kpis.totalProduction)}
          target={formatNumber(dashboardData.kpis.targetProduction)}
          icon={<Factory className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
          trend={5}
        />

        <KPICard
          title={currentLanguage === "np" ? "दक्षता" : "Efficiency"}
          value={dashboardData.kpis.efficiency}
          target="90"
          icon={<Zap className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
          trend={3}
          isPercentage={true}
        />

        <KPICard
          title={currentLanguage === "np" ? "गुणस्तर स्कोर" : "Quality Score"}
          value={dashboardData.kpis.qualityScore}
          target="95"
          icon={<Award className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
          trend={2}
          isPercentage={true}
        />

        <KPICard
          title={
            currentLanguage === "np" ? "सक्रिय ऑपरेटर" : "Active Operators"
          }
          value={`${dashboardData.kpis.activeOperators}/${dashboardData.kpis.totalOperators}`}
          icon={<Users className="w-6 h-6 text-orange-600" />}
          color="bg-orange-100"
          trend={0}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trends */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {currentLanguage === "np"
                ? "उत्पादन ट्रेन्ड"
                : "Production Trend"}
            </h3>
            <div className="flex space-x-2">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="daily">
                  {currentLanguage === "np" ? "दैनिक" : "Daily"}
                </option>
                <option value="weekly">
                  {currentLanguage === "np" ? "साप्ताहिक" : "Weekly"}
                </option>
                <option value="monthly">
                  {currentLanguage === "np" ? "मासिक" : "Monthly"}
                </option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.productionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="planned"
                stroke={chartColors.primary}
                strokeWidth={2}
                name={currentLanguage === "np" ? "योजनाबद्ध" : "Planned"}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke={chartColors.secondary}
                strokeWidth={2}
                name={currentLanguage === "np" ? "वास्तविक" : "Actual"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Efficiency by Hour */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {currentLanguage === "np"
              ? "घण्टाको आधारमा दक्षता"
              : "Hourly Efficiency"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardData.efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="efficiency"
                stroke={chartColors.tertiary}
                fill={chartColors.tertiary}
                fillOpacity={0.3}
                name={currentLanguage === "np" ? "दक्षता %" : "Efficiency %"}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Issues */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {currentLanguage === "np" ? "गुणस्तर मुद्दाहरू" : "Quality Issues"}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dashboardData.qualityMetrics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="defectType"
              >
                {dashboardData.qualityMetrics.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={pieColors[index % pieColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line Comparison */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {currentLanguage === "np" ? "लाइन तुलना" : "Line Comparison"}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardData.lineComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="line" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="target"
                fill={chartColors.primary}
                name={currentLanguage === "np" ? "लक्ष्य" : "Target"}
              />
              <Bar
                dataKey="achieved"
                fill={chartColors.secondary}
                name={currentLanguage === "np" ? "हासिल" : "Achieved"}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {currentLanguage === "np" ? "शीर्ष कलाकार" : "Top Performers"}
          </h3>
          <div className="space-y-3">
            {dashboardData.operatorPerformance
              .slice(0, 5)
              .map((operator, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">
                        {operator.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {operator.pieces} टुक्रा
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      रु. {operator.earnings}
                    </p>
                    <p className="text-sm text-gray-600">
                      {operator.efficiency}%
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {currentLanguage === "np" ? "वित्तीय अवलोकन" : "Financial Overview"}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboardData.financialData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `रु. ${formatNumber(value)}`} />
            <Legend />
            <Bar
              dataKey="revenue"
              fill={chartColors.primary}
              name={currentLanguage === "np" ? "आम्दानी" : "Revenue"}
            />
            <Bar
              dataKey="cost"
              fill={chartColors.quaternary}
              name={currentLanguage === "np" ? "लागत" : "Cost"}
            />
            <Bar
              dataKey="profit"
              fill={chartColors.secondary}
              name={currentLanguage === "np" ? "नाफा" : "Profit"}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Production Analytics Dashboard
  const ProductionAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Production */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {currentLanguage === "np" ? "घण्टाको उत्पादन" : "Hourly Production"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.hourlyProduction}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pieces" fill={chartColors.primary} name="टुक्रा" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Efficiency Radial */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {currentLanguage === "np"
              ? "दक्षता मेट्रिक्स"
              : "Efficiency Metrics"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="10%"
              outerRadius="80%"
              barSize={20}
              data={[
                {
                  name: "Overall",
                  efficiency: dashboardData.kpis.efficiency,
                  fill: chartColors.primary,
                },
                {
                  name: "Quality",
                  efficiency: dashboardData.kpis.qualityScore,
                  fill: chartColors.secondary,
                },
                {
                  name: "OnTime",
                  efficiency: dashboardData.kpis.onTimeDelivery,
                  fill: chartColors.tertiary,
                },
              ]}
            >
              <RadialBar
                dataKey="efficiency"
                cornerRadius={10}
                fill="#8884d8"
              />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {currentLanguage === "np"
                ? "व्यवस्थापन ड्यासबोर्ड"
                : "Management Dashboard"}
            </h1>
            <p className="text-gray-600">
              {currentLanguage === "np" ? "स्वागत छ" : "Welcome"},{" "}
              {user?.name || "Manager"}!
              {currentLanguage === "np"
                ? " आजको प्रदर्शन देख्नुहोस्।"
                : " View today's performance."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4 lg:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">
                {currentLanguage === "np" ? "आज" : "Today"}
              </option>
              <option value="thisWeek">
                {currentLanguage === "np" ? "यो हप्ता" : "This Week"}
              </option>
              <option value="thisMonth">
                {currentLanguage === "np" ? "यो महिना" : "This Month"}
              </option>
              <option value="lastMonth">
                {currentLanguage === "np" ? "गत महिना" : "Last Month"}
              </option>
            </select>

            <button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {currentLanguage === "np" ? "रिफ्रेस" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            {
              key: "overview",
              label: currentLanguage === "np" ? "सारांश" : "Overview",
              icon: BarChart3,
            },
            {
              key: "production",
              label: currentLanguage === "np" ? "उत्पादन" : "Production",
              icon: Factory,
            },
            {
              key: "analytics",
              label: currentLanguage === "np" ? "विश्लेषण" : "Analytics",
              icon: Activity,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                activeView === tab.key
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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">
                {currentLanguage === "np"
                  ? "डेटा लोड हुँदै छ..."
                  : "Loading dashboard data..."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeView === "overview" && <OverviewDashboard />}
            {activeView === "production" && <ProductionAnalytics />}
            {activeView === "analytics" && <ProductionAnalytics />}
          </>
        )}
      </div>
    </div>
  );
};

export default AdvancedManagementDashboard;
