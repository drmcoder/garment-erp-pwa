// src/demo/AshikaDamageWorkflowDemo.jsx
// Complete demo/test scenario for Ashika's 22-piece sleeve join workflow with damage handling

import React, { useState, useEffect } from 'react';
import { User, Package, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';

const AshikaDamageWorkflowDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ashikaBundle, setAshikaBundle] = useState({
    bundleNumber: 'B001-8085-BL-XL-22P',
    article: '8085',
    articleName: 'Polo T-Shirt',
    color: 'Blue-1',
    size: 'XL',
    totalPieces: 22,
    operation: 'Sleeve Join',
    rate: 2.50,
    assignedTo: 'ashika_devi',
    operatorName: 'Ashika Devi',
    supervisorId: 'hari_supervisor',
    supervisorName: 'Hari Pokharel',
    status: 'assigned',
    completedPieces: 0,
    damagedPieces: 0,
    damageLog: [],
    startTime: null,
    completedTime: null
  });

  const [notifications, setNotifications] = useState([]);
  const [paymentCalculation, setPaymentCalculation] = useState(null);

  const workflowSteps = [
    {
      id: 0,
      title: 'Bundle Assignment',
      description: 'Ashika receives 22-piece sleeve join bundle',
      actor: 'supervisor',
      action: 'assign',
      status: 'assigned'
    },
    {
      id: 1,
      title: 'Work Start',
      description: 'Ashika starts working on sleeve join operation',
      actor: 'operator',
      action: 'start_work',
      status: 'in_progress'
    },
    {
      id: 2,
      title: 'Damage Discovery',
      description: 'Ashika finds fabric hole in piece #15 (not her fault)',
      actor: 'operator',
      action: 'discover_damage',
      status: 'working_with_damage'
    },
    {
      id: 3,
      title: 'Damage Reporting',
      description: 'Ashika reports damage to supervisor via system',
      actor: 'operator',
      action: 'report_damage',
      status: 'damage_reported'
    },
    {
      id: 4,
      title: 'Continue Good Work',
      description: 'Ashika continues working on 21 good pieces',
      actor: 'operator',
      action: 'continue_work',
      status: 'working_partial'
    },
    {
      id: 5,
      title: 'Supervisor Notification',
      description: 'Hari receives damage notification and starts rework',
      actor: 'supervisor',
      action: 'start_rework',
      status: 'rework_in_progress'
    },
    {
      id: 6,
      title: 'Fabric Replacement',
      description: 'Hari replaces damaged fabric on piece #15',
      actor: 'supervisor',
      action: 'fix_damage',
      status: 'rework_completed'
    },
    {
      id: 7,
      title: 'Return Fixed Piece',
      description: 'Hari returns fixed piece to Ashika',
      actor: 'supervisor',
      action: 'return_piece',
      status: 'piece_returned'
    },
    {
      id: 8,
      title: 'Complete Bundle',
      description: 'Ashika completes final piece and finishes bundle',
      actor: 'operator',
      action: 'complete_bundle',
      status: 'completed'
    },
    {
      id: 9,
      title: 'Payment Calculation',
      description: 'System calculates fair payment including rework piece',
      actor: 'system',
      action: 'calculate_payment',
      status: 'paid'
    }
  ];

  const executeStep = (stepId) => {
    const step = workflowSteps[stepId];
    let newBundle = { ...ashikaBundle };
    let newNotifications = [...notifications];

    switch (step.action) {
      case 'assign':
        newBundle.status = 'assigned';
        newBundle.assignedAt = new Date().toISOString();
        addNotification('Bundle assigned to Ashika Devi', 'info', 'supervisor');
        break;

      case 'start_work':
        newBundle.status = 'in_progress';
        newBundle.startTime = new Date().toISOString();
        addNotification('Ashika started working on sleeve join', 'success', 'operator');
        break;

      case 'discover_damage':
        addNotification('⚠️ Fabric hole discovered in piece #15', 'warning', 'operator');
        break;

      case 'report_damage':
        const damageReport = {
          pieceNumber: 15,
          damageType: 'fabric_hole',
          reportedBy: 'ashika_devi',
          reportedAt: new Date().toISOString(),
          status: 'reported_to_supervisor',
          description: 'Small hole in sleeve fabric',
          urgency: 'normal'
        };
        newBundle.damageLog.push(damageReport);
        newBundle.damagedPieces = 1;
        newBundle.status = 'working_with_damage';
        addNotification('🔧 Damage reported to Hari Supervisor', 'info', 'operator');
        addNotification('🚨 NEW DAMAGE REPORT from Ashika', 'urgent', 'supervisor');
        break;

      case 'continue_work':
        newBundle.completedPieces = 21; // Completed good pieces
        addNotification('✅ 21 good pieces completed, waiting for rework', 'success', 'operator');
        break;

      case 'start_rework':
        newBundle.damageLog[0].status = 'in_rework';
        newBundle.damageLog[0].reworkStartTime = new Date().toISOString();
        addNotification('🔧 Started rework on piece #15', 'info', 'supervisor');
        break;

      case 'fix_damage':
        newBundle.damageLog[0].status = 'completed';
        newBundle.damageLog[0].reworkCompletedTime = new Date().toISOString();
        newBundle.damageLog[0].partsReplaced = ['sleeve_fabric'];
        newBundle.damageLog[0].supervisorNotes = 'Replaced damaged fabric section with new material';
        addNotification('✅ Fabric replacement completed on piece #15', 'success', 'supervisor');
        break;

      case 'return_piece':
        newBundle.damageLog[0].status = 'returned_to_operator';
        addNotification('📤 Fixed piece returned to Ashika', 'info', 'supervisor');
        addNotification('📥 Reworked piece received - ready to complete!', 'success', 'operator');
        break;

      case 'complete_bundle':
        newBundle.completedPieces = 22; // All pieces completed
        newBundle.status = 'completed';
        newBundle.completedTime = new Date().toISOString();
        newBundle.qualityScore = 96; // High quality despite complications
        addNotification('🏁 All 22 pieces completed successfully!', 'success', 'operator');
        break;

      case 'calculate_payment':
        const payment = calculateFairPayment(newBundle);
        setPaymentCalculation(payment);
        newBundle.status = 'paid';
        addNotification(`💰 Payment processed: ₹${payment.totalEarned.toFixed(2)}`, 'success', 'system');
        break;
    }

    function addNotification(message, type, source) {
      newNotifications.push({
        id: Date.now() + Math.random(),
        message,
        type,
        source,
        timestamp: new Date().toISOString()
      });
    }

    setAshikaBundle(newBundle);
    setNotifications(newNotifications);
  };

  const calculateFairPayment = (bundle) => {
    const baseRate = bundle.rate;
    const totalPieces = bundle.totalPieces;
    const reworkPieces = bundle.damageLog.length;
    
    // Ashika gets paid for ALL pieces including rework (fabric damage not her fault)
    const basePayment = totalPieces * baseRate;
    const reworkBonus = reworkPieces * baseRate * 0.05; // 5% bonus for handling complications
    const qualityBonus = bundle.qualityScore >= 95 ? totalPieces * baseRate * 0.03 : 0; // 3% quality bonus
    
    return {
      basePieces: totalPieces,
      basePayment: basePayment,
      reworkBonus: reworkBonus,
      qualityBonus: qualityBonus,
      totalEarned: basePayment + reworkBonus + qualityBonus,
      breakdown: {
        note: 'Full payment for all pieces + bonuses (damage not operator fault)'
      }
    };
  };

  const playDemo = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setCurrentStep(0);
    setAshikaBundle({
      ...ashikaBundle,
      status: 'assigned',
      completedPieces: 0,
      damagedPieces: 0,
      damageLog: []
    });
    setNotifications([]);
    setPaymentCalculation(null);

    // Auto-play through steps
    const playStep = (stepIndex) => {
      if (stepIndex >= workflowSteps.length) {
        setIsPlaying(false);
        return;
      }

      setTimeout(() => {
        setCurrentStep(stepIndex);
        executeStep(stepIndex);
        playStep(stepIndex + 1);
      }, 2000); // 2 seconds between steps
    };

    playStep(0);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setAshikaBundle({
      ...ashikaBundle,
      status: 'assigned',
      completedPieces: 0,
      damagedPieces: 0,
      damageLog: [],
      startTime: null,
      completedTime: null
    });
    setNotifications([]);
    setPaymentCalculation(null);
  };

  const getStepIcon = (step, index) => {
    if (index < currentStep) return <CheckCircle className="text-green-500" size={24} />;
    if (index === currentStep) return <Clock className="text-blue-500 animate-pulse" size={24} />;
    return <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>;
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 border-red-500 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'success': return 'bg-green-100 border-green-500 text-green-800';
      case 'info': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🧵 Ashika's Damage Workflow Demo
        </h1>
        <p className="text-gray-600 text-lg">
          Real-world scenario: 22-piece sleeve join bundle with fabric damage handling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bundle Status Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="text-blue-600" />
              Bundle Status
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Bundle:</span>
                <span className="font-medium">{ashikaBundle.bundleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Operator:</span>
                <span className="font-medium">{ashikaBundle.operatorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Operation:</span>
                <span className="font-medium">{ashikaBundle.operation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pieces:</span>
                <span className="font-medium">{ashikaBundle.totalPieces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">{ashikaBundle.completedPieces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Damaged:</span>
                <span className="font-medium text-red-600">{ashikaBundle.damagedPieces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rate:</span>
                <span className="font-medium">₹{ashikaBundle.rate}/piece</span>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    ashikaBundle.status === 'completed' ? 'bg-green-100 text-green-800' :
                    ashikaBundle.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    ashikaBundle.status.includes('damage') ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ashikaBundle.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Calculation */}
            {paymentCalculation && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <DollarSign size={18} />
                  Fair Payment Calculation
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Payment ({paymentCalculation.basePieces} pcs):</span>
                    <span>₹{paymentCalculation.basePayment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Complexity Bonus:</span>
                    <span>₹{paymentCalculation.reworkBonus.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality Bonus:</span>
                    <span>₹{paymentCalculation.qualityBonus.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-green-800 border-t pt-2">
                    <span>Total Earned:</span>
                    <span>₹{paymentCalculation.totalEarned.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    ✅ Full payment for all pieces including rework (damage not operator fault)
                  </p>
                </div>
              </div>
            )}

            {/* Demo Controls */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={playDemo}
                disabled={isPlaying}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPlaying ? '▶️ Playing...' : '▶️ Play Demo'}
              </button>
              <button
                onClick={resetDemo}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Workflow Steps</h2>
            
            <div className="space-y-4">
              {workflowSteps.map((step, index) => (
                <div key={step.id} className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                  index === currentStep ? 'border-blue-300 bg-blue-50' :
                  index < currentStep ? 'border-green-300 bg-green-50' :
                  'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex-shrink-0 mt-1">
                    {getStepIcon(step, index)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        step.actor === 'operator' ? 'bg-blue-100 text-blue-800' :
                        step.actor === 'supervisor' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {step.actor}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                    
                    {/* Show damage details for relevant steps */}
                    {step.action === 'report_damage' && ashikaBundle.damageLog.length > 0 && (
                      <div className="mt-2 p-3 bg-red-50 rounded border border-red-200">
                        <h4 className="font-medium text-red-800">Damage Report:</h4>
                        <div className="text-sm text-red-700">
                          <p>Piece #15: Fabric hole</p>
                          <p>Type: Material defect (not operator fault)</p>
                          <p>Action: Send to supervisor for fabric replacement</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Panel */}
          {notifications.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Live Notifications</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.slice(-8).reverse().map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${getNotificationColor(notification.type)}`}>
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium">{notification.message}</p>
                      <span className="text-xs opacity-75">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-xs opacity-75">{notification.source}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AshikaDamageWorkflowDemo;