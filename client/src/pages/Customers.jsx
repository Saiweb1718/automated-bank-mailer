import { useState, useEffect } from 'react';
import { api } from '../api';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [sending, setSending] = useState({});

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const res = await api.getCustomers();
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function viewCustomer(id) {
    setSelected(id);
    try {
      const res = await api.getCustomer(id);
      setDetail(res.data);
    } catch (err) {
      console.error('Failed to load customer:', err);
    }
  }

  async function sendBalance(customerId, accountId, e) {
    e.stopPropagation();
    const key = `${customerId}-${accountId}-balance`;
    setSending(prev => ({ ...prev, [key]: true }));
    try {
      await api.sendBalanceEmail(customerId, accountId);
      await api.processQueue();
      alert('Balance email sent and processed!');
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setSending(prev => ({ ...prev, [key]: false }));
    }
  }

  async function sendSummary(customerId, accountId, e) {
    e.stopPropagation();
    const key = `${customerId}-${accountId}-summary`;
    setSending(prev => ({ ...prev, [key]: true }));
    try {
      await api.sendSummaryEmail(customerId, accountId);
      await api.processQueue();
      alert('Transaction summary email sent and processed!');
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally {
      setSending(prev => ({ ...prev, [key]: false }));
    }
  }

  if (loading) return <div className="loading">Loading customers...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <p>Manage customers and trigger email notifications</p>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: selected ? '0 0 45%' : '1' }}>
          <div className="card">
            <div className="card-header">
              <h3>All Customers ({customers.length})</h3>
            </div>
            <div className="card-body table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Accounts</th>
                    <th>Total Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c.customer_id}
                      onClick={() => viewCustomer(c.customer_id)}
                      style={{ cursor: 'pointer', background: selected === c.customer_id ? 'var(--accent-glow)' : undefined }}
                    >
                      <td><strong>{c.first_name} {c.last_name}</strong></td>
                      <td className="mono">{c.email}</td>
                      <td>{c.account_count}</td>
                      <td className="mono">₹{parseFloat(c.total_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selected && detail && (
          <div style={{ flex: '1' }}>
            <div className="card mb-md">
              <div className="card-header flex-between">
                <h3>{detail.first_name} {detail.last_name}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(null); setDetail(null); }}>✕ Close</button>
              </div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div><span className="text-muted">Email:</span><br /><span className="mono">{detail.email}</span></div>
                  <div><span className="text-muted">Phone:</span><br />{detail.phone || '—'}</div>
                  <div><span className="text-muted">Status:</span><br /><span className={`badge ${detail.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{detail.status}</span></div>
                  <div><span className="text-muted">Verified:</span><br />{detail.email_verified ? '✅ Yes' : '❌ No'}</div>
                </div>

                <h4 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '14px' }}>Accounts</h4>
                {detail.accounts?.map((acc) => (
                  <div key={acc.account_id} style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px',
                    marginBottom: '10px'
                  }}>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <span className="mono" style={{ fontWeight: 600 }}>{acc.account_number}</span>
                      <span className={`badge ${acc.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{acc.status}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      {acc.account_type.toUpperCase()} • {acc.currency} {parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => sendBalance(detail.customer_id, acc.account_id, e)}
                        disabled={sending[`${detail.customer_id}-${acc.account_id}-balance`]}
                      >
                        {sending[`${detail.customer_id}-${acc.account_id}-balance`] ? '⏳' : '💰'} Balance Email
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => sendSummary(detail.customer_id, acc.account_id, e)}
                        disabled={sending[`${detail.customer_id}-${acc.account_id}-summary`]}
                      >
                        {sending[`${detail.customer_id}-${acc.account_id}-summary`] ? '⏳' : '📋'} Summary Email
                      </button>
                    </div>
                  </div>
                ))}

                <h4 style={{ marginTop: '20px', marginBottom: '12px', fontSize: '14px' }}>Email Preferences</h4>
                <div style={{ fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>{detail.daily_summary ? '✅' : '❌'} Daily Summary</div>
                  <div>{detail.weekly_summary ? '✅' : '❌'} Weekly Summary</div>
                  <div>{detail.monthly_summary ? '✅' : '❌'} Monthly Summary</div>
                  <div>{detail.transaction_alerts ? '✅' : '❌'} Transaction Alerts</div>
                  <div>{detail.low_balance_alerts ? '✅' : '❌'} Low Balance Alerts</div>
                  <div className="text-muted">Threshold: ₹{detail.low_balance_threshold}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
