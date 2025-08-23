import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { WIPDataParser, parseWIPData } from '../../utils/wipDataParser';
import { AdvancedWIPParser } from '../../utils/advancedWIPParser';
import { LayerBasedBundleGenerator } from '../../utils/layerBasedBundleGenerator';

const WIPImport = ({ onImport, onCancel }) => {
  const { currentLanguage } = useLanguage();
  
  const [importMethod, setImportMethod] = useState('excel'); // 'excel', 'manual', or 'sheets'
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [manualData, setManualData] = useState({
    lotNumber: '',
    articles: [''],
    fabricType: '',
    fabricWeight: '',
    colors: [{ name: '', layers: 0, pieces: {} }],
    consumptionRate: 0,
    cuttingDate: new Date().toISOString().split('T')[0],
    buyer: '',
    orderNumber: '',
    style: ''
  });

  const [processTemplate, setProcessTemplate] = useState('');
  const [customProcess, setCustomProcess] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentView, setCurrentView] = useState('import'); // 'import' or 'template-manager'
  const [templateManager, setTemplateManager] = useState({
    name: '',
    articleNumber: '',
    steps: []
  });
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Load saved templates from localStorage
  const [savedTemplates, setSavedTemplates] = useState(() => {
    const saved = localStorage.getItem('processTemplates');
    return saved ? JSON.parse(saved) : {};
  });

  // Predefined process templates
  const processTemplates = {
    ...savedTemplates,
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
    'tshirt': ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    'tops': ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
    'kids': ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y', '14-15Y']
  };

  // Available size categories
  const sizeCategories = {
    'adult': sizes.tshirt,
    'adult-extended': sizes.tops,
    'kids': sizes.kids
  };

  const [selectedSizeCategory, setSelectedSizeCategory] = useState('adult');

  // Template management functions
  const saveTemplate = () => {
    const templateKey = `custom-${Date.now()}`;
    const template = {
      name: templateManager.name,
      articleNumber: templateManager.articleNumber,
      steps: templateManager.steps
    };
    
    const updated = { ...savedTemplates, [templateKey]: template };
    setSavedTemplates(updated);
    localStorage.setItem('processTemplates', JSON.stringify(updated));
    
    // Reset form
    setTemplateManager({ name: '', articleNumber: '', steps: [] });
    setCurrentView('import');
  };

  const deleteTemplate = (templateKey) => {
    const updated = { ...savedTemplates };
    delete updated[templateKey];
    setSavedTemplates(updated);
    localStorage.setItem('processTemplates', JSON.stringify(updated));
  };

  const addTemplateStep = () => {
    setTemplateManager(prev => ({
      ...prev,
      steps: [...prev.steps, { operation: '', machine: 'ओभरलक', rate: 0, time: 0 }]
    }));
  };

  const updateTemplateStep = (index, field, value) => {
    setTemplateManager(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeTemplateStep = (index) => {
    setTemplateManager(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
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

  // Excel file handling functions
  const handleExcelFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setExcelFile(file);
      setExcelData(null);
    }
  };

  const parseExcelFile = async () => {
    if (!excelFile) return;
    
    setIsProcessing(true);
    try {
      // Read file content
      const fileContent = await readFileContent(excelFile);
      
      // Parse using the enhanced WIP parser
      const parsedResult = await parseWIPData(fileContent, 'auto');
      
      // Validate parsed data
      const parser = new WIPDataParser();
      const validation = parser.validateParsedData(parsedResult);
      const stats = parser.generateStats(parsedResult);
      
      if (validation.errors.length > 0) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Parsing warnings:', validation.warnings);
      }
      
      setExcelData({
        ...parsedResult,
        stats: stats,
        validation: validation
      });
      
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      alert(`${currentLanguage === 'np' ? 'Excel फाइल पार्स गर्नमा त्रुटि' : 'Error parsing Excel file'}: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          
          if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            // Parse CSV
            const lines = content.split('\n').map(line => line.split(','));
            resolve(lines);
          } else {
            // For Excel files, we would need a library like xlsx
            // For now, simulate with CSV-like parsing
            const lines = content.split('\n').map(line => 
              line.split(/\t|,/).map(cell => cell.trim())
            );
            resolve(lines);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsText(file); // For demo - real implementation would use xlsx
      }
    });
  };

  const useExcelData = () => {
    if (!excelData) return;
    
    // Convert Excel data to manual data format
    const convertedData = {
      ...manualData,
      colors: excelData.colors.map((color, index) => ({
        name: color.name,
        layers: Math.ceil(Object.values(color.pieces).reduce((sum, pieces) => sum + pieces, 0) / 25), // Estimate layers based on total pieces
        pieces: color.pieces
      }))
    };
    
    setManualData(convertedData);
    setImportMethod('manual'); // Switch to manual view to show data
  };

  const parseGoogleSheets = async () => {
    if (!sheetsUrl) return;
    
    setIsProcessing(true);
    try {
      // Extract Google Sheets CSV URL
      const csvUrl = convertToCSVUrl(sheetsUrl);
      
      // Fetch data from Google Sheets
      const response = await fetch(csvUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'text/csv'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const csvText = await response.text();
      const csvData = csvText.split('\n').map(line => 
        line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim())
      ).filter(row => row.some(cell => cell.length > 0));
      
      // Parse using advanced parser
      const advancedParser = new AdvancedWIPParser();
      const parsedResult = await advancedParser.parseWIPData(csvData);
      
      // Validate
      const validation = parsedResult.validation;
      
      if (validation.errors.length > 0) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Convert to manual data format with enhanced metadata
      const convertedData = {
        lotNumber: parsedResult.metadata.lotNumber || parsedResult.metadata.lot || 'AUTO-' + Date.now().toString().slice(-6),
        articles: parsedResult.metadata.articles || (parsedResult.metadata.article ? [parsedResult.metadata.article] : ['AUTO']),
        fabricType: parsedResult.metadata.fabric || 'Cotton',
        fabricWeight: parsedResult.metadata.weight || '180 GSM',
        colors: parsedResult.colors.map(color => ({
          name: color.name,
          layers: color.layers || Math.ceil(color.total / 25),
          pieces: color.pieces,
          piecesPerLayer: color.piecesPerLayer || Math.round(color.total / (color.layers || 1))
        })),
        consumptionRate: parsedResult.metadata.consumption || 0.25,
        buyer: parsedResult.metadata.buyer || 'Google Sheets Import',
        orderNumber: parsedResult.metadata.order || 'GS-' + Date.now().toString().slice(-6),
        style: parsedResult.metadata.style || parsedResult.metadata.article || 'Imported Style',
        cuttingDate: parsedResult.metadata.cuttingDate || new Date().toISOString().split('T')[0]
      };
      
      setManualData(convertedData);
      setImportMethod('manual');
      
    } catch (error) {
      console.error('Error parsing Google Sheets:', error);
      alert(`${currentLanguage === 'np' ? 'Google Sheets पार्स गर्नमा त्रुटि' : 'Error parsing Google Sheets'}: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const convertToCSVUrl = (sheetsUrl) => {
    // Convert various Google Sheets URL formats to CSV export URL
    let url = sheetsUrl.trim();
    
    // Handle published CSV URLs (already in correct format)
    if (url.includes('output=csv')) {
      return url;
    }
    
    // Handle pubhtml URLs
    if (url.includes('pubhtml')) {
      return url.replace('pubhtml', 'pub').replace(/&single=true.*$/, '') + '&output=csv';
    }
    
    // Handle regular sharing URLs
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      const sheetId = match[1];
      const gidMatch = url.match(/[#&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }
    
    throw new Error('Invalid Google Sheets URL format');
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

    try {
      // Use layer-based bundle generator for proper bundle creation
      const bundleGenerator = new LayerBasedBundleGenerator();
      
      // Prepare WIP data in the correct format for the generator
      const wipDataForGenerator = {
        lotNumber: manualData.lotNumber,
        articles: manualData.articles,
        colors: manualData.colors.map(color => ({
          name: color.name,
          layers: color.layers || Math.ceil(Object.values(color.pieces).reduce((sum, p) => sum + p, 0) / 25),
          pieces: color.pieces,
          total: Object.values(color.pieces).reduce((sum, p) => sum + p, 0)
        })),
        cuttingDate: manualData.cuttingDate,
        cutter: 'Manual Import'
      };

      // Determine garment type from process template
      let garmentType = 'tshirt'; // default
      if (processTemplate.includes('polo')) {
        garmentType = 'polo';
      }

      // Generate bundles using the layer-based approach
      const bundleResult = bundleGenerator.generateLayerBasedBundles(wipDataForGenerator, {
        garmentType: garmentType,
        maxBundleSize: 30,
        minBundleSize: 15,
        bundleNamingFormat: '{lot}-{article}-{color}-{size}-{sequence}'
      });

      const wipData = {
        lotNumber: manualData.lotNumber,
        articles: manualData.articles,
        fabricType: manualData.fabricType,
        fabricWeight: manualData.fabricWeight,
        colors: manualData.colors,
        consumptionRate: manualData.consumptionRate,
        processTemplate: processTemplate,
        bundles: bundleResult.bundles,
        workflowBundles: bundleGenerator.createProductionWorkflow(bundleResult.bundles),
        bundleSummary: bundleResult.summary,
        bundleMetadata: bundleResult.metadata,
        createdAt: new Date().toISOString(),
        totalPieces: bundleResult.summary.totalGarments,
        bundleGenerationMethod: 'layer_based'
      };

      onImport(wipData);
    } catch (error) {
      console.error('Bundle generation failed:', error);
      alert('बन्डल सिर्जना असफल भयो: ' + error.message);
    }
  };

  if (currentView === 'template-manager') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {currentLanguage === 'np' ? 'प्रक्रिया टेम्प्लेट प्रबन्धक' : 'Process Template Manager'} 🏭
          </h1>
          <button
            onClick={() => setCurrentView('import')}
            className="px-4 py-2 text-blue-600 hover:text-blue-800"
          >
            ← {currentLanguage === 'np' ? 'आयातमा फर्कनुहोस्' : 'Back to Import'}
          </button>
        </div>

        {/* Create New Template */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {currentLanguage === 'np' ? 'नयाँ टेम्प्लेट सिर्जना गर्नुहोस्' : 'Create New Template'}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'टेम्प्लेट नाम' : 'Template Name'}
              </label>
              <input
                type="text"
                value={templateManager.name}
                onChange={(e) => setTemplateManager(prev => ({ ...prev, name: e.target.value }))}
                placeholder={currentLanguage === 'np' ? 'टेम्प्लेटको नाम' : 'Template name'}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentLanguage === 'np' ? 'लेख नम्बर' : 'Article Number'}
              </label>
              <input
                type="text"
                value={templateManager.articleNumber}
                onChange={(e) => setTemplateManager(prev => ({ ...prev, articleNumber: e.target.value }))}
                placeholder="8085"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Process Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-700">
                {currentLanguage === 'np' ? 'प्रक्रिया चरणहरू' : 'Process Steps'}
              </h3>
              <button
                onClick={addTemplateStep}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                + {currentLanguage === 'np' ? 'चरण थप्नुहोस्' : 'Add Step'}
              </button>
            </div>

            {templateManager.steps.map((step, index) => (
              <div key={index} className="grid grid-cols-5 gap-3 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {currentLanguage === 'np' ? 'सञ्चालन' : 'Operation'}
                  </label>
                  <input
                    type="text"
                    value={step.operation}
                    onChange={(e) => updateTemplateStep(index, 'operation', e.target.value)}
                    placeholder={currentLanguage === 'np' ? 'सञ्चालनको नाम' : 'Operation name'}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {currentLanguage === 'np' ? 'मेसिन' : 'Machine'}
                  </label>
                  <select
                    value={step.machine}
                    onChange={(e) => updateTemplateStep(index, 'machine', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                  >
                    <option value="ओभरलक">ओभरलक</option>
                    <option value="एकल सुई">एकल सुई</option>
                    <option value="फ्ल्यालक">फ्ल्यालक</option>
                    <option value="बटनहोल">बटनहोल</option>
                    <option value="बटन अट्याच">बटन अट्याच</option>
                    <option value="आइरन">आइरन</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {currentLanguage === 'np' ? 'दर (रु.)' : 'Rate (Rs.)'}
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={step.rate}
                    onChange={(e) => updateTemplateStep(index, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {currentLanguage === 'np' ? 'समय (मिन)' : 'Time (min)'}
                  </label>
                  <input
                    type="number"
                    value={step.time}
                    onChange={(e) => updateTemplateStep(index, 'time', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => removeTemplateStep(index)}
                    className="w-full p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {templateManager.steps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {currentLanguage === 'np' ? 'कुनै चरण थपिएको छैन' : 'No steps added yet'}
              </div>
            )}
          </div>

          {/* Save Template */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setTemplateManager({ name: '', articleNumber: '', steps: [] })}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {currentLanguage === 'np' ? 'सफा गर्नुहोस्' : 'Clear'}
            </button>
            <button
              onClick={saveTemplate}
              disabled={!templateManager.name || !templateManager.articleNumber || templateManager.steps.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentLanguage === 'np' ? 'टेम्प्लेट सुरक्षित गर्नुहोस्' : 'Save Template'}
            </button>
          </div>
        </div>

        {/* Existing Templates */}
        {Object.keys(savedTemplates).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {currentLanguage === 'np' ? 'सुरक्षित टेम्प्लेटहरू' : 'Saved Templates'}
            </h2>
            
            <div className="space-y-4">
              {Object.entries(savedTemplates).map(([key, template]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">
                        {currentLanguage === 'np' ? 'लेख:' : 'Article:'} {template.articleNumber} | 
                        {template.steps.length} {currentLanguage === 'np' ? 'चरणहरू' : 'steps'}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTemplate(key)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                    >
                      {currentLanguage === 'np' ? 'मेटाउनुहोस्' : 'Delete'}
                    </button>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    {template.steps.map((step, index) => (
                      <div key={index} className="flex justify-between text-gray-600">
                        <span>{step.operation} ({step.machine})</span>
                        <span>रु. {step.rate} | {step.time}मिन</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
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
            <button
              onClick={() => setCurrentView('template-manager')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {currentLanguage === 'np' ? 'टेम्प्लेट प्रबन्धक' : 'Template Manager'}
            </button>
          </div>

          {/* Import Method Selection */}
          <div className="flex space-x-4 flex-wrap">
            <label className="flex items-center">
              <input
                type="radio"
                value="excel"
                checked={importMethod === 'excel'}
                onChange={(e) => setImportMethod(e.target.value)}
                className="mr-2"
              />
              <span>{currentLanguage === 'np' ? 'Excel फाइल आयात' : 'Import Excel File'}</span>
            </label>
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

        {/* Excel File Import */}
        {importMethod === 'excel' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📊 {currentLanguage === 'np' ? 'Excel WIP फाइल अपलोड' : 'Excel WIP File Upload'}
            </h2>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLanguage === 'np' ? 'WIP Excel फाइल छान्नुहोस्' : 'Select WIP Excel File'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelFileUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label htmlFor="excel-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-gray-600 mb-2">
                      {excelFile ? excelFile.name : 
                        (currentLanguage === 'np' ? 'Excel फाइल छान्नुहोस्' : 'Click to select Excel file')
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentLanguage === 'np' ? 'समर्थित: .xlsx, .xls, .csv' : 'Supported: .xlsx, .xls, .csv'}
                    </p>
                  </label>
                </div>
              </div>
              
              {/* Supported Formats Guide */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-3">
                  📋 {currentLanguage === 'np' ? 'सपोर्टेड फर्म्याटहरू' : 'Supported Formats'}
                </h3>
                <div className="text-sm text-blue-700 space-y-3">
                  <div>
                    <p className="font-semibold">📋 {currentLanguage === 'np' ? 'होरिजन्टल म्याट्रिक्स:' : 'Horizontal Matrix:'}</p>
                    <p className="ml-4">Color | XS | S | M | L | XL | 2XL | 3XL</p>
                  </div>
                  <div>
                    <p className="font-semibold">📋 {currentLanguage === 'np' ? 'भर्टिकल म्याट्रिक्स:' : 'Vertical Matrix:'}</p>
                    <p className="ml-4">Size | Color1 | Color2 | Color3</p>
                  </div>
                  <div>
                    <p className="font-semibold">📋 {currentLanguage === 'np' ? 'डिटेल ब्रेकडाउन:' : 'Detail Breakdown:'}</p>
                    <p className="ml-4">Color | Size | Pieces | Lot | Article</p>
                  </div>
                  <div>
                    <p className="font-semibold">📋 {currentLanguage === 'np' ? 'कटिङ लेआउट:' : 'Cutting Layout:'}</p>
                    <p className="ml-4">Color | Size | Pieces | Layers | Fabric</p>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    🤖 {currentLanguage === 'np' ? 'आटो-डिटेक्शन: सिस्टमले आफ्नै फर्म्याट पत्ता लगाउँछ' : 'Auto-Detection: System automatically detects your format'}
                  </p>
                </div>
              </div>
              
              {excelFile && (
                <button
                  onClick={parseExcelFile}
                  disabled={isProcessing}
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
                    <>
                      📊 {currentLanguage === 'np' ? 'Excel डेटा पार्स गर्नुहोस्' : 'Parse Excel Data'}
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Parsed Excel Data Preview */}
            {excelData && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">
                  📈 {currentLanguage === 'np' ? 'पार्स गरिएको डेटा पूर्वावलोकन' : 'Parsed Data Preview'}
                </h3>
                
                {/* Parsing Statistics */}
                {excelData.stats && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-green-800 mb-2">
                      📊 {currentLanguage === 'np' ? 'पार्सिङ तथ्याङ्क' : 'Parsing Statistics'}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-green-600 font-medium">{currentLanguage === 'np' ? 'फर्म्याट:' : 'Format:'}</span>
                        <span className="ml-1 text-green-800">{excelData.stats.format}</span>
                      </div>
                      <div>
                        <span className="text-green-600 font-medium">{currentLanguage === 'np' ? 'रङहरू:' : 'Colors:'}</span>
                        <span className="ml-1 text-green-800">{excelData.stats.totalColors}</span>
                      </div>
                      <div>
                        <span className="text-green-600 font-medium">{currentLanguage === 'np' ? 'साइजहरू:' : 'Sizes:'}</span>
                        <span className="ml-1 text-green-800">{excelData.stats.totalSizes}</span>
                      </div>
                      <div>
                        <span className="text-green-600 font-medium">{currentLanguage === 'np' ? 'बन्डल:' : 'Bundles:'}</span>
                        <span className="ml-1 text-green-800">{excelData.stats.estimatedBundles}</span>
                      </div>
                    </div>
                    {excelData.validation.warnings.length > 0 && (
                      <div className="mt-2 text-xs text-yellow-600">
                        ⚠️ {currentLanguage === 'np' ? 'चेतावनी:' : 'Warnings:'} {excelData.validation.warnings.join(', ')}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {currentLanguage === 'np' ? 'रङ' : 'Color'}
                        </th>
                        {sizeCategories[selectedSizeCategory].map(size => (
                          <th key={size} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {size}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {currentLanguage === 'np' ? 'कुल' : 'Total'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {excelData.colors.map((color, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{color.name}</td>
                          {sizeCategories[selectedSizeCategory].map(size => (
                            <td key={size} className="px-3 py-2 text-sm text-gray-500">
                              {color.pieces[size] || 0}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                            {Object.values(color.pieces).reduce((sum, pieces) => sum + (pieces || 0), 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {currentLanguage === 'np' ? 'रङहरू:' : 'Colors:'} {excelData.colors.length} | 
                    {currentLanguage === 'np' ? 'कुल टुक्रा:' : 'Total Pieces:'} {' '}
                    <span className="font-semibold">
                      {excelData.colors.reduce((total, color) => 
                        total + Object.values(color.pieces).reduce((sum, pieces) => sum + (pieces || 0), 0), 0
                      )}
                    </span>
                  </span>
                  <button
                    onClick={useExcelData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    ✅ {currentLanguage === 'np' ? 'यो डेटा प्रयोग गर्नुहोस्' : 'Use This Data'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
   </div>
 );
};

export default WIPImport;