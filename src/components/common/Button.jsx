const Button = ({ children, color = 'purple', onClick, disabled, type = 'button' }) => {
  
  const colors = {
    purple: 'bg-purple-600 hover:bg-purple-700',
    red: 'bg-red-500 hover:bg-red-600',
    green: 'bg-green-500 hover:bg-green-600',
    gray: 'bg-gray-500 hover:bg-gray-600'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${colors[color]} text-white px-6 py-2.5 rounded-lg font-medium 
        transition-all duration-200 hover:shadow-lg disabled:opacity-50 
        disabled:cursor-not-allowed flex items-center gap-2`}
    >
      {children}
    </button>
  );
};

export default Button;
