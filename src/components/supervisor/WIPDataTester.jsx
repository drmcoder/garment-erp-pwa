import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { WIPDataParser, parseWIPData } from '../../utils/wipDataParser';

const WIPDataTester = () => {
  const { currentLanguage } = useLanguage();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Sample test data in different formats
  const testDataSets = {
    horizontal_matrix: [
      ['Color', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
      ['नीलो-1', '45', '60', '80', '85', '70', '40', '25'],
      ['रातो-1', '40', '55', '75', '80', '65', '35', '20'],
      ['सेतो-1', '35', '50', '70', '75', '60', '30', '15']
    ],
    
    vertical_matrix: [
      ['Size', 'नीलो-1', 'रातो-1', 'सेतो-1'],
      ['XS', '45', '40', '35'],
      ['S', '60', '55', '50'],
      ['M', '80', '75', '70'],
      ['L', '85', '80', '75'],
      ['XL', '70', '65', '60'],
      ['2XL', '40', '35', '30'],
      ['3XL', '25', '20', '15']
    ],
    
    detailed_breakdown: [
      ['Color', 'Size', 'Pieces', 'Lot', 'Article'],
      ['नीलो-1', 'XS', '45', 'S-85', '8085'],
      ['नीलो-1', 'S', '60', 'S-85', '8085'],
      ['नीलो-1', 'M', '80', 'S-85', '8085'],
      ['रातो-1', 'XS', '40', 'S-85', '8085'],
      ['रातो-1', 'S', '55', 'S-85', '8085'],
      ['सेतो-1', 'M', '70', 'S-85', '8085']
    ],
    
    cutting_layout: [
      ['Color', 'Size', 'Pieces', 'Layers', 'Fabric', 'Buyer'],
      ['नीलो-1', 'L', '85', '4', 'Cotton Pique', 'ABC Garments'],
      ['नीलो-1', 'XL', '70', '3', 'Cotton Pique', 'ABC Garments'],
      ['रातो-1', 'L', '80', '4', 'Cotton Pique', 'ABC Garments'],
      ['रातो-1', 'XL', '65', '3', 'Cotton Pique', 'ABC Garments']
    ],
    
    batch_summary: [
      ['Lot', 'Article', 'Color', 'Total_Pieces', 'Cutting_Date', 'Buyer'],
      ['S-85', '8085', 'नीलो-1', '405', '2024-08-23', 'ABC Garments'],
      ['S-85', '8085', 'रातो-1', '370', '2024-08-23', 'ABC Garments'],
      ['S-86', '8086', 'सेतो-1', '335', '2024-08-23', 'XYZ Fashion']
    ]
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const results = [];

    for (const [formatName, testData] of Object.entries(testDataSets)) {
      try {
        console.log(`Testing format: ${formatName}`);
        
        const startTime = Date.now();
        const parsed = await parseWIPData(testData, 'auto');
        const endTime = Date.now();
        
        const parser = new WIPDataParser();
        const validation = parser.validateParsedData(parsed);
        const stats = parser.generateStats(parsed);
        
        results.push({
          format: formatName,
          success: true,
          detectedFormat: parsed.format,
          processingTime: endTime - startTime,
          stats: stats,
          validation: validation,
          data: parsed
        });
      } catch (error) {
        results.push({
          format: formatName,
          success: false,
          error: error.message
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getFormatDisplayName = (format) => {
    const names = {
      horizontal_matrix: currentLanguage === 'np' ? 'होरिजन्टल म्याट्रिक्स' : 'Horizontal Matrix',
      vertical_matrix: currentLanguage === 'np' ? 'भर्टिकल म्याट्रिक्स' : 'Vertical Matrix',
      detailed_breakdown: currentLanguage === 'np' ? 'विस्तृत ब्रेकडाउन' : 'Detailed Breakdown',
      cutting_layout: currentLanguage === 'np' ? 'कटिङ लेआउट' : 'Cutting Layout',
      batch_summary: currentLanguage === 'np' ? 'ब्याच सारांश' : 'Batch Summary'
    };
    return names[format] || format;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            🧪 {currentLanguage === 'np' ? 'WIP डेटा पार्सर परीक्षण' : 'WIP Data Parser Testing'}
          </h2>
          <p className="text-gray-600 mt-2">
            {currentLanguage === 'np' 
              ? 'विभिन्न फर्म्याटहरूमा WIP डेटा पार्सिङ परीक्षण गर्नुहोस्'
              : 'Test WIP data parsing across different formats'
            }
          </p>
        </div>

        <div className="p-6">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 mb-6"
          >
            {isRunning 
              ? (currentLanguage === 'np' ? '⏳ परीक्षण चलिरहेको छ...' : '⏳ Running Tests...')
              : (currentLanguage === 'np' ? '🚀 सबै परीक्षणहरू चलाउनुहोस्' : '🚀 Run All Tests')
            }
          </button>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">
                📊 {currentLanguage === 'np' ? 'परीक्षण परिणामहरू' : 'Test Results'}
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {getFormatDisplayName(result.format)}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {result.success 
                          ? (currentLanguage === 'np' ? '✅ सफल' : '✅ Success')
                          : (currentLanguage === 'np' ? '❌ असफल' : '❌ Failed')
                        }
                      </span>
                    </div>

                    {result.success ? (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">
                              {currentLanguage === 'np' ? 'पत्ता लगाइएको फर्म्याट:' : 'Detected Format:'}
                            </span>
                            <span className="ml-2 text-blue-600">{result.detectedFormat}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              {currentLanguage === 'np' ? 'प्रसंस्करण समय:' : 'Processing Time:'}
                            </span>
                            <span className="ml-2 text-green-600">{result.processingTime}ms</span>
                          </div>
                        </div>

                        {result.stats && (
                          <div className="bg-white rounded p-3 mt-3">
                            <h5 className="font-medium text-gray-800 mb-2">
                              📈 {currentLanguage === 'np' ? 'तथ्याङ्कहरू' : 'Statistics'}
                            </h5>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-gray-600">{currentLanguage === 'np' ? 'रङहरू:' : 'Colors:'}</span>
                                <span className="ml-2 font-medium">{result.stats.totalColors}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">{currentLanguage === 'np' ? 'साइजहरू:' : 'Sizes:'}</span>
                                <span className="ml-2 font-medium">{result.stats.totalSizes}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">{currentLanguage === 'np' ? 'कुल टुक्रा:' : 'Total Pieces:'}</span>
                                <span className="ml-2 font-medium">{result.stats.totalPieces}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">{currentLanguage === 'np' ? 'बन्डलहरू:' : 'Bundles:'}</span>
                                <span className="ml-2 font-medium">{result.stats.estimatedBundles}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {result.validation.warnings.length > 0 && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                            <p className="text-yellow-700 text-xs">
                              ⚠️ {currentLanguage === 'np' ? 'चेतावनी:' : 'Warnings:'} {result.validation.warnings.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Sample parsed data preview */}
                        {result.data && result.data.colors && result.data.colors.length > 0 && (
                          <div className="bg-white rounded p-3 mt-3">
                            <h5 className="font-medium text-gray-800 mb-2">
                              🎨 {currentLanguage === 'np' ? 'पार्स गरिएको डेटा नमूना' : 'Parsed Data Sample'}
                            </h5>
                            <div className="text-xs space-y-1">
                              {result.data.colors.slice(0, 2).map((color, colorIndex) => (
                                <div key={colorIndex} className="flex items-center space-x-2">
                                  <span className="font-medium text-blue-600">{color.name}:</span>
                                  <span className="text-gray-600">
                                    {Object.entries(color.pieces).slice(0, 3).map(([size, pieces]) => 
                                      `${size}:${pieces}`
                                    ).join(', ')}
                                    {Object.keys(color.pieces).length > 3 && '...'}
                                  </span>
                                  <span className="text-purple-600">(Total: {color.total || Object.values(color.pieces).reduce((sum, p) => sum + p, 0)})</span>
                                </div>
                              ))}
                              {result.data.colors.length > 2 && (
                                <p className="text-gray-500">+ {result.data.colors.length - 2} more colors</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-600 text-sm">
                        <p className="font-medium">
                          {currentLanguage === 'np' ? 'त्रुटि:' : 'Error:'}
                        </p>
                        <p className="mt-1">{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Overall Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">
                  📋 {currentLanguage === 'np' ? 'समग्र सारांश' : 'Overall Summary'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {testResults.filter(r => r.success).length}
                    </div>
                    <div className="text-gray-600">{currentLanguage === 'np' ? 'सफल परीक्षण' : 'Successful Tests'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {testResults.filter(r => !r.success).length}
                    </div>
                    <div className="text-gray-600">{currentLanguage === 'np' ? 'असफल परीक्षण' : 'Failed Tests'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {testResults.filter(r => r.success).reduce((sum, r) => sum + (r.stats?.totalPieces || 0), 0)}
                    </div>
                    <div className="text-gray-600">{currentLanguage === 'np' ? 'कुल टुक्रा पार्स भयो' : 'Total Pieces Parsed'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {testResults.filter(r => r.success).reduce((avg, r) => avg + (r.processingTime || 0), 0) / Math.max(testResults.filter(r => r.success).length, 1)}ms
                    </div>
                    <div className="text-gray-600">{currentLanguage === 'np' ? 'औसत प्रसंस्करण समय' : 'Avg Processing Time'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WIPDataTester;