// Skill Levels Configuration
export const SKILL_LEVELS = {
  'trainee': {
    id: 'trainee',
    name: 'Trainee',
    nameNp: 'तालिमार्थी',
    icon: '🎯',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    description: 'Learning basic skills',
    level: 1,
    multiplier: 0.6,
    targetEfficiency: 60
  },
  'beginner': {
    id: 'beginner',
    name: 'Beginner',
    nameNp: 'नयाँ',
    icon: '🌱',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    description: 'Basic skill level',
    level: 2,
    multiplier: 0.8,
    targetEfficiency: 75
  },
  'intermediate': {
    id: 'intermediate',
    name: 'Intermediate',
    nameNp: 'मध्यम',
    icon: '📈',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    description: 'Good skill level with some experience',
    level: 3,
    multiplier: 1.0,
    targetEfficiency: 85
  },
  'advanced': {
    id: 'advanced',
    name: 'Advanced',
    nameNp: 'उन्नत',
    icon: '🚀',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    description: 'High skill level with extensive experience',
    level: 4,
    multiplier: 1.2,
    targetEfficiency: 90
  },
  'expert': {
    id: 'expert',
    name: 'Expert',
    nameNp: 'निपुण',
    icon: '⭐',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
    description: 'Master level with exceptional skills',
    level: 5,
    multiplier: 1.4,
    targetEfficiency: 95
  }
};

// Get skill level info
export const getSkillLevel = (levelId) => {
  return SKILL_LEVELS[levelId] || SKILL_LEVELS['beginner'];
};

// Get skill level name
export const getSkillLevelName = (levelId, language = 'en') => {
  const level = SKILL_LEVELS[levelId];
  if (!level) return levelId || 'Unknown';
  return language === 'np' ? level.nameNp : level.name;
};

// Get skill level multiplier for calculations
export const getSkillMultiplier = (levelId) => {
  const level = SKILL_LEVELS[levelId];
  return level?.multiplier || 1.0;
};

// Get target efficiency for skill level
export const getTargetEfficiency = (levelId) => {
  const level = SKILL_LEVELS[levelId];
  return level?.targetEfficiency || 80;
};

// Get all skill levels as array
export const getAllSkillLevels = () => {
  return Object.values(SKILL_LEVELS);
};

// Get skill level options for dropdowns
export const getSkillLevelOptions = (language = 'en') => {
  return Object.values(SKILL_LEVELS).map(level => ({
    value: level.id,
    label: language === 'np' ? level.nameNp : level.name,
    icon: level.icon,
    color: level.color,
    level: level.level
  }));
};