import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  TrendingUp,
  Users,
  Package,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  FileText,
  Printer,
  Send,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { db, collection, query, where, orderBy, getDocs, addDoc } from '../../config/firebase';

const DailyReports = () => {
  const { user } = useAuth();
  const { currentLanguage, formatDate, formatDateTime, formatCurrency } = useLanguage();
  const { showNotification } = useNotifications();
  const isNepali = currentLanguage === 'np';

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);

  // Load existing reports
  useEffect(() => {
    loadReportHistory();
  }, []);

  const loadReportHistory = async () => {
    try {
      const reportsQuery = query(
        collection(db, 'dailyReports'),
        orderBy('generatedAt', 'desc')
      );
      const snapshot = await getDocs(reportsQuery);
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReportHistory(reports);
    } catch (error) {
      console.error('Error loading report history:', error);
    }
  };

  // Generate daily report
  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const selectedDateObj = new Date(selectedDate);
      const startOfDay = new Date(selectedDateObj.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDateObj.setHours(23, 59, 59, 999));

      // Gather data from multiple collections
      const [operatorEarnings, workAssignments, lineInspections, damageReports] = await Promise.all([
        getDocs(query(
          collection(db, 'operatorEarnings'),
          where('completedAt', '>=', startOfDay),
          where('completedAt', '<=', endOfDay)
        )),
        getDocs(query(
          collection(db, 'workAssignments'),
          where('assignedAt', '>=', startOfDay),
          where('assignedAt', '<=', endOfDay)
        )),
        getDocs(query(
          collection(db, 'lineInspections'),
          where('createdAt', '>=', startOfDay),
          where('createdAt', '<=', endOfDay)
        )),
        getDocs(query(
          collection(db, 'damageReports'),
          where('reportedAt', '>=', startOfDay),
          where('reportedAt', '<=', endOfDay)
        ))
      ]);

      // Process data
      const earnings = operatorEarnings.docs.map(doc => doc.data());
      const assignments = workAssignments.docs.map(doc => doc.data());
      const inspections = lineInspections.docs.map(doc => doc.data());
      const damages = damageReports.docs.map(doc => doc.data());

      // Calculate metrics
      const totalEarnings = earnings.reduce((sum, e) => sum + (e.earnings || 0), 0);
      const totalPieces = earnings.reduce((sum, e) => sum + (e.pieces || 0), 0);
      const uniqueOperators = new Set(earnings.map(e => e.operatorId)).size;
      const completedWorks = earnings.length;
      const pendingWorks = assignments.filter(a => a.status === 'assigned').length;
      const avgRating = inspections.length > 0 
        ? inspections.reduce((sum, i) => sum + (i.overallRating || 0), 0) / inspections.length 
        : 0;
      const totalDamages = damages.length;
      const damageValue = damages.reduce((sum, d) => sum + (d.estimatedCost || 0), 0);

      // Operator performance
      const operatorPerformance = {};
      earnings.forEach(earning => {
        if (!operatorPerformance[earning.operatorId]) {
          operatorPerformance[earning.operatorId] = {
            name: earning.operatorName,
            totalEarnings: 0,
            totalPieces: 0,
            workCount: 0
          };
        }
        operatorPerformance[earning.operatorId].totalEarnings += earning.earnings || 0;
        operatorPerformance[earning.operatorId].totalPieces += earning.pieces || 0;
        operatorPerformance[earning.operatorId].workCount += 1;
      });

      const topPerformers = Object.values(operatorPerformance)
        .sort((a, b) => b.totalEarnings - a.totalEarnings)
        .slice(0, 5);

      // Line performance
      const linePerformance = {};
      inspections.forEach(inspection => {
        if (!linePerformance[inspection.lineId]) {
          linePerformance[inspection.lineId] = {
            lineName: inspection.lineName,
            inspections: 0,
            avgRating: 0,
            totalRating: 0
          };
        }
        linePerformance[inspection.lineId].inspections += 1;
        linePerformance[inspection.lineId].totalRating += inspection.overallRating || 0;
        linePerformance[inspection.lineId].avgRating = 
          linePerformance[inspection.lineId].totalRating / linePerformance[inspection.lineId].inspections;
      });

      const reportData = {
        date: selectedDate,
        generatedAt: new Date(),
        generatedBy: user.uid,
        generatorName: user.name,
        summary: {
          totalEarnings,
          totalPieces,
          uniqueOperators,
          completedWorks,
          pendingWorks,
          avgLineRating: avgRating,
          totalInspections: inspections.length,
          totalDamages,
          damageValue
        },
        topPerformers,
        linePerformance: Object.values(linePerformance),
        damageBreakdown: damages.map(d => ({
          type: d.damageType,
          count: 1,
          cost: d.estimatedCost || 0
        })),
        hourlyProductivity: generateHourlyData(earnings),
        recommendations: generateRecommendations({
          avgRating,
          totalDamages,
          uniqueOperators,
          completedWorks
        })
      };

      // Save report
      await addDoc(collection(db, 'dailyReports'), reportData);
      
      setReportData(reportData);
      loadReportHistory();
      showNotification(
        isNepali ? 'दैनिक रिपोर्ट सफलतापूर्वक तयार भयो' : 'Daily report generated successfully',
        'success'
      );
    } catch (error) {
      console.error('Error generating report:', error);
      showNotification(
        isNepali ? 'रिपोर्ट तयार गर्न समस्या भयो' : 'Error generating report',
        'error'
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  const generateHourlyData = (earnings) => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      pieces: 0,
      earnings: 0
    }));

    earnings.forEach(earning => {
      const hour = new Date(earning.completedAt).getHours();
      hourlyData[hour].pieces += earning.pieces || 0;
      hourlyData[hour].earnings += earning.earnings || 0;
    });

    return hourlyData.filter(h => h.pieces > 0 || h.earnings > 0);
  };

  const generateRecommendations = ({ avgRating, totalDamages, uniqueOperators, completedWorks }) => {
    const recommendations = [];
    
    if (avgRating < 3) {
      recommendations.push({
        type: 'warning',
        text: isNepali 
          ? 'लाइन गुणस्तरमा सुधार आवश्यक - थप प्रशिक्षण दिनुहोस्'
          : 'Line quality needs improvement - Provide additional training'
      });
    }

    if (totalDamages > 5) {
      recommendations.push({
        type: 'danger',
        text: isNepali
          ? 'क्षति रिपोर्ट धेरै छ - गुणस्तर नियन्त्रण बढाउनुहोस्'
          : 'High damage reports - Increase quality control measures'
      });
    }

    if (uniqueOperators < 10) {
      recommendations.push({
        type: 'info',
        text: isNepali
          ? 'अपरेटर संख्या कम छ - थप जनशक्ति आवश्यक'
          : 'Low operator count - Consider additional workforce'
      });
    }

    if (completedWorks > 50) {
      recommendations.push({
        type: 'success',
        text: isNepali
          ? 'उत्कृष्ट उत्पादकता - टोलीलाई बधाई!'
          : 'Excellent productivity - Congratulate the team!'
      });
    }

    return recommendations;
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const csvData = generateCSV(reportData);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-report-${reportData.date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (data) => {
    let csv = `Daily Production Report - ${data.date}\n\n`;
    csv += `Summary\n`;
    csv += `Total Earnings,${data.summary.totalEarnings}\n`;
    csv += `Total Pieces,${data.summary.totalPieces}\n`;
    csv += `Active Operators,${data.summary.uniqueOperators}\n`;
    csv += `Completed Works,${data.summary.completedWorks}\n`;
    csv += `Average Line Rating,${data.summary.avgLineRating.toFixed(2)}\n\n`;
    
    csv += `Top Performers\n`;
    csv += `Name,Earnings,Pieces,Works\n`;
    data.topPerformers.forEach(performer => {
      csv += `${performer.name},${performer.totalEarnings},${performer.totalPieces},${performer.workCount}\n`;
    });
    
    return csv;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          📊 {isNepali ? 'दैनिक रिपोर्ट' : 'Daily Reports'}
        </h2>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={generateReport}
            disabled={generatingReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {generatingReport ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
            <span>{isNepali ? 'रिपोर्ट तयार गर्नुहोस्' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium opacity-90">
                    {isNepali ? 'कुल आम्दानी' : 'Total Earnings'}
                  </h3>
                  <p className="text-2xl font-bold">
                    {formatCurrency(reportData.summary.totalEarnings)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium opacity-90">
                    {isNepali ? 'कुल टुक्राहरू' : 'Total Pieces'}
                  </h3>
                  <p className="text-2xl font-bold">{reportData.summary.totalPieces}</p>
                </div>
                <Package className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium opacity-90">
                    {isNepali ? 'सक्रिय अपरेटर' : 'Active Operators'}
                  </h3>
                  <p className="text-2xl font-bold">{reportData.summary.uniqueOperators}</p>
                </div>
                <Users className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium opacity-90">
                    {isNepali ? 'लाइन रेटिङ' : 'Avg Line Rating'}
                  </h3>
                  <p className="text-2xl font-bold">{reportData.summary.avgLineRating.toFixed(1)}/5</p>
                </div>
                <Target className="w-8 h-8 opacity-80" />
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">
              🏆 {isNepali ? 'शीर्ष प्रदर्शनकर्ता' : 'Top Performers'}
            </h3>
            <div className="space-y-3">
              {reportData.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-yellow-700' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-sm text-gray-600">
                        {performer.workCount} {isNepali ? 'काम' : 'works'} • {performer.totalPieces} {isNepali ? 'टुक्रा' : 'pieces'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(performer.totalEarnings)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {reportData.recommendations && reportData.recommendations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">
                💡 {isNepali ? 'सिफारिसहरू' : 'Recommendations'}
              </h3>
              <div className="space-y-3">
                {reportData.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      rec.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
                      rec.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                      rec.type === 'danger' ? 'bg-red-50 border-red-500 text-red-800' :
                      'bg-blue-50 border-blue-500 text-blue-800'
                    }`}
                  >
                    <p className="text-sm font-medium">{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">
              📤 {isNepali ? 'रिपोर्ट निकाल्नुहोस्' : 'Export Report'}
            </h3>
            <div className="flex space-x-4">
              <button
                onClick={exportReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{isNepali ? 'CSV डाउनलोड' : 'Download CSV'}</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <Printer className="w-4 h-4" />
                <span>{isNepali ? 'प्रिन्ट' : 'Print'}</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                <Send className="w-4 h-4" />
                <span>{isNepali ? 'इमेल पठाउनुहोस्' : 'Email Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            📋 {isNepali ? 'रिपोर्ट इतिहास' : 'Report History'}
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {reportHistory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>{isNepali ? 'कुनै रिपोर्ट फेला परेन' : 'No reports found'}</p>
            </div>
          ) : (
            reportHistory.map((report) => (
              <div key={report.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {isNepali ? 'दैनिक रिपोर्ट' : 'Daily Report'} - {formatDate(report.date)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {isNepali ? 'तयार गर्नेः' : 'Generated by'} {report.generatorName} • {formatDateTime(report.generatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setReportData(report)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      {isNepali ? 'हेर्नुहोस्' : 'View'}
                    </button>
                    <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReports;