// Garment Sizes Configuration
export const GARMENT_SIZES = {
  'xs': {
    id: 'xs',
    name: 'Extra Small',
    nameNp: 'अति सानो',
    short: 'XS',
    icon: '👶',
    measurements: {
      chest: '30-32',
      waist: '24-26',
      hip: '32-34'
    },
    order: 1
  },
  's': {
    id: 's',
    name: 'Small',
    nameNp: 'सानो',
    short: 'S',
    icon: '👦',
    measurements: {
      chest: '32-34',
      waist: '26-28',
      hip: '34-36'
    },
    order: 2
  },
  'm': {
    id: 'm',
    name: 'Medium',
    nameNp: 'मध्यम',
    short: 'M',
    icon: '👨',
    measurements: {
      chest: '36-38',
      waist: '30-32',
      hip: '38-40'
    },
    order: 3
  },
  'l': {
    id: 'l',
    name: 'Large',
    nameNp: 'ठूलो',
    short: 'L',
    icon: '👨‍🦰',
    measurements: {
      chest: '40-42',
      waist: '34-36',
      hip: '42-44'
    },
    order: 4
  },
  'xl': {
    id: 'xl',
    name: 'Extra Large',
    nameNp: 'अति ठूलो',
    short: 'XL',
    icon: '🧔',
    measurements: {
      chest: '44-46',
      waist: '38-40',
      hip: '46-48'
    },
    order: 5
  },
  'xxl': {
    id: 'xxl',
    name: '2X Large',
    nameNp: '२X ठूलो',
    short: 'XXL',
    icon: '👨‍💼',
    measurements: {
      chest: '48-50',
      waist: '42-44',
      hip: '50-52'
    },
    order: 6
  },
  'xxxl': {
    id: 'xxxl',
    name: '3X Large',
    nameNp: '३X ठूलो',
    short: 'XXXL',
    icon: '🤵',
    measurements: {
      chest: '52-54',
      waist: '46-48',
      hip: '54-56'
    },
    order: 7
  }
};

// Kids sizes
export const KIDS_SIZES = {
  '2t': { id: '2t', name: '2 Toddler', nameNp: '२ वर्ष', short: '2T', order: 1 },
  '3t': { id: '3t', name: '3 Toddler', nameNp: '३ वर्ष', short: '3T', order: 2 },
  '4t': { id: '4t', name: '4 Toddler', nameNp: '४ वर्ष', short: '4T', order: 3 },
  '5': { id: '5', name: 'Size 5', nameNp: '५ नम्बर', short: '5', order: 4 },
  '6': { id: '6', name: 'Size 6', nameNp: '६ नम्बर', short: '6', order: 5 },
  '7': { id: '7', name: 'Size 7', nameNp: '७ नम्बर', short: '7', order: 6 },
  '8': { id: '8', name: 'Size 8', nameNp: '८ नम्बर', short: '8', order: 7 },
  '10': { id: '10', name: 'Size 10', nameNp: '१० नम्बर', short: '10', order: 8 },
  '12': { id: '12', name: 'Size 12', nameNp: '१२ नम्बर', short: '12', order: 9 },
  '14': { id: '14', name: 'Size 14', nameNp: '१४ नम्बर', short: '14', order: 10 },
  '16': { id: '16', name: 'Size 16', nameNp: '१६ नम्बर', short: '16', order: 11 }
};

// Get size info
export const getGarmentSize = (sizeId) => {
  return GARMENT_SIZES[sizeId] || KIDS_SIZES[sizeId] || {
    id: sizeId,
    name: sizeId,
    nameNp: sizeId,
    short: sizeId?.toUpperCase()
  };
};

// Get size name
export const getGarmentSizeName = (sizeId, language = 'en') => {
  const size = getGarmentSize(sizeId);
  return language === 'np' ? size.nameNp : size.name;
};

// Get all adult sizes
export const getAllAdultSizes = () => {
  return Object.values(GARMENT_SIZES).sort((a, b) => a.order - b.order);
};

// Get all kids sizes
export const getAllKidsSizes = () => {
  return Object.values(KIDS_SIZES).sort((a, b) => a.order - b.order);
};

// Get all sizes combined
export const getAllSizes = () => {
  return [...getAllAdultSizes(), ...getAllKidsSizes()];
};

// Get size options for dropdowns
export const getSizeOptions = (language = 'en', includeKids = true) => {
  const adultSizes = Object.values(GARMENT_SIZES).map(size => ({
    value: size.id,
    label: language === 'np' ? size.nameNp : size.name,
    short: size.short,
    category: 'adult',
    order: size.order
  }));

  if (!includeKids) {
    return adultSizes.sort((a, b) => a.order - b.order);
  }

  const kidsSizes = Object.values(KIDS_SIZES).map(size => ({
    value: size.id,
    label: language === 'np' ? size.nameNp : size.name,
    short: size.short,
    category: 'kids',
    order: size.order
  }));

  return [...adultSizes, ...kidsSizes].sort((a, b) => a.order - b.order);
};