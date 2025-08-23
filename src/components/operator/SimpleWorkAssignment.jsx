import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobalError } from '../common/GlobalErrorHandler';

const SimpleWorkAssignment = ({ onWorkAssigned }) => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [availableWork, setAvailableWork] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Simple work data - would normally come from Firebase
  const mockWork = [
    {
      id: 'W001',
      articleNumber: '8085',
      articleName: currentLanguage === 'np' ? 'पोलो टी-शर्ट' : 'Polo T-Shirt',
      color: currentLanguage === 'np' ? 'नीलो-१' : 'Blue-1',
      size: 'XL',
      pieces: 30,
      operation: currentLanguage === 'np' ? 'काँध जोड्ने' : 'Shoulder Join',
      machineType: 'overlock',
      rate: 2.5,
      estimatedTime: 45,
      difficulty: currentLanguage === 'np' ? 'सजिलो' : 'Easy',
      priority: currentLanguage === 'np' ? 'उच्च' : 'High',
      earnings: 75,
      icon: '👕',
      color_code: '#3B82F6'
    },
    {
      id: 'W002', 
      articleNumber: '8086',
      articleName: currentLanguage === 'np' ? 'कार्गो प्यान्ट' : 'Cargo Pants',
      color: currentLanguage === 'np' ? 'खैरो' : 'Brown',
      size: 'L',
      pieces: 25,
      operation: currentLanguage === 'np' ? 'हेम फोल्ड' : 'Hem Fold',
      machineType: 'flatlock',
      rate: 3.0,
      estimatedTime: 35,
      difficulty: currentLanguage === 'np' ? 'सजिलो' : 'Easy',
      priority: currentLanguage === 'np' ? 'सामान्य' : 'Normal',
      earnings: 75,
      icon: '👖',
      color_code: '#10B981'
    },
    {
      id: 'W003',
      articleNumber: '8087', 
      articleName: currentLanguage === 'np' ? 'फ्रक ड्रेस' : 'Frock Dress',
      color: currentLanguage === 'np' ? 'गुलाफी' : 'Pink',
      size: 'M',
      pieces: 20,
      operation: currentLanguage === 'np' ? 'साइड सिम' : 'Side Seam',
      machineType: 'overlock',
      rate: 3.5,
      estimatedTime: 50,
      difficulty: currentLanguage === 'np' ? 'मध्यम' : 'Medium',
      priority: currentLanguage === 'np' ? 'उच्च' : 'High', 
      earnings: 70,
      icon: '👗',
      color_code: '#F59E0B'
    },
    {
      id: 'W004',
      articleNumber: '8088',
      articleName: currentLanguage === 'np' ? 'जुम्पर' : 'Jumper',
      color: currentLanguage === 'np' ? 'कालो' : 'Black',
      size: 'S',
      pieces: 35,
      operation: currentLanguage === 'np' ? 'प्लाकेट' : 'Placket',
      machineType: 'singleNeedle',
      rate: 2.8,
      estimatedTime: 40,
      difficulty: currentLanguage === 'np' ? 'मध्यम' : 'Medium',
      priority: currentLanguage === 'np' ? 'सामान्य' : 'Normal',
      earnings: 98,
      icon: '🧥',
      color_code: '#8B5CF6'
    }
  ];

  useEffect(() => {
    loadAvailableWork();
  }, []);

  const loadAvailableWork = async () => {
    setLoading(true);
    try {
      // Filter work based on operator's machine type
      const filteredWork = mockWork.filter(work => {
        if (!user?.machine) return true;
        
        const machineMap = {
          'overlock': ['overlock'],
          'flatlock': ['flatlock'],
          'singleNeedle': ['singleNeedle'],
          'buttonhole': ['buttonhole']
        };
        
        const compatibleMachines = machineMap[user.machine] || [user.machine];
        return compatibleMachines.includes(work.machineType);
      });

      setAvailableWork(filteredWork);
      
    } catch (error) {
      addError({
        message: currentLanguage === 'np' ? 'काम लोड गर्न समस्या भयो' : 'Failed to load work',
        component: 'SimpleWorkAssignment',
        action: 'Load Work',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkSelect = (work) => {
    setSelectedWork(work);
  };

  const handleAcceptWork = async () => {
    if (!selectedWork) return;
    
    try {
      // Simulate work assignment
      addError({
        message: currentLanguage === 'np' 
          ? `काम स्वीकार गरियो: ${selectedWork.articleName}` 
          : `Work accepted: ${selectedWork.articleName}`,
        component: 'SimpleWorkAssignment',
        action: 'Accept Work',
        data: { workId: selectedWork.id }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);

      if (onWorkAssigned) {
        onWorkAssigned(selectedWork);
      }
      
    } catch (error) {
      addError({
        message: currentLanguage === 'np' ? 'काम स्वीकार गर्न समस्या भयो' : 'Failed to accept work',
        component: 'SimpleWorkAssignment', 
        action: 'Accept Work',
        data: { workId: selectedWork.id, error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'उच्च' || priority === 'High') return 'bg-red-100 text-red-800 border-red-200';
    if (priority === 'सामान्य' || priority === 'Normal') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty === 'कठिन' || difficulty === 'Hard') return 'bg-red-100 text-red-700';
    if (difficulty === 'मध्यम' || difficulty === 'Medium') return 'bg-yellow-100 text-yellow-700'; 
    return 'bg-green-100 text-green-700';
  };

  const itemsPerPage = 2;
  const totalPages = Math.ceil(availableWork.length / itemsPerPage);
  const currentItems = availableWork.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-2xl font-bold text-gray-600 mb-2">
            {currentLanguage === 'np' ? 'काम खोजिरहेका छौं...' : 'Finding work for you...'}
          </div>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (availableWork.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl p-12 shadow-lg max-w-md">
          <div className="text-8xl mb-6">😴</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {currentLanguage === 'np' ? 'काम छैन' : 'No Work Available'}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {currentLanguage === 'np' ? 'अहिले कुनै काम छैन। केही समयमा फेरि हेर्नुहोस्।' : 'No work right now. Please check back later.'}
          </p>
          <button
            onClick={loadAvailableWork}
            className="bg-blue-500 text-white text-xl font-bold py-4 px-8 rounded-2xl hover:bg-blue-600 transition-colors touch-button"
          >
            🔄 {currentLanguage === 'np' ? 'फेरि हेर्नुहोस्' : 'Check Again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {currentLanguage === 'np' ? 'आफ्नो काम छनोट गर्नुहोस्' : 'Choose Your Work'}
          </h1>
          <p className="text-xl text-gray-600">
            {currentLanguage === 'np' 
              ? `नमस्कार ${user?.name || 'साथी'}! तपाईंको लागि ${availableWork.length} वटा काम छन्।`
              : `Hello ${user?.name || 'Friend'}! We have ${availableWork.length} jobs for you.`
            }
          </p>
        </div>

        {/* Work Cards */}
        <div className="space-y-6 mb-8">
          {currentItems.map((work) => (
            <div
              key={work.id}
              onClick={() => handleWorkSelect(work)}
              className={`bg-white rounded-3xl p-8 shadow-lg border-4 cursor-pointer transition-all duration-300 touch-button ${
                selectedWork?.id === work.id 
                  ? 'border-green-400 bg-green-50 transform scale-105' 
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-xl'
              }`}
            >
              <div className="flex items-center space-x-6 mb-6">
                {/* Article Icon */}
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                  style={{ backgroundColor: work.color_code + '20' }}
                >
                  {work.icon}
                </div>
                
                {/* Article Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {work.articleName}
                    </h2>
                    <span 
                      className={`px-3 py-1 rounded-full text-sm font-bold border ${getPriorityColor(work.priority)}`}
                    >
                      {work.priority}
                    </span>
                  </div>
                  
                  <div className="text-lg text-gray-600">
                    #{work.articleNumber} • {work.color} • {work.size}
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedWork?.id === work.id && (
                  <div className="text-4xl">✅</div>
                )}
              </div>

              {/* Work Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-2">🧵</div>
                  <div className="text-sm text-gray-600 mb-1">
                    {currentLanguage === 'np' ? 'काम' : 'Operation'}
                  </div>
                  <div className="font-bold text-gray-800">{work.operation}</div>
                </div>
                
                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-2">📦</div>
                  <div className="text-sm text-gray-600 mb-1">
                    {currentLanguage === 'np' ? 'टुक्राहरू' : 'Pieces'}
                  </div>
                  <div className="font-bold text-gray-800 text-xl">{work.pieces}</div>
                </div>
                
                <div className="bg-yellow-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="text-sm text-gray-600 mb-1">
                    {currentLanguage === 'np' ? 'समय' : 'Time'}
                  </div>
                  <div className="font-bold text-gray-800">{work.estimatedTime} {currentLanguage === 'np' ? 'मिनेट' : 'min'}</div>
                </div>
                
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="text-sm text-gray-600 mb-1">
                    {currentLanguage === 'np' ? 'कमाई' : 'Earnings'}
                  </div>
                  <div className="font-bold text-gray-800 text-xl">रु. {work.earnings}</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-2 rounded-full text-sm font-semibold ${getDifficultyColor(work.difficulty)}`}>
                    💪 {work.difficulty}
                  </div>
                  <div className="text-lg text-gray-600">
                    रु. {work.rate}/{currentLanguage === 'np' ? 'टुक्रा' : 'piece'}
                  </div>
                </div>
                
                {selectedWork?.id === work.id && (
                  <div className="text-green-600 font-bold text-lg">
                    {currentLanguage === 'np' ? '✓ चयन गरिएको' : '✓ Selected'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="bg-gray-200 text-gray-700 py-3 px-6 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors touch-button"
            >
              ⬅️ {currentLanguage === 'np' ? 'अघिल्लो' : 'Previous'}
            </button>
            
            <div className="flex items-center space-x-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`w-12 h-12 rounded-xl font-bold text-lg transition-colors ${
                    currentPage === index 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="bg-gray-200 text-gray-700 py-3 px-6 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors touch-button"
            >
              {currentLanguage === 'np' ? 'अर्को' : 'Next'} ➡️
            </button>
          </div>
        )}

        {/* Accept Button */}
        {selectedWork && (
          <div className="bg-white rounded-3xl p-8 shadow-lg border-4 border-green-300">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {currentLanguage === 'np' ? '✅ काम पुष्टि गर्नुहोस्' : '✅ Confirm Your Work'}
              </h3>
              
              <div className="bg-green-50 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="text-4xl">{selectedWork.icon}</div>
                  <div>
                    <div className="text-xl font-bold">{selectedWork.articleName}</div>
                    <div className="text-gray-600">{selectedWork.operation}</div>
                  </div>
                </div>
                
                <div className="text-3xl font-bold text-green-600 mb-2">
                  रु. {selectedWork.earnings}
                </div>
                <div className="text-gray-600">
                  {selectedWork.pieces} {currentLanguage === 'np' ? 'टुक्रा × रु.' : 'pieces × Rs.'} {selectedWork.rate}
                </div>
              </div>

              <div className="flex space-x-4 justify-center">
                <button
                  onClick={handleAcceptWork}
                  className="bg-green-500 text-white text-2xl font-bold py-6 px-12 rounded-2xl hover:bg-green-600 transition-colors touch-button"
                >
                  🎯 {currentLanguage === 'np' ? 'यो काम स्वीकार गर्नुहोस्' : 'Accept This Work'}
                </button>
                
                <button
                  onClick={() => setSelectedWork(null)}
                  className="bg-gray-500 text-white text-2xl font-bold py-6 px-12 rounded-2xl hover:bg-gray-600 transition-colors touch-button"
                >
                  ❌ {currentLanguage === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-3xl p-6 text-center">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">
            💡 {currentLanguage === 'np' ? 'सहयोग' : 'Help'}
          </h3>
          <p className="text-blue-700 text-lg">
            {currentLanguage === 'np' 
              ? 'कार्ड छुनुहोस् → काम छनोट गर्नुहोस् → हरियो बटन थिच्नुहोस्'
              : 'Touch card → Select work → Press green button'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleWorkAssignment;