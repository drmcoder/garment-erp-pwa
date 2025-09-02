// Centralized Workflow Engine
// Manages all business logic for work item processing and state transitions

import { WORK_STATUS, PERMISSIONS, USER_ROLES } from '../constants';
import logger from '../../utils/logger';

class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.validators = new Map();
    this.hooks = new Map();
    
    // Initialize default workflows
    this.initializeWorkflows();
  }

  // Initialize default workflow definitions
  initializeWorkflows() {
    // Standard Work Item Workflow
    this.registerWorkflow('standard_work', {
      initialState: WORK_STATUS.PENDING,
      states: {
        [WORK_STATUS.PENDING]: {
          transitions: [WORK_STATUS.ASSIGNED, WORK_STATUS.SELF_ASSIGNED],
          permissions: [PERMISSIONS.ASSIGN_WORK, PERMISSIONS.SELF_ASSIGN]
        },
        [WORK_STATUS.ASSIGNED]: {
          transitions: [WORK_STATUS.IN_PROGRESS, WORK_STATUS.PENDING],
          permissions: [PERMISSIONS.COMPLETE_WORK]
        },
        [WORK_STATUS.SELF_ASSIGNED]: {
          transitions: [WORK_STATUS.IN_PROGRESS, WORK_STATUS.PENDING],
          permissions: [PERMISSIONS.COMPLETE_WORK, PERMISSIONS.APPROVE_WORK]
        },
        [WORK_STATUS.IN_PROGRESS]: {
          transitions: [WORK_STATUS.COMPLETED, WORK_STATUS.ON_HOLD],
          permissions: [PERMISSIONS.COMPLETE_WORK]
        },
        [WORK_STATUS.COMPLETED]: {
          transitions: [WORK_STATUS.QUALITY_CHECK, WORK_STATUS.APPROVED, WORK_STATUS.REWORK],
          permissions: [PERMISSIONS.QUALITY_CHECK, PERMISSIONS.APPROVE_WORK]
        },
        [WORK_STATUS.QUALITY_CHECK]: {
          transitions: [WORK_STATUS.APPROVED, WORK_STATUS.REJECTED, WORK_STATUS.REWORK],
          permissions: [PERMISSIONS.QUALITY_CHECK]
        },
        [WORK_STATUS.REJECTED]: {
          transitions: [WORK_STATUS.REWORK, WORK_STATUS.CANCELLED],
          permissions: [PERMISSIONS.REJECT_WORK, PERMISSIONS.ASSIGN_WORK]
        },
        [WORK_STATUS.REWORK]: {
          transitions: [WORK_STATUS.IN_PROGRESS, WORK_STATUS.ASSIGNED],
          permissions: [PERMISSIONS.ASSIGN_WORK, PERMISSIONS.COMPLETE_WORK]
        },
        [WORK_STATUS.ON_HOLD]: {
          transitions: [WORK_STATUS.IN_PROGRESS, WORK_STATUS.CANCELLED],
          permissions: [PERMISSIONS.ASSIGN_WORK]
        },
        [WORK_STATUS.APPROVED]: {
          transitions: [], // Terminal state
          permissions: []
        },
        [WORK_STATUS.CANCELLED]: {
          transitions: [], // Terminal state
          permissions: []
        }
      }
    });

    // Quality Control Workflow
    this.registerWorkflow('quality_control', {
      initialState: WORK_STATUS.QUALITY_CHECK,
      states: {
        [WORK_STATUS.QUALITY_CHECK]: {
          transitions: [WORK_STATUS.APPROVED, WORK_STATUS.REJECTED],
          permissions: [PERMISSIONS.QUALITY_CHECK]
        },
        [WORK_STATUS.APPROVED]: {
          transitions: [],
          permissions: []
        },
        [WORK_STATUS.REJECTED]: {
          transitions: [WORK_STATUS.REWORK],
          permissions: [PERMISSIONS.REJECT_WORK]
        }
      }
    });
  }

  // Register a new workflow
  registerWorkflow(name, definition) {
    this.workflows.set(name, definition);
    logger.info(`Workflow registered: ${name}`);
  }

  // Register a state validator
  registerValidator(state, validator) {
    if (!this.validators.has(state)) {
      this.validators.set(state, []);
    }
    this.validators.get(state).push(validator);
  }

  // Register workflow hooks
  registerHook(event, hook) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push(hook);
  }

  // Check if transition is valid
  canTransition(workflowName, currentState, targetState, userRole, userPermissions = []) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      logger.error(`Workflow not found: ${workflowName}`);
      return false;
    }

    const stateConfig = workflow.states[currentState];
    if (!stateConfig) {
      logger.error(`Invalid current state: ${currentState}`);
      return false;
    }

    // Check if transition is allowed
    if (!stateConfig.transitions.includes(targetState)) {
      logger.warn(`Transition not allowed: ${currentState} -> ${targetState}`);
      return false;
    }

    // Check permissions
    const requiredPermissions = stateConfig.permissions;
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission) || this.hasRolePermission(userRole, permission)
    );

    if (!hasPermission) {
      logger.warn(`Insufficient permissions for transition: ${currentState} -> ${targetState}`, {
        userRole,
        userPermissions,
        requiredPermissions
      });
      return false;
    }

    return true;
  }

  // Execute state transition
  async executeTransition(workItem, targetState, context = {}) {
    const { workflowName = 'standard_work', user, reason = '' } = context;
    
    try {
      // Run pre-transition hooks
      await this.runHooks('pre-transition', { workItem, targetState, context });

      // Validate transition
      if (!this.canTransition(
        workflowName,
        workItem.status,
        targetState,
        user.role,
        user.permissions
      )) {
        throw new Error(`Invalid transition: ${workItem.status} -> ${targetState}`);
      }

      // Run validators
      await this.runValidators(targetState, workItem, context);

      // Store previous state
      const previousState = workItem.status;

      // Execute transition
      const updatedWorkItem = {
        ...workItem,
        status: targetState,
        previousStatus: previousState,
        updatedAt: new Date(),
        updatedBy: user.id,
        transitionReason: reason,
        transitionHistory: [
          ...(workItem.transitionHistory || []),
          {
            from: previousState,
            to: targetState,
            timestamp: new Date(),
            userId: user.id,
            reason
          }
        ]
      };

      // Run post-transition hooks
      await this.runHooks('post-transition', { 
        workItem: updatedWorkItem, 
        previousState, 
        targetState, 
        context 
      });

      logger.info(`Work item transition executed: ${previousState} -> ${targetState}`, {
        workItemId: workItem.id,
        userId: user.id
      });

      return updatedWorkItem;

    } catch (error) {
      logger.error('Workflow transition failed', {
        workItemId: workItem.id,
        currentState: workItem.status,
        targetState,
        error: error.message
      });
      throw error;
    }
  }

  // Run validators for a state
  async runValidators(state, workItem, context) {
    const validators = this.validators.get(state) || [];
    
    for (const validator of validators) {
      const isValid = await validator(workItem, context);
      if (!isValid) {
        throw new Error(`Validation failed for state: ${state}`);
      }
    }
  }

  // Run workflow hooks
  async runHooks(event, data) {
    const hooks = this.hooks.get(event) || [];
    
    for (const hook of hooks) {
      try {
        await hook(data);
      } catch (error) {
        logger.error(`Hook execution failed: ${event}`, error);
      }
    }
  }

  // Check if user role has permission
  hasRolePermission(userRole, permission) {
    const rolePermissions = {
      [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
      [USER_ROLES.MANAGEMENT]: [
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.FINANCIAL_REPORTS,
        PERMISSIONS.MANAGE_WORKFLOWS,
        PERMISSIONS.APPROVE_WORK
      ],
      [USER_ROLES.MANAGER]: [
        PERMISSIONS.ASSIGN_WORK,
        PERMISSIONS.VIEW_ALL_WORK,
        PERMISSIONS.APPROVE_WORK,
        PERMISSIONS.VIEW_ANALYTICS
      ],
      [USER_ROLES.SUPERVISOR]: [
        PERMISSIONS.ASSIGN_WORK,
        PERMISSIONS.VIEW_ALL_WORK,
        PERMISSIONS.APPROVE_WORK
      ],
      [USER_ROLES.QUALITY_CONTROLLER]: [
        PERMISSIONS.QUALITY_CHECK,
        PERMISSIONS.REJECT_WORK,
        PERMISSIONS.QUALITY_REPORTS
      ],
      [USER_ROLES.OPERATOR]: [
        PERMISSIONS.SELF_ASSIGN,
        PERMISSIONS.COMPLETE_WORK,
        PERMISSIONS.VIEW_OWN_WORK
      ]
    };

    return rolePermissions[userRole]?.includes(permission) || false;
  }

  // Get available transitions for current state
  getAvailableTransitions(workflowName, currentState, userRole, userPermissions = []) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) return [];

    const stateConfig = workflow.states[currentState];
    if (!stateConfig) return [];

    return stateConfig.transitions.filter(targetState => 
      this.canTransition(workflowName, currentState, targetState, userRole, userPermissions)
    );
  }

  // Get workflow status
  getWorkflowStatus(workflowName) {
    const workflow = this.workflows.get(workflowName);
    return workflow ? {
      name: workflowName,
      states: Object.keys(workflow.states),
      initialState: workflow.initialState
    } : null;
  }

  // Bulk transition validation
  validateBulkTransition(workItems, targetState, user) {
    const results = workItems.map(workItem => ({
      workItemId: workItem.id,
      canTransition: this.canTransition(
        'standard_work',
        workItem.status,
        targetState,
        user.role,
        user.permissions
      ),
      currentState: workItem.status
    }));

    return {
      total: workItems.length,
      valid: results.filter(r => r.canTransition).length,
      invalid: results.filter(r => !r.canTransition).length,
      results
    };
  }
}

// Create singleton instance
const workflowEngine = new WorkflowEngine();

// Export both the class and the singleton
export { WorkflowEngine };
export default workflowEngine;