import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import LiveIssueCounter from '../../components/common/LiveIssueCounter';
import Loader from '../../components/common/Loader';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeIssues: 0,
    resolvedToday: 0,
    technicians: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [priorityIssues, setPriorityIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserData();

    const assetChannel = subscribeToAssets();
    const issueChannel = subscribeToIssues();

    fetchDashboardData();

    return () => {
      supabase.removeChannel(assetChannel);
      supabase.removeChannel(issueChannel);
    };
  }, []);

  const subscribeToAssets = () => {
    return supabase
      .channel('assets-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'assets' },
        () => fetchDashboardData()
      )
      .subscribe();
  };

  const subscribeToIssues = () => {
    return supabase
      .channel('issues-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        (payload) => {
          fetchDashboardData();
          if (payload.eventType === 'INSERT') {
            showBrowserNotification(payload.new);
          }
        }
      )
      .subscribe();
  };

  const showBrowserNotification = (issue) => {
    if (Notification.permission === 'granted') {
      new Notification('New Issue Reported!', {
        body: `${issue.title} - ${issue.priority} priority`,
        icon: '/favicon.svg',
      });
    }
  };

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchDashboardData = async () => {
    try {
      const { count: totalAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true });

      const { count: activeIssues } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'assigned', 'in-progress']);

      const today = new Date().toISOString().split('T')[0];
      const { count: resolvedToday } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('resolved_at', today);

      const { count: technicians } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'technician');

      setStats({
        totalAssets: totalAssets || 0,
        activeIssues: activeIssues || 0,
        resolvedToday: resolvedToday || 0,
        technicians: technicians || 0,
      });

      const { data: urgentIssues } = await supabase
        .from('issues')
        .select('*')
        .in('status', ['open', 'assigned', 'in-progress'])
        .in('priority', ['urgent', 'high'])
        .order('created_at', { ascending: false })
        .limit(5);

      setPriorityIssues(urgentIssues || []);

      const { data: activities } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activities) {
        setRecentActivity(activities.map(a => ({
          id: a.id,
          action: a.action,
          detail: a.detail,
          time: formatTimeAgo(a.created_at),
          icon: getActivityIcon(a.action),
          color: getActivityColor(a.action),
        })));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getActivityIcon = (action) => {
    if (action?.includes('Resolved')) return 'fa-check-circle';
    if (action?.includes('Reported')) return 'fa-exclamation-triangle';
    if (action?.includes('Registered')) return 'fa-plus-circle';
    if (action?.includes('Scheduled')) return 'fa-calendar-check';
    return 'fa-info-circle';
  };

  const getActivityColor = (action) => {
    if (action?.includes('Resolved')) return 'green';
    if (action?.includes('Reported')) return 'red';
    if (action?.includes('Registered')) return 'blue';
    return 'purple';
  };

  const activityColors = {
    green: { bg: '#d1fae5', text: '#10b981' },
    red: { bg: '#fee2e2', text: '#ef4444' },
    blue: { bg: '#dbeafe', text: '#3b82f6' },
    purple: { bg: '#ede9fe', text: '#8b5cf6' },
  };

  const quickActions = [
    { title: 'Add Asset', icon: 'fa-plus', color: '#7c3aed', bg: '#ede9fe', path: '/assets' },
    { title: 'Report Issue', icon: 'fa-exclamation-triangle', color: '#f59e0b', bg: '#fef3c7', path: '/issues' },
    { title: 'View History', icon: 'fa-history', color: '#3b82f6', bg: '#dbeafe', path: '/history' },
    { title: 'Asset Registry', icon: 'fa-boxes', color: '#10b981', bg: '#d1fae5', path: '/assets' },
  ];

  if (loading) return <Loader text="Loading dashboard..." />;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
          </h1>
          <p className="dashboard-subtitle">Here's what's happening with your assets today</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIssueCounter />
          <button className="refresh-btn" onClick={fetchDashboardData}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Assets" value={stats.totalAssets} icon="boxes" color="purple" />
        <StatCard title="Active Issues" value={stats.activeIssues} icon="exclamation-triangle" color="red" />
        <StatCard title="Resolved Today" value={stats.resolvedToday} icon="check-circle" color="green" />
        <StatCard title="Technicians" value={stats.technicians} icon="users" color="blue" />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-fire text-red-500"></i> Priority Issues
            </h2>
            <button className="view-all" onClick={() => navigate('/issues')}>View All</button>
          </div>
          <div className="priority-list">
            {priorityIssues.length > 0 ? priorityIssues.map(issue => (
              <div key={issue.id} className="priority-item">
                <span className="priority-badge" data-priority={issue.priority}>
                  {issue.priority}
                </span>
                <div className="priority-content">
                  <p className="priority-title">{issue.title}</p>
                  <p className="priority-meta">
                    <i className="fas fa-clock"></i>
                    {new Date(issue.created_at).toLocaleDateString()}
                    <span className="dot"></span>
                    {issue.status}
                  </p>
                </div>
              </div>
            )) : (
              <div className="priority-item">
                <p className="priority-meta" style={{ padding: '10px 0' }}>No urgent issues right now</p>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <i className="fas fa-history text-purple-500"></i> Recent Activity
            </h2>
            <button className="view-all" onClick={() => navigate('/history')}>View All</button>
          </div>
          <div className="activity-list">
            {recentActivity.length > 0 ? recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div
                  className="activity-icon"
                  style={{
                    background: activityColors[activity.color]?.bg,
                    color: activityColors[activity.color]?.text,
                  }}
                >
                  <i className={`fas ${activity.icon}`}></i>
                </div>
                <div className="activity-content">
                  <p className="activity-title">{activity.action}</p>
                  <p className="activity-detail">{activity.detail}</p>
                </div>
                <span className="activity-time">{activity.time}</span>
              </div>
            )) : (
              <div className="activity-item">
                <p className="activity-detail" style={{ padding: '10px 0' }}>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {quickActions.map(action => (
            <div
              key={action.title}
              className="quick-action-card"
              style={{ '--hover-color': action.color, '--hover-bg': action.bg }}
              onClick={() => navigate(action.path)}
            >
              <div className="quick-action-icon" style={{ background: action.bg, color: action.color }}>
                <i className={`fas ${action.icon}`}></i>
              </div>
              <span className="quick-action-title">{action.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
