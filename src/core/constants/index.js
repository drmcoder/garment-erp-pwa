// Core Constants - Centralized Export

// Animation constants
export const ANIMATION = {
  FAST: 150,
  MEDIUM: 300,
  SLOW: 500
};

// UI constants
export const UI_CONSTANTS = {
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32
  },
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 9999,
    TOAST: 10000,
    TOOLTIP: 10001
  }
};

// Re-export from existing constants
export * from '../../constants';