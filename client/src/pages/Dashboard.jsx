import { useState, useEffect } from 'react';
import { api } from '../api';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await api.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessQueue() {
    setProcessing(true);
    try {
      const res = await api.processQueue();
      alert(`Queue processed: ${res.data.successful} sent, ${res.data.failed} failed`);
      loadDashboard();
    } catch (err) {
      alert('Failed to process queue: ' + err.message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const stats = data?.stats || {};

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Dashboard</h1>
          <p>Banking email automation overview</p>
        </div>
        <button className="btn btn-primary" onClick={handleProcessQueue} disabled={processing}>
          {processing ? '⏳ Processing...' : '⚡ Process Email Queue'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-label">Active Customers</div>
          <div className="stat-value">{stats.total_customers || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏦</div>
          <div className="stat-label">Active Accounts</div>
          <div className="stat-value">{stats.total_accounts || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">Pending Emails</div>
          <div className="stat-value text-warning">{stats.pending_emails || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Sent Today</div>
          <div className="stat-value text-success">{stats.sent_today || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-label">Failed Emails</div>
          <div className="stat-value text-danger">{stats.failed_emails || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-label">Transactions Today</div>
          <div className="stat-value">{stats.transactions_today || 0}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Email Activity</h3>
          <span className="text-muted" style={{ fontSize: '12px' }}>Last 10 notifications</span>
        </div>
        <div className="card-body">
          <div className="table-wrapper">
            {data?.recentEmails?.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEmails.map((email) => (
                    <tr key={email.notification_id}>
                      <td>
                        <strong>{email.first_name} {email.last_name}</strong>
                        <br />
                        <span className="text-muted" style={{ fontSize: '12px' }}>{email.recipient_email}</span>
                      </td>
                      <td>
                        <span className="badge badge-info">{email.notification_type.replace(/_/g, ' ')}</span>
                      </td>
                      <td>
                        <StatusBadge status={email.status} />
                      </td>
                      <td className="text-muted" style={{ fontSize: '12px' }}>
                        {new Date(email.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No email activity yet. Send your first email from the Customers page.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    sent: { cls: 'badge-success', label: 'Sent' },
    pending: { cls: 'badge-warning', label: 'Pending' },
    failed: { cls: 'badge-danger', label: 'Failed' },
    retrying: { cls: 'badge-info', label: 'Retrying' },
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export default Dashboard;
