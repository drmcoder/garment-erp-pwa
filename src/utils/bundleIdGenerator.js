// Bundle ID Generator - Human Readable Format
// Format: B:batch:article:S:size:color:pieces
// Example: B:55:3233:S:XL:blu:13P

export const generateBundleId = (bundleData) => {
  const {
    batchNumber = '001',
    articleNumber = '0000',
    size = 'M',
    color = 'def',
    pieces = 0,
    quantity = 0,
    colorQuantity = 1 // Number of items of this color in the bundle
  } = bundleData;

  // Use pieces or quantity, whichever is available
  const totalPieces = pieces || quantity || 0;

  // Normalize size (convert to standard format)
  const normalizedSize = normalizeSize(size);

  // Normalize color (convert to 3-letter code with quantity prefix if > 1)
  const colorCode = normalizeColor(color, colorQuantity);

  // Format: B:batch:article:S:size:color:pieces
  return `B:${batchNumber}:${articleNumber}:S:${normalizedSize}:${colorCode}:${totalPieces}P`;
};

// Helper function to normalize size to standard format
const normalizeSize = (size) => {
  if (!size) return 'M';
  
  const sizeMap = {
    // Standard sizes
    'XS': 'XS',
    'S': 'S',
    'M': 'M', 
    'L': 'L',
    'XL': 'XL',
    'XXL': 'XXL',
    '2XL': 'XXL',
    '3XL': 'XXXL',
    
    // Common variations
    'SMALL': 'S',
    'MEDIUM': 'M',
    'LARGE': 'L',
    'EXTRA LARGE': 'XL',
    'EXTRA SMALL': 'XS',
    
    // Numeric sizes
    '28': '28',
    '30': '30',
    '32': '32',
    '34': '34',
    '36': '36',
    '38': '38',
    '40': '40',
    '42': '42',
    
    // Kids sizes
    '2T': '2T',
    '3T': '3T',
    '4T': '4T',
    '5T': '5T'
  };

  const upperSize = size.toString().toUpperCase();
  return sizeMap[upperSize] || upperSize.slice(0, 3);
};

// Helper function to normalize color to 3-letter code with quantity prefix
const normalizeColor = (color, quantity = 1) => {
  if (!color) return 'def';
  
  const colorMap = {
    // Basic colors
    'BLACK': 'bla',
    'WHITE': 'whi',
    'BLUE': 'blu', 
    'RED': 'red',
    'GREEN': 'gre',
    'YELLOW': 'yel',
    'ORANGE': 'ora',
    'PURPLE': 'pur',
    'PINK': 'pin',
    'BROWN': 'bro',
    'GRAY': 'gra',
    'GREY': 'gra',
    
    // Extended colors
    'NAVY': 'nav',
    'ROYAL': 'roy',
    'LIME': 'lim',
    'TEAL': 'tea',
    'CYAN': 'cya',
    'MAGENTA': 'mag',
    'MAROON': 'mar',
    'OLIVE': 'oli',
    'SILVER': 'sil',
    'GOLD': 'gol',
    'BEIGE': 'bei',
    'KHAKI': 'kha',
    'CORAL': 'cor',
    'SALMON': 'sal',
    'TURQUOISE': 'tur',
    'VIOLET': 'vio',
    'INDIGO': 'ind',
    'CRIMSON': 'cri',
    
    // Variations
    'LIGHT BLUE': 'lbl',
    'DARK BLUE': 'dbl',
    'LIGHT GREEN': 'lgr',
    'DARK GREEN': 'dgr',
    'LIGHT GRAY': 'lgy',
    'DARK GRAY': 'dgy',
    
    // Default
    'DEFAULT': 'def',
    'MIXED': 'mix',
    'ASSORTED': 'ass'
  };

  const upperColor = color.toString().toUpperCase();
  
  // Handle numbered color patterns (e.g., "color-1", "color 2")
  const numberedColorMatch = upperColor.match(/(?:COLOR\s*-?\s*(\d+)|\s*(\d+)\s*CLR?)/);
  if (numberedColorMatch) {
    const colorNum = numberedColorMatch[1] || numberedColorMatch[2];
    return `${colorNum}clr`;
  }
  
  const baseColor = colorMap[upperColor] || upperColor.slice(0, 3).toLowerCase();
  
  // Add quantity prefix if more than 1 (e.g., 2bla for 2 black items)
  return quantity > 1 ? `${quantity}${baseColor}` : baseColor;
};

// Function to parse bundle ID back to components
export const parseBundleId = (bundleId) => {
  if (!bundleId || !bundleId.startsWith('B:')) {
    return null;
  }

  try {
    const parts = bundleId.split(':');
    if (parts.length !== 6) return null;

    return {
      prefix: parts[0], // 'B'
      batchNumber: parts[1],
      articleNumber: parts[2],
      sizeIndicator: parts[3], // 'S'
      size: parts[4],
      color: parts[5],
      pieces: parseInt(parts[6].replace('P', '')) || 0
    };
  } catch (error) {
    console.warn('Failed to parse bundle ID:', bundleId, error);
    return null;
  }
};

// Function to generate display name from bundle ID
export const getBundleDisplayName = (bundleId) => {
  const parsed = parseBundleId(bundleId);
  if (!parsed) return bundleId;

  return `Article ${parsed.articleNumber} - ${parsed.size} ${getColorName(parsed.color)} (${parsed.pieces} pcs)`;
};

// Helper to get full color name from code
const getColorName = (colorCode) => {
  const colorNames = {
    'bla': 'Black',
    'whi': 'White', 
    'blu': 'Blue',
    'red': 'Red',
    'gre': 'Green',
    'yel': 'Yellow',
    'ora': 'Orange',
    'pur': 'Purple',
    'pin': 'Pink',
    'bro': 'Brown',
    'gra': 'Gray',
    'nav': 'Navy',
    'roy': 'Royal',
    'lim': 'Lime',
    'tea': 'Teal',
    'cya': 'Cyan',
    'mag': 'Magenta',
    'mar': 'Maroon',
    'oli': 'Olive',
    'sil': 'Silver',
    'gol': 'Gold',
    'bei': 'Beige',
    'kha': 'Khaki',
    'cor': 'Coral',
    'sal': 'Salmon',
    'tur': 'Turquoise',
    'vio': 'Violet',
    'ind': 'Indigo',
    'cri': 'Crimson',
    'lbl': 'Light Blue',
    'dbl': 'Dark Blue',
    'lgr': 'Light Green',
    'dgr': 'Dark Green',
    'lgy': 'Light Gray',
    'dgy': 'Dark Gray',
    'def': 'Default',
    'mix': 'Mixed',
    'ass': 'Assorted'
  };

  return colorNames[colorCode] || colorCode.toUpperCase();
};

// Function to update existing bundle with readable ID
export const updateBundleWithReadableId = (bundle) => {
  // If bundle already has a readable ID, return as is
  if (bundle.readableId || (bundle.id && bundle.id.startsWith('B:'))) {
    return bundle;
  }

  // Generate readable ID from bundle data
  const readableId = generateBundleId({
    batchNumber: bundle.batchNumber || bundle.batch || '001',
    articleNumber: bundle.articleNumber || bundle.article || '0000',
    size: bundle.size || bundle.sizes?.[0] || 'M',
    color: bundle.color || 'def',
    pieces: bundle.pieces || bundle.quantity || bundle.pieceCount || 0
  });

  return {
    ...bundle,
    readableId,
    displayName: getBundleDisplayName(readableId)
  };
};

// Function to check for duplicate bundle IDs
export const checkForDuplicateBundleId = (bundleId, existingBundles) => {
  if (!bundleId || !Array.isArray(existingBundles)) return { isDuplicate: false };
  
  const duplicates = existingBundles.filter(bundle => 
    bundle.readableId === bundleId || bundle.id === bundleId
  );
  
  return {
    isDuplicate: duplicates.length > 0,
    duplicates,
    count: duplicates.length
  };
};

// Function to generate unique bundle ID with suffix if needed
export const generateUniqueBundleId = (bundleData, existingBundles) => {
  let baseId = generateBundleId(bundleData);
  let uniqueId = baseId;
  let suffix = 1;
  
  while (checkForDuplicateBundleId(uniqueId, existingBundles).isDuplicate) {
    uniqueId = `${baseId}-${suffix}`;
    suffix++;
  }
  
  return {
    bundleId: uniqueId,
    isUnique: uniqueId === baseId,
    suffix: uniqueId === baseId ? 0 : suffix - 1
  };
};

// Function to validate bundle ID format
export const validateBundleId = (bundleId) => {
  if (!bundleId || typeof bundleId !== 'string') {
    return { isValid: false, error: 'Bundle ID is required' };
  }
  
  const parsed = parseBundleId(bundleId);
  if (!parsed) {
    return { isValid: false, error: 'Invalid bundle ID format. Expected format: B:batch:article:S:size:color:pieces' };
  }
  
  if (!parsed.batchNumber || !parsed.articleNumber || !parsed.size || !parsed.color || parsed.pieces === 0) {
    return { isValid: false, error: 'Bundle ID contains missing or invalid components' };
  }
  
  return { isValid: true, parsed };
};