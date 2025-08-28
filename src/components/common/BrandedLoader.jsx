import React from 'react';

const BrandedLoader = ({ 
  message = "Loading...", 
  size = "large", 
  showProgress = false,
  progress = 0 
}) => {
  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-20 h-20", 
    large: "w-32 h-32",
    xlarge: "w-48 h-48"
  };

  const messageSizes = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
    xlarge: "text-xl"
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col items-center justify-center z-50">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-2 h-2 rounded-full animate-ping" style={{ top: '20%', left: '10%', animationDelay: '0s', backgroundColor: '#37479d40' }}></div>
        <div className="absolute w-1 h-1 rounded-full animate-ping" style={{ top: '70%', left: '80%', animationDelay: '1s', backgroundColor: '#ec1d2540' }}></div>
        <div className="absolute w-3 h-3 rounded-full animate-ping" style={{ top: '40%', left: '90%', animationDelay: '2s', backgroundColor: '#37479d30' }}></div>
        <div className="absolute w-1 h-1 rounded-full animate-ping" style={{ top: '80%', left: '20%', animationDelay: '1.5s', backgroundColor: '#ec1d2530' }}></div>
        <div className="absolute w-2 h-2 rounded-full animate-ping" style={{ top: '10%', left: '60%', animationDelay: '0.5s', backgroundColor: '#37479d50' }}></div>
      </div>

      {/* Main loading container */}
      <div className="relative flex flex-col items-center space-y-6">
        {/* Progress circle background */}
        {showProgress && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="rgba(55, 71, 157, 0.1)"
                strokeWidth="4"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="rgba(55, 71, 157, 0.6)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
                className="transition-all duration-300 ease-out"
              />
            </svg>
          </div>
        )}

        {/* Logo container with animations */}
        <div className="relative">
          {/* Rotating ring around logo */}
          <div className="absolute -inset-4 border-2 border-dashed rounded-full animate-spin opacity-30" style={{borderColor: '#37479d80'}}></div>
          
          {/* Pulsing ring */}
          <div className="absolute -inset-6 border rounded-full animate-ping opacity-20" style={{borderColor: '#ec1d2560'}}></div>
          
          {/* Logo with multiple animations */}
          <div className={`${sizeClasses[size]} relative rounded-full shadow-2xl overflow-hidden animate-bounce`} 
               style={{ animationDuration: '2s' }}>
            
            {/* Gradient overlay animation */}
            <div className="absolute inset-0 animate-pulse" style={{background: 'linear-gradient(135deg, rgba(55, 71, 157, 0.2), rgba(236, 29, 37, 0.2))'}}></div>
            
            {/* Main logo */}
            <img
              src="https://kaha6.com/wp-content/uploads/ts-logo1640412572.png"
              alt="Brand Logo"
              className="w-full h-full object-contain animate-pulse"
              style={{ 
                filter: 'drop-shadow(0 0 20px rgba(55, 71, 157, 0.5))',
                animationDuration: '3s' 
              }}
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            
            {/* Fallback logo */}
            <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-2xl" style={{display: 'none', background: 'linear-gradient(135deg, #37479d, #ec1d25)'}}>
              <span className="animate-pulse">ERP</span>
            </div>
          </div>

          {/* Floating elements around logo */}
          <div className="absolute top-2 -right-2 w-3 h-3 rounded-full animate-bounce opacity-60" style={{animationDelay: '0.5s', backgroundColor: '#37479d'}}></div>
          <div className="absolute -bottom-1 -left-2 w-2 h-2 rounded-full animate-bounce opacity-60" style={{animationDelay: '1s', backgroundColor: '#ec1d25'}}></div>
          <div className="absolute top-6 -left-3 w-1 h-1 rounded-full animate-bounce opacity-60" style={{animationDelay: '1.5s', backgroundColor: '#37479d'}}></div>
        </div>

        {/* Loading message with typewriter effect */}
        <div className="text-center space-y-2">
          <h2 className={`${messageSizes[size]} font-semibold text-gray-700 animate-pulse`}>
            {message}
          </h2>
          
          {/* Animated dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 rounded-full animate-bounce" style={{animationDelay: '0s', backgroundColor: '#37479d'}}></div>
            <div className="w-2 h-2 rounded-full animate-bounce" style={{animationDelay: '0.3s', backgroundColor: '#ec1d25'}}></div>
            <div className="w-2 h-2 rounded-full animate-bounce" style={{animationDelay: '0.6s', backgroundColor: '#37479d'}}></div>
          </div>

          {/* Progress percentage */}
          {showProgress && (
            <div className="text-sm text-gray-500 font-medium animate-fade-in">
              {Math.round(progress)}% Complete
            </div>
          )}
        </div>

        {/* Bottom decorative wave */}
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
          <svg width="200" height="20" viewBox="0 0 200 20" className="animate-pulse">
            <path
              d="M0,10 Q50,0 100,10 T200,10"
              stroke="#37479d"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          </svg>
        </div>
      </div>

      {/* Additional CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

// Preset configurations for different use cases
export const FullScreenLoader = ({ message = "Loading Application..." }) => (
  <BrandedLoader message={message} size="xlarge" />
);

export const ProgressLoader = ({ message = "Processing...", progress = 0 }) => (
  <BrandedLoader message={message} size="large" showProgress={true} progress={progress} />
);

export const CompactLoader = ({ message = "Loading..." }) => (
  <BrandedLoader message={message} size="medium" />
);

export const MiniLoader = () => (
  <div className="flex items-center justify-center p-4">
    <BrandedLoader message="" size="small" />
  </div>
);

export default BrandedLoader;