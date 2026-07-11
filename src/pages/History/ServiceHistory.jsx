import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import SearchBar from '../../components/common/SearchBar';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import './ServiceHistory.css';

const ServiceHistory = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel('service-history-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterActivities();
  }, [search, filter, activities]);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setActivities(data);
      setFilteredActivities(data);
    }
    setLoading(false);
  };

  const filterActivities = () => {
    let filtered = [...activities];

    if (search) {
      filtered = filtered.filter(a =>
        a.detail?.toLowerCase().includes(search.toLowerCase()) ||
        a.action?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filter !== 'all') {
      filtered = filtered.filter(a => a.action?.toLowerCase().includes(filter));
    }

    setFilteredActivities(filtered);
  };

  const getActionIcon = (action) => {
    if (action?.includes('Resolved')) return { icon: 'fa-check-circle', color: '#10b981', bg: '#d1fae5' };
    if (action?.includes('Reported')) return { icon: 'fa-exclamation-circle', color: '#f59e0b', bg: '#fef3c7' };
    if (action?.includes('Registered') || action?.includes('Added')) return { icon: 'fa-plus-circle', color: '#3b82f6', bg: '#dbeafe' };
    if (action?.includes('Assigned')) return { icon: 'fa-user-check', color: '#8b5cf6', bg: '#ede9fe' };
    if (action?.includes('Scheduled')) return { icon: 'fa-calendar-check', color: '#6366f1', bg: '#e0e7ff' };
    if (action?.includes('Updated') || action?.includes('Edited')) return { icon: 'fa-edit', color: '#6b7280', bg: '#f3f4f6' };
    return { icon: 'fa-info-circle', color: '#9ca3af', bg: '#f3f4f6' };
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filters = [
    { value: 'all', label: 'All Activity' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'reported', label: 'Reported' },
    { value: 'registered', label: 'Registered' },
    { value: 'assigned', label: 'Assigned' },
  ];

  if (loading) return <Loader text="Loading history..." />;

  return (
    <div className="history-container">
      
      {/* Header */}
      <div className="history-header">
        <div>
          <h1 className="history-title">Service History</h1>
          <p className="history-subtitle">Complete timeline of all maintenance activities</p>
        </div>
      </div>

      {/* Controls */}
      <div className="history-controls">
        <div className="search-wrapper">
          <SearchBar 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities..."
          />
        </div>
        <div className="filter-buttons">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {filteredActivities.length > 0 ? (
        <div className="timeline">
          {filteredActivities.map((activity, index) => {
            const { icon, color, bg } = getActionIcon(activity.action);
            
            return (
              <div key={activity.id || index} className="timeline-item">
                {/* Timeline Line */}
                <div className="timeline-line">
                  <div className="timeline-dot" style={{ background: color, boxShadow: `0 0 0 4px ${bg}` }}>
                    <i className={`fas ${icon}`} style={{ color: 'white', fontSize: '10px' }}></i>
                  </div>
                  {index < filteredActivities.length - 1 && (
                    <div className="timeline-connector"></div>
                  )}
                </div>

                {/* Timeline Content */}
                <div className="timeline-content">
                  <div className="timeline-card">
                    <div className="timeline-card-header">
                      <h3>{activity.action || 'Activity'}</h3>
                      <span className="timeline-time">
                        <i className="fas fa-clock"></i>
                        {formatDateTime(activity.created_at)}
                      </span>
                    </div>
                    
                    <p className="timeline-detail">{activity.detail || 'No details available'}</p>
                    
                    {activity.reference_type && (
                      <div className="timeline-meta">
                        <Badge text={activity.reference_type} type="info" />
                        <span className="timeline-ref">
                          Ref: {activity.reference_id?.substring(0, 8) || 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          icon="fa-history"
          title="No activity found"
          description={search ? 'Try different search terms' : 'Activities will appear here once actions are performed'}
        />
      )}
    </div>
  );
};

export default ServiceHistory;