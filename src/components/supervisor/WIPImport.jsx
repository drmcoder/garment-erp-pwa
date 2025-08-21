import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const WIPImport = ({ onImport, onCancel }) => {
  const { currentLanguage } = useLanguage();
  
  const [importMethod, setImportMethod] = useState('manual'); // 'manual' or 'sheets'
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [manualData, setManualData] = useState({
    lotNumber: '',
    articles: [''],
    fabricType: '',
    fabricWeight: '',
    colors: [{ name: '', layers: 0, pieces: {} }],
    consumptionRate: 0
  });

  const [processTemplate, setProcessTemplate] = useState('');
  const [customProcess, setCustomProcess] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Predefined process templates
  const processTemplates = {
    'polo-tshirt': {
      name: currentLanguage === 'np' ? 'पोलो टी-शर्ट मानक' : 'Polo T-Shirt Standard',
      steps: [
        { operation: 'काँध जोड्ने', machine: 'ओभरलक', rate: 2.50, time: 8 },
        { operation: 'प्लाकेट', machine: 'एकल सुई', rate: 3.20, time: 12 },
        { operation: 'कलर अट्याच', machine: 'एकल सुई', rate: 4.50, time: 15 },
        { operation: 'स्लिभ अट्याच', machine: 'ओभरलक', rate: 3.50, time: 10 },
        { operation: 'साइड सिम', machine: 'ओभरलक', rate: 2.80, time: 7 },
        { operation: 'हेम फोल्ड', machine: 'फ्ल्यालक', rate: 1.90, time: 6 }
      ]
    },
    'round-neck-tshirt': {
      name: currentLanguage === 'np' ? 'राउन्ड नेक टी-शर्ट' : 'Round Neck T-Shirt',
      steps: [
        { operation: 'काँध जोड्ने', machine: 'ओभरलक', rate: 2.20, time: 8 },
        { operation: 'नेक बाइन्डिङ', machine: 'ओभरलक', rate: 2.50, time: 10 },
        { operation: 'स्लिभ अट्याच', machine: 'ओभरलक', rate: 2.80, time: 8 },
        { operation: 'साइड सिम', machine: 'ओभरलक', rate: 2.30, time: 6 },
        { operation: 'हेम फोल्ड', machine: 'फ्ल्यालक', rate: 1.60, time: 3 }
      ]
    },
    '3-button-tops': {
      name: currentLanguage === 'np' ? '३-बटन पेपर टप्स' : '3-Button Paper Tops',
      steps: [
        { operation: 'कलर बनाउने', machine: 'एकल सुई', rate: 4.50, time: 15 },
        { operation: 'प्लाकेट तयारी', machine: 'एकल सुई', rate: 3.80, time: 12 },
        { operation: 'काँध जोड्ने', machine: 'ओभरलक', rate: 3.20, time: 10 },
        { operation: 'कलर अट्याच', machine: 'एकल सुई', rate: 5.50, time: 20 },
        { operation: 'स्लिभ सेटिङ', machine: 'ओभरलक', rate: 4.20, time: 15 },
        { operation: 'साइड सिम', machine: 'ओभरलक', rate: 3.50, time: 12 },
        { operation: 'बटनहोल', machine: 'बटनहोल', rate: 2.80, time: 8 },
        { operation: 'बटन अट्याच', machine: 'बटन अट्याच', rate: 2.20, time: 6 },
        { operation: 'हेम फिनिसिङ', machine: 'एकल सुई', rate: 2.40, time: 8 },
        { operation: 'फाइनल प्रेसिङ', machine: 'आइरन', rate: 1.80, time: 5 }
      ]
    }
  };

  const sizes = {
    'tshirt': ['L', 'XL', '2XL', '3XL'],
    'tops': ['L', 'XL', '2XL', '3XL', '4XL', '5XL']
  };

  const handleAddArticle = () => {
    setManualData(prev => ({
      ...prev,
      articles: [...prev.articles, '']
    }));
  };

  const handleRemoveArticle = (index) => {
    setManualData(prev => ({
      ...prev,
      articles: prev.articles.filter((_, i) => i !== index)
    }));
  };

  const handleArticleChange = (index, value) => {
    setManualData(prev => ({
      ...prev,
      articles: prev.articles.map((article, i) => i === index ? value : article)
    }));
  };

  const handleAddColor = () => {
    setManualData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: '', layers: 0, pieces: {} }]
    }));
  };

  const handleColorChange = (index, field, value) => {
    setManualData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => 
        i === index ? { ...color, [field]: value } : color
      )
    }));
  };

  const handleSizeChange = (colorIndex, size, pieces) => {
    setManualData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => 
        i === colorIndex ? {
          ...color,
          pieces: { ...color.pieces, [size]: parseInt(pieces) || 0 }
        } : color
      )
    }));
  };

  const parseGoogleSheets = async () => {
    setIsProcessing(true);
    try {
      // Simulate Google Sheets parsing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock parsed data
      const parsedData = {
        lotNumber: 'S-85',
        articles: ['8085'],
        fabricType: 'Cotton Pique',
        fabricWeight: '180 GSM',
        colors: [
          {
            name: 'नीलो-१',
            layers: 35,
            pieces: { 'L': 180, 'XL': 185, '2XL': 190, '3XL': 190 }
          }
        ],
        consumptionRate: 0.25
      };
      
      setManualData(parsedData);
      setImportMethod('manual'); // Switch to manual to show parsed data
    } catch (error) {
      console.error('Error parsing sheets:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateBundles = () => {
    const bundles = [];
    let bundleCounter = 1;

    manualData.colors.forEach(color => {
      Object.entries(color.pieces).forEach(([size, pieceCount]) => {
        if (pieceCount > 0) {
          // Calculate bundle size (typically 25-40 pieces)
          const bundleSize = Math.min(pieceCount, 30);
          const numberOfBundles = Math.ceil(pieceCount / bundleSize);

          for (let i = 0; i < numberOfBundles; i++) {
            const remainingPieces = pieceCount - (i * bundleSize);
            const currentBundleSize = Math.min(bundleSize, remainingPieces);

            if (currentBundleSize > 0) {
              const bundleId = `B${bundleCounter.toString().padStart(3, '0')}-${manualData.articles[0]}-${color.name.split('-')[1] || 'C'}-${size}`;
              
              // Create bundles for each process step
              const template = processTemplates[processTemplate];
              if (template) {
                template.steps.forEach((step, stepIndex) => {
                  bundles.push({
                    id: `${bundleId}-${stepIndex + 1}`,
                    bundleNumber: bundleId,
                    lotNumber: manualData.lotNumber,
                    article: manualData.articles[0],
                    color: color.name,
                    size: size,
                    pieces: currentBundleSize,
                    operation: step.operation,
                    machine: step.machine,
                    rate: step.rate,
                    estimatedTime: step.time,
                    sequence: stepIndex + 1,
                    status: 'pending',
                    priority: 'normal'
                  });
                });
              }
              bundleCounter++;
            }
          }
        }
      });
    });

    return bundles;
  };

  const handleSubmit = () => {
    if (!processTemplate) {
      alert('प्रक्रिया टेम्प्लेट छान्नुहोस्');
      return;
    }

    const bundles = generateBundles();
    const wipData = {
      lotNumber: manualData.lotNumber,
      articles: manualData.articles,
      fabricType: manualData.fabricType,
      fabricWeight: manualData.fabricWeight,
      colors: manualData.colors,
      consumptionRate: manualData.consumptionRate,
      processTemplate: processTemplate,
      bundles: bundles,
      createdAt: new Date().toISOString(),
      totalPieces: manualData.colors.reduce((total, color) => 
        total + Object.values(color.pieces).reduce((sum, pieces) => sum + pieces, 0), 0
      )
    };

    onImport(wipData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {currentLanguage === 'np' ? 'WIP डेटा आयात गर्नुहोस्' : 'Import WIP Data'}
              </h1>
              <p className="text-sm text-gray-600">
                {currentLanguage === 'np' ? 'Google Sheets वा म्यानुअल एन्ट्री' : 'Google Sheets or Manual Entry'}
              </p>
            </div>
          </div>

          {/* Import Method Selection */}
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="sheets"
                checked={importMethod === 'sheets'}
                onChange={(e) => setImportMethod(e.target.value)}
                className="mr-2"
              />
              <span>{currentLanguage === 'np' ? 'Google Sheets बाट आयात' : 'Import from Google Sheets'}</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="manual"
                checked={importMethod === 'manual'}
                onChange={(e) => setImportMethod(e.target.value)}
                className="mr-2"
              />
              <span>{currentLanguage === 'np' ? 'म्यानुअल एन्ट्री' : 'Manual Entry'}</span>
            </label>
          </div>
        </div>

        {/* Google Sheets Import */}
        {importMethod === 'sheets' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === 'np' ? 'Google Sheets URL' : 'Google Sheets URL'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === 'np' ? 'Sheets लिंक' : 'Sheets Link'}
                </label>
                <input
                  type="url"
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
              </div>
              
              <button
                onClick={parseGoogleSheets}
                disabled={!sheetsUrl || isProcessing}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {currentLanguage === 'np' ? 'पार्स गर्दै...' : 'Parsing...'}
                  </>
                ) : (
                  currentLanguage === 'np' ? 'डेटा पार्स गर्नुहोस्' : 'Parse Data'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Manual Data Entry */}
        {importMethod === 'manual' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {currentLanguage === 'np' ? 'आधारभूत जानकारी' : 'Basic Information'}
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'लट नम्बर' : 'Lot Number'}
                  </label>
                  <input
                    type="text"
                    value={manualData.lotNumber}
                    onChange={(e) => setManualData(prev => ({ ...prev, lotNumber: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="S-85"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'कपडाको प्रकार' : 'Fabric Type'}
                  </label>
                  <input
                    type="text"
                    value={manualData.fabricType}
                    onChange={(e) => setManualData(prev => ({ ...prev, fabricType: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Cotton Pique"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'कपडाको तौल' : 'Fabric Weight'}
                  </label>
                  <input
                    type="text"
                    value={manualData.fabricWeight}
                    onChange={(e) => setManualData(prev => ({ ...prev, fabricWeight: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="180 GSM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLanguage === 'np' ? 'खपत दर (kg/टुक्रा)' : 'Consumption Rate (kg/piece)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualData.consumptionRate}
                    onChange={(e) => setManualData(prev => ({ ...prev, consumptionRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.25"
                  />
                </div>
              </div>
            </div>

            {/* Articles */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {currentLanguage === 'np' ? 'लेख नम्बरहरू' : 'Article Numbers'}
                </h2>
                <button
                  onClick={handleAddArticle}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  + {currentLanguage === 'np' ? 'लेख थप्नुहोस्' : 'Add Article'}
                </button>
              </div>
              
              <div className="space-y-2">
                {manualData.articles.map((article, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={article}
                      onChange={(e) => handleArticleChange(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="8085"
                    />
                    {manualData.articles.length > 1 && (
                      <button
                        onClick={() => handleRemoveArticle(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Colors and Sizes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {currentLanguage === 'np' ? 'रङ र साइज' : 'Colors and Sizes'}
                </h2>
                <button
                  onClick={handleAddColor}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >+ {currentLanguage === 'np' ? 'रङ थप्नुहोस्' : 'Add Color'}
               </button>
             </div>
             
             <div className="space-y-6">
               {manualData.colors.map((color, colorIndex) => (
                 <div key={colorIndex} className="border border-gray-200 rounded-lg p-4">
                   <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         {currentLanguage === 'np' ? 'रङको नाम' : 'Color Name'}
                       </label>
                       <input
                         type="text"
                         value={color.name}
                         onChange={(e) => handleColorChange(colorIndex, 'name', e.target.value)}
                         className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="नीलो-१"
                       />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         {currentLanguage === 'np' ? 'लेयर संख्या' : 'Layer Count'}
                       </label>
                       <input
                         type="number"
                         value={color.layers}
                         onChange={(e) => handleColorChange(colorIndex, 'layers', parseInt(e.target.value) || 0)}
                         className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                         placeholder="35"
                       />
                     </div>
                   </div>
                   
                   {/* Size breakdown */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       {currentLanguage === 'np' ? 'साइज अनुसार टुक्रा संख्या' : 'Pieces by Size'}
                     </label>
                     <div className="grid grid-cols-4 gap-2">
                       {sizes.tshirt.map((size) => (
                         <div key={size}>
                           <label className="block text-xs text-gray-600 mb-1">{size}</label>
                           <input
                             type="number"
                             value={color.pieces[size] || ''}
                             onChange={(e) => handleSizeChange(colorIndex, size, e.target.value)}
                             className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                             placeholder="0"
                           />
                         </div>
                       ))}
                     </div>
                   </div>
                   
                   {/* Color summary */}
                   <div className="mt-3 p-2 bg-gray-50 rounded">
                     <span className="text-sm text-gray-600">
                       {currentLanguage === 'np' ? 'कुल टुक्रा:' : 'Total pieces:'} {' '}
                       <span className="font-medium">
                         {Object.values(color.pieces).reduce((sum, pieces) => sum + (pieces || 0), 0)}
                       </span>
                     </span>
                   </div>
                   
                   {manualData.colors.length > 1 && (
                     <button
                       onClick={() => setManualData(prev => ({
                         ...prev,
                         colors: prev.colors.filter((_, i) => i !== colorIndex)
                       }))}
                       className="mt-2 text-red-600 text-sm hover:text-red-800"
                     >
                       {currentLanguage === 'np' ? 'रङ हटाउनुहोस्' : 'Remove Color'}
                     </button>
                   )}
                 </div>
               ))}
             </div>
           </div>
         </div>
       )}

       {/* Process Template Selection */}
       <div className="bg-white rounded-lg shadow-sm p-6">
         <h2 className="text-lg font-semibold text-gray-800 mb-4">
           {currentLanguage === 'np' ? 'प्रक्रिया टेम्प्लेट छान्नुहोस्' : 'Select Process Template'}
         </h2>
         
         <div className="space-y-3">
           {Object.entries(processTemplates).map(([key, template]) => (
             <label key={key} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
               <input
                 type="radio"
                 name="processTemplate"
                 value={key}
                 checked={processTemplate === key}
                 onChange={(e) => setProcessTemplate(e.target.value)}
                 className="mt-1 mr-3"
               />
               <div className="flex-1">
                 <div className="font-medium text-gray-800 mb-2">{template.name}</div>
                 <div className="text-sm text-gray-600 mb-2">
                   {template.steps.length} {currentLanguage === 'np' ? 'चरणहरू' : 'steps'} | 
                   कुल दर: रु. {template.steps.reduce((sum, step) => sum + step.rate, 0).toFixed(2)} | 
                   अनुमानित समय: {template.steps.reduce((sum, step) => sum + step.time, 0)} मिनेट
                 </div>
                 <div className="flex flex-wrap gap-1">
                   {template.steps.slice(0, 3).map((step, index) => (
                     <span key={index} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                       {step.operation}
                     </span>
                   ))}
                   {template.steps.length > 3 && (
                     <span className="text-xs text-gray-500">
                       +{template.steps.length - 3} {currentLanguage === 'np' ? 'थप' : 'more'}
                     </span>
                   )}
                 </div>
               </div>
             </label>
           ))}
         </div>
         
         {/* Process Preview */}
         {processTemplate && (
           <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
             <h3 className="font-medium text-blue-800 mb-3">
               {currentLanguage === 'np' ? 'प्रक्रिया पूर्वावलोकन' : 'Process Preview'}
             </h3>
             <div className="space-y-2">
               {processTemplates[processTemplate].steps.map((step, index) => (
                 <div key={index} className="flex items-center justify-between text-sm">
                   <div className="flex items-center space-x-2">
                     <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                       {index + 1}
                     </span>
                     <span className="font-medium">{step.operation}</span>
                     <span className="text-gray-600">({step.machine})</span>
                   </div>
                   <div className="text-gray-600">
                     रु. {step.rate} | {step.time}मिन
                   </div>
                 </div>
               ))}
             </div>
           </div>
         )}
       </div>

       {/* Import Summary */}
       {manualData.lotNumber && processTemplate && (
         <div className="bg-white rounded-lg shadow-sm p-6">
           <h2 className="text-lg font-semibold text-gray-800 mb-4">
             {currentLanguage === 'np' ? 'आयात सारांश' : 'Import Summary'}
           </h2>
           
           <div className="grid grid-cols-2 gap-6">
             <div>
               <h3 className="font-medium text-gray-700 mb-2">
                 {currentLanguage === 'np' ? 'WIP विवरण' : 'WIP Details'}
               </h3>
               <div className="text-sm space-y-1">
                 <p><strong>लट:</strong> {manualData.lotNumber}</p>
                 <p><strong>लेखहरू:</strong> {manualData.articles.join(', ')}</p>
                 <p><strong>कपडा:</strong> {manualData.fabricType} ({manualData.fabricWeight})</p>
                 <p><strong>रङहरू:</strong> {manualData.colors.length}</p>
                 <p><strong>कुल टुक्रा:</strong> {
                   manualData.colors.reduce((total, color) => 
                     total + Object.values(color.pieces).reduce((sum, pieces) => sum + (pieces || 0), 0), 0
                   )
                 }</p>
               </div>
             </div>
             
             <div>
               <h3 className="font-medium text-gray-700 mb-2">
                 {currentLanguage === 'np' ? 'उत्पादन अनुमान' : 'Production Estimate'}
               </h3>
               <div className="text-sm space-y-1">
                 <p><strong>प्रक्रिया:</strong> {processTemplates[processTemplate]?.name}</p>
                 <p><strong>चरणहरू:</strong> {processTemplates[processTemplate]?.steps.length}</p>
                 <p><strong>अनुमानित बन्डल:</strong> {Math.ceil(
                   manualData.colors.reduce((total, color) => 
                     total + Object.values(color.pieces).reduce((sum, pieces) => sum + (pieces || 0), 0), 0
                   ) / 30
                 )}</p>
                 <p><strong>कुल प्रक्रिया बन्डल:</strong> {Math.ceil(
                   manualData.colors.reduce((total, color) => 
                     total + Object.values(color.pieces).reduce((sum, pieces) => sum + (pieces || 0), 0), 0
                   ) / 30
                 ) * processTemplates[processTemplate]?.steps.length}</p>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Action Buttons */}
       <div className="flex space-x-4">
         <button
           onClick={onCancel}
           className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
         >
           {currentLanguage === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
         </button>
         <button
           onClick={handleSubmit}
           disabled={!manualData.lotNumber || !processTemplate}
           className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {currentLanguage === 'np' ? 'WIP आयात गर्नुहोस्' : 'Import WIP'}
         </button>
       </div>
     </div>
   </div>
 );
};

export default WIPImport;