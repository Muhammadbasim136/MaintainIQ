import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabase';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import IssueForm from '../Issues/IssueForm';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import './PublicAssetPage.css';

const PublicAssetPage = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [recentIssues, setRecentIssues] = useState([]);

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    const { data: assetData } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();

    if (assetData) {
      setAsset(assetData);
      
      // Get recent issues for this asset
      const { data: issuesData } = await supabase
        .from('issues')
        .select('*')
        .eq('asset_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentIssues(issuesData || []);
    }

    setLoading(false);
  };

  const handleReportIssue = async (issueData) => {
    const { data } = await supabase
      .from('issues')
      .insert([{ ...issueData, asset_id: id, status: 'open' }])
      .select()
      .single();

    if (data) {
      setShowReportForm(false);
      setReportSuccess(true);
      fetchAsset(); // Refresh
      
      setTimeout(() => setReportSuccess(false), 5000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational': return 'success';
      case 'Issue Reported': return 'warning';
      case 'Under Maintenance': return 'info';
      case 'Out of Service': return 'danger';
      default: return 'default';
    }
  };

  if (loading) return <Loader text="Loading asset..." />;
  
  if (!asset) {
    return (
      <div className="public-error">
        <div className="error-icon">🔍</div>
        <h2>Asset Not Found</h2>
        <p>This asset does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="public-container">
      
      {/* Header Bar */}
      <div className="public-header">
        <div className="public-logo">
          <i className="fas fa-qrcode"></i>
          <span>MaintainIQ</span>
        </div>
      </div>

      {/* Asset Info Card */}
      <div className="public-card">
        <div className="public-asset-header">
          <div className="public-status">
            <span className={`status-indicator ${asset.status?.toLowerCase().replace(' ', '-')}`}></span>
            <Badge text={asset.status} type={getStatusColor(asset.status)} />
          </div>
          <h1>{asset.name}</h1>
          <p className="public-code">Asset Code: {asset.code}</p>
        </div>

        <div className="public-info-grid">
          <div className="public-info-item">
            <i className="fas fa-layer-group"></i>
            <div>
              <span className="info-label">Category</span>
              <span className="info-value">{asset.category || 'N/A'}</span>
            </div>
          </div>
          <div className="public-info-item">
            <i className="fas fa-map-marker-alt"></i>
            <div>
              <span className="info-label">Location</span>
              <span className="info-value">{asset.location || 'N/A'}</span>
            </div>
          </div>
          <div className="public-info-item">
            <i className="fas fa-heart"></i>
            <div>
              <span className="info-label">Condition</span>
              <span className="info-value">{asset.condition || 'N/A'}</span>
            </div>
          </div>
          <div className="public-info-item">
            <i className="fas fa-calendar-check"></i>
            <div>
              <span className="info-label">Last Serviced</span>
              <span className="info-value">
                {asset.last_service_date 
                  ? new Date(asset.last_service_date).toLocaleDateString() 
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Report Success */}
        {reportSuccess && (
          <div className="report-success">
            <i className="fas fa-check-circle"></i>
            Issue reported successfully! We'll look into it.
          </div>
        )}

        {/* Report Button */}
        <button 
          className="report-btn"
          onClick={() => setShowReportForm(true)}
        >
          <i className="fas fa-exclamation-triangle"></i>
          Report an Issue
        </button>
      </div>

      {/* Recent Issues */}
      {recentIssues.length > 0 && (
        <div className="public-card">
          <h3 className="recent-title">Recent Issues</h3>
          <div className="recent-list">
            {recentIssues.map(issue => (
              <div key={issue.id} className="recent-item">
                <div className="recent-header">
                  <span className="recent-issue-title">{issue.title}</span>
                  <Badge text={issue.status} type="info" />
                </div>
                <span className="recent-date">
                  {new Date(issue.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      <Modal 
        isOpen={showReportForm}
        onClose={() => setShowReportForm(false)}
        title="Report an Issue"
      >
        <IssueForm 
          onSubmit={handleReportIssue}
          onCancel={() => setShowReportForm(false)}
          initialAssetId={id}
        />
      </Modal>
    </div>
  );
};

export default PublicAssetPage;