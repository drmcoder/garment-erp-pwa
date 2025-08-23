import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AdvancedWIPParser } from '../../utils/advancedWIPParser';

const GoogleSheetsParser = () => {
  const { currentLanguage } = useLanguage();
  const [testUrls] = useState([
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOKDxLoiRvUsdnbcatYxSbVnQJ2cnTB0bDS8-KCBv9aAKfjh6Bk2XekI1SqH9WHw/pub?gid=950721958&single=true&output=csv',
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvaGQezevdvigP8d6cBbQKkChvsWuKvOv_CM7EXdoH3siBlFfwCvqtRxtwruV_Jg/pub?gid=1893076681&single=true&output=csv',
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMhKbILy_mqMh_FXw3skhptM9Vzfw9cJlHpxGQr4wyRyWaycDRzdjF5bQWC7Pwew/pub?gid=1581212011&single=true&output=csv',
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSr_vn3pofV-LmP6Z3-85PXM2xYMdJGCuX8Fr5dhQPO-W_PwifMvYPmJc_mUPXvqQ/pub?gid=1507858987&single=true&output=csv'
  ]);
  
  const [customUrl, setCustomUrl] = useState('');
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  const parseGoogleSheet = async (url, index) => {
    try {
      console.log(`Fetching data from URL ${index + 1}:`, url);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/csv,application/csv',
          'User-Agent': 'Mozilla/5.0 (compatible; WIP-Parser/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log(`CSV data fetched (${csvText.length} characters)`);
      
      // Parse CSV to array
      const csvData = this.parseCSVText(csvText);
      console.log(`Parsed ${csvData.length} rows, ${csvData[0]?.length} columns`);
      
      // Use advanced parser
      const parser = new AdvancedWIPParser();
      const parsedResult = await parser.parseWIPData(csvData);
      
      return {
        url: url,
        index: index + 1,
        success: true,
        rawData: csvData.slice(0, 10), // First 10 rows for preview
        totalRows: csvData.length,
        totalColumns: csvData[0]?.length || 0,
        parsedResult: parsedResult,
        processingTime: Date.now()
      };
      
    } catch (error) {
      console.error(`Error parsing URL ${index + 1}:`, error);
      return {
        url: url,
        index: index + 1,
        success: false,
        error: error.message,
        processingTime: Date.now()
      };
    }
  };

  const parseCSVText = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const cells = [];
      let current = '';
      let inQuotes = false;
      let i = 0;
      
      while (i < line.length) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i-1] === ',')) {
          inQuotes = true;
        } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
          inQuotes = false;
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else if (char !== '"' || inQuotes) {
          current += char;
        }
        i++;
      }
      
      cells.push(current.trim());
      return cells;
    });
  };

  const testAllUrls = async () => {
    setIsProcessing(true);
    setResults([]);
    
    const allResults = [];
    
    for (let i = 0; i < testUrls.length; i++) {
      const result = await parseGoogleSheet(testUrls[i], i);
      allResults.push(result);
      setResults([...allResults]); // Update results incrementally
    }
    
    setIsProcessing(false);
  };

  const testCustomUrl = async () => {
    if (!customUrl.trim()) return;
    
    setIsProcessing(true);
    const result = await parseGoogleSheet(customUrl.trim(), results.length);
    setResults(prev => [...prev, result]);
    setIsProcessing(false);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return value.toString();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            📊 {currentLanguage === 'np' ? 'Google Sheets WIP पार्सर परीक्षण' : 'Google Sheets WIP Parser Testing'}
          </h2>
          <p className="text-gray-600 mt-2">
            {currentLanguage === 'np' 
              ? 'तपाईंका Google Sheets URLs परीक्षण गरी डेटा फर्म्याट बुझ्नुहोस्'
              : 'Test your Google Sheets URLs to understand the data format'
            }
          </p>
        </div>

        <div className="p-6">
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={testAllUrls}
              disabled={isProcessing}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isProcessing 
                ? <><div className="animate-spin mr-2">⏳</div> {currentLanguage === 'np' ? 'परीक्षण चलिरहेको...' : 'Testing...'}</> 
                : <><span className="mr-2">🚀</span> {currentLanguage === 'np' ? 'सबै URLs परीक्षण गर्नुहोस्' : 'Test All URLs'}</>
              }
            </button>
            
            <button
              onClick={() => setResults([])}
              className="bg-gray-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-600"
            >
              🗑️ {currentLanguage === 'np' ? 'सफा गर्नुहोस्' : 'Clear Results'}
            </button>
          </div>

          {/* Custom URL Testing */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              🔗 {currentLanguage === 'np' ? 'कस्टम URL परीक्षण' : 'Custom URL Testing'}
            </h3>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={testCustomUrl}
                disabled={isProcessing || !customUrl.trim()}
                className="bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {currentLanguage === 'np' ? 'परीक्षण' : 'Test'}
              </button>
            </div>
          </div>

          {/* Results Display */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                📈 {currentLanguage === 'np' ? 'परीक्षण परिणामहरू' : 'Test Results'} ({results.length})
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      result.success 
                        ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                        : 'border-red-200 bg-red-50'
                    } ${selectedResult === result ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        URL {result.index}
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
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium text-gray-700">
                              {currentLanguage === 'np' ? 'पंक्तिहरू:' : 'Rows:'}
                            </span>
                            <span className="ml-2">{result.totalRows}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              {currentLanguage === 'np' ? 'कलमहरू:' : 'Columns:'}
                            </span>
                            <span className="ml-2">{result.totalColumns}</span>
                          </div>
                        </div>

                        {result.parsedResult && (
                          <div className="bg-white rounded p-3 mt-3">
                            <h5 className="font-medium text-gray-800 mb-2">पार्स गरिएको डेटा</h5>
                            <div className="text-xs space-y-1">
                              <div><strong>Format:</strong> {result.parsedResult.format}</div>
                              <div><strong>Colors:</strong> {result.parsedResult.statistics?.totalColors || 0}</div>
                              <div><strong>Total Pieces:</strong> {result.parsedResult.statistics?.totalPieces || 0}</div>
                              {result.parsedResult.formatInfo && (
                                <div><strong>Confidence:</strong> {(result.parsedResult.formatInfo.confidence * 100).toFixed(1)}%</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Raw Data Preview */}
                        {result.rawData && result.rawData.length > 0 && (
                          <div className="bg-white rounded p-3 mt-3">
                            <h5 className="font-medium text-gray-800 mb-2">कच्चा डेटा (पहिलो 3 पंक्ति)</h5>
                            <div className="text-xs space-y-1 font-mono">
                              {result.rawData.slice(0, 3).map((row, rowIndex) => (
                                <div key={rowIndex} className="truncate">
                                  <strong>Row {rowIndex}:</strong> [{row.slice(0, 5).map(cell => `"${cell}"`).join(', ')}
                                  {row.length > 5 && '...'}]
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-600 text-sm">
                        <p className="font-medium">Error:</p>
                        <p className="mt-1">{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed View */}
          {selectedResult && selectedResult.success && (
            <div className="mt-8 bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🔍 URL {selectedResult.index} - विस्तृत दृश्य
              </h3>

              {/* Parsed Data Details */}
              {selectedResult.parsedResult && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">पार्सिङ जानकारी</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Format:</span>
                        <span className="ml-2">{selectedResult.parsedResult.format}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Confidence:</span>
                        <span className="ml-2">{(selectedResult.parsedResult.formatInfo?.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Colors:</span>
                        <span className="ml-2">{selectedResult.parsedResult.statistics?.totalColors}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Total Pieces:</span>
                        <span className="ml-2">{selectedResult.parsedResult.statistics?.totalPieces}</span>
                      </div>
                    </div>
                  </div>

                  {/* Colors Data */}
                  {selectedResult.parsedResult.colors && selectedResult.parsedResult.colors.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3">रङ डेटा</h4>
                      <div className="space-y-2">
                        {selectedResult.parsedResult.colors.slice(0, 5).map((color, index) => (
                          <div key={index} className="bg-white rounded p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-800">{color.name}</span>
                              <span className="text-sm text-gray-600">Total: {color.total}</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              <strong>Sizes:</strong> {Object.entries(color.pieces).map(([size, count]) => `${size}:${count}`).join(', ')}
                            </div>
                            {color.layers && (
                              <div className="text-xs text-gray-600 mt-1">
                                <strong>Layers:</strong> {color.layers}
                              </div>
                            )}
                          </div>
                        ))}
                        {selectedResult.parsedResult.colors.length > 5 && (
                          <p className="text-sm text-gray-600">+ {selectedResult.parsedResult.colors.length - 5} more colors</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {selectedResult.parsedResult.metadata && Object.keys(selectedResult.parsedResult.metadata).length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 mb-3">मेटाडेटा</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(selectedResult.parsedResult.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium text-purple-700 capitalize">{key}:</span>
                            <span className="ml-2 text-gray-700">{formatValue(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsParser;