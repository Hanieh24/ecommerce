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

function buildProductBody(product) {
  if (product.imageFile) {
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description || '');
    formData.append('price', product.price);
    formData.append('stock', product.stock);
    formData.append('imgUrl', product.imgUrl || '');
    formData.append('image', product.imageFile);

    return {
      body: formData,
      headers: {},
    };
  }

  return {
    body: JSON.stringify(product),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

export function getProducts() {
  return request('/products');
}

export function getProductById(id) {
  return request(`/products/${id}`);
}

export function createProduct(product) {
  const productBody = buildProductBody(product);

  return request('/products', {
    method: 'POST',
    headers: productBody.headers,
    body: productBody.body,
  });
}

export function updateProduct(id, product) {
  const productBody = buildProductBody(product);

  return request(`/products/${id}`, {
    method: 'PUT',
    headers: productBody.headers,
    body: productBody.body,
  });
}

export function deleteProduct(id) {
  return request(`/products/${id}`, {
    method: 'DELETE',
  });
}
