const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível completar a ação.');
  }

  return data;
}

export function getAdminOrders() {
  return request('/admin/orders');
}

export function acceptOrder(id) {
  return request(`/admin/orders/${id}/accept`, {
    method: 'POST',
  });
}

export function rejectOrder(id) {
  return request(`/admin/orders/${id}/reject`, {
    method: 'POST',
  });
}

export function updateOrderStatus(id, status, trackingCode = '') {
  return request(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status,
      trackingCode,
    }),
  });
}
