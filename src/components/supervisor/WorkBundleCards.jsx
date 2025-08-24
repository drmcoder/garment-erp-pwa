import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const WorkBundleCards = ({ bundles, onUpdateBundle }) => {
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';

  // Define work checklist for each bundle type
  const getWorkChecklist = (operation, garmentType = 'round-neck-tshirt') => {
    const checklists = {
      'Shoulder Join': [
        { id: 'cut_check', name: 'Cutting Quality Check', nameNp: 'काटन गुणस्तर जाँच' },
        { id: 'alignment', name: 'Shoulder Alignment', nameNp: 'काँध मिलान' },
        { id: 'seam_stitch', name: 'Seam Stitching', nameNp: 'सिलाई सिम' },
        { id: 'overlock_finish', name: 'Overlock Finishing', nameNp: 'ओभरलक फिनिशिङ' },
        { id: 'quality_check', name: 'Final Quality Check', nameNp: 'अन्तिम गुणस्तर जाँच' }
      ],
      'Neck Join': [
        { id: 'neck_prep', name: 'Neck Preparation', nameNp: 'नेक तयारी' },
        { id: 'binding_cut', name: 'Binding Cutting', nameNp: 'बाइन्डिङ काटना' },
        { id: 'neck_attach', name: 'Neck Attachment', nameNp: 'नेक जोडना' },
        { id: 'stretch_check', name: 'Stretch Test', nameNp: 'स्ट्रेच जाँच' },
        { id: 'finish_trim', name: 'Finish & Trim', nameNp: 'फिनिश र ट्रिम' }
      ],
      'Bottom Fold': [
        { id: 'measure_hem', name: 'Measure Hem Width', nameNp: 'हेम चौडाई नाप' },
        { id: 'fold_press', name: 'Fold & Press', nameNp: 'फोल्ड र प्रेस' },
        { id: 'flatlock_stitch', name: 'Flatlock Stitching', nameNp: 'फ्ल्यालक सिलाई' },
        { id: 'hem_quality', name: 'Hem Quality Check', nameNp: 'हेम गुणस्तर जाँच' }
      ],
      'Sleeve Fold': [
        { id: 'sleeve_prep', name: 'Sleeve Preparation', nameNp: 'स्लिभ तयारी' },
        { id: 'fold_mark', name: 'Fold Marking', nameNp: 'फोल्ड मार्किङ' },
        { id: 'sleeve_stitch', name: 'Sleeve Stitching', nameNp: 'स्लिभ सिलाई' },
        { id: 'sleeve_finish', name: 'Sleeve Finishing', nameNp: 'स्लिभ फिनिशिङ' }
      ],
      'Neck Band': [
        { id: 'band_cut', name: 'Band Cutting', nameNp: 'ब्यान्ड काटना' },
        { id: 'band_prep', name: 'Band Preparation', nameNp: 'ब्यान्ड तयारी' },
        { id: 'single_stitch', name: 'Single Needle Stitch', nameNp: 'एकल सुई सिलाई' },
        { id: 'band_attach', name: 'Band Attachment', nameNp: 'ब्यान्ड जोडना' },
        { id: 'final_press', name: 'Final Pressing', nameNp: 'अन्तिम प्रेसिङ' }
      ]
    };
    
    return checklists[operation] || [
      { id: 'general_prep', name: 'Preparation', nameNp: 'तयारी' },
      { id: 'general_work', name: 'Main Work', nameNp: 'मुख्य काम' },
      { id: 'general_check', name: 'Quality Check', nameNp: 'गुणस्तर जाँच' }
    ];
  };

  const getBundleCompletionPercentage = (bundle) => {
    const checklist = bundle.checklist || [];
    if (checklist.length === 0) return 0;
    
    const completedItems = checklist.filter(item => item.completed).length;
    return Math.round((completedItems / checklist.length) * 100);
  };

  const getBundleStatusColor = (bundle) => {
    const percentage = getBundleCompletionPercentage(bundle);
    
    if (percentage === 100) return 'bg-green-100 border-green-400';
    if (percentage >= 50) return 'bg-yellow-100 border-yellow-400';
    if (percentage > 0) return 'bg-orange-100 border-orange-400';
    return 'bg-red-100 border-red-400';
  };

  const getBundleStatusIcon = (bundle) => {
    const percentage = getBundleCompletionPercentage(bundle);
    
    if (percentage === 100) return '✅';
    if (percentage >= 50) return '⚠️';
    if (percentage > 0) return '🔄';
    return '❌';
  };

  const getMachineTypeColor = (machineType) => {
    const colors = {
      'overlock': 'bg-blue-500',
      'flatlock': 'bg-green-500', 
      'single-needle': 'bg-purple-500',
      'singleNeedle': 'bg-purple-500',
      'buttonhole': 'bg-orange-500'
    };
    return colors[machineType] || 'bg-gray-500';
  };

  const initializeBundleChecklist = (bundle) => {
    if (!bundle.checklist) {
      const checklist = getWorkChecklist(bundle.operation || bundle.currentOperation);
      return {
        ...bundle,
        checklist: checklist.map(item => ({
          ...item,
          completed: false,
          completedAt: null,
          completedBy: null
        }))
      };
    }
    return bundle;
  };

  const handleChecklistToggle = (bundleId, checklistItemId) => {
    const updatedBundles = bundles.map(bundle => {
      if (bundle.id === bundleId) {
        const updatedChecklist = bundle.checklist.map(item => {
          if (item.id === checklistItemId) {
            return {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date().toISOString() : null,
              completedBy: !item.completed ? 'current_user' : null
            };
          }
          return item;
        });
        
        const updatedBundle = {
          ...bundle,
          checklist: updatedChecklist
        };
        
        // Update bundle status based on completion
        const percentage = getBundleCompletionPercentage(updatedBundle);
        updatedBundle.status = percentage === 100 ? 'completed' : 'in-progress';
        
        return updatedBundle;
      }
      return bundle;
    });
    
    onUpdateBundle && onUpdateBundle(updatedBundles);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'text-red-600 bg-red-100',
      'medium': 'text-yellow-600 bg-yellow-100',
      'low': 'text-green-600 bg-green-100'
    };
    return colors[priority] || colors.medium;
  };

  // Initialize checklists for bundles that don't have them
  const initializedBundles = bundles.map(initializeBundleChecklist);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          📦 {isNepali ? 'काम बन्डल कार्डहरू' : 'Work Bundle Cards'}
        </h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>{isNepali ? 'सुरु नगरिएको' : 'Not Started'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span>{isNepali ? 'प्रगतिमा' : 'In Progress'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>{isNepali ? 'सकिएको' : 'Completed'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initializedBundles.map(bundle => {
          const percentage = getBundleCompletionPercentage(bundle);
          const statusIcon = getBundleStatusIcon(bundle);
          const statusColor = getBundleStatusColor(bundle);
          
          return (
            <div
              key={bundle.id}
              className={`border-2 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${statusColor}`}
            >
              {/* Card Header */}
              <div className="bg-white px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{statusIcon}</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {bundle.bundleNumber || bundle.bundleId || bundle.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {bundle.lotNumber || bundle.articleName}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(bundle.priority)}`}>
                    {isNepali ? (bundle.priority === 'high' ? 'उच्च' : bundle.priority === 'low' ? 'कम' : 'सामान्य') : bundle.priority}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {isNepali ? 'प्रगति:' : 'Progress:'}
                    </span>
                    <span className="font-semibold text-gray-800">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        percentage === 100 ? 'bg-green-500' : 
                        percentage >= 50 ? 'bg-yellow-500' : 
                        percentage > 0 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Bundle Details */}
              <div className="bg-white px-6 py-4 border-b">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{isNepali ? 'ऑपरेशन:' : 'Operation:'}</span>
                    <div className="font-semibold text-gray-800">
                      {bundle.operation || bundle.currentOperation}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">{isNepali ? 'मेसिन:' : 'Machine:'}</span>
                    <div className={`inline-block px-2 py-1 rounded text-white text-xs font-semibold ${getMachineTypeColor(bundle.machineType)}`}>
                      {bundle.machineType}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">{isNepali ? 'टुक्राहरू:' : 'Pieces:'}</span>
                    <div className="font-semibold text-gray-800">
                      {bundle.pieces || bundle.quantity} {isNepali ? 'वटा' : 'pcs'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">{isNepali ? 'समय:' : 'Time:'}</span>
                    <div className="font-semibold text-gray-800">
                      {bundle.estimatedTime} {isNepali ? 'मिनेट' : 'min'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">{isNepali ? 'रङ/साइज:' : 'Color/Size:'}</span>
                    <div className="font-semibold text-gray-800">
                      {bundle.color} • {bundle.size}
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Checklist */}
              <div className="bg-gray-50 px-6 py-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  ✅ {isNepali ? 'काम चेकलिस्ट:' : 'Work Checklist:'}
                </h4>
                
                <div className="space-y-2">
                  {bundle.checklist.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        item.completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-white hover:bg-gray-100'
                      }`}
                      onClick={() => handleChecklistToggle(bundle.id, item.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${item.completed ? 'line-through' : ''}`}>
                          {index + 1}. {isNepali ? item.nameNp : item.name}
                        </span>
                        {item.completed && item.completedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            ✅ {new Date(item.completedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="text-lg">
                        {item.completed ? '✅' : '⏳'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bundle Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {isNepali ? 'स्थिति:' : 'Status:'} {bundle.status}
                    </div>
                    {percentage === 100 && (
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {isNepali ? '✅ सकिएको' : '✅ Complete'}
                      </div>
                    )}
                    {percentage === 0 && (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {isNepali ? '📋 Available' : '📋 Available'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {initializedBundles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-500">
            {isNepali ? 'कुनै बन्डल फेला परेन' : 'No bundles found'}
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkBundleCards;