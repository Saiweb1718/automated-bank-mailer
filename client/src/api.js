const BASE = '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  getDashboard: () => request('/emails/dashboard'),
  getCustomers: () => request('/customers'),
  getCustomer: (id) => request(`/customers/${id}`),
  updatePreferences: (id, prefs) => request(`/customers/${id}/preferences`, {
    method: 'PUT',
    body: JSON.stringify(prefs),
  }),
  getNotifications: (params = '') => request(`/emails/notifications${params ? '?' + params : ''}`),
  getCustomerNotifications: (id) => request(`/emails/notifications/${id}`),
  sendBalanceEmail: (customerId, accountId) => request(`/emails/send-balance/${customerId}/${accountId}`, { method: 'POST' }),
  sendSummaryEmail: (customerId, accountId) => request(`/emails/send-summary/${customerId}/${accountId}`, { method: 'POST' }),
  processQueue: () => request('/emails/process-queue', { method: 'POST' }),
  getTransactions: (accountId, params = '') => request(`/transactions/${accountId}/history${params ? '?' + params : ''}`),
};
