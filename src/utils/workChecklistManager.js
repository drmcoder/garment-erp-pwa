// Work Checklist Manager - Handles bundle checklist logic and Available Work filtering

export class WorkChecklistManager {
  
  // Get work checklist items for specific operations
  static getWorkChecklist(operation, garmentType = 'round-neck-tshirt') {
    const checklists = {
      'Shoulder Join': [
        { id: 'cut_check', name: 'Cutting Quality Check', nameNp: 'काटन गुणस्तर जाँच', estimatedTime: 5 },
        { id: 'alignment', name: 'Shoulder Alignment', nameNp: 'काँध मिलान', estimatedTime: 8 },
        { id: 'seam_stitch', name: 'Seam Stitching', nameNp: 'सिलाई सिम', estimatedTime: 12 },
        { id: 'overlock_finish', name: 'Overlock Finishing', nameNp: 'ओभरलक फिनिशिङ', estimatedTime: 10 },
        { id: 'quality_check', name: 'Final Quality Check', nameNp: 'अन्तिम गुणस्तर जाँच', estimatedTime: 5 }
      ],
      'Neck Join': [
        { id: 'neck_prep', name: 'Neck Preparation', nameNp: 'नेक तयारी', estimatedTime: 8 },
        { id: 'binding_cut', name: 'Binding Cutting', nameNp: 'बाइन्डिङ काटना', estimatedTime: 6 },
        { id: 'neck_attach', name: 'Neck Attachment', nameNp: 'नेक जोडना', estimatedTime: 15 },
        { id: 'stretch_check', name: 'Stretch Test', nameNp: 'स्ट्रेच जाँच', estimatedTime: 5 },
        { id: 'finish_trim', name: 'Finish & Trim', nameNp: 'फिनिश र ट्रिम', estimatedTime: 6 }
      ],
      'Bottom Fold': [
        { id: 'measure_hem', name: 'Measure Hem Width', nameNp: 'हेम चौडाई नाप', estimatedTime: 4 },
        { id: 'fold_press', name: 'Fold & Press', nameNp: 'फोल्ड र प्रेस', estimatedTime: 8 },
        { id: 'flatlock_stitch', name: 'Flatlock Stitching', nameNp: 'फ्ल्यालक सिलाई', estimatedTime: 12 },
        { id: 'hem_quality', name: 'Hem Quality Check', nameNp: 'हेम गुणस्तर जाँच', estimatedTime: 6 }
      ],
      'Sleeve Fold': [
        { id: 'sleeve_prep', name: 'Sleeve Preparation', nameNp: 'स्लिभ तयारी', estimatedTime: 6 },
        { id: 'fold_mark', name: 'Fold Marking', nameNp: 'फोल्ड मार्किङ', estimatedTime: 5 },
        { id: 'sleeve_stitch', name: 'Sleeve Stitching', nameNp: 'स्लिभ सिलाई', estimatedTime: 15 },
        { id: 'sleeve_finish', name: 'Sleeve Finishing', nameNp: 'स्लिभ फिनिशिङ', estimatedTime: 9 }
      ],
      'Neck Band': [
        { id: 'band_cut', name: 'Band Cutting', nameNp: 'ब्यान्ड काटना', estimatedTime: 8 },
        { id: 'band_prep', name: 'Band Preparation', nameNp: 'ब्यान्ड तयारी', estimatedTime: 7 },
        { id: 'single_stitch', name: 'Single Needle Stitch', nameNp: 'एकल सुई सिलाई', estimatedTime: 20 },
        { id: 'band_attach', name: 'Band Attachment', nameNp: 'ब्यान्ड जोडना', estimatedTime: 10 },
        { id: 'final_press', name: 'Final Pressing', nameNp: 'अन्तिम प्रेसिङ', estimatedTime: 5 }
      ]
    };
    
    return checklists[operation] || [
      { id: 'general_prep', name: 'Preparation', nameNp: 'तयारी', estimatedTime: 10 },
      { id: 'general_work', name: 'Main Work', nameNp: 'मुख्य काम', estimatedTime: 20 },
      { id: 'general_check', name: 'Quality Check', nameNp: 'गुणस्तर जाँच', estimatedTime: 5 }
    ];
  }

  // Initialize checklist for a bundle
  static initializeBundleChecklist(bundle) {
    if (bundle.checklist && bundle.checklist.length > 0) {
      return bundle; // Already has checklist
    }

    const checklist = this.getWorkChecklist(bundle.operation || bundle.currentOperation);
    
    return {
      ...bundle,
      checklist: checklist.map(item => ({
        ...item,
        completed: false,
        completedAt: null,
        completedBy: null,
        notes: ''
      })),
      checklistInitialized: true
    };
  }

  // Calculate completion percentage
  static getBundleCompletionPercentage(bundle) {
    const checklist = bundle.checklist || [];
    if (checklist.length === 0) return 0;
    
    const completedItems = checklist.filter(item => item.completed).length;
    return Math.round((completedItems / checklist.length) * 100);
  }

  // Check if bundle should be in Available Work (has uncompleted checklist items)
  static shouldShowInAvailableWork(bundle) {
    // If no checklist, show in available work
    if (!bundle.checklist || bundle.checklist.length === 0) {
      return true;
    }

    // If any checklist item is not completed, show in available work
    const hasUncompletedItems = bundle.checklist.some(item => !item.completed);
    return hasUncompletedItems;
  }

  // Filter bundles for Available Work based on checklist completion
  static filterAvailableWork(bundles) {
    return bundles
      .map(bundle => this.initializeBundleChecklist(bundle))
      .filter(bundle => {
        // Must have pending/ready status
        const hasValidStatus = ['pending', 'ready', 'in-progress'].includes(bundle.status);
        
        // Must have uncompleted checklist items
        const hasUncompletedWork = this.shouldShowInAvailableWork(bundle);
        
        return hasValidStatus && hasUncompletedWork;
      });
  }

  // Get bundle status based on checklist completion
  static getBundleStatus(bundle) {
    if (!bundle.checklist || bundle.checklist.length === 0) {
      return 'pending';
    }

    const percentage = this.getBundleCompletionPercentage(bundle);
    
    if (percentage === 100) return 'completed';
    if (percentage > 0) return 'in-progress';
    return 'pending';
  }

  // Update checklist item completion
  static updateChecklistItem(bundle, checklistItemId, completed, userId = 'current_user') {
    const updatedChecklist = bundle.checklist.map(item => {
      if (item.id === checklistItemId) {
        return {
          ...item,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
          completedBy: completed ? userId : null
        };
      }
      return item;
    });

    const updatedBundle = {
      ...bundle,
      checklist: updatedChecklist
    };

    // Update bundle status based on completion
    updatedBundle.status = this.getBundleStatus(updatedBundle);
    updatedBundle.lastUpdated = new Date().toISOString();

    return updatedBundle;
  }

  // Get remaining work items for a bundle
  static getRemainingWork(bundle) {
    if (!bundle.checklist) return [];
    
    return bundle.checklist.filter(item => !item.completed);
  }

  // Get completed work items for a bundle
  static getCompletedWork(bundle) {
    if (!bundle.checklist) return [];
    
    return bundle.checklist.filter(item => item.completed);
  }

  // Calculate total estimated time for remaining work
  static getRemainingTime(bundle) {
    const remainingWork = this.getRemainingWork(bundle);
    return remainingWork.reduce((total, item) => total + (item.estimatedTime || 0), 0);
  }

  // Save bundle updates to Firestore
  static async saveBundleUpdates(bundles) {
    try {
      // Note: This method now depends on Firestore integration
      // Individual bundle updates should be handled by the calling component
      console.log('⚠️ Bundle updates should be saved individually via Firestore');
      return true;
    } catch (error) {
      console.error('❌ Failed to save bundle updates:', error);
      return false;
    }
  }

  // Load bundles from Firestore (this method will be replaced by Firestore calls)
  static async loadBundlesWithChecklists() {
    try {
      console.log('⚠️ This method should be replaced with Firestore bundle fetching');
      // This method is now deprecated - bundles should be loaded via FirebaseService
      return [];
    } catch (error) {
      console.error('❌ Failed to load bundles:', error);
      return [];
    }
  }

  // Create demo bundles with checklists for testing
  static createDemoBundlesWithChecklists() {
    const demoBundles = [
      {
        id: 'DEMO-001',
        bundleId: 'DEMO-001',
        bundleNumber: 'test lot-DEMO001',
        articleNumber: 'D001',
        articleName: 'Demo Round Neck T-shirt',
        color: 'Blue',
        size: 'M',
        pieces: 25,
        operation: 'Shoulder Join',
        machineType: 'overlock',
        status: 'pending',
        priority: 'medium',
        rate: 2.5,
        estimatedTime: 40,
        createdAt: new Date().toISOString()
      },
      {
        id: 'DEMO-002',
        bundleId: 'DEMO-002',
        bundleNumber: 'test lot-DEMO002',
        articleNumber: 'D001',
        articleName: 'Demo Round Neck T-shirt',
        color: 'Red',
        size: 'L',
        pieces: 30,
        operation: 'Neck Join',
        machineType: 'overlock',
        status: 'pending',
        priority: 'high',
        rate: 3.0,
        estimatedTime: 45,
        createdAt: new Date().toISOString()
      },
      {
        id: 'DEMO-003',
        bundleId: 'DEMO-003',
        bundleNumber: 'test lot-DEMO003',
        articleNumber: 'D001',
        articleName: 'Demo Round Neck T-shirt',
        color: 'White',
        size: 'XL',
        pieces: 28,
        operation: 'Bottom Fold',
        machineType: 'flatlock',
        status: 'pending',
        priority: 'medium',
        rate: 2.0,
        estimatedTime: 30,
        createdAt: new Date().toISOString()
      }
    ];

    // Initialize checklists for demo bundles
    const initializedDemoBundles = demoBundles.map(bundle => 
      this.initializeBundleChecklist(bundle)
    );

    // Note: Demo bundles created but not saved anywhere
    // These should be saved to Firestore by the calling component
    console.log('⚠️ Demo bundles created but not persisted - save to Firestore manually');

    return initializedDemoBundles;
  }
}

export default WorkChecklistManager;