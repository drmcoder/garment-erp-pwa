// Machine Types Configuration
export const MACHINE_TYPES = {
  'single-needle': {
    id: 'single-needle',
    name: 'Single Needle',
    nameNp: 'एकल सुई',
    icon: '📍',
    description: 'Single needle sewing machine'
  },
  'double-needle': {
    id: 'double-needle',
    name: 'Double Needle',
    nameNp: 'दोहोरो सुई',
    icon: '📌',
    description: 'Double needle sewing machine'
  },
  'overlock': {
    id: 'overlock',
    name: 'Overlock',
    nameNp: 'ओभरलक',
    icon: '🔗',
    description: 'Overlock sewing machine'
  },
  'flatlock': {
    id: 'flatlock',
    name: 'Flatlock',
    nameNp: 'फ्ल्याटलक',
    icon: '📎',
    description: 'Flatlock sewing machine'
  },
  'buttonhole': {
    id: 'buttonhole',
    name: 'Buttonhole',
    nameNp: 'बटनहोल',
    icon: '🕳️',
    description: 'Buttonhole machine'
  },
  'cutting': {
    id: 'cutting',
    name: 'Cutting',
    nameNp: 'काट्ने',
    icon: '✂️',
    description: 'Fabric cutting machine'
  },
  'pressing': {
    id: 'pressing',
    name: 'Pressing',
    nameNp: 'प्रेसिंग',
    icon: '🔥',
    description: 'Pressing machine'
  },
  'finishing': {
    id: 'finishing',
    name: 'Finishing',
    nameNp: 'फिनिसिंग',
    icon: '✨',
    description: 'Finishing operations'
  },
  'kansai': {
    id: 'kansai',
    name: 'Kansai',
    nameNp: 'कान्साई',
    icon: '🏭',
    description: 'Kansai special machine'
  }
};

// Get machine type icon
export const getMachineTypeIcon = (machineType) => {
  return MACHINE_TYPES[machineType]?.icon || '⚙️';
};

// Get machine type name
export const getMachineTypeName = (machineType, language = 'en') => {
  const machine = MACHINE_TYPES[machineType];
  if (!machine) return machineType || 'Unknown';
  return language === 'np' ? machine.nameNp : machine.name;
};

// Get all machine types as array
export const getAllMachineTypes = () => {
  return Object.values(MACHINE_TYPES);
};

// Get machine type options for dropdowns
export const getMachineTypeOptions = (language = 'en') => {
  return Object.values(MACHINE_TYPES).map(machine => ({
    value: machine.id,
    label: language === 'np' ? machine.nameNp : machine.name,
    icon: machine.icon
  }));
};