const postLoginRedirectKey = 'postLoginRedirect';
const pendingCartItemKey = 'pendingCartItem';

export function setPostLoginRedirect(path) {
  sessionStorage.setItem(postLoginRedirectKey, path);
}

export function getPostLoginRedirect(fallback = '/products') {
  return sessionStorage.getItem(postLoginRedirectKey) || fallback;
}

export function clearPostLoginRedirect() {
  sessionStorage.removeItem(postLoginRedirectKey);
}

export function setPendingCartItem(productId, quantity) {
  sessionStorage.setItem(pendingCartItemKey, JSON.stringify({
    productId,
    quantity,
  }));
}

export function consumePendingCartItem() {
  const value = sessionStorage.getItem(pendingCartItemKey);
  sessionStorage.removeItem(pendingCartItemKey);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
