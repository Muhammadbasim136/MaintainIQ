import { useState } from 'react';
import Button from '../../components/common/Button';

const AssetForm = ({ asset, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    code: asset?.code || '',
    category: asset?.category || '',
    location: asset?.location || '',
    status: asset?.status || 'Operational',
    condition: asset?.condition || 'Good'
  });
  const [loading, setLoading] = useState(false);

  const generateCode = () => {
    const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'AST';
    const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setFormData({ ...formData, code: `${prefix}-${number}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      alert('Name and Code are required');
      return;
    }
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  const categories = ['HVAC', 'Electronics', 'Furniture', 'Plumbing', 'Electrical', 'IT Equipment', 'Kitchen', 'Safety', 'Other'];

  return (
    <form onSubmit={handleSubmit} className="asset-form">
      <div className="form-group">
        <label><i className="fas fa-tag"></i> Asset Name *</label>
        <input
          type="text"
          placeholder="e.g., Conference Room AC Unit"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label><i className="fas fa-barcode"></i> Asset Code *</label>
        <div className="code-input-wrapper">
          <input
            type="text"
            placeholder="e.g., HVAC-0042"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
          <button type="button" onClick={generateCode} className="generate-btn">
            <i className="fas fa-sync-alt"></i> Generate
          </button>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label><i className="fas fa-layer-group"></i> Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label><i className="fas fa-map-marker-alt"></i> Location</label>
          <input
            type="text"
            placeholder="e.g., Building A, Floor 2"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label><i className="fas fa-info-circle"></i> Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="Operational">Operational</option>
            <option value="Issue Reported">Issue Reported</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Out of Service">Out of Service</option>
          </select>
        </div>

        <div className="form-group">
          <label><i className="fas fa-heart"></i> Condition</label>
          <select
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          >
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" color="gray" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : asset ? 'Update Asset' : 'Add Asset'}
        </Button>
      </div>
    </form>
  );
};

export default AssetForm;