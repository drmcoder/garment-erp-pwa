// File: src/components/avatar/UniqueAvatarSystem.jsx
// Advanced 3D-style avatar system with unique combinations

import React, { useState, useEffect, useMemo } from 'react';
import { User, Palette, Shuffle, Download, Save } from 'lucide-react';

const UniqueAvatarSystem = ({ 
  userId, 
  name, 
  size = 'md', 
  showCustomizer = false, 
  onAvatarChange = null,
  className = '' 
}) => {
  // Avatar configuration state
  const [avatarConfig, setAvatarConfig] = useState({
    style: 'adventurer',
    backgroundColor: '#4F46E5',
    hairStyle: 0,
    eyeStyle: 0,
    mouthStyle: 0,
    accessory: 0,
    skinTone: 0
  });

  // Available avatar styles (using DiceBear API-compatible styles)
  const avatarStyles = [
    'adventurer',
    'adventurer-neutral', 
    'avataaars',
    'big-ears',
    'big-ears-neutral',
    'big-smile',
    'bottts',
    'croodles',
    'croodles-neutral',
    'fun-emoji',
    'icons',
    'identicon',
    'initials',
    'lorelei',
    'lorelei-neutral',
    'micah',
    'miniavs',
    'open-peeps',
    'personas',
    'pixel-art',
    'pixel-art-neutral',
    'shapes',
    'thumbs'
  ];

  // Color palettes for backgrounds
  const colorPalettes = [
    '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F97316',
    '#EAB308', '#22C55E', '#10B981', '#06B6D4', '#3B82F6',
    '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#F43F5E'
  ];

  // Size configurations
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12', 
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
    '2xl': 'w-48 h-48'
  };

  // Generate unique seed from userId and name
  const generateSeed = (id, name) => {
    const combined = `${id || ''}${name || 'anonymous'}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  };

  // Generate avatar URL using DiceBear API
  const generateAvatarUrl = (config, seed) => {
    const baseUrl = 'https://api.dicebear.com/7.x';
    const params = new URLSearchParams({
      seed: seed,
      backgroundColor: config.backgroundColor.replace('#', ''),
      size: '200'
    });

    // Add style-specific parameters
    if (config.style === 'adventurer' || config.style === 'adventurer-neutral') {
      params.append('hairColor', ['0e0e0e', '3c4043', '6c4e37', 'd2691e', 'ffa500'][config.hairStyle % 5]);
      params.append('eyesColor', ['000000', '1e40af', '059669', '7c2d12'][config.eyeStyle % 4]);
    } else if (config.style === 'avataaars') {
      params.append('accessoriesColor', ['000000', '3c4043', '6c4e37'][config.accessory % 3]);
      params.append('skinColor', ['fdbcb4', 'f8d25c', 'd08b5b', 'ae5d29'][config.skinTone % 4]);
    }

    return `${baseUrl}/${config.style}/svg?${params.toString()}`;
  };

  // Generate unique avatar configuration from user data
  const generateUniqueConfig = (id, name) => {
    const seed = generateSeed(id, name);
    const seedNum = parseInt(seed.slice(0, 8), 16);
    
    return {
      style: avatarStyles[seedNum % avatarStyles.length],
      backgroundColor: colorPalettes[seedNum % colorPalettes.length],
      hairStyle: (seedNum >> 4) % 5,
      eyeStyle: (seedNum >> 8) % 4,
      mouthStyle: (seedNum >> 12) % 4,
      accessory: (seedNum >> 16) % 3,
      skinTone: (seedNum >> 20) % 4
    };
  };

  // Initialize avatar configuration
  useEffect(() => {
    const uniqueConfig = generateUniqueConfig(userId, name);
    setAvatarConfig(uniqueConfig);
  }, [userId, name]);

  // Generate current avatar URL
  const avatarUrl = useMemo(() => {
    const seed = generateSeed(userId, name);
    return generateAvatarUrl(avatarConfig, seed);
  }, [avatarConfig, userId, name]);

  // Handle configuration changes
  const updateConfig = (key, value) => {
    const newConfig = { ...avatarConfig, [key]: value };
    setAvatarConfig(newConfig);
    if (onAvatarChange) {
      onAvatarChange(newConfig);
    }
  };

  // Randomize avatar
  const randomizeAvatar = () => {
    const randomConfig = {
      style: avatarStyles[Math.floor(Math.random() * avatarStyles.length)],
      backgroundColor: colorPalettes[Math.floor(Math.random() * colorPalettes.length)],
      hairStyle: Math.floor(Math.random() * 5),
      eyeStyle: Math.floor(Math.random() * 4),
      mouthStyle: Math.floor(Math.random() * 4),
      accessory: Math.floor(Math.random() * 3),
      skinTone: Math.floor(Math.random() * 4)
    };
    setAvatarConfig(randomConfig);
    if (onAvatarChange) {
      onAvatarChange(randomConfig);
    }
  };

  // Download avatar
  const downloadAvatar = async () => {
    try {
      const response = await fetch(avatarUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avatar-${name || 'user'}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download avatar:', error);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Avatar Display */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden shadow-lg border-4 border-white bg-gradient-to-br from-indigo-500 to-purple-600`}>
        <img
          src={avatarUrl}
          alt={`${name}'s avatar`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials avatar if image fails to load
            e.target.style.display = 'none';
            const fallback = e.target.nextSibling;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        {/* Fallback initials */}
        <div 
          className="absolute inset-0 flex items-center justify-center text-white font-bold bg-gradient-to-br from-indigo-500 to-purple-600"
          style={{ display: 'none' }}
        >
          <User className="w-1/2 h-1/2" />
        </div>
      </div>

      {/* Avatar Customizer */}
      {showCustomizer && (
        <div className="mt-6 w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2 text-indigo-600" />
            Customize Avatar
          </h3>

          {/* Style Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar Style</label>
            <select
              value={avatarConfig.style}
              onChange={(e) => updateConfig('style', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {avatarStyles.map(style => (
                <option key={style} value={style}>
                  {style.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Background Color */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
            <div className="flex flex-wrap gap-2">
              {colorPalettes.map(color => (
                <button
                  key={color}
                  onClick={() => updateConfig('backgroundColor', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    avatarConfig.backgroundColor === color 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Variation Controls */}
          {(avatarConfig.style === 'adventurer' || avatarConfig.style === 'adventurer-neutral') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hair Style</label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={avatarConfig.hairStyle}
                  onChange={(e) => updateConfig('hairStyle', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Eye Style</label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={avatarConfig.eyeStyle}
                  onChange={(e) => updateConfig('eyeStyle', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={randomizeAvatar}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Shuffle className="w-4 h-4 mr-1" />
              Random
            </button>
            <button
              onClick={downloadAvatar}
              className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniqueAvatarSystem;