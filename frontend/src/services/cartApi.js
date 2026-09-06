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
    const error = new Error(data.message || 'Não foi possível completar a ação.');
    error.data = data;
    throw error;
  }

  return data;
}

export function getCart() {
  return request('/cart');
}

export function getAddressTitles() {
  return request('/addresses/titles');
}

export function getAddresses() {
  return request('/addresses');
}

export function addCartItem(productId, quantity) {
  return request('/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      quantity,
    }),
  });
}

export function updateCartItem(productId, quantity) {
  return request(`/cart/items/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      quantity,
    }),
  });
}

export function removeCartItem(productId) {
  return request(`/cart/items/${productId}`, {
    method: 'DELETE',
  });
}

export function createCheckout(checkoutData = {}) {
  return request('/orders/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(checkoutData),
  });
}
