import React from 'react';
import { ChevronLeft, LogOut, User, Settings } from 'lucide-react';
import { ANIMATION } from '../../../constants';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';

const ButtonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  info: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  ghost: 'text-blue-600 hover:bg-blue-50',
  back: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-500'
};

const ButtonSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-2 text-sm', 
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl'
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-${ANIMATION.FAST}
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
    ${ButtonSizes[size]}
    ${ButtonVariants[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={baseClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

// Specialized button components
export const BackButton = ({ onClick, text = 'Back', className = '' }) => (
  <Button 
    onClick={onClick}
    variant="back"
    icon={<ChevronLeft className="w-4 h-4" />}
    className={className}
  >
    {text}
  </Button>
);

export const LogoutButton = ({ className = "", variant = "button" }) => {
  const { logout, getUserDisplayInfo } = useAuth();
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const userInfo = getUserDisplayInfo();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  if (variant === "dropdown") {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
        >
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{userInfo?.name}</p>
            <p className="text-xs text-gray-500">{t(userInfo?.role)}</p>
          </div>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-200">
              <p className="font-medium text-gray-900">{userInfo?.name}</p>
              <p className="text-xs text-gray-400">{t(userInfo?.role)}</p>
            </div>

            <div className="py-1">
              <button
                onClick={() => setShowMenu(false)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t("settings")}
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? t("loading") : t("logout")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoggingOut}
      variant="danger"
      icon={<LogOut className="w-4 h-4" />}
      className={className}
    >
      {isLoggingOut ? t("loading") : t("logout")}
    </Button>
  );
};

export default Button;