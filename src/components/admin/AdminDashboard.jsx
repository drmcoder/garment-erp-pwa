import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { OperatorService, WIPService } from '../../services/firebase-services';
import { db, collection, getDocs, COLLECTIONS } from '../../config/firebase';
import OperatorManagement from './OperatorManagement';
import SupervisorManagement from './SupervisorManagement';
import OperatorTemplates from './OperatorTemplates';
import MachineManagement from './MachineManagement';
import WorkflowTemplateManagement from './WorkflowTemplateManagement';

const AdminDashboard = () => {
  const { currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('operators');
  const [stats, setStats] = useState({
    totalOperators: 0,
    totalSupervisors: 0,
    totalMachines: 0,
    totalOperationTemplates: 0,
    totalWorkflowTemplates: 0
  });

  // Load stats from localStorage or API
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('🔄 Loading admin dashboard stats from Firestore...');
      
      // Load real data from Firestore
      const [operatorsResult, supervisorsSnapshot, machinesSnapshot, templatesSnapshot, workflowTemplatesSnapshot] = await Promise.all([
        OperatorService.getActiveOperators(),
        getDocs(collection(db, COLLECTIONS.SUPERVISORS)),
        getDocs(collection(db, COLLECTIONS.MACHINE_CONFIGS)),
        getDocs(collection(db, COLLECTIONS.ARTICLE_TEMPLATES)),
        getDocs(collection(db, 'workflow_templates'))
      ]);

      const operators = operatorsResult.success ? operatorsResult.operators : [];
      const supervisors = supervisorsSnapshot.docs || [];
      const machines = machinesSnapshot.docs || [];
      const operationTemplates = templatesSnapshot.docs || [];
      const workflowTemplates = workflowTemplatesSnapshot.docs || [];

      console.log('✅ Admin dashboard stats loaded:', {
        operators: operators.length,
        supervisors: supervisors.length, 
        machines: machines.length,
        templates: operationTemplates.length,
        workflowTemplates: workflowTemplates.length
      });

      setStats({
        totalOperators: operators.length,
        totalSupervisors: supervisors.length,
        totalMachines: machines.length,
        totalOperationTemplates: operationTemplates.length,
        totalWorkflowTemplates: workflowTemplates.length
      });
    } catch (error) {
      console.error('❌ Error loading admin dashboard stats:', error);
      // Keep existing stats on error
    }
  };

  const tabs = [
    {
      id: 'operators',
      label: currentLanguage === 'en' ? 'Operators' : 'अपरेटरहरू',
      icon: '👷‍♂️',
      count: stats.totalOperators
    },
    {
      id: 'supervisors',
      label: currentLanguage === 'en' ? 'Supervisors' : 'सुपरभाइजरहरू',
      icon: '👨‍💼',
      count: stats.totalSupervisors
    },
    {
      id: 'machines',
      label: currentLanguage === 'en' ? 'Machines' : 'मेसिनहरू',
      icon: '🏭',
      count: stats.totalMachines
    },
    {
      id: 'templates',
      label: currentLanguage === 'en' ? 'Operator Templates' : 'अपरेटर टेम्प्लेटहरू',
      icon: '📋',
      count: stats.totalOperationTemplates
    },
    {
      id: 'workflows',
      label: currentLanguage === 'en' ? 'Workflow Templates' : 'वर्कफ्लो टेम्प्लेटहरू',
      icon: '🔄',
      count: stats.totalWorkflowTemplates
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'operators':
        return <OperatorManagement onStatsUpdate={loadStats} />;
      case 'supervisors':
        return <SupervisorManagement onStatsUpdate={loadStats} />;
      case 'machines':
        return <MachineManagement onStatsUpdate={loadStats} />;
      case 'templates':
        return <OperatorTemplates onStatsUpdate={loadStats} />;
      case 'workflows':
        return <WorkflowTemplateManagement onStatsUpdate={loadStats} />;
      default:
        return <OperatorManagement onStatsUpdate={loadStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🔧 TSA Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                {currentLanguage === 'en' 
                  ? 'AI Powered Production Management - Admin Panel'
                  : 'AI संचालित उत्पादन प्रबन्धन - प्रशासन प्यानल'
                }
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalOperators}</div>
                <div className="text-sm text-gray-600">
                  {currentLanguage === 'en' ? 'Operators' : 'अपरेटरहरू'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalSupervisors}</div>
                <div className="text-sm text-gray-600">
                  {currentLanguage === 'en' ? 'Supervisors' : 'सुपरभाइजरहरू'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalMachines}</div>
                <div className="text-sm text-gray-600">
                  {currentLanguage === 'en' ? 'Machines' : 'मेसिनहरू'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;