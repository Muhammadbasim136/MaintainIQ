import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import './AssetDetails.css';

const AssetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrExpanded, setQrExpanded] = useState(false);

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    const { data } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();
    
    setAsset(data);
    setLoading(false);
  };

  if (loading) return <Loader text="Loading asset details..." />;
  if (!asset) return <div className="p-6 text-center text-red-500">Asset not found!</div>;

  const publicUrl = `${window.location.origin}/asset/${asset.id}/public`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`;

  const getStatusType = (status) => {
    switch (status) {
      case 'Operational': return 'success';
      case 'Issue Reported': return 'warning';
      case 'Under Maintenance': return 'info';
      case 'Out of Service': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="asset-detail-container">
      
      {/* Back Button */}
      <button onClick={() => navigate('/assets')} className="back-btn">
        <i className="fas fa-arrow-left"></i> Back to Assets
      </button>

      <div className="asset-detail-grid">
        
        {/* Left - Asset Info */}
        <div className="asset-info-card">
          <div className="asset-detail-header">
            <h1>{asset.name}</h1>
            <Badge text={asset.status} type={getStatusType(asset.status)} />
          </div>

          <div className="asset-code-big">Code: #{asset.code}</div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Category</span>
              <span className="info-value">{asset.category || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Location</span>
              <span className="info-value">{asset.location || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Condition</span>
              <span className="info-value">{asset.condition || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Service</span>
              <span className="info-value">
                {asset.last_service_date 
                  ? new Date(asset.last_service_date).toLocaleDateString() 
                  : 'Not serviced yet'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Next Service</span>
              <span className="info-value">
                {asset.next_service_date 
                  ? new Date(asset.next_service_date).toLocaleDateString() 
                  : 'Not scheduled'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Added On</span>
              <span className="info-value">
                {new Date(asset.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right - QR Code */}
        <div className="qr-card">
          <h3>QR Code</h3>
          <p className="qr-subtitle">Scan to view public asset page</p>
          
          <div className={`qr-image-wrapper ${qrExpanded ? 'expanded' : ''}`}>
            <img src={qrCodeUrl} alt="Asset QR Code" className="qr-image" />
          </div>

          <div className="qr-actions">
            <button onClick={() => setQrExpanded(!qrExpanded)} className="qr-btn">
              <i className="fas fa-search-plus"></i>
              {qrExpanded ? 'Shrink' : 'Expand'}
            </button>
            <button onClick={() => window.open(qrCodeUrl, '_blank')} className="qr-btn">
              <i className="fas fa-download"></i> Download
            </button>
            <button onClick={() => window.open(publicUrl, '_blank')} className="qr-btn">
              <i className="fas fa-external-link-alt"></i> Open Public Page
            </button>
          </div>

          <div className="public-url-box">
            <p className="url-label">Public URL:</p>
            <div className="url-copy">
              <input type="text" value={publicUrl} readOnly />
              <button onClick={() => navigator.clipboard.writeText(publicUrl)}>
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssetDetails;