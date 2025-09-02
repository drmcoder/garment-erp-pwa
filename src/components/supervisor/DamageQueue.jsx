// src/components/supervisor/DamageQueue.jsx
// Supervisor interface for managing damaged pieces and rework

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { NotificationContext } from '../../context/NotificationContext';
import { damageReportService } from '../../services/DamageReportService';

const DamageQueue = () => {
  const { user } = useContext(AuthContext);
  const { isNepali } = useContext(LanguageContext);
  const { showNotification } = useContext(NotificationContext);

  const [damageReports, setDamageReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reworkModal, setReworkModal] = useState(false);

  const [reworkData, setReworkData] = useState({
    partsReplaced: [],
    notes: '',
    timeSpent: 0,
    qualityCheck: false
  });

  useEffect(() => {
    loadDamageQueue();
    // Set up real-time updates
    const interval = setInterval(loadDamageQueue, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDamageQueue = async () => {
    try {
      // Load real damage reports from service
      const result = await damageReportService.getSupervisorDamageQueue(user.id || 'supervisor');
      
      if (result.success) {
        setDamageReports(result.data);
      } else {
        console.error('Error loading damage queue:', result.error);
        setDamageReports([]); // Empty array instead of mock data
      }
    } catch (error) {
      console.error('Error loading damage queue:', error);
      showNotification(
        isNepali ? 'क्षतिको सूची लोड गर्दा त्रुटि भयो' : 'Error loading damage queue',
        'error'
      );
    }
    setLoading(false);
  };

  const handleStartRework = async (report) => {
    try {
      const updatedReport = {
        ...report,
        status: 'in_rework',
        reworkDetails: {
          ...report.reworkDetails,
          startTime: new Date().toISOString()
        }
      };

      // Update local state
      setDamageReports(prev => 
        prev.map(r => r.id === report.id ? updatedReport : r)
      );

      // Send API update
      await updateDamageReport(updatedReport);

      showNotification(
        isNepali 
          ? `${report.operatorName}को ${report.pieceNumbers.length} टुक्राको मर्मत सुरु भयो`
          : `Started rework for ${report.pieceNumbers.length} pieces from ${report.operatorName}`,
        'info'
      );
    } catch (error) {
      console.error('Error starting rework:', error);
      showNotification(
        isNepali ? 'मर्मत सुरु गर्दा त्रुटि भयो' : 'Error starting rework',
        'error'
      );
    }
  };

  const handleCompleteRework = async (report) => {
    if (!reworkData.qualityCheck) {
      showNotification(
        isNepali ? 'कृपया गुणस्तर जाँच पूरा गर्नुहोस्' : 'Please complete quality check',
        'warning'
      );
      return;
    }

    try {
      // Use the proper DamageReportService method
      const completionData = {
        supervisorName: user.name,
        partsReplaced: reworkData.partsReplaced,
        supervisorNotes: reworkData.notes,
        timeSpentMinutes: reworkData.timeSpent,
        qualityCheck: reworkData.qualityCheck
      };

      await damageReportService.completeRework(report.id, completionData);

      // Return pieces to operator and create new work assignment
      await damageReportService.returnToOperator(report.id, {
        supervisorId: user.uid,
        supervisorName: user.name
      });

      // Update local state to remove completed report from queue
      setDamageReports(prev => prev.filter(r => r.id !== report.id));

      showNotification(
        isNepali 
          ? `${report.operatorName}को ${report.pieceNumbers.length} टुक्रा ठीक भएर फिर्ता पठाइयो`
          : `${report.pieceNumbers.length} pieces fixed and returned to ${report.operatorName}`,
        'success'
      );
    } catch (error) {
      console.error('Error completing rework:', error);
      showNotification(
        isNepali ? 'मर्मत पूरा गर्दा त्रुटि भयो' : 'Error completing rework',
        'error'
      );
    } finally {
      setReworkModal(false);
      setSelectedReport(null);
      setReworkData({ partsReplaced: [], notes: '', timeSpent: 0, qualityCheck: false });
    }
  };

  const updateDamageReport = async (reportData) => {
    try {
      const updatedReport = await damageReportService.updateDamageReport(reportData.id, reportData);
      console.log('💾 Damage report updated:', updatedReport);
      return updatedReport;
    } catch (error) {
      console.error('Error updating damage report:', error);
      throw error;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported_to_supervisor': return 'bg-red-100 text-red-800';
      case 'in_rework': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'returned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyIcon = (urgency) => {
    return urgency === 'urgent' ? '🔴' : '🟡';
  };

  const getDamageTypeIcon = (type) => {
    const icons = {
      fabric_hole: '🕳️',
      color_issue: '🎨',
      cutting_pattern: '✂️',
      size_issue: '📏',
      stitching_defect: '🧵',
      other: '❓'
    };
    return icons[type] || '❓';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isNepali ? 'क्षतिको सूची लोड भइरहेको छ...' : 'Loading damage queue...'}
          </p>
        </div>
      </div>
    );
  }

  const pendingReports = damageReports.filter(r => r.status === 'reported_to_supervisor');
  const inProgressReports = damageReports.filter(r => r.status === 'in_rework');
  const completedReports = damageReports.filter(r => r.status === 'completed');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          🔧 {isNepali ? 'क्षतिको सूची र मर्मत' : 'Damage Queue & Rework'}
        </h1>
        <div className="flex gap-4 text-sm">
          <div className="bg-red-100 px-3 py-1 rounded-full">
            <span className="text-red-800 font-medium">
              {pendingReports.length} {isNepali ? 'नयाँ' : 'New'}
            </span>
          </div>
          <div className="bg-yellow-100 px-3 py-1 rounded-full">
            <span className="text-yellow-800 font-medium">
              {inProgressReports.length} {isNepali ? 'काममा' : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* New Reports - Priority Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
          🚨 {isNepali ? 'नयाँ क्षतिको रिपोर्ट' : 'New Damage Reports'}
          {pendingReports.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {pendingReports.length}
            </span>
          )}
        </h2>
        
        {pendingReports.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <span className="text-green-700">
              ✅ {isNepali ? 'कुनै नयाँ क्षतिको रिपोर्ट छैन' : 'No new damage reports'}
            </span>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingReports.map((report) => (
              <div key={report.id} className="bg-white border border-red-200 rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getUrgencyIcon(report.urgency)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {report.bundleNumber} - {report.operation}
                      </h3>
                      <p className="text-sm text-gray-600">
                        👤 {report.operatorName} • 🕒 {new Date(report.reportedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {isNepali ? 'नयाँ' : 'New'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">{isNepali ? 'वस्तु:' : 'Article:'}</span>
                    <div className="font-medium">{report.articleName}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">{isNepali ? 'रंग/नाप:' : 'Color/Size:'}</span>
                    <div className="font-medium">{report.color} / {report.size}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">{isNepali ? 'क्षतिको प्रकार:' : 'Damage Type:'}</span>
                    <div className="font-medium flex items-center gap-1">
                      {getDamageTypeIcon(report.damageType)}
                      {report.damageType.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">{isNepali ? 'टुक्रा संख्या:' : 'Pieces:'}</span>
                    <div className="font-medium">
                      #{report.pieceNumbers.join(', #')} ({report.pieceNumbers.length} pcs)
                    </div>
                  </div>
                </div>
                
                {report.description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">
                      💬 {report.description}
                    </span>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStartRework(report)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 text-sm font-medium"
                  >
                    🔧 {isNepali ? 'मर्मत सुरु गर्नुहोस्' : 'Start Rework'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In Progress Reports */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center gap-2">
          ⚙️ {isNepali ? 'मर्मत काममा' : 'Rework In Progress'}
        </h2>
        
        {inProgressReports.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <span className="text-gray-600">
              {isNepali ? 'मर्मत काममा कुनै काम छैन' : 'No rework in progress'}
            </span>
          </div>
        ) : (
          <div className="grid gap-4">
            {inProgressReports.map((report) => (
              <div key={report.id} className="bg-white border border-yellow-200 rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {report.bundleNumber} - {report.operation}
                    </h3>
                    <p className="text-sm text-gray-600">
                      👤 {report.operatorName} • ⏱️ Started: {new Date(report.reworkDetails.startTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {isNepali ? 'काममा' : 'In Progress'}
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setReworkModal(true);
                    }}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 text-sm font-medium"
                  >
                    ✅ {isNepali ? 'मर्मत पूरा गर्नुहोस्' : 'Complete Rework'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Completed Reports */}
      <div>
        <h2 className="text-lg font-semibold text-green-700 mb-4">
          ✅ {isNepali ? 'हालै पूरा भएका' : 'Recently Completed'}
        </h2>
        
        <div className="grid gap-3">
          {completedReports.slice(0, 3).map((report) => (
            <div key={report.id} className="bg-white border border-green-200 rounded-lg shadow-sm p-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{report.bundleNumber}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    → {report.operatorName}
                  </span>
                </div>
                <span className="text-xs text-green-600">
                  ✅ {new Date(report.reworkDetails.completedTime).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rework Completion Modal */}
      {reworkModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                🔧 {isNepali ? 'मर्मत पूरा गर्नुहोस्' : 'Complete Rework'}
              </h2>
              
              <div className="mb-4">
                <h3 className="font-medium">{selectedReport.bundleNumber}</h3>
                <p className="text-sm text-gray-600">
                  {selectedReport.pieceNumbers.length} pieces for {selectedReport.operatorName}
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'बदलिएका भागहरू:' : 'Parts Replaced:'}
                </label>
                <textarea
                  value={reworkData.partsReplaced.join(', ')}
                  onChange={(e) => setReworkData(prev => ({ 
                    ...prev, 
                    partsReplaced: e.target.value.split(', ').filter(p => p.trim()) 
                  }))}
                  placeholder={isNepali ? 'जस्तै: कपडा, सुतो, बटन...' : 'e.g: fabric, thread, button...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows="2"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNepali ? 'टिप्पणी:' : 'Notes:'}
                </label>
                <textarea
                  value={reworkData.notes}
                  onChange={(e) => setReworkData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={isNepali ? 'मर्मतको विवरण...' : 'Rework details...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows="3"
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reworkData.qualityCheck}
                    onChange={(e) => setReworkData(prev => ({ ...prev, qualityCheck: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    {isNepali ? 'गुणस्तर जाँच पूरा भयो' : 'Quality check completed'}
                  </span>
                </label>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setReworkModal(false);
                    setSelectedReport(null);
                    setReworkData({ partsReplaced: [], notes: '', timeSpent: 0, qualityCheck: false });
                  }}
                  className="flex-1 py-2 px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
                >
                  {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleCompleteRework(selectedReport)}
                  disabled={!reworkData.qualityCheck}
                  className="flex-1 py-2 px-4 bg-green-500 text-white hover:bg-green-600 rounded-md text-sm font-medium disabled:bg-gray-400"
                >
                  ✅ {isNepali ? 'पूरा गर्नुहोस्' : 'Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DamageQueue;