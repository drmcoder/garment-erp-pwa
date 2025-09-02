import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MapPin,
  Users,
  Activity,
  Clock,
  Package,
  Zap,
  RefreshCw,
  Download,
  Camera,
  FileText,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { db, collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc } from '../../config/firebase';

const LineInspection = () => {
  const { user } = useAuth();
  const { currentLanguage, formatDateTime, formatTime } = useLanguage();
  const { showNotification } = useNotifications();
  const isNepali = currentLanguage === 'np';

  const [inspections, setInspections] = useState([]);
  const [activeInspection, setActiveInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productionLines, setProductionLines] = useState([
    {
      id: 'line-a',
      name: 'Line A - Shirts',
      station: 'Main Floor',
      operators: 12,
      status: 'active',
      currentArticle: 'SH-001-L-WHT',
      target: 150,
      completed: 89
    },
    {
      id: 'line-b', 
      name: 'Line B - Pants',
      station: 'Second Floor',
      operators: 8,
      status: 'active',
      currentArticle: 'PT-202-M-BLU',
      target: 120,
      completed: 75
    },
    {
      id: 'line-c',
      name: 'Line C - Jackets', 
      station: 'Main Floor',
      operators: 15,
      status: 'maintenance',
      currentArticle: 'JK-105-XL-BLK',
      target: 80,
      completed: 45
    }
  ]);

  // Load inspections
  useEffect(() => {
    const inspectionsQuery = query(
      collection(db, 'lineInspections'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(inspectionsQuery, (snapshot) => {
      const inspectionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInspections(inspectionData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Start new inspection
  const startInspection = (line) => {
    const inspection = {
      lineId: line.id,
      lineName: line.name,
      inspectorId: user.uid,
      inspectorName: user.name,
      startTime: new Date(),
      status: 'in_progress',
      checkpoints: [
        { id: 'safety', name: 'Safety Compliance', status: 'pending', notes: '' },
        { id: 'quality', name: 'Quality Standards', status: 'pending', notes: '' },
        { id: 'efficiency', name: 'Production Efficiency', status: 'pending', notes: '' },
        { id: 'equipment', name: 'Equipment Status', status: 'pending', notes: '' },
        { id: 'cleanliness', name: 'Workspace Cleanliness', status: 'pending', notes: '' },
        { id: 'operators', name: 'Operator Performance', status: 'pending', notes: '' }
      ],
      issues: [],
      overallRating: 0,
      createdAt: new Date()
    };

    setActiveInspection(inspection);
  };

  // Update checkpoint
  const updateCheckpoint = (checkpointId, status, notes = '') => {
    setActiveInspection(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.map(checkpoint =>
        checkpoint.id === checkpointId
          ? { ...checkpoint, status, notes }
          : checkpoint
      )
    }));
  };

  // Add issue
  const addIssue = (issue) => {
    setActiveInspection(prev => ({
      ...prev,
      issues: [...prev.issues, {
        id: Date.now(),
        ...issue,
        reportedAt: new Date()
      }]
    }));
  };

  // Complete inspection
  const completeInspection = async (rating) => {
    try {
      const completedInspection = {
        ...activeInspection,
        status: 'completed',
        endTime: new Date(),
        overallRating: rating,
        duration: Math.round((new Date() - activeInspection.startTime) / 60000) // minutes
      };

      await addDoc(collection(db, 'lineInspections'), completedInspection);
      
      // Show notification based on rating
      const message = rating >= 4 
        ? (isNepali ? 'लाइन निरीक्षण सफलतापूर्वक पूरा भयो - उत्कृष्ट!' : 'Line inspection completed successfully - Excellent!')
        : rating >= 3
        ? (isNepali ? 'लाइन निरीक्षण पूरा भयो - ठीक छ' : 'Line inspection completed - Good')
        : (isNepali ? 'लाइन निरीक्षण पूरा भयो - सुधार आवश्यक' : 'Line inspection completed - Needs improvement');
      
      showNotification(message, rating >= 3 ? 'success' : 'warning');
      setActiveInspection(null);
    } catch (error) {
      console.error('Error completing inspection:', error);
      showNotification(
        isNepali ? 'निरीक्षण सेभ गर्न समस्या भयो' : 'Error saving inspection',
        'error'
      );
    }
  };

  const getLineStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'stopped': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCheckpointIcon = (status) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  if (activeInspection) {
    return (
      <div className="space-y-6">
        {/* Inspection Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                🔍 {isNepali ? 'लाइन निरीक्षण जारी' : 'Line Inspection in Progress'}
              </h2>
              <p className="text-gray-600 mt-1">
                {activeInspection.lineName} • {isNepali ? 'सुरु भएको' : 'Started'}: {formatTime(activeInspection.startTime)}
              </p>
            </div>
            <button
              onClick={() => setActiveInspection(null)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
          </div>
        </div>

        {/* Checkpoints */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">
            ✅ {isNepali ? 'चेकपोइन्टहरू' : 'Inspection Checkpoints'}
          </h3>
          <div className="space-y-4">
            {activeInspection.checkpoints.map((checkpoint) => (
              <div key={checkpoint.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getCheckpointIcon(checkpoint.status)}
                    <h4 className="font-medium text-gray-900">{checkpoint.name}</h4>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateCheckpoint(checkpoint.id, 'passed')}
                      className={`px-3 py-1 text-xs rounded-full border ${
                        checkpoint.status === 'passed'
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
                      }`}
                    >
                      {isNepali ? 'उत्तीर्ण' : 'Pass'}
                    </button>
                    <button
                      onClick={() => updateCheckpoint(checkpoint.id, 'warning')}
                      className={`px-3 py-1 text-xs rounded-full border ${
                        checkpoint.status === 'warning'
                          ? 'bg-yellow-500 text-white border-yellow-500'
                          : 'bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50'
                      }`}
                    >
                      {isNepali ? 'चेतावनी' : 'Warning'}
                    </button>
                    <button
                      onClick={() => updateCheckpoint(checkpoint.id, 'failed')}
                      className={`px-3 py-1 text-xs rounded-full border ${
                        checkpoint.status === 'failed'
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                      }`}
                    >
                      {isNepali ? 'असफल' : 'Fail'}
                    </button>
                  </div>
                </div>
                <textarea
                  placeholder={isNepali ? 'टिप्पणी थप्नुहोस्...' : 'Add notes...'}
                  value={checkpoint.notes}
                  onChange={(e) => updateCheckpoint(checkpoint.id, checkpoint.status, e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Complete Inspection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">
            🎯 {isNepali ? 'निरीक्षण पूरा गर्नुहोस्' : 'Complete Inspection'}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {isNepali ? 'समग्र मूल्याङ्कन:' : 'Overall Rating:'}
              </span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => completeInspection(rating)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {isNepali ? 'रेटिङ दिनुहोस् र निरीक्षण पूरा गर्नुहोस्' : 'Click stars to rate and complete inspection'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          🏭 {isNepali ? 'लाइन निरीक्षण' : 'Line Inspection'}
        </h2>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{isNepali ? 'रिफ्रेस' : 'Refresh'}</span>
        </button>
      </div>

      {/* Production Lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productionLines.map((line) => (
          <div key={line.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{line.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full border ${getLineStatusColor(line.status)}`}>
                {line.status.charAt(0).toUpperCase() + line.status.slice(1)}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{isNepali ? 'स्थान:' : 'Location:'}</span>
                <span className="font-medium">{line.station}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{isNepali ? 'अपरेटरहरू:' : 'Operators:'}</span>
                <span className="font-medium">{line.operators}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{isNepali ? 'हालको लेख:' : 'Current Article:'}</span>
                <span className="font-medium text-xs">{line.currentArticle}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{isNepali ? 'प्रगति:' : 'Progress:'}</span>
                <span className="font-medium">{line.completed}/{line.target}</span>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min((line.completed / line.target) * 100, 100)}%` }}
              ></div>
            </div>

            <button
              onClick={() => startInspection(line)}
              disabled={line.status === 'maintenance'}
              className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                line.status === 'maintenance'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{isNepali ? 'निरीक्षण सुरु गर्नुहोस्' : 'Start Inspection'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Recent Inspections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            📋 {isNepali ? 'हालका निरीक्षणहरू' : 'Recent Inspections'}
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {inspections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>{isNepali ? 'कुनै निरीक्षण रेकर्ड फेला परेन' : 'No inspection records found'}</p>
            </div>
          ) : (
            inspections.map((inspection) => (
              <div key={inspection.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{inspection.lineName}</h4>
                    <p className="text-sm text-gray-600">
                      {inspection.inspectorName} • {formatDateTime(inspection.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < inspection.overallRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full border ${
                      inspection.status === 'completed'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                      {inspection.status === 'completed' ? 
                        (isNepali ? 'पूरा भयो' : 'Completed') : 
                        (isNepali ? 'जारी' : 'In Progress')
                      }
                    </span>
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

export default LineInspection;