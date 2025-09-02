// src/components/management/AdvancedManagementDashboard.jsx
// Enhanced Management Dashboard with Advanced Analytics and Visualizations

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Factory,
  Zap,
  Award,
  BarChart3,
  RefreshCw,
  Wrench,
  Cog,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { 
  useUsers,
  useProductionAnalytics,
  useSupervisorData,
  useCentralizedStatus
} from "../../hooks/useAppData";
import DamageAnalyticsDashboard from './DamageAnalyticsDashboard';
import SupervisorManagement from '../admin/SupervisorManagement';
import MachineManagement from '../admin/MachineManagement';

const AdvancedManagementDashboard = () => {
  const { user } = useAuth();
  const { currentLanguage, formatNumber } = useLanguage();
  
  // Use centralized data hooks
  const { allUsers, loading: usersLoading } = useUsers();
  const { loading: productionLoading } = useProductionAnalytics();
  const { workData } = useSupervisorData();
  const { isReady } = useCentralizedStatus();

  // State Management
  const [activeView, setActiveView] = useState("overview");
  const [dateRange, setDateRange] = useState("thisMonth");
  const [timeFilter, setTimeFilter] = useState("daily");
  const isLoading = usersLoading || productionLoading;

  // Derive dashboard data from centralized hooks
  const dashboardData = React.useMemo(() => {
    if (!isReady) return {
      kpis: {
        totalProduction: 0,
        targetProduction: 0,
        efficiency: 0,
        qualityScore: 0,
        activeOperators: 0,
        totalOperators: 0,
        revenue: 0,
        profit: 0,
        costPerPiece: 0,
        onTimeDelivery: 0,
      },
      productionTrends: [],
      operatorPerformance: [],
      qualityMetrics: [],
      financialData: [],
      efficiencyData: [],
      hourlyProduction: [],
    };

    // Calculate metrics from centralized data
    const operators = allUsers?.filter(user => user.role === 'operator') || [];
    const activeOps = operators.filter(op => op.status === 'working');
    const totalProduced = workData?.totalProductionToday || 0;
    const avgEfficiency = operators.length > 0 ? 
      operators.reduce((sum, op) => sum + (op.currentEfficiency || 0), 0) / operators.length : 0;
    
    return {
      kpis: {
        totalProduction: totalProduced,
        targetProduction: workData?.targetProduction || 1000,
        efficiency: Math.round(avgEfficiency),
        qualityScore: Math.round(operators.reduce((sum, op) => sum + (op.qualityScore || 95), 0) / (operators.length || 1)),
        activeOperators: activeOps.length,
        totalOperators: operators.length,
        revenue: totalProduced * 12.5, // Estimate
        profit: totalProduced * 3.2, // Estimate  
        costPerPiece: 9.3,
        onTimeDelivery: 92,
      },
      productionTrends: workData?.productionTrends || [],
      operatorPerformance: operators.slice(0, 10).map(op => ({
        id: op.id,
        name: op.name,
        efficiency: op.currentEfficiency || 0,
        production: op.dailyProduction || 0,
        quality: op.qualityScore || 95
      })),
      qualityMetrics: workData?.qualityMetrics || [],
      financialData: workData?.financialData || [],
      efficiencyData: workData?.efficiencyTrends || [],
      hourlyProduction: workData?.hourlyProduction || [],
    };
  }, [isReady, allUsers, workData]);

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

  // const pieColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]; // Unused

  // Overview Dashboard
  const OverviewDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">

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


  // Main Render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                {currentLanguage === "np"
                  ? "व्यवस्थापन ड्यासबोर्ड"
                  : "Management Dashboard"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 truncate">
                {currentLanguage === "np" ? "स्वागत छ" : "Welcome"},{" "}
                {user?.name || "Manager"}!
                {currentLanguage === "np"
                  ? " आजको प्रदर्शन देख्नुहोस्।"
                  : " View today's performance."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
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
              onClick={() => {/* Data auto-refreshes via centralized hooks */}}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm w-full sm:w-auto"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {currentLanguage === "np" ? "रिफ्रेस" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto space-x-1 mb-4 sm:mb-6 bg-gray-100 p-1 rounded-lg scrollbar-hide">
          {[
            {
              key: "overview",
              label: currentLanguage === "np" ? "सारांश" : "Overview",
              icon: BarChart3,
            },
            {
              key: "damage",
              label: currentLanguage === "np" ? "क्षति विश्लेषण" : "Damage Analytics",
              icon: Wrench,
            },
            {
              key: "personnel",
              label: currentLanguage === "np" ? "कर्मचारीहरू" : "Personnel",
              icon: Users,
            },
            {
              key: "machines",
              label: currentLanguage === "np" ? "मेसिनहरू" : "Machines",
              icon: Cog,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`flex items-center px-2 sm:px-4 py-2 rounded-md transition-all whitespace-nowrap text-xs sm:text-sm ${
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
            {activeView === "damage" && <DamageAnalyticsDashboard />}
            {activeView === "personnel" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      {currentLanguage === "np" ? "सुपरभाइजरहरू" : "Supervisors"}
                      <span className="ml-2 text-sm text-gray-500">
                        {currentLanguage === "np" ? "(अपरेटरहरू सुपरभाइजरले व्यवस्थापन गर्छन्)" : "(Operators managed by supervisors)"}
                      </span>
                    </h3>
                  </div>
                  <div className="p-4">
                    <SupervisorManagement />
                  </div>
                </div>
              </div>
            )}
            {activeView === "machines" && <MachineManagement />}
          </>
        )}
      </div>
    </div>
  );
};

export default AdvancedManagementDashboard;
