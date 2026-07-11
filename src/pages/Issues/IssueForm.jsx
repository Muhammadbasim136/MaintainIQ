import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Button from '../../components/common/Button';
import './IssueForm.css';

const IssueForm = ({ onSubmit, onCancel, initialAssetId }) => {
  const [assets, setAssets] = useState([]);
  const [formData, setFormData] = useState({
    asset_id: initialAssetId || '',
    title: '',
    description: '',
    priority: 'medium',
    reported_by: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    const { data } = await supabase
      .from('assets')
      .select('id, name, code')
      .order('name');
    
    if (data) setAssets(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.asset_id || !formData.title) {
      alert('Asset and Title are required');
      return;
    }

    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="issue-form">
      <div className="form-group">
        <label><i className="fas fa-boxes"></i> Select Asset *</label>
        <select
          value={formData.asset_id}
          onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
          required
        >
          <option value="">Choose asset...</option>
          {assets.map(asset => (
            <option key={asset.id} value={asset.id}>
              {asset.name} ({asset.code})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><i className="fas fa-heading"></i> Issue Title *</label>
        <input
          type="text"
          placeholder="e.g., AC not cooling properly"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label><i className="fas fa-align-left"></i> Description</label>
        <textarea
          rows="4"
          placeholder="Describe the issue in detail..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        ></textarea>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label><i className="fas fa-exclamation-triangle"></i> Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="form-group">
          <label><i className="fas fa-user"></i> Reported By</label>
          <input
            type="text"
            placeholder="Your name"
            value={formData.reported_by}
            onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
          />
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" color="gray" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <><span className="spinner"></span> Submitting...</>
          ) : (
            <><i className="fas fa-paper-plane"></i> Report Issue</>
          )}
        </Button>
      </div>
    </form>
  );
};

export default IssueForm;