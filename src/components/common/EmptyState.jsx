import Button from './Button';

const EmptyState = ({ 
  icon = 'fa-inbox', 
  title = 'No Data Found', 
  description = 'There is nothing to show right now.',
  actionText,
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
        <i className={`fas ${icon} text-4xl text-purple-400`}></i>
      </div>
      <h3 className="text-xl font-bold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} color="purple">
          <i className="fas fa-plus mr-2"></i>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;