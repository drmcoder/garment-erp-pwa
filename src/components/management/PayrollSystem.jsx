// src/components/management/PayrollSystem.jsx
// Advanced Payroll & Wage Calculation System

import React, { useState, useEffect } from "react";
import {
  Calculator,
  Download,
  Printer,
  Filter,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
} from "date-fns";
import { ne } from "date-fns/locale";

const PayrollSystem = () => {
  const { t, currentLanguage, formatNumber } = useLanguage();

  // State Management
  const [activeTab, setActiveTab] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [filterBy, setFilterBy] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  // Data States
  const [payrollData, setPayrollData] = useState({
    operators: [],
    summary: {},
    incentives: [],
    deductions: [],
  });

  // Load payroll data
  useEffect(() => {
    loadPayrollData();
  }, [selectedMonth]);

  const loadPayrollData = async () => {
    setIsCalculating(true);

    // Simulate API call
    setTimeout(() => {
      setPayrollData({
        operators: [
          {
            id: "op001",
            name: "राम सिंह",
            designation: "ओभरलक ऑपरेटर",
            employeeId: "EMP001",
            workingDays: 26,
            totalPieces: 2480,
            averageRate: 2.5,
            baseWage: 6200,
            productivityBonus: 620,
            qualityBonus: 310,
            overtimeEarnings: 450,
            attendanceBonus: 300,
            totalEarnings: 7880,
            pfDeduction: 372,
            taxDeduction: 0,
            advanceDeduction: 500,
            totalDeductions: 872,
            netPayable: 7008,
            efficiency: 95,
            qualityScore: 98,
            attendancePercent: 100,
            status: "active",
          },
          {
            id: "op002",
            name: "सीता देवी",
            designation: "फ्ल्यालक ऑपरेटर",
            employeeId: "EMP002",
            workingDays: 24,
            totalPieces: 2160,
            averageRate: 2.3,
            baseWage: 4968,
            productivityBonus: 497,
            qualityBonus: 248,
            overtimeEarnings: 320,
            attendanceBonus: 0,
            totalEarnings: 6033,
            pfDeduction: 298,
            taxDeduction: 0,
            advanceDeduction: 1000,
            totalDeductions: 1298,
            netPayable: 4735,
            efficiency: 92,
            qualityScore: 96,
            attendancePercent: 92,
            status: "active",
          },
          {
            id: "op003",
            name: "हरि बहादुर",
            designation: "सिंगल नीडल ऑपरेटर",
            employeeId: "EMP003",
            workingDays: 25,
            totalPieces: 2250,
            averageRate: 2.2,
            baseWage: 4950,
            productivityBonus: 495,
            qualityBonus: 248,
            overtimeEarnings: 280,
            attendanceBonus: 200,
            totalEarnings: 6173,
            pfDeduction: 308,
            taxDeduction: 0,
            advanceDeduction: 0,
            totalDeductions: 308,
            netPayable: 5865,
            efficiency: 88,
            qualityScore: 94,
            attendancePercent: 96,
            status: "active",
          },
        ],
        summary: {
          totalOperators: 48,
          activeOperators: 45,
          totalPayroll: 267840,
          totalDeductions: 23456,
          netPayroll: 244384,
          averageWage: 5497,
          averageEfficiency: 91,
          bonusDistributed: 34567,
          overtimePaid: 12890,
        },
        incentives: [
          {
            type: "productivityBonus",
            name: "उत्पादकता बोनस",
            rate: "10%",
            condition: "दक्षता > 90%",
          },
          {
            type: "qualityBonus",
            name: "गुणस्तर बोनस",
            rate: "5%",
            condition: "गुणस्तर > 95%",
          },
          {
            type: "attendanceBonus",
            name: "उपस्थिति बोनस",
            rate: "रु. 300",
            condition: "100% उपस्थिति",
          },
          {
            type: "overtimeRate",
            name: "ओभरटाइम दर",
            rate: "1.5x",
            condition: "8 घण्टा पछि",
          },
        ],
        deductions: [
          { type: "pf", name: "भविष्य कोष", rate: "6%", mandatory: true },
          {
            type: "tax",
            name: "आयकर",
            rate: "स्ल्याब अनुसार",
            mandatory: true,
          },
          {
            type: "advance",
            name: "एड्भान्स",
            rate: "Variable",
            mandatory: false,
          },
        ],
      });
      setIsCalculating(false);
    }, 1500);
  };

  // Filter operators based on search and filter criteria
  const filteredOperators = payrollData.operators.filter((operator) => {
    const matchesSearch =
      operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterBy === "all" ||
      (filterBy === "highPerformers" && operator.efficiency >= 95) ||
      (filterBy === "lowPerformers" && operator.efficiency < 85) ||
      (filterBy === "fullAttendance" && operator.attendancePercent === 100);

    return matchesSearch && matchesFilter;
  });

  // Calculate payroll summary
  const calculatePayrollSummary = () => {
    const totalGross = filteredOperators.reduce(
      (sum, op) => sum + op.totalEarnings,
      0
    );
    const totalDeductions = filteredOperators.reduce(
      (sum, op) => sum + op.totalDeductions,
      0
    );
    const totalNet = filteredOperators.reduce(
      (sum, op) => sum + op.netPayable,
      0
    );

    return { totalGross, totalDeductions, totalNet };
  };

  // Generate payslip
  const generatePayslip = (operator) => {
    setSelectedPayslip(operator);
    setShowPayslipModal(true);
  };

  // Export to Excel
  const exportToExcel = () => {
    // Implementation for Excel export
    const csvContent = [
      [
        "Employee ID",
        "Name",
        "Designation",
        "Base Wage",
        "Bonuses",
        "Deductions",
        "Net Payable",
      ],
      ...filteredOperators.map((op) => [
        op.employeeId,
        op.name,
        op.designation,
        op.baseWage,
        op.productivityBonus + op.qualityBonus + op.attendanceBonus,
        op.totalDeductions,
        op.netPayable,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${format(selectedMonth, "yyyy-MM")}.csv`;
    a.click();
  };

  // Payslip Modal Component
  const PayslipModal = ({ operator, onClose }) => {
    if (!operator) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {currentLanguage === "np" ? "पेस्लिप" : "Payslip"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Payslip Content */}
          <div className="p-6">
            {/* Company Header */}
            <div className="text-center mb-6 border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-bold text-gray-800">गारमेन्ट ERP</h1>
              <p className="text-gray-600">उत्पादन व्यवस्थापन</p>
              <p className="text-sm text-gray-500">
                {currentLanguage === "np" ? "महिना" : "Month"}:{" "}
                {format(selectedMonth, "MMMM yyyy", {
                  locale: currentLanguage === "np" ? ne : undefined,
                })}
              </p>
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p>
                  <strong>
                    {currentLanguage === "np" ? "कर्मचारी ID" : "Employee ID"}:
                  </strong>{" "}
                  {operator.employeeId}
                </p>
                <p>
                  <strong>{currentLanguage === "np" ? "नाम" : "Name"}:</strong>{" "}
                  {operator.name}
                </p>
                <p>
                  <strong>
                    {currentLanguage === "np" ? "पद" : "Designation"}:
                  </strong>{" "}
                  {operator.designation}
                </p>
              </div>
              <div>
                <p>
                  <strong>
                    {currentLanguage === "np"
                      ? "काम गरेको दिन"
                      : "Working Days"}
                    :
                  </strong>{" "}
                  {operator.workingDays}
                </p>
                <p>
                  <strong>
                    {currentLanguage === "np" ? "कुल टुक्रा" : "Total Pieces"}:
                  </strong>{" "}
                  {formatNumber(operator.totalPieces)}
                </p>
                <p>
                  <strong>
                    {currentLanguage === "np" ? "औसत दर" : "Average Rate"}:
                  </strong>{" "}
                  रु. {operator.averageRate}
                </p>
              </div>
            </div>

            {/* Earnings */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                {currentLanguage === "np" ? "आम्दानी" : "Earnings"}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>
                    {currentLanguage === "np" ? "आधारभूत तलब" : "Base Wage"}:
                  </span>
                  <span>रु. {formatNumber(operator.baseWage)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {currentLanguage === "np"
                      ? "उत्पादकता बोनस"
                      : "Productivity Bonus"}
                    :
                  </span>
                  <span>रु. {formatNumber(operator.productivityBonus)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {currentLanguage === "np"
                      ? "गुणस्तर बोनस"
                      : "Quality Bonus"}
                    :
                  </span>
                  <span>रु. {formatNumber(operator.qualityBonus)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {currentLanguage === "np" ? "ओभरटाइम" : "Overtime"}:
                  </span>
                  <span>रु. {formatNumber(operator.overtimeEarnings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {currentLanguage === "np"
                      ? "उपस्थिति बोनस"
                      : "Attendance Bonus"}
                    :
                  </span>
                  <span>रु. {formatNumber(operator.attendanceBonus)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-200 pt-2">
                  <span>
                    {currentLanguage === "np"
                      ? "कुल आम्दानी"
                      : "Total Earnings"}
                    :
                  </span>
                  <span>रु. {formatNumber(operator.totalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                {currentLanguage === "np" ? "कटौती" : "Deductions"}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>
                    {currentLanguage === "np" ? "भविष्य कोष" : "Provident Fund"}
                    :
                  </span>
                  <span>रु. {formatNumber(operator.pfDeduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {currentLanguage === "np" ? "आयकर" : "Income Tax"}:
                  </span>
                  <span>रु. {formatNumber(operator.taxDeduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {currentLanguage === "np" ? "एड्भान्स" : "Advance"}:
                  </span>
                  <span>रु. {formatNumber(operator.advanceDeduction)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-200 pt-2">
                  <span>
                    {currentLanguage === "np"
                      ? "कुल कटौती"
                      : "Total Deductions"}
                    :
                  </span>
                  <span>रु. {formatNumber(operator.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Payable */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-green-800">
                  {currentLanguage === "np"
                    ? "कुल भुक्तानी योग्य रकम"
                    : "Net Payable Amount"}
                  :
                </span>
                <span className="text-2xl font-bold text-green-600">
                  रु. {formatNumber(operator.netPayable)}
                </span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {operator.efficiency}%
                </div>
                <div className="text-sm text-gray-600">
                  {currentLanguage === "np" ? "दक्षता" : "Efficiency"}
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {operator.qualityScore}%
                </div>
                <div className="text-sm text-gray-600">
                  {currentLanguage === "np" ? "गुणस्तर" : "Quality"}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {operator.attendancePercent}%
                </div>
                <div className="text-sm text-gray-600">
                  {currentLanguage === "np" ? "उपस्थिति" : "Attendance"}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>
                यो कम्प्युटर जेनेरेटेड पेस्लिप हो। हस्ताक्षरको आवश्यकता छैन।
              </p>
              <p>Generated on: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-6 flex justify-end space-x-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Printer className="w-4 h-4 mr-2" />
              {currentLanguage === "np" ? "प्रिन्ट" : "Print"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {currentLanguage === "np" ? "बन्द गर्नुहोस्" : "Close"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {currentLanguage === "np"
                ? "पेरोल व्यवस्थापन"
                : "Payroll Management"}
            </h1>
            <p className="text-gray-600">
              {currentLanguage === "np"
                ? "मासिक तलब गणना र पेस्लिप जेनेरेसन"
                : "Monthly wage calculation and payslip generation"}
            </p>
          </div>

          <div className="flex space-x-3 mt-4 lg:mt-0">
            <button
              onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← {currentLanguage === "np" ? "अघिल्लो महिना" : "Previous"}
            </button>
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
              {format(selectedMonth, "MMMM yyyy", {
                locale: currentLanguage === "np" ? ne : undefined,
              })}
            </div>
            <button
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {currentLanguage === "np" ? "अर्को महिना" : "Next"} →
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {currentLanguage === "np" ? "कुल ऑपरेटर" : "Total Operators"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {payrollData.summary.totalOperators}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {currentLanguage === "np" ? "कुल पेरोल" : "Total Payroll"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  रु. {formatNumber(payrollData.summary.totalPayroll)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {currentLanguage === "np"
                    ? "बोनस वितरण"
                    : "Bonus Distributed"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  रु. {formatNumber(payrollData.summary.bonusDistributed)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {currentLanguage === "np"
                    ? "औसत दक्षता"
                    : "Average Efficiency"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {payrollData.summary.averageEfficiency}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    currentLanguage === "np" ? "खोज्नुहोस्..." : "Search..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>

              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">
                  {currentLanguage === "np" ? "सबै" : "All"}
                </option>
                <option value="highPerformers">
                  {currentLanguage === "np"
                    ? "उच्च प्रदर्शनकर्ता"
                    : "High Performers"}
                </option>
                <option value="lowPerformers">
                  {currentLanguage === "np"
                    ? "कम प्रदर्शनकर्ता"
                    : "Low Performers"}
                </option>
                <option value="fullAttendance">
                  {currentLanguage === "np"
                    ? "पूर्ण उपस्थिति"
                    : "Full Attendance"}
                </option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                {currentLanguage === "np" ? "एक्सपोर्ट" : "Export"}
              </button>
              <button
                onClick={loadPayrollData}
                disabled={isCalculating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Calculator
                  className={`w-4 h-4 mr-2 ${
                    isCalculating ? "animate-spin" : ""
                  }`}
                />
                {isCalculating
                  ? currentLanguage === "np"
                    ? "गणना हुँदै..."
                    : "Calculating..."
                  : currentLanguage === "np"
                  ? "पुनः गणना"
                  : "Recalculate"}
              </button>
            </div>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === "np" ? "कर्मचारी" : "Employee"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === "np" ? "कार्यदिन" : "Work Days"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === "np"
                      ? "टुक्रा/दक्षता"
                      : "Pieces/Efficiency"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === "np" ? "आधारभूत तलब" : "Base Wage"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === "np" ? "बोनस" : "Bonuses"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === "np" ? "कटौती" : "Deductions"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === "np" ? "नेट पेमेन्ट" : "Net Payment"}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentLanguage === "np" ? "कार्य" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOperators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {operator.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {operator.employeeId}
                        </div>
                        <div className="text-xs text-gray-400">
                          {operator.designation}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {operator.workingDays} दिन
                      </div>
                      <div className="text-xs text-gray-500">
                        {operator.attendancePercent}% उपस्थिति
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatNumber(operator.totalPieces)} टुक्रा
                      </div>
                      <div className="text-xs text-gray-500">
                        {operator.efficiency}% दक्षता
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        रु. {formatNumber(operator.baseWage)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        रु.{" "}
                        {formatNumber(
                          operator.productivityBonus +
                            operator.qualityBonus +
                            operator.attendanceBonus
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        +{formatNumber(operator.overtimeEarnings)} ओभरटाइम
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        रु. {formatNumber(operator.totalDeductions)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        रु. {formatNumber(operator.netPayable)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => generatePayslip(operator)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                रु. {formatNumber(calculatePayrollSummary().totalGross)}
              </div>
              <div className="text-sm text-gray-600">
                {currentLanguage === "np"
                  ? "कुल ग्रस पेमेन्ट"
                  : "Total Gross Payment"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                रु. {formatNumber(calculatePayrollSummary().totalDeductions)}
              </div>
              <div className="text-sm text-gray-600">
                {currentLanguage === "np" ? "कुल कटौती" : "Total Deductions"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                रु. {formatNumber(calculatePayrollSummary().totalNet)}
              </div>
              <div className="text-sm text-gray-600">
                {currentLanguage === "np"
                  ? "कुल नेट पेमेन्ट"
                  : "Total Net Payment"}
              </div>
            </div>
          </div>
        </div>

        {/* Payslip Modal */}
        {showPayslipModal && (
          <PayslipModal
            operator={selectedPayslip}
            onClose={() => setShowPayslipModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PayrollSystem;
