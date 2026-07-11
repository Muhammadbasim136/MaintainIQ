import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import AssetForm from './AssetForm';
import './AssetRegistry.css';

const AssetRegistry = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    fetchAssets();

    const channel = supabase
      .channel('asset-registry-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'assets' },
        () => fetchAssets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterAssets();
  }, [search, statusFilter, assets]);

  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setAssets(data);
      setFilteredAssets(data);
    }
    setLoading(false);
  };

  const filterAssets = () => {
    let filtered = [...assets];

    // Search filter
    if (search) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(search.toLowerCase()) ||
        asset.code.toLowerCase().includes(search.toLowerCase()) ||
        asset.location?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }

    setFilteredAssets(filtered);
  };

  const handleAddAsset = async (assetData) => {
    const { data, error } = await supabase
      .from('assets')
      .insert([assetData])
      .select()
      .single();

    if (error) {
      console.error('Add asset failed:', error);
      alert(`Asset add nahi hua: ${error.message}`);
      return;
    }

    if (data) {
      setAssets([data, ...assets]);
      setShowForm(false);
    }
  };

  const handleEditAsset = async (assetData) => {
    const { data, error } = await supabase
      .from('assets')
      .update(assetData)
      .eq('id', selectedAsset.id)
      .select()
      .single();

    if (error) {
      console.error('Edit asset failed:', error);
      alert(`Asset update nahi hua: ${error.message}`);
      return;
    }

    if (data) {
      setAssets(assets.map(a => a.id === data.id ? data : a));
      setShowForm(false);
      setSelectedAsset(null);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) {
        console.error('Delete asset failed:', error);
        alert(`Asset delete nahi hua: ${error.message}`);
        return;
      }
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  const statuses = ['all', 'Operational', 'Issue Reported', 'Under Maintenance', 'Out of Service'];

  const getStatusType = (status) => {
    switch (status) {
      case 'Operational': return 'success';
      case 'Issue Reported': return 'warning';
      case 'Under Maintenance': return 'info';
      case 'Out of Service': return 'danger';
      default: return 'default';
    }
  };

  if (loading) return <Loader text="Loading assets..." />;

  return (
    <div className="asset-container">
      
      {/* Header */}
      <div className="asset-header">
        <div>
          <h1 className="asset-title">Asset Registry</h1>
          <p className="asset-subtitle">Manage all your physical assets and their QR codes</p>
        </div>
        <Button onClick={() => {
          setSelectedAsset(null);
          setShowForm(true);
        }}>
          <i className="fas fa-plus"></i> Add Asset
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="asset-controls">
        <div className="search-wrapper">
          <SearchBar 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by name, code, or location..."
          />
        </div>
        <div className="status-filters">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length > 0 ? (
        <div className="assets-grid">
          {filteredAssets.map(asset => (
            <div 
              key={asset.id} 
              className="asset-card"
              onClick={() => navigate(`/assets/${asset.id}`)}
            >
              <div className="asset-card-header">
                <div className="asset-code">#{asset.code}</div>
                <Badge text={asset.status} type={getStatusType(asset.status)} />
              </div>
              
              <h3 className="asset-name">{asset.name}</h3>
              
              <div className="asset-meta">
                <div className="meta-item">
                  <i className="fas fa-layer-group"></i>
                  {asset.category || 'Uncategorized'}
                </div>
                <div className="meta-item">
                  <i className="fas fa-map-marker-alt"></i>
                  {asset.location || 'No location'}
                </div>
                {asset.last_service_date && (
                  <div className="meta-item">
                    <i className="fas fa-calendar-check"></i>
                    Last Service: {new Date(asset.last_service_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="asset-card-actions" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="icon-btn"
                  onClick={() => {
                    setSelectedAsset(asset);
                    setShowForm(true);
                  }}
                  title="Edit"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className="icon-btn"
                  onClick={() => navigate(`/assets/${asset.id}`)}
                  title="View QR"
                >
                  <i className="fas fa-qrcode"></i>
                </button>
                <button 
                  className="icon-btn danger"
                  onClick={() => handleDeleteAsset(asset.id)}
                  title="Delete"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon="fa-boxes"
          title="No assets found"
          description={search ? 'Try different search terms' : 'Start by adding your first asset'}
          actionText="Add Asset"
          onAction={() => setShowForm(true)}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={showForm} 
        onClose={() => {
          setShowForm(false);
          setSelectedAsset(null);
        }}
        title={selectedAsset ? 'Edit Asset' : 'Add New Asset'}
      >
        <AssetForm 
          asset={selectedAsset}
          onSubmit={selectedAsset ? handleEditAsset : handleAddAsset}
          onCancel={() => {
            setShowForm(false);
            setSelectedAsset(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default AssetRegistry;