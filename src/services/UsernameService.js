// Username Service for generating and validating usernames
import { db, collection, getDocs, COLLECTIONS } from '../config/firebase';

export class UsernameService {
  // Cache for existing usernames to avoid repeated database queries
  static existingUsernames = new Set();
  static lastCacheUpdate = null;
  static cacheExpiry = 60000; // 1 minute

  // Load all existing usernames from Firestore
  static async loadExistingUsernames() {
    const now = Date.now();
    
    // Use cache if it's still valid
    if (this.lastCacheUpdate && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      return this.existingUsernames;
    }

    try {
      const usernames = new Set();
      
      // Load from operators
      const operatorsSnapshot = await getDocs(collection(db, COLLECTIONS.OPERATORS));
      operatorsSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.username) {
          usernames.add(userData.username.toLowerCase());
        }
      });

      // Load from supervisors  
      const supervisorsSnapshot = await getDocs(collection(db, COLLECTIONS.SUPERVISORS));
      supervisorsSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.username) {
          usernames.add(userData.username.toLowerCase());
        }
      });

      // Load from management
      const managementSnapshot = await getDocs(collection(db, COLLECTIONS.MANAGEMENT));
      managementSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.username) {
          usernames.add(userData.username.toLowerCase());
        }
      });

      this.existingUsernames = usernames;
      this.lastCacheUpdate = now;
      
      console.log(`📝 Loaded ${usernames.size} existing usernames for validation`);
      return usernames;
      
    } catch (error) {
      console.error('❌ Failed to load existing usernames:', error);
      return this.existingUsernames; // Return cached version if available
    }
  }

  // Generate a simple 4-digit username
  static async generateSimple4DigitUsername(baseName = '') {
    await this.loadExistingUsernames();
    
    // Extract first few characters from name if provided
    let prefix = '';
    if (baseName) {
      // Take first 2-3 characters from name, remove spaces and special chars
      prefix = baseName.toLowerCase()
        .replace(/[^a-z]/g, '')
        .substring(0, 2);
    }
    
    // If no prefix or too short, use random letters
    if (prefix.length < 2) {
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      prefix = letters.charAt(Math.floor(Math.random() * letters.length)) +
               letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // Generate 4-digit number
    for (let attempts = 0; attempts < 100; attempts++) {
      const digits = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const username = prefix + digits;
      
      if (!this.existingUsernames.has(username.toLowerCase())) {
        console.log(`✅ Generated username: ${username}`);
        return username;
      }
    }

    // Fallback: use timestamp if all attempts failed
    const timestamp = Date.now().toString().slice(-4);
    const fallbackUsername = prefix + timestamp;
    console.log(`⚠️ Using fallback username: ${fallbackUsername}`);
    return fallbackUsername;
  }

  // Generate multiple username suggestions
  static async generateUsernameSuggestions(baseName = '', count = 3) {
    const suggestions = [];
    
    for (let i = 0; i < count; i++) {
      const username = await this.generateSimple4DigitUsername(baseName);
      if (!suggestions.includes(username)) {
        suggestions.push(username);
      }
    }
    
    return suggestions;
  }

  // Validate username instantly
  static async validateUsername(username) {
    if (!username || username.length < 3) {
      return {
        isValid: false,
        message: 'Username must be at least 3 characters long',
        messageNp: 'प्रयोगकर्ता नाम कम्तिमा 3 अक्षर लामो हुनुपर्छ'
      };
    }

    if (username.length > 20) {
      return {
        isValid: false,
        message: 'Username must be less than 20 characters',
        messageNp: 'प्रयोगकर्ता नाम 20 अक्षर भन्दा कम हुनुपर्छ'
      };
    }

    // Check for valid characters (alphanumeric, dots, underscores)
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return {
        isValid: false,
        message: 'Username can only contain letters, numbers, dots, and underscores',
        messageNp: 'प्रयोगकर्ता नाममा अक्षर, संख्या, डट र अण्डरस्कोर मात्र हुन सक्छ'
      };
    }

    // Check if username already exists
    await this.loadExistingUsernames();
    
    if (this.existingUsernames.has(username.toLowerCase())) {
      return {
        isValid: false,
        message: 'Username already exists. Please choose a different one.',
        messageNp: 'प्रयोगकर्ता नाम पहिले नै अवस्थित छ। कृपया फरक छान्नुहोस्।'
      };
    }

    return {
      isValid: true,
      message: 'Username is available',
      messageNp: 'प्रयोगकर्ता नाम उपलब्ध छ'
    };
  }

  // Add new username to cache to avoid duplicates during session
  static addUsernameToCache(username) {
    this.existingUsernames.add(username.toLowerCase());
  }

  // Generate username from full name
  static generateUsernameFromName(fullName) {
    if (!fullName) return '';
    
    // Split name and take first letter of each word + last word
    const parts = fullName.toLowerCase().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 6);
    }
    
    // First letter of each word except last + full last word
    const initials = parts.slice(0, -1).map(part => part.charAt(0)).join('');
    const lastName = parts[parts.length - 1];
    
    return (initials + lastName).substring(0, 10);
  }

  // Get login suggestions for dropdown
  static async getLoginSuggestions() {
    await this.loadExistingUsernames();
    
    // Return recently created usernames (this would be enhanced with actual recent user data)
    const suggestions = Array.from(this.existingUsernames)
      .slice(0, 8) // Get first 8 for dropdown
      .map(username => ({
        username,
        displayName: username,
        lastLogin: new Date() // This would come from user data
      }));
    
    return suggestions;
  }
}

export default UsernameService;