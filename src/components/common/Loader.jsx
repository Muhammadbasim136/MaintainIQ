const Loader = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-purple-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-500 font-medium">{text}</p>
    </div>
  );
};

export default Loader;