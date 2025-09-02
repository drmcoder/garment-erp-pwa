// src/lib/dataProcessor.js
// Centralized data processing and transformation utilities

import { arrayUtils, dateUtils, validationUtils } from './appUtils';
import { transformUtils } from './serviceUtils';
import { debugUtils } from './index';

// Data Aggregation and Analysis
export const dataAggregator = {
  // Group data by time periods
  groupByTimePeriod: (data, dateField, period = 'day') => {
    const groups = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      let key;
      
      switch (period) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth()}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toDateString();
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    return groups;
  },

  // Calculate aggregated metrics
  calculateMetrics: (data, metricDefinitions) => {
    const results = {};
    
    Object.entries(metricDefinitions).forEach(([metricName, definition]) => {
      const { field, type, filter } = definition;
      let filteredData = filter ? data.filter(filter) : data;
      
      switch (type) {
        case 'sum':
          results[metricName] = filteredData.reduce((sum, item) => 
            sum + (parseFloat(item[field]) || 0), 0);
          break;
          
        case 'average':
          const total = filteredData.reduce((sum, item) => 
            sum + (parseFloat(item[field]) || 0), 0);
          results[metricName] = filteredData.length > 0 ? total / filteredData.length : 0;
          break;
          
        case 'count':
          results[metricName] = filteredData.length;
          break;
          
        case 'max':
          results[metricName] = Math.max(...filteredData.map(item => 
            parseFloat(item[field]) || 0));
          break;
          
        case 'min':
          results[metricName] = Math.min(...filteredData.map(item => 
            parseFloat(item[field]) || 0));
          break;
          
        case 'unique':
          const uniqueValues = new Set(filteredData.map(item => item[field]));
          results[metricName] = uniqueValues.size;
          break;
          
        default:
          debugUtils.warn(`Unknown metric type: ${type}`);
      }
    });
    
    return results;
  },

  // Create summary statistics
  summarizeNumericField: (data, field) => {
    const values = data
      .map(item => parseFloat(item[field]))
      .filter(value => !isNaN(value))
      .sort((a, b) => a - b);
    
    if (values.length === 0) {
      return { count: 0, sum: 0, mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median = values.length % 2 === 0 ? 
      (values[values.length / 2 - 1] + values[values.length / 2]) / 2 :
      values[Math.floor(values.length / 2)];
    
    const variance = values.reduce((sum, value) => 
      sum + Math.pow(value - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: values.length,
      sum,
      mean: Math.round(mean * 100) / 100,
      median,
      min: values[0],
      max: values[values.length - 1],
      stdDev: Math.round(stdDev * 100) / 100
    };
  }
};

// Data Filtering and Search
export const dataFilter = {
  // Advanced filtering with multiple criteria
  applyFilters: (data, filters) => {
    return data.filter(item => {
      return Object.entries(filters).every(([field, criteria]) => {
        const value = item[field];
        
        if (criteria === null || criteria === undefined || criteria === '') {
          return true; // No filter applied
        }
        
        if (typeof criteria === 'object') {
          // Range or complex criteria
          if (criteria.min !== undefined && value < criteria.min) return false;
          if (criteria.max !== undefined && value > criteria.max) return false;
          if (criteria.equals !== undefined && value !== criteria.equals) return false;
          if (criteria.contains !== undefined && 
              !value.toString().toLowerCase().includes(criteria.contains.toLowerCase())) {
            return false;
          }
          if (criteria.in !== undefined && !criteria.in.includes(value)) return false;
          return true;
        }
        
        // Simple equality check
        return value === criteria;
      });
    });
  },

  // Text search across multiple fields
  searchText: (data, searchTerm, searchFields) => {
    if (!searchTerm || searchTerm.trim() === '') return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      });
    });
  },

  // Filter by date range
  filterByDateRange: (data, dateField, startDate, endDate) => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;
      return true;
    });
  },

  // Dynamic sorting
  sortData: (data, sortConfig) => {
    return [...data].sort((a, b) => {
      for (const { field, direction } of sortConfig) {
        const aVal = a[field];
        const bVal = b[field];
        
        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        if (aVal < bVal) comparison = -1;
        
        if (comparison !== 0) {
          return direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }
};

// Data Transformation
export const dataTransformer = {
  // Normalize data structure
  normalizeData: (data, schema) => {
    return data.map(item => {
      const normalized = {};
      
      Object.entries(schema).forEach(([targetField, sourceConfig]) => {
        if (typeof sourceConfig === 'string') {
          // Simple field mapping
          normalized[targetField] = item[sourceConfig];
        } else if (typeof sourceConfig === 'object') {
          // Complex mapping with transformation
          const { source, transform, defaultValue } = sourceConfig;
          let value = item[source] || defaultValue;
          
          if (transform && typeof transform === 'function') {
            value = transform(value, item);
          }
          
          normalized[targetField] = value;
        }
      });
      
      return normalized;
    });
  },

  // Flatten nested objects
  flattenObject: (obj, prefix = '', separator = '.') => {
    const flattened = {};
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, dataTransformer.flattenObject(value, newKey, separator));
      } else {
        flattened[newKey] = value;
      }
    });
    
    return flattened;
  },

  // Convert to CSV format
  toCSV: (data, columns = null) => {
    if (!data || data.length === 0) return '';
    
    const headers = columns || Object.keys(data[0]);
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(item => {
      const values = headers.map(header => {
        const value = item[header];
        // Escape commas and quotes
        if (value && value.toString().includes(',')) {
          return `"${value.toString().replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  },

  // Pivot data
  pivotData: (data, rowField, columnField, valueField, aggregateFunction = 'sum') => {
    const pivoted = {};
    const columns = new Set();
    
    // Collect unique column values
    data.forEach(item => {
      columns.add(item[columnField]);
    });
    
    // Create pivot structure
    data.forEach(item => {
      const rowKey = item[rowField];
      const colKey = item[columnField];
      const value = parseFloat(item[valueField]) || 0;
      
      if (!pivoted[rowKey]) {
        pivoted[rowKey] = {};
        columns.forEach(col => {
          pivoted[rowKey][col] = aggregateFunction === 'count' ? 0 : 0;
        });
      }
      
      switch (aggregateFunction) {
        case 'sum':
          pivoted[rowKey][colKey] += value;
          break;
        case 'count':
          pivoted[rowKey][colKey] += 1;
          break;
        case 'max':
          pivoted[rowKey][colKey] = Math.max(pivoted[rowKey][colKey], value);
          break;
        case 'min':
          pivoted[rowKey][colKey] = Math.min(pivoted[rowKey][colKey], value);
          break;
        case 'average':
          // For average, we need to track sum and count separately
          if (!pivoted[rowKey][`${colKey}_sum`]) {
            pivoted[rowKey][`${colKey}_sum`] = 0;
            pivoted[rowKey][`${colKey}_count`] = 0;
          }
          pivoted[rowKey][`${colKey}_sum`] += value;
          pivoted[rowKey][`${colKey}_count`] += 1;
          pivoted[rowKey][colKey] = pivoted[rowKey][`${colKey}_sum`] / pivoted[rowKey][`${colKey}_count`];
          break;
      }
    });
    
    return pivoted;
  }
};

// Data Validation and Cleaning
export const dataValidator = {
  // Validate data against schema
  validateSchema: (data, schema) => {
    const errors = [];
    
    data.forEach((item, index) => {
      Object.entries(schema).forEach(([field, rules]) => {
        const value = item[field];
        
        if (rules.required && (value === null || value === undefined || value === '')) {
          errors.push(`Row ${index + 1}: Field '${field}' is required`);
        }
        
        if (value !== null && value !== undefined && value !== '') {
          if (rules.type === 'number' && isNaN(parseFloat(value))) {
            errors.push(`Row ${index + 1}: Field '${field}' must be a number`);
          }
          
          if (rules.type === 'email' && !validationUtils.isEmail(value)) {
            errors.push(`Row ${index + 1}: Field '${field}' must be a valid email`);
          }
          
          if (rules.minLength && value.toString().length < rules.minLength) {
            errors.push(`Row ${index + 1}: Field '${field}' must be at least ${rules.minLength} characters`);
          }
          
          if (rules.maxLength && value.toString().length > rules.maxLength) {
            errors.push(`Row ${index + 1}: Field '${field}' must be no more than ${rules.maxLength} characters`);
          }
          
          if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
            errors.push(`Row ${index + 1}: Field '${field}' does not match required pattern`);
          }
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Clean and standardize data
  cleanData: (data, cleaningRules = {}) => {
    return data.map(item => {
      const cleaned = { ...item };
      
      Object.entries(cleaningRules).forEach(([field, rules]) => {
        let value = cleaned[field];
        
        if (value !== null && value !== undefined) {
          if (rules.trim && typeof value === 'string') {
            value = value.trim();
          }
          
          if (rules.lowercase && typeof value === 'string') {
            value = value.toLowerCase();
          }
          
          if (rules.uppercase && typeof value === 'string') {
            value = value.toUpperCase();
          }
          
          if (rules.removeSpaces && typeof value === 'string') {
            value = value.replace(/\s+/g, '');
          }
          
          if (rules.parseNumber && typeof value === 'string') {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) value = parsed;
          }
          
          if (rules.parseDate && typeof value === 'string') {
            const date = new Date(value);
            if (!isNaN(date.getTime())) value = date;
          }
          
          if (rules.defaultValue !== undefined && (value === null || value === undefined || value === '')) {
            value = rules.defaultValue;
          }
        }
        
        cleaned[field] = value;
      });
      
      return cleaned;
    });
  },

  // Remove duplicates
  removeDuplicates: (data, keyFields = []) => {
    if (keyFields.length === 0) {
      // Remove exact duplicates
      return data.filter((item, index) => 
        data.findIndex(other => JSON.stringify(other) === JSON.stringify(item)) === index
      );
    }
    
    // Remove duplicates based on specific fields
    const seen = new Set();
    return data.filter(item => {
      const key = keyFields.map(field => item[field]).join('|');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
};

// Export all data processing modules
export default {
  dataAggregator,
  dataFilter,
  dataTransformer,
  dataValidator
};