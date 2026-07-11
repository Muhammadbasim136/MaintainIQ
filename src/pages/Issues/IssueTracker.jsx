import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import IssueForm from './IssueForm';
import './IssueTracker.css';

const IssueTracker = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchIssues();

    const channel = supabase
      .channel('issue-tracker-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        () => fetchIssues()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setIssues(data);
    setLoading(false);
  };

  const handleAddIssue = async (issueData) => {
    const { data } = await supabase
      .from('issues')
      .insert([{ ...issueData, status: 'open', created_at: new Date() }])
      .select()
      .single();
    
    if (data) {
      setIssues([data, ...issues]);
      setShowForm(false);
    }
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    const updates = { 
      status: newStatus, 
      updated_at: new Date() 
    };
    
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date();
    }

    const { data } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', issueId)
      .select()
      .single();

    if (data) {
      setIssues(issues.map(i => i.id === data.id ? data : i));
    }
  };

  const handleAssignTechnician = async (issueId, technicianId) => {
    const { data } = await supabase
      .from('issues')
      .update({ assigned_to: technicianId, status: 'assigned' })
      .eq('id', issueId)
      .select()
      .single();

    if (data) {
      setIssues(issues.map(i => i.id === data.id ? data : i));
    }
  };

  const columns = [
    { status: 'open', title: 'Reported', icon: 'fa-exclamation-circle', color: '#f59e0b' },
    { status: 'assigned', title: 'Assigned', icon: 'fa-user-check', color: '#3b82f6' },
    { status: 'in-progress', title: 'In Progress', icon: 'fa-spinner', color: '#8b5cf6' },
    { status: 'resolved', title: 'Resolved', icon: 'fa-check-circle', color: '#10b981' },
    { status: 'closed', title: 'Closed', icon: 'fa-archive', color: '#6b7280' }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getIssuesByStatus = (status) => {
    return issues.filter(issue => issue.status === status);
  };

  if (loading) return <Loader text="Loading issues..." />;

  return (
    <div className="issue-container">
      
      {/* Header */}
      <div className="issue-header">
        <div>
          <h1 className="issue-title">Issue Tracker</h1>
          <p className="issue-subtitle">Manage and track all maintenance issues</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i> Report Issue
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {columns.map(column => (
          <div key={column.status} className="kanban-column">
            <div className="column-header" style={{ borderTopColor: column.color }}>
              <i className={`fas ${column.icon}`} style={{ color: column.color }}></i>
              <span className="column-title">{column.title}</span>
              <span className="column-count">{getIssuesByStatus(column.status).length}</span>
            </div>

            <div className="column-cards">
              {getIssuesByStatus(column.status).map(issue => (
                <div 
                  key={issue.id} 
                  className="issue-card"
                  onClick={() => {
                    setSelectedIssue(issue);
                    setShowDetail(true);
                  }}
                >
                  <div className="issue-card-header">
                    <Badge text={issue.priority} type={getPriorityColor(issue.priority)} />
                    {issue.assigned_to && (
                      <span className="assigned-badge">
                        <i className="fas fa-user"></i>
                      </span>
                    )}
                  </div>
                  
                  <h4 className="issue-card-title">{issue.title}</h4>
                  
                  <p className="issue-card-desc">
                    {issue.description?.substring(0, 80)}
                    {issue.description?.length > 80 ? '...' : ''}
                  </p>

                  <div className="issue-card-footer">
                    <span className="issue-meta">
                      <i className="fas fa-boxes"></i>
                      {issue.asset_id?.substring(0, 8) || 'N/A'}
                    </span>
                    <span className="issue-meta">
                      <i className="fas fa-clock"></i>
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="issue-card-actions" onClick={(e) => e.stopPropagation()}>
                    {column.status === 'open' && (
                      <button 
                        className="action-btn assign"
                        onClick={() => handleAssignTechnician(issue.id, null)}
                      >
                        <i className="fas fa-user-plus"></i> Assign
                      </button>
                    )}
                    {column.status === 'assigned' && (
                      <button 
                        className="action-btn progress"
                        onClick={() => handleUpdateStatus(issue.id, 'in-progress')}
                      >
                        <i className="fas fa-play"></i> Start
                      </button>
                    )}
                    {column.status === 'in-progress' && (
                      <button 
                        className="action-btn resolve"
                        onClick={() => handleUpdateStatus(issue.id, 'resolved')}
                      >
                        <i className="fas fa-check"></i> Resolve
                      </button>
                    )}
                    {column.status === 'resolved' && (
                      <button 
                        className="action-btn close"
                        onClick={() => handleUpdateStatus(issue.id, 'closed')}
                      >
                        <i className="fas fa-archive"></i> Close
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {getIssuesByStatus(column.status).length === 0 && (
                <div className="empty-column">
                  <i className="fas fa-inbox"></i>
                  <p>No issues</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Report Issue Modal */}
      <Modal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)}
        title="Report New Issue"
      >
        <IssueForm 
          onSubmit={handleAddIssue}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Issue Detail Modal */}
      <Modal 
        isOpen={showDetail} 
        onClose={() => setShowDetail(false)}
        title="Issue Details"
      >
        {selectedIssue && (
          <div className="issue-detail">
            <div className="detail-header">
              <h3>{selectedIssue.title}</h3>
              <Badge text={selectedIssue.priority} type={getPriorityColor(selectedIssue.priority)} />
            </div>
            <p className="detail-desc">{selectedIssue.description || 'No description'}</p>
            <div className="detail-meta">
              <div className="meta-row">
                <span>Status:</span>
                <Badge text={selectedIssue.status} type="info" />
              </div>
              <div className="meta-row">
                <span>Reported:</span>
                <span>{new Date(selectedIssue.created_at).toLocaleString()}</span>
              </div>
              {selectedIssue.assigned_to && (
                <div className="meta-row">
                  <span>Assigned To:</span>
                  <span>Technician #{selectedIssue.assigned_to?.substring(0, 8)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IssueTracker;