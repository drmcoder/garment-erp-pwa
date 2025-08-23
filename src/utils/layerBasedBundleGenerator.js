// Layer-Based Bundle Generator for Garment Production
// Handles cutting department WIP where layers determine bundle structure

export class LayerBasedBundleGenerator {
  constructor() {
    // Standard garment part definitions
    this.garmentParts = {
      'tshirt': [
        { part: 'Front', quantity: 1, operation: 'काँध जोड्ने' },
        { part: 'Back', quantity: 1, operation: 'काँध जोड्ने' },
        { part: 'Sleeve Left', quantity: 1, operation: 'स्लिभ अट्याच' },
        { part: 'Sleeve Right', quantity: 1, operation: 'स्लिभ अट्याच' },
        { part: 'Collar', quantity: 1, operation: 'कलर अट्याच' }
      ],
      'polo': [
        { part: 'Front', quantity: 1, operation: 'प्लाकेट' },
        { part: 'Back', quantity: 1, operation: 'काँध जोड्ने' },
        { part: 'Sleeve Left', quantity: 1, operation: 'स्लिभ अट्याच' },
        { part: 'Sleeve Right', quantity: 1, operation: 'स्लिभ अट्याच' },
        { part: 'Collar', quantity: 1, operation: 'कलर अट्याच' },
        { part: 'Placket', quantity: 1, operation: 'प्लाकेट' }
      ]
    };

    // Process templates based on garment type
    this.processTemplates = {
      'tshirt': [
        { step: 1, operation: 'काँध जोड्ने', machine: 'ओभरलक', rate: 2.20, time: 8 },
        { step: 2, operation: 'नेक बाइन्डिङ', machine: 'ओभरलक', rate: 2.50, time: 10 },
        { step: 3, operation: 'स्लिभ अट्याच', machine: 'ओभरलक', rate: 2.80, time: 8 },
        { step: 4, operation: 'साइड सिम', machine: 'ओभरलक', rate: 2.30, time: 6 },
        { step: 5, operation: 'हेम फोल्ड', machine: 'फ्ल्यालक', rate: 1.60, time: 3 }
      ],
      'polo': [
        { step: 1, operation: 'काँध जोड्ने', machine: 'ओभरलक', rate: 2.50, time: 8 },
        { step: 2, operation: 'प्लाकेट', machine: 'एकल सुई', rate: 3.20, time: 12 },
        { step: 3, operation: 'कलर अट्याच', machine: 'एकल सुई', rate: 4.50, time: 15 },
        { step: 4, operation: 'स्लिभ अट्याच', machine: 'ओभरलक', rate: 3.50, time: 10 },
        { step: 5, operation: 'साइड सिम', machine: 'ओभरलक', rate: 2.80, time: 7 },
        { step: 6, operation: 'हेम फोल्ड', machine: 'फ्ल्यालक', rate: 1.90, time: 6 }
      ]
    };
  }

  /**
   * Generate bundles based on layer cutting logic
   * @param {Object} wipData - WIP data from cutting department
   * @param {Object} options - Bundle generation options
   */
  generateLayerBasedBundles(wipData, options = {}) {
    const {
      garmentType = 'tshirt',
      maxBundleSize = 30,
      minBundleSize = 15,
      bundleNamingFormat = '{lot}-{article}-{color}-{size}-{sequence}'
    } = options;

    const bundles = [];
    let globalBundleCounter = 1;

    // Process each color in the WIP data
    wipData.colors.forEach(colorData => {
      const { name: colorName, layers, pieces } = colorData;
      
      // Process each size for this color
      Object.entries(pieces).forEach(([size, totalPieces]) => {
        if (totalPieces <= 0) return;

        // Key Logic: Each "layer cut" represents pieces that can make complete garments
        // If we have 15 layers and 15 pieces in XL, it means we cut 15 XL garments worth of parts
        const piecesPerLayer = Math.floor(totalPieces / layers) || 1;
        const actualGarmentCount = Math.min(totalPieces, layers * piecesPerLayer);
        
        // Create bundles based on the actual garment count
        const bundlesNeeded = Math.ceil(actualGarmentCount / maxBundleSize);
        
        for (let bundleIndex = 0; bundleIndex < bundlesNeeded; bundleIndex++) {
          const startPiece = bundleIndex * maxBundleSize;
          const endPiece = Math.min(startPiece + maxBundleSize, actualGarmentCount);
          const bundlePieceCount = endPiece - startPiece;
          
          if (bundlePieceCount < minBundleSize && bundleIndex > 0) {
            // Merge with previous bundle if too small
            const lastBundle = bundles[bundles.length - 1];
            if (lastBundle && lastBundle.color === colorName && lastBundle.size === size) {
              lastBundle.pieceCount += bundlePieceCount;
              lastBundle.endPiece = endPiece;
              continue;
            }
          }

          // Generate bundle ID
          const bundleId = this.formatBundleId(bundleNamingFormat, {
            lot: wipData.lotNumber || 'LOT',
            article: wipData.articles?.[0] || 'ART',
            color: this.sanitizeColorName(colorName),
            size: size,
            sequence: String(bundleIndex + 1).padStart(2, '0'),
            globalSequence: String(globalBundleCounter).padStart(3, '0')
          });

          // Create the main bundle (represents complete garments)
          const bundle = {
            id: bundleId,
            bundleNumber: bundleId,
            type: 'complete_garment',
            
            // Basic info
            lotNumber: wipData.lotNumber,
            article: wipData.articles?.[0],
            color: colorName,
            size: size,
            
            // Piece information
            pieceCount: bundlePieceCount, // Number of complete garments this bundle will make
            totalParts: bundlePieceCount * this.getTotalPartsPerGarment(garmentType),
            
            // Layer information
            originalLayers: layers,
            layersUsed: Math.ceil(bundlePieceCount / piecesPerLayer),
            piecesPerLayer: piecesPerLayer,
            
            // Bundle sequence
            bundleSequence: bundleIndex + 1,
            startPiece: startPiece + 1,
            endPiece: endPiece,
            
            // Process information
            garmentType: garmentType,
            processSteps: this.processTemplates[garmentType] || [],
            currentStep: 0,
            
            // Status
            status: 'ready_for_production',
            createdAt: new Date().toISOString(),
            
            // Parts breakdown
            parts: this.generatePartsBreakdown(garmentType, bundlePieceCount),
            
            // Quality info
            qualityChecks: [],
            defects: 0,
            
            // Metadata
            metadata: {
              cuttingInfo: {
                totalLayersCut: layers,
                fabricConsumption: this.calculateFabricConsumption(bundlePieceCount, size, garmentType),
                cuttingDate: wipData.cuttingDate,
                cutter: wipData.cutter
              },
              production: {
                estimatedTime: this.calculateEstimatedTime(garmentType, bundlePieceCount),
                estimatedCost: this.calculateEstimatedCost(garmentType, bundlePieceCount)
              }
            }
          };

          bundles.push(bundle);
          globalBundleCounter++;
        }
      });
    });

    return {
      bundles: bundles,
      summary: this.generateBundleSummary(bundles, wipData),
      metadata: {
        generatedAt: new Date().toISOString(),
        totalBundles: bundles.length,
        totalGarments: bundles.reduce((sum, b) => sum + b.pieceCount, 0),
        bundleGenerationMethod: 'layer_based',
        options: options
      }
    };
  }

  /**
   * Generate parts breakdown for a bundle
   */
  generatePartsBreakdown(garmentType, pieceCount) {
    const parts = this.garmentParts[garmentType] || this.garmentParts.tshirt;
    
    return parts.map(part => ({
      partName: part.part,
      quantityPerGarment: part.quantity,
      totalQuantityInBundle: part.quantity * pieceCount,
      operation: part.operation,
      status: 'cut_ready',
      defects: 0
    }));
  }

  /**
   * Calculate total parts per garment
   */
  getTotalPartsPerGarment(garmentType) {
    const parts = this.garmentParts[garmentType] || this.garmentParts.tshirt;
    return parts.reduce((total, part) => total + part.quantity, 0);
  }

  /**
   * Format bundle ID based on naming convention
   */
  formatBundleId(format, data) {
    return format.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
  }

  /**
   * Sanitize color name for bundle ID
   */
  sanitizeColorName(colorName) {
    return colorName
      .replace(/[^\w\u0900-\u097F]/g, '') // Keep only alphanumeric and Devanagari
      .substring(0, 8) // Limit length
      .toUpperCase();
  }

  /**
   * Calculate fabric consumption
   */
  calculateFabricConsumption(pieceCount, size, garmentType) {
    // Base consumption rates (kg per piece)
    const baseConsumption = {
      tshirt: { XS: 0.18, S: 0.20, M: 0.22, L: 0.24, XL: 0.26, '2XL': 0.28, '3XL': 0.30 },
      polo: { XS: 0.22, S: 0.24, M: 0.26, L: 0.28, XL: 0.30, '2XL': 0.32, '3XL': 0.34 }
    };
    
    const consumption = baseConsumption[garmentType]?.[size] || 0.25;
    return +(consumption * pieceCount).toFixed(3);
  }

  /**
   * Calculate estimated production time
   */
  calculateEstimatedTime(garmentType, pieceCount) {
    const processSteps = this.processTemplates[garmentType] || [];
    const totalTimePerPiece = processSteps.reduce((sum, step) => sum + step.time, 0);
    return Math.round(totalTimePerPiece * pieceCount); // Total minutes
  }

  /**
   * Calculate estimated production cost
   */
  calculateEstimatedCost(garmentType, pieceCount) {
    const processSteps = this.processTemplates[garmentType] || [];
    const totalCostPerPiece = processSteps.reduce((sum, step) => sum + step.rate, 0);
    return +(totalCostPerPiece * pieceCount).toFixed(2);
  }

  /**
   * Generate bundle summary
   */
  generateBundleSummary(bundles, wipData) {
    const summary = {
      totalBundles: bundles.length,
      totalGarments: bundles.reduce((sum, b) => sum + b.pieceCount, 0),
      totalParts: bundles.reduce((sum, b) => sum + b.totalParts, 0),
      
      // By color breakdown
      byColor: {},
      
      // By size breakdown  
      bySize: {},
      
      // Production estimates
      estimatedTotalTime: bundles.reduce((sum, b) => sum + b.metadata.production.estimatedTime, 0),
      estimatedTotalCost: bundles.reduce((sum, b) => sum + b.metadata.production.estimatedCost, 0),
      
      // Fabric consumption
      totalFabricConsumption: bundles.reduce((sum, b) => sum + b.metadata.cuttingInfo.fabricConsumption, 0)
    };

    // Group by color and size
    bundles.forEach(bundle => {
      // By color
      if (!summary.byColor[bundle.color]) {
        summary.byColor[bundle.color] = { bundles: 0, garments: 0, parts: 0 };
      }
      summary.byColor[bundle.color].bundles += 1;
      summary.byColor[bundle.color].garments += bundle.pieceCount;
      summary.byColor[bundle.color].parts += bundle.totalParts;

      // By size
      if (!summary.bySize[bundle.size]) {
        summary.bySize[bundle.size] = { bundles: 0, garments: 0, parts: 0 };
      }
      summary.bySize[bundle.size].bundles += 1;
      summary.bySize[bundle.size].garments += bundle.pieceCount;
      summary.bySize[bundle.size].parts += bundle.totalParts;
    });

    return summary;
  }

  /**
   * Create production workflow bundles
   * Each bundle goes through multiple sewing operations
   */
  createProductionWorkflow(bundles) {
    const workflowBundles = [];

    bundles.forEach(mainBundle => {
      mainBundle.processSteps.forEach((step, stepIndex) => {
        const workflowBundle = {
          id: `${mainBundle.id}-S${stepIndex + 1}`,
          parentBundleId: mainBundle.id,
          bundleNumber: mainBundle.bundleNumber,
          
          // Step information
          processStep: stepIndex + 1,
          operation: step.operation,
          machine: step.machine,
          
          // Piece information (same for all steps)
          pieceCount: mainBundle.pieceCount,
          
          // Basic info (inherited)
          lotNumber: mainBundle.lotNumber,
          article: mainBundle.article,
          color: mainBundle.color,
          size: mainBundle.size,
          
          // Operation-specific info
          estimatedTime: step.time * mainBundle.pieceCount,
          ratePerPiece: step.rate,
          totalRate: step.rate * mainBundle.pieceCount,
          
          // Status
          status: stepIndex === 0 ? 'ready' : 'pending',
          operator: null,
          startTime: null,
          endTime: null,
          
          // Quality
          qcStatus: 'pending',
          defects: 0,
          
          // Dependencies
          dependsOn: stepIndex > 0 ? `${mainBundle.id}-S${stepIndex}` : null,
          nextStep: stepIndex < mainBundle.processSteps.length - 1 ? `${mainBundle.id}-S${stepIndex + 2}` : null
        };

        workflowBundles.push(workflowBundle);
      });
    });

    return workflowBundles;
  }
}

export default LayerBasedBundleGenerator;