import React, { useState, useEffect, useContext } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AuthContext } from '../../context/AuthContext';
import { useGlobalError } from '../common/GlobalErrorHandler';
import TemplateBuilder from './TemplateBuilder';
import { 
  universalDelete, 
  DELETE_PERMISSIONS, 
  DeleteConfirmationModal 
} from '../../utils/deleteUtils';
import { 
  db, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  serverTimestamp 
} from '../../config/firebase';
import { COLLECTIONS } from '../../config/firebase';

const ProcessTemplateManager = ({ onTemplateSelect, onClose }) => {
  const { currentLanguage } = useLanguage();
  const { user } = useContext(AuthContext);
  const { addError, ERROR_TYPES, ERROR_SEVERITY } = useGlobalError();
  
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Predefined process templates
  const defaultTemplates = [
    {
      id: 'polo-tshirt-template',
      name: currentLanguage === 'np' ? 'पोलो टी-शर्ट प्रसंस्करण' : 'Polo T-Shirt Process',
      articleType: 'polo-tshirt',
      articleNumbers: null, // Universal for all polo/t-shirt style garments
      operations: [
        {
          id: 1,
          name: currentLanguage === 'np' ? 'काटना' : 'Cutting',
          nameEn: 'Cutting',
          nameNp: 'काटना',
          machineType: 'cutting',
          estimatedTimePerPiece: 0.5,
          rate: 1.0,
          skillLevel: 'medium',
          sequence: 1,
          dependencies: [],
          icon: '✂️'
        },
        {
          id: 2,
          name: currentLanguage === 'np' ? 'काँध जोड्ने' : 'Shoulder Join',
          nameEn: 'Shoulder Join',
          nameNp: 'काँध जोड्ने',
          machineType: 'overlock',
          estimatedTimePerPiece: 2.5,
          rate: 2.5,
          skillLevel: 'easy',
          sequence: 2,
          dependencies: [1],
          icon: '🧵'
        },
        {
          id: 3,
          name: currentLanguage === 'np' ? 'साइड सिम' : 'Side Seam',
          nameEn: 'Side Seam',
          nameNp: 'साइड सिम',
          machineType: 'overlock',
          estimatedTimePerPiece: 3.0,
          rate: 3.0,
          skillLevel: 'easy',
          sequence: 3,
          dependencies: [2],
          icon: '📏'
        },
        {
          id: 4,
          name: currentLanguage === 'np' ? 'हेम फोल्ड' : 'Hem Fold',
          nameEn: 'Hem Fold',
          nameNp: 'हेम फोल्ड',
          machineType: 'flatlock',
          estimatedTimePerPiece: 1.5,
          rate: 2.0,
          skillLevel: 'easy',
          sequence: 4,
          dependencies: [3],
          icon: '📐'
        },
        {
          id: 5,
          name: currentLanguage === 'np' ? 'आर्महोल' : 'Armhole',
          nameEn: 'Armhole',
          nameNp: 'आर्महोल',
          machineType: 'overlock',
          estimatedTimePerPiece: 2.0,
          rate: 2.5,
          skillLevel: 'medium',
          sequence: 5,
          dependencies: [2],
          icon: '🔵'
        },
        {
          id: 6,
          name: currentLanguage === 'np' ? 'नेकलाइन' : 'Neckline',
          nameEn: 'Neckline',
          nameNp: 'नेकलाइन',
          machineType: 'flatlock',
          estimatedTimePerPiece: 2.5,
          rate: 3.0,
          skillLevel: 'hard',
          sequence: 6,
          dependencies: [5],
          icon: '⭕'
        },
        {
          id: 7,
          name: currentLanguage === 'np' ? 'प्लाकेट' : 'Placket',
          nameEn: 'Placket',
          nameNp: 'प्लाकेट',
          machineType: 'singleNeedle',
          estimatedTimePerPiece: 4.0,
          rate: 4.0,
          skillLevel: 'hard',
          sequence: 7,
          dependencies: [6],
          icon: '🎯'
        },
        {
          id: 8,
          name: currentLanguage === 'np' ? 'बटनहोल' : 'Buttonhole',
          nameEn: 'Buttonhole',
          nameNp: 'बटनहोल',
          machineType: 'buttonhole',
          estimatedTimePerPiece: 1.0,
          rate: 2.0,
          skillLevel: 'medium',
          sequence: 8,
          dependencies: [7],
          icon: '🕳️'
        },
        {
          id: 9,
          name: currentLanguage === 'np' ? 'बटन लगाउने' : 'Button Attach',
          nameEn: 'Button Attach',
          nameNp: 'बटन लगाउने',
          machineType: 'singleNeedle',
          estimatedTimePerPiece: 1.5,
          rate: 2.5,
          skillLevel: 'easy',
          sequence: 9,
          dependencies: [8],
          icon: '🔘'
        },
        {
          id: 10,
          name: currentLanguage === 'np' ? 'अन्तिम जाँच' : 'Final Check',
          nameEn: 'Final Check',
          nameNp: 'अन्तिम जाँच',
          machineType: 'manual',
          estimatedTimePerPiece: 0.5,
          rate: 1.0,
          skillLevel: 'easy',
          sequence: 10,
          dependencies: [9],
          icon: '✅'
        }
      ],
      totalOperations: 10,
      estimatedTotalTime: 18.5, // sum of all operation times
      createdAt: new Date()
    },
    {
      id: 'cargo-pants-template',
      name: currentLanguage === 'np' ? 'कार्गो प्यान्ट प्रसंस्करण' : 'Cargo Pants Process',
      articleType: 'cargo-pants',
      articleNumbers: null, // Universal for all trouser/bottom garments
      operations: [
        {
          id: 1,
          name: currentLanguage === 'np' ? 'काटना' : 'Cutting',
          nameEn: 'Cutting',
          nameNp: 'काटना',
          machineType: 'cutting',
          estimatedTimePerPiece: 1.0,
          rate: 1.5,
          skillLevel: 'medium',
          sequence: 1,
          dependencies: [],
          icon: '✂️'
        },
        {
          id: 2,
          name: currentLanguage === 'np' ? 'पकेट लगाउने' : 'Pocket Attach',
          nameEn: 'Pocket Attach',
          nameNp: 'पकेट लगाउने',
          machineType: 'singleNeedle',
          estimatedTimePerPiece: 5.0,
          rate: 5.0,
          skillLevel: 'hard',
          sequence: 2,
          dependencies: [1],
          icon: '👜'
        },
        {
          id: 3,
          name: currentLanguage === 'np' ? 'साइड सिम' : 'Side Seam',
          nameEn: 'Side Seam',
          nameNp: 'साइड सिम',
          machineType: 'overlock',
          estimatedTimePerPiece: 4.0,
          rate: 4.0,
          skillLevel: 'medium',
          sequence: 3,
          dependencies: [2],
          icon: '📏'
        },
        {
          id: 4,
          name: currentLanguage === 'np' ? 'इन्सिम' : 'Inseam',
          nameEn: 'Inseam',
          nameNp: 'इन्सिम',
          machineType: 'overlock',
          estimatedTimePerPiece: 3.0,
          rate: 3.5,
          skillLevel: 'medium',
          sequence: 4,
          dependencies: [3],
          icon: '🦵'
        },
        {
          id: 5,
          name: currentLanguage === 'np' ? 'कम्मर बन्ड' : 'Waistband',
          nameEn: 'Waistband',
          nameNp: 'कम्मर बन्ड',
          machineType: 'flatlock',
          estimatedTimePerPiece: 3.5,
          rate: 4.0,
          skillLevel: 'hard',
          sequence: 5,
          dependencies: [4],
          icon: '⚫'
        },
        {
          id: 6,
          name: currentLanguage === 'np' ? 'हेम' : 'Hem',
          nameEn: 'Hem',
          nameNp: 'हेम',
          machineType: 'flatlock',
          estimatedTimePerPiece: 2.0,
          rate: 2.5,
          skillLevel: 'easy',
          sequence: 6,
          dependencies: [5],
          icon: '📐'
        },
        {
          id: 7,
          name: currentLanguage === 'np' ? 'अन्तिम जाँच' : 'Final Check',
          nameEn: 'Final Check',
          nameNp: 'अन्तिम जाँच',
          machineType: 'manual',
          estimatedTimePerPiece: 1.0,
          rate: 1.0,
          skillLevel: 'easy',
          sequence: 7,
          dependencies: [6],
          icon: '✅'
        }
      ],
      totalOperations: 7,
      estimatedTotalTime: 19.5,
      createdAt: new Date()
    },
    {
      id: 'universal-garment-template',
      name: currentLanguage === 'np' ? 'सार्वभौमिक गार्मेन्ट प्रसंस्करण' : 'Universal Garment Process',
      articleType: 'universal',
      articleNumbers: null, // Will work with any article
      operations: [
        {
          id: 1,
          name: currentLanguage === 'np' ? 'काटना' : 'Cutting',
          nameEn: 'Cutting',
          nameNp: 'काटना',
          machineType: 'cutting',
          estimatedTimePerPiece: 0.5,
          rate: 1.0,
          skillLevel: 'medium',
          sequence: 1,
          dependencies: [],
          icon: '✂️'
        },
        {
          id: 2,
          name: currentLanguage === 'np' ? 'मुख्य सिलाई' : 'Main Sewing',
          nameEn: 'Main Sewing',
          nameNp: 'मुख्य सिलाई',
          machineType: 'overlock',
          estimatedTimePerPiece: 5.0,
          rate: 5.0,
          skillLevel: 'medium',
          sequence: 2,
          dependencies: [1],
          icon: '🧵'
        },
        {
          id: 3,
          name: currentLanguage === 'np' ? 'फिनिसिङ' : 'Finishing',
          nameEn: 'Finishing',
          nameNp: 'फिनिसिङ',
          machineType: 'singleNeedle',
          estimatedTimePerPiece: 3.0,
          rate: 3.0,
          skillLevel: 'easy',
          sequence: 3,
          dependencies: [2],
          icon: '✨'
        },
        {
          id: 4,
          name: currentLanguage === 'np' ? 'गुणस्तर जाँच' : 'Quality Check',
          nameEn: 'Quality Check',
          nameNp: 'गुणस्तर जाँच',
          machineType: 'manual',
          estimatedTimePerPiece: 0.5,
          rate: 1.0,
          skillLevel: 'easy',
          sequence: 4,
          dependencies: [3],
          icon: '✅'
        }
      ],
      totalOperations: 4,
      estimatedTotalTime: 9.0,
      createdAt: new Date()
    },
    {
      id: 'plazo-template',
      name: currentLanguage === 'np' ? 'प्लाजो प्रसंस्करण' : 'Plazo Process',
      articleType: 'plazo',
      articleNumbers: null, // Universal for all plazo garments
      operations: [
        {
          id: 1,
          name: currentLanguage === 'np' ? 'काटना' : 'Cutting',
          nameEn: 'Cutting',
          nameNp: 'काटना',
          machineType: 'cutting',
          estimatedTimePerPiece: 0.8,
          rate: 1.2,
          skillLevel: 'medium',
          sequence: 1,
          dependencies: [],
          icon: '✂️'
        },
        {
          id: 2,
          name: currentLanguage === 'np' ? 'कम्मर बन्ड तयारी' : 'Waistband Preparation',
          nameEn: 'Waistband Preparation',
          nameNp: 'कम्मर बन्ड तयारी',
          machineType: 'singleNeedle',
          estimatedTimePerPiece: 2.0,
          rate: 3.0,
          skillLevel: 'high',
          sequence: 2,
          dependencies: [1],
          icon: '📏'
        },
        {
          id: 3,
          name: currentLanguage === 'np' ? 'छेउ सिलाई' : 'Side Seam',
          nameEn: 'Side Seam',
          nameNp: 'छेउ सिलाई',
          machineType: 'overlock',
          estimatedTimePerPiece: 3.5,
          rate: 4.0,
          skillLevel: 'medium',
          sequence: 3,
          dependencies: [2],
          icon: '🧵'
        },
        {
          id: 4,
          name: currentLanguage === 'np' ? 'क्रच सिलाई' : 'Crotch Seam',
          nameEn: 'Crotch Seam',
          nameNp: 'क्रच सिलाई',
          machineType: 'overlock',
          estimatedTimePerPiece: 4.0,
          rate: 5.0,
          skillLevel: 'high',
          sequence: 4,
          dependencies: [3],
          icon: '✂️'
        },
        {
          id: 5,
          name: currentLanguage === 'np' ? 'हेमिंग/किनारा' : 'Hemming',
          nameEn: 'Hemming',
          nameNp: 'हेमिंग/किनारा',
          machineType: 'singleNeedle',
          estimatedTimePerPiece: 2.5,
          rate: 3.5,
          skillLevel: 'medium',
          sequence: 5,
          dependencies: [4],
          icon: '📐'
        },
        {
          id: 6,
          name: currentLanguage === 'np' ? 'नाडा/ड्रस्ट्रिङ' : 'Drawstring',
          nameEn: 'Drawstring',
          nameNp: 'नाडा/ड्रस्ट्रिङ',
          machineType: 'manual',
          estimatedTimePerPiece: 1.5,
          rate: 2.0,
          skillLevel: 'easy',
          sequence: 6,
          dependencies: [5],
          icon: '🪢'
        },
        {
          id: 7,
          name: currentLanguage === 'np' ? 'गुणस्तर जाँच' : 'Quality Check',
          nameEn: 'Quality Check',
          nameNp: 'गुणस्तर जाँच',
          machineType: 'manual',
          estimatedTimePerPiece: 1.0,
          rate: 1.5,
          skillLevel: 'high',
          sequence: 7,
          dependencies: [6],
          icon: '✅'
        }
      ],
      totalOperations: 7,
      estimatedTotalTime: 15.3,
      createdAt: new Date()
    }
  ];

  useEffect(() => {
    // Load custom templates from Firestore and localStorage, combine with defaults
    const loadTemplates = async () => {
      try {
        // Load from Firestore
        let firestoreTemplates = [];
        try {
          const templatesSnapshot = await getDocs(collection(db, COLLECTIONS.ARTICLE_TEMPLATES));
          firestoreTemplates = templatesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            customTemplate: true
          }));
          console.log('Loaded templates from Firestore:', firestoreTemplates);
        } catch (firestoreError) {
          console.warn('Failed to load templates from Firestore:', firestoreError);
        }
        
        // Load deleted default templates from Firestore
        let deletedDefaultTemplates = [];
        try {
          const deletedSnapshot = await getDocs(collection(db, COLLECTIONS.DELETED_TEMPLATES));
          const firestoreDeleted = deletedSnapshot.docs
            .map(doc => doc.data())
            .filter(deletion => deletion.type === 'default')
            .map(deletion => deletion.templateId);
          deletedDefaultTemplates = firestoreDeleted;
          console.log('Loaded deleted templates from Firestore:', deletedDefaultTemplates);
        } catch (deletedError) {
          console.warn('Failed to load deleted templates from Firestore:', deletedError);
          // No fallback - use empty array
          deletedDefaultTemplates = [];
        }
        
        // Use only Firestore templates
        let localCustomTemplates = [];
        if (firestoreTemplates.length === 0) {
          console.log('No Firestore templates found, using empty array');
          localCustomTemplates = [];
        }
        
        console.log('Deleted default templates:', deletedDefaultTemplates);
        
        // Combine Firestore and localStorage templates (prefer Firestore)
        const allCustomTemplates = [
          ...firestoreTemplates,
          ...localCustomTemplates.filter(local => !firestoreTemplates.find(fs => fs.name === local.name))
        ];
        
        // Filter out deleted default templates
        const availableDefaultTemplates = defaultTemplates.filter(template => 
          !deletedDefaultTemplates.includes(template.id)
        );
        
        // Combine available defaults with custom templates
        const combinedTemplates = [...availableDefaultTemplates, ...allCustomTemplates];
        setTemplates(combinedTemplates);
        
        addError({
          message: `Loaded ${allCustomTemplates.length} custom templates (${firestoreTemplates.length} from Firestore), ${availableDefaultTemplates.length} default templates`,
          component: 'ProcessTemplateManager',
          action: 'Load Templates'
        }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
        
      } catch (error) {
        console.error('Error loading custom templates:', error);
        setTemplates(defaultTemplates);
        
        addError({
          message: 'Failed to load custom templates, using defaults only',
          component: 'ProcessTemplateManager',
          action: 'Load Templates',
          data: { error: error.message }
        }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.MEDIUM);
      }
    };

    loadTemplates();
  }, [currentLanguage]);

  const getMachineTypeColor = (machineType) => {
    const colors = {
      'cutting': 'bg-red-100 text-red-800',
      'overlock': 'bg-blue-100 text-blue-800',
      'flatlock': 'bg-green-100 text-green-800',
      'singleNeedle': 'bg-purple-100 text-purple-800',
      'buttonhole': 'bg-orange-100 text-orange-800',
      'interlock': 'bg-indigo-100 text-indigo-800',
      'coverstitch': 'bg-teal-100 text-teal-800',
      'zigzag': 'bg-pink-100 text-pink-800',
      'manual': 'bg-gray-100 text-gray-800'
    };
    return colors[machineType] || 'bg-gray-100 text-gray-800';
  };

  const getSkillLevelColor = (level) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800', 
      'hard': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const handleTemplateSelect = (template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };


  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowCreateNew(true);
  };

  const handleTemplateUpdated = (updatedTemplate) => {
    try {
      // Update in templates array
      setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));

      // No localStorage backup needed

      setShowCreateNew(false);
      setEditingTemplate(null);

      addError({
        message: currentLanguage === 'np' ? 'टेम्प्लेट अपडेट गरियो' : 'Template updated successfully',
        component: 'ProcessTemplateManager',
        action: 'Update Template',
        data: { templateId: updatedTemplate.id }
      }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);

    } catch (error) {
      addError({
        message: 'Failed to update template',
        component: 'ProcessTemplateManager',
        action: 'Update Template',
        data: { error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    }
  };



  const handleDeleteTemplate = async (templateId) => {
    const templateToDelete = templates.find(t => t.id === templateId);
    if (!templateToDelete) return;

    setDeleteLoading(true);
    
    try {
      const result = await universalDelete({
        item: templateToDelete,
        itemName: currentLanguage === 'np' ? 'टेम्प्लेट' : 'Template',
        user,
        permissionLevel: templateToDelete.customTemplate ? DELETE_PERMISSIONS.OWNER_ONLY : DELETE_PERMISSIONS.SUPERVISOR_PLUS,
        permissionOptions: { allowedRoles: ['management', 'admin', 'supervisor'] },
        language: currentLanguage === 'np' ? 'np' : 'en',
        collectionName: templateToDelete.customTemplate ? COLLECTIONS.ARTICLE_TEMPLATES : null,
        deleteOptions: {
          checkDependencies: [
            {
              collection: COLLECTIONS.BUNDLES,
              field: 'templateId',
              name: currentLanguage === 'np' ? 'बन्डलहरू' : 'bundles'
            }
          ]
        },
        onSuccess: async (deletedTemplate) => {
          // Remove from local state
          setTemplates(prev => prev.filter(t => t.id !== templateId));
          
          if (deletedTemplate.customTemplate) {
            // No localStorage update needed
          } else {
            // Track deleted default template in Firestore and localStorage
            try {
              await addDoc(collection(db, COLLECTIONS.DELETED_TEMPLATES), {
                templateId: templateId,
                deletedBy: user?.id || 'supervisor',
                deletedAt: serverTimestamp(),
                type: 'default'
              });
              console.log('Default template deletion recorded in Firestore');
            } catch (error) {
              console.warn('Failed to record deletion in Firestore:', error);
            }
            
            // No localStorage backup needed
          }
          
          // Clear selection if deleted template was selected
          if (selectedTemplate?.id === templateId) {
            setSelectedTemplate(null);
          }
          
          addError({
            message: currentLanguage === 'np' ? 'टेम्प्लेट सफलतापूर्वक मेटाइयो' : 'Template deleted successfully',
            component: 'ProcessTemplateManager',
            action: 'Delete Template',
            data: { templateId }
          }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
        },
        onError: (errorMessage) => {
          addError({
            message: errorMessage,
            component: 'ProcessTemplateManager',
            action: 'Delete Template',
            data: { templateId, error: errorMessage }
          }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
        }
      });
      
    } catch (error) {
      console.error('Error in handleDeleteTemplate:', error);
      addError({
        message: currentLanguage === 'np' ? 'टेम्प्लेट मेटाउन समस्या भयो' : 'Failed to delete template',
        component: 'ProcessTemplateManager',
        action: 'Delete Template',
        data: { templateId, error: error.message }
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Show TemplateBuilder when creating new or editing
  if (showCreateNew) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <TemplateBuilder
            onTemplateCreated={async (template) => {
              try {
                // Save to Firestore
                const templateData = {
                  ...template,
                  customTemplate: true,
                  createdBy: user?.id || 'supervisor',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                };
                
                const docRef = await addDoc(collection(db, COLLECTIONS.ARTICLE_TEMPLATES), templateData);
                const savedTemplate = { ...templateData, id: docRef.id };
                
                // No localStorage backup needed
                
                setTemplates(prev => [...prev, savedTemplate]);
                setShowCreateNew(false);
                setEditingTemplate(null);
                
                addError({
                  message: currentLanguage === 'np' ? 'टेम्प्लेट सिर्जना गरियो' : 'Template created successfully',
                component: 'ProcessTemplateManager',
                action: 'Create Template'
                }, ERROR_TYPES.USER, ERROR_SEVERITY.LOW);
              } catch (error) {
                console.error('Error saving template to Firestore:', error);
                addError({
                  message: currentLanguage === 'np' ? 'टेम्प्लेट सेभ गर्न सकिएन' : 'Failed to save template',
                  component: 'ProcessTemplateManager',
                  action: 'Create Template'
                }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
              }
            }}
            onCancel={() => {
              setShowCreateNew(false);
              setEditingTemplate(null);
            }}
            editingTemplate={editingTemplate}
            onTemplateUpdated={handleTemplateUpdated}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                ⚙️ {currentLanguage === 'np' ? 'प्रसंस्करण टेम्प्लेट' : 'Process Templates'}
              </h1>
              <p className="text-purple-100">
                {currentLanguage === 'np' ? 'उत्पादन प्रक्रिया चयन गर्नुहोस्' : 'Select production process'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-purple-600 p-2 rounded-xl transition-colors"
            >
              <div className="text-2xl">✕</div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Template Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {templates.map(template => (
              <div
                key={template.id}
                className={`border-2 rounded-2xl p-6 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                  selectedTemplate?.id === template.id 
                    ? 'border-purple-400 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                {/* Template Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{template.name}</h3>
                        <p className="text-gray-600">{template.articleNumbers?.join(', ')}</p>
                        {template.customTemplate && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-1">
                            {currentLanguage === 'np' ? 'कस्टम' : 'Custom'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">{template.totalOperations}</div>
                          <div className="text-sm text-gray-600">{currentLanguage === 'np' ? 'सञ्चालनहरू' : 'operations'}</div>
                        </div>
                        {/* Edit/Delete buttons for all templates */}
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={currentLanguage === 'np' ? 'सम्पादन गर्नुहोस्' : 'Edit Template'}
                          >
                            ✏️
                          </button>
                          {/* Delete button with permission check */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              deleteLoading 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            disabled={deleteLoading}
                            title={currentLanguage === 'np' ? 'मेटाउनुहोस्' : 'Delete Template'}
                          >
                            {deleteLoading ? '⏳' : '🗑️'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="font-bold text-blue-600">{template.estimatedTotalTime}</div>
                    <div className="text-gray-600">{currentLanguage === 'np' ? 'मिनेट/टुक्रा' : 'min/piece'}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="font-bold text-green-600">
                      रु. {template.operations.reduce((sum, op) => sum + op.rate, 0).toFixed(2)}
                    </div>
                    <div className="text-gray-600">{currentLanguage === 'np' ? 'कुल दर' : 'total rate'}</div>
                  </div>
                </div>

                {/* Process Flow Preview */}
                <div className="space-y-2">
                  <div className="font-semibold text-gray-700 text-sm mb-2">
                    {currentLanguage === 'np' ? 'प्रसंस्करण प्रवाह:' : 'Process Flow:'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.operations.slice(0, 6).map((operation, index) => (
                      <React.Fragment key={operation.id}>
                        <div className="flex items-center space-x-1">
                          <span className="text-lg">{operation.icon}</span>
                          <span className="text-xs font-medium text-gray-600">
                            {currentLanguage === 'np' ? operation.nameNp : operation.nameEn}
                          </span>
                        </div>
                        {index < Math.min(template.operations.length - 1, 5) && (
                          <span className="text-gray-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                    {template.operations.length > 6 && (
                      <span className="text-gray-400 text-xs">+{template.operations.length - 6} more</span>
                    )}
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedTemplate?.id === template.id && (
                  <div className="mt-4 text-center">
                    <span className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      ✓ {currentLanguage === 'np' ? 'चयनित' : 'Selected'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Selected Template Details */}
          {selectedTemplate && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📋 {selectedTemplate.name} - {currentLanguage === 'np' ? 'विस्तृत प्रसंस्करण' : 'Detailed Process'}
              </h3>
              
              <div className="space-y-3">
                {selectedTemplate.operations.map((operation, index) => (
                  <div key={operation.id} className="bg-white rounded-lg p-4 flex items-center space-x-4">
                    <div className="text-2xl">{operation.icon}</div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-gray-800">
                          {index + 1}. {currentLanguage === 'np' ? operation.nameNp : operation.nameEn}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getMachineTypeColor(operation.machineType)}`}>
                          {operation.machineType}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getSkillLevelColor(operation.skillLevel)}`}>
                          {operation.skillLevel}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentLanguage === 'np' ? 'समय:' : 'Time:'} {operation.estimatedTimePerPiece} min/pc • 
                        {currentLanguage === 'np' ? 'दर:' : 'Rate:'} रु. {operation.rate}/pc
                      </div>
                    </div>

                    {operation.dependencies.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {currentLanguage === 'np' ? 'निर्भर:' : 'After:'} {operation.dependencies.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowCreateNew(true)}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ➕ {currentLanguage === 'np' ? 'नयाँ टेम्प्लेट' : 'New Template'}
            </button>
            
            <div className="space-x-4">
              <button
                onClick={onClose}
                className="bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 transition-colors"
              >
                ❌ {currentLanguage === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
              </button>
              
              {selectedTemplate && (
                <button
                  onClick={() => handleTemplateSelect(selectedTemplate)}
                  className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  ✅ {currentLanguage === 'np' ? 'यो टेम्प्लेट प्रयोग गर्नुहोस्' : 'Use This Template'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm !== null}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => {
            const templateId = showDeleteConfirm;
            setShowDeleteConfirm(null);
            handleDeleteTemplate(templateId);
          }}
          itemName={currentLanguage === 'np' ? 'टेम्प्लेट' : 'Template'}
          language={currentLanguage === 'np' ? 'np' : 'en'}
          customMessage={
            currentLanguage === 'np'
              ? 'यो टेम्प्लेट मेटाउनुभयो भने यससँग जोडिएका सबै बन्डलहरूमा असर पर्नेछ।'
              : 'Deleting this template will affect all bundles that use it.'
          }
        />
      </div>
    </div>
  );
};

export default ProcessTemplateManager;