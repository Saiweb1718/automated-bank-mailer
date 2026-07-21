import { useState, useEffect } from 'react';
import { api } from '../api';

function Emails() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const params = filter ? `status=${filter}` : '';
      const res = await api.getNotifications(params);
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessQueue() {
    setProcessing(true);
    try {
      const res = await api.processQueue();
      alert(`Processed: ${res.data.successful} sent, ${res.data.failed} failed out of ${res.data.total}`);
      loadNotifications();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Email Notifications</h1>
          <p>View and manage all email notifications</p>
        </div>
        <button className="btn btn-primary" onClick={handleProcessQueue} disabled={processing}>
          {processing ? '⏳ Processing...' : '⚡ Process Queue'}
        </button>
      </div>

      <div className="card">
        <div className="card-header flex-between">
          <h3>All Notifications ({notifications.length})</h3>
          <div className="filter-bar">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="retrying">Retrying</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={loadNotifications}>↻ Refresh</button>
          </div>
        </div>
        <div className="card-body table-wrapper">
          {loading ? (
            <div className="loading">Loading notifications...</div>
          ) : notifications.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Type</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Retries</th>
                  <th>Scheduled</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.notification_id}>
                    <td>
                      <strong>{n.first_name} {n.last_name}</strong>
                      <br />
                      <span className="text-muted" style={{ fontSize: '11px' }}>{n.recipient_email}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{n.notification_type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="truncate" title={n.subject}>{n.subject}</td>
                    <td><StatusBadge status={n.status} /></td>
                    <td className="mono">{n.retry_count || 0}</td>
                    <td className="text-muted" style={{ fontSize: '12px' }}>
                      {new Date(n.scheduled_at).toLocaleString()}
                    </td>
                    <td className="text-muted" style={{ fontSize: '12px' }}>
                      {n.sent_at ? new Date(n.sent_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>{filter ? `No ${filter} notifications found.` : 'No notifications yet.'}</p>
            </div>
          )}
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

export default Emails;
