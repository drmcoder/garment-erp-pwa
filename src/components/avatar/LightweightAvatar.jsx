// File: src/components/avatar/LightweightAvatar.jsx
// Lightweight 3D-style avatar system with CSS-only graphics

import React, { useMemo } from 'react';

const LightweightAvatar = ({ 
  userId, 
  name = 'User', 
  size = 'md', 
  className = '' 
}) => {
  // Size configurations
  const sizes = {
    xs: 32,
    sm: 48,
    md: 64,
    lg: 96,
    xl: 128
  };

  const avatarSize = sizes[size];

  // Generate unique characteristics from userId/name
  const avatarData = useMemo(() => {
    const seed = `${userId || ''}${name}`;
    let hash = 0;
    
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff;
    }
    
    // Use hash to generate consistent characteristics
    const abs = Math.abs(hash);
    
    return {
      // Skin tones
      skinColor: [
        '#FDBCB4', // Light
        '#F1C27D', // Medium-light  
        '#E0AC69', // Medium
        '#C68642', // Medium-dark
        '#8D5524'  // Dark
      ][abs % 5],
      
      // Hair colors and styles
      hairColor: [
        '#2C1B18', // Black
        '#6C4E37', // Dark Brown
        '#D2691E', // Light Brown
        '#DEB887', // Blonde
        '#FF6347'  // Red
      ][(abs >> 4) % 5],
      
      // Eye colors
      eyeColor: [
        '#8B4513', // Brown
        '#1E90FF', // Blue
        '#228B22', // Green
        '#4B0082'  // Purple
      ][(abs >> 8) % 4],
      
      // Accessories
      hasGlasses: (abs >> 12) % 3 === 0,
      hasMustache: (abs >> 16) % 4 === 0,
      hasBeard: (abs >> 20) % 5 === 0,
      
      // Background gradient
      bgColors: [
        ['#667eea', '#764ba2'], // Purple-blue
        ['#ffecd2', '#fcb69f'], // Orange-pink
        ['#a8edea', '#fed6e3'], // Mint-pink
        ['#ff9a9e', '#fecfef'], // Pink gradient
        ['#a18cd1', '#fbc2eb'], // Purple-pink
        ['#fad0c4', '#ffd1ff'], // Peach-pink
        ['#fed6e3', '#d299c2'], // Pink-purple
        ['#89f7fe', '#66a6ff']  // Blue gradient
      ][(abs >> 24) % 8]
    };
  }, [userId, name]);

  // Generate initials fallback
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className={`relative rounded-full overflow-hidden shadow-lg ${className}`}
      style={{ 
        width: avatarSize, 
        height: avatarSize,
        background: `linear-gradient(135deg, ${avatarData.bgColors[0]}, ${avatarData.bgColors[1]})`
      }}
    >
      {/* 3D Avatar SVG */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 200 200" 
        className="absolute inset-0"
      >
        <defs>
          {/* Gradients for 3D effect */}
          <radialGradient id={`skinGradient-${userId}`} cx="0.3" cy="0.3">
            <stop offset="0%" stopColor={avatarData.skinColor} stopOpacity="1" />
            <stop offset="100%" stopColor={avatarData.skinColor} stopOpacity="0.7" />
          </radialGradient>
          
          <radialGradient id={`hairGradient-${userId}`} cx="0.3" cy="0.3">
            <stop offset="0%" stopColor={avatarData.hairColor} stopOpacity="1" />
            <stop offset="100%" stopColor={avatarData.hairColor} stopOpacity="0.8" />
          </radialGradient>
          
          {/* Shadow filters */}
          <filter id={`shadow-${userId}`}>
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Head (3D oval) */}
        <ellipse 
          cx="100" 
          cy="110" 
          rx="55" 
          ry="65" 
          fill={`url(#skinGradient-${userId})`}
          filter={`url(#shadow-${userId})`}
        />
        
        {/* Hair */}
        <path 
          d="M 45 80 Q 100 40 155 80 Q 150 85 145 90 L 55 90 Q 50 85 45 80 Z"
          fill={`url(#hairGradient-${userId})`}
          filter={`url(#shadow-${userId})`}
        />
        
        {/* Eyes */}
        <ellipse cx="80" cy="95" rx="8" ry="10" fill="white" />
        <ellipse cx="120" cy="95" rx="8" ry="10" fill="white" />
        <circle cx="80" cy="95" r="5" fill={avatarData.eyeColor} />
        <circle cx="120" cy="95" r="5" fill={avatarData.eyeColor} />
        <circle cx="82" cy="93" r="2" fill="white" opacity="0.8" />
        <circle cx="122" cy="93" r="2" fill="white" opacity="0.8" />
        
        {/* Eyebrows */}
        <path d="M 70 85 Q 80 80 90 85" stroke={avatarData.hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 110 85 Q 120 80 130 85" stroke={avatarData.hairColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        
        {/* Nose */}
        <ellipse cx="100" cy="110" rx="3" ry="8" fill={avatarData.skinColor} opacity="0.6" />
        
        {/* Mouth */}
        <path 
          d="M 90 130 Q 100 140 110 130" 
          stroke="#ff6b6b" 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round"
        />
        
        {/* Glasses (conditional) */}
        {avatarData.hasGlasses && (
          <>
            <circle cx="80" cy="95" r="15" fill="none" stroke="#333" strokeWidth="2" />
            <circle cx="120" cy="95" r="15" fill="none" stroke="#333" strokeWidth="2" />
            <path d="M 95 95 L 105 95" stroke="#333" strokeWidth="2" />
          </>
        )}
        
        {/* Mustache (conditional) */}
        {avatarData.hasMustache && (
          <path 
            d="M 85 122 Q 100 118 115 122" 
            stroke={avatarData.hairColor} 
            strokeWidth="4" 
            fill="none" 
            strokeLinecap="round"
          />
        )}
        
        {/* Beard (conditional) */}
        {avatarData.hasBeard && (
          <ellipse 
            cx="100" 
            cy="155" 
            rx="25" 
            ry="15" 
            fill={`url(#hairGradient-${userId})`}
          />
        )}
        
        {/* Collar/Shirt */}
        <path 
          d="M 50 175 Q 100 185 150 175 L 150 200 L 50 200 Z"
          fill="#4F46E5" 
          opacity="0.8"
        />
      </svg>
      
      {/* Fallback initials (hidden by default) */}
      <div 
        className="absolute inset-0 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-20"
        style={{ fontSize: avatarSize * 0.35 }}
      >
        {initials}
      </div>
    </div>
  );
};

export default LightweightAvatar;