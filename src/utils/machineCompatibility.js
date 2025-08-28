// Centralized machine type compatibility validation utility
export class MachineCompatibilityValidator {
  
  // Standard machine type aliases and their variations
  static machineTypeAliases = {
    'single-needle': ['single-needle', 'singleneedle', 'single_needle', 'sn', 'single needle'],
    'overlock': ['overlock', 'over-lock', 'over_lock', 'ol', 'over lock'],
    'flatlock': ['flatlock', 'flat-lock', 'flat_lock', 'fl', 'flat lock'],
    'kansai': ['kansai', 'kansai-special', 'kansai_special', 'ks'],
    'buttonhole': ['buttonhole', 'button-hole', 'button_hole', 'bh', 'button hole'],
    'double-needle': ['double-needle', 'doubleneedle', 'double_needle', 'dn', 'double needle'],
    'cutting': ['cutting', 'cutter', 'cut', 'knife'],
    'pressing': ['pressing', 'press', 'iron', 'steam'],
    'inspection': ['inspection', 'quality', 'qc', 'check'],
    'manual': ['manual', 'hand', 'finishing', 'trim'],
    'multi-skill': ['multi-skill', 'multiskill', 'multi_skill', 'all', 'universal']
  };

  /**
   * Normalize machine type string
   * @param {string} machineType - Raw machine type string
   * @returns {string} - Normalized machine type
   */
  static normalizeMachineType(machineType) {
    if (!machineType) return null;
    
    // Convert to lowercase and remove special characters/spaces
    const normalized = machineType.toLowerCase().trim().replace(/[-_\s]/g, '');
    
    // Find matching standard type
    for (const [standardType, aliases] of Object.entries(this.machineTypeAliases)) {
      const normalizedAliases = aliases.map(alias => alias.toLowerCase().replace(/[-_\s]/g, ''));
      if (normalizedAliases.includes(normalized)) {
        return standardType;
      }
    }
    
    return normalized; // Return as-is if no standard match found
  }

  /**
   * Check if operator can handle a specific work item
   * @param {Object} operator - Operator object with machine property
   * @param {Object} workItem - Work item object with machineType property
   * @returns {Object} - Compatibility result with boolean and reason
   */
  static isCompatible(operator, workItem) {
    // Validate inputs
    if (!operator || !workItem) {
      return {
        compatible: false,
        reason: 'Invalid operator or work item data',
        severity: 'high'
      };
    }

    // Extract machine types
    const operatorMachine = this.normalizeMachineType(operator.machine);
    const workMachine = this.normalizeMachineType(workItem.machineType);

    // Log for debugging
    console.log('🔍 Machine Compatibility Check:', {
      operatorId: operator.id,
      operatorName: operator.name,
      operatorMachine: operator.machine,
      normalizedOperatorMachine: operatorMachine,
      workItemId: workItem.id,
      workMachine: workItem.machineType,
      normalizedWorkMachine: workMachine
    });

    // Multi-skill operators can handle any work
    if (operatorMachine === 'multi-skill') {
      return {
        compatible: true,
        reason: 'Multi-skill operator can handle any work type',
        confidence: 'high'
      };
    }

    // Check if machines are missing
    if (!operatorMachine) {
      return {
        compatible: false,
        reason: 'Operator machine type not specified',
        severity: 'medium'
      };
    }

    if (!workMachine) {
      return {
        compatible: false,
        reason: 'Work item machine type not specified',
        severity: 'medium'
      };
    }

    // Direct machine type match
    if (operatorMachine === workMachine) {
      return {
        compatible: true,
        reason: `Exact machine match: ${operatorMachine}`,
        confidence: 'high'
      };
    }

    // No compatibility found
    return {
      compatible: false,
      reason: `Machine mismatch: operator has ${operatorMachine}, work requires ${workMachine}`,
      severity: 'high'
    };
  }

  /**
   * Filter operators compatible with a work item
   * @param {Array} operators - Array of operator objects
   * @param {Object} workItem - Work item object
   * @returns {Array} - Array of compatible operators with compatibility info
   */
  static getCompatibleOperators(operators, workItem) {
    if (!Array.isArray(operators) || !workItem) return [];

    return operators
      .map(operator => {
        const compatibility = this.isCompatible(operator, workItem);
        return {
          ...operator,
          compatibility
        };
      })
      .filter(operator => operator.compatibility.compatible);
  }

  /**
   * Filter work items compatible with an operator
   * @param {Array} workItems - Array of work item objects
   * @param {Object} operator - Operator object
   * @returns {Array} - Array of compatible work items with compatibility info
   */
  static getCompatibleWorkItems(workItems, operator) {
    if (!Array.isArray(workItems) || !operator) return [];

    return workItems
      .map(workItem => {
        const compatibility = this.isCompatible(operator, workItem);
        return {
          ...workItem,
          compatibility
        };
      })
      .filter(workItem => workItem.compatibility.compatible);
  }

  /**
   * Validate an assignment before it's made
   * @param {Object} operator - Operator object
   * @param {Object} workItem - Work item object
   * @param {Object} options - Additional validation options
   * @returns {Object} - Validation result
   */
  static validateAssignment(operator, workItem, options = {}) {
    const compatibility = this.isCompatible(operator, workItem);
    
    const result = {
      valid: compatibility.compatible,
      errors: [],
      warnings: [],
      compatibility
    };

    // Add machine compatibility error
    if (!compatibility.compatible) {
      result.errors.push({
        type: 'MACHINE_INCOMPATIBLE',
        message: compatibility.reason,
        severity: compatibility.severity || 'high'
      });
    }

    // Additional validations can be added here
    if (options.checkWorkload && operator.currentLoad >= operator.maxLoad) {
      result.warnings.push({
        type: 'OPERATOR_OVERLOADED',
        message: 'Operator is at maximum workload capacity',
        severity: 'medium'
      });
    }

    if (options.checkAvailability && operator.status !== 'available') {
      result.errors.push({
        type: 'OPERATOR_UNAVAILABLE',
        message: `Operator is not available (status: ${operator.status})`,
        severity: 'high'
      });
    }

    return result;
  }

  /**
   * Get machine type statistics
   * @param {Array} operators - Array of operators
   * @param {Array} workItems - Array of work items
   * @returns {Object} - Machine type distribution and compatibility stats
   */
  static getMachineTypeStats(operators = [], workItems = []) {
    const operatorMachines = {};
    const workItemMachines = {};
    let compatibilityMatrix = {};

    // Count operator machine types
    operators.forEach(op => {
      const normalized = this.normalizeMachineType(op.machine);
      operatorMachines[normalized] = (operatorMachines[normalized] || 0) + 1;
    });

    // Count work item machine types
    workItems.forEach(item => {
      const normalized = this.normalizeMachineType(item.machineType);
      workItemMachines[normalized] = (workItemMachines[normalized] || 0) + 1;
    });

    // Build compatibility matrix
    Object.keys(workItemMachines).forEach(workMachine => {
      compatibilityMatrix[workMachine] = {
        required: workItemMachines[workMachine],
        available: operatorMachines[workMachine] || 0,
        multiSkill: operatorMachines['multi-skill'] || 0
      };
    });

    return {
      operatorMachines,
      workItemMachines,
      compatibilityMatrix,
      totalOperators: operators.length,
      totalWorkItems: workItems.length
    };
  }
}

export default MachineCompatibilityValidator;