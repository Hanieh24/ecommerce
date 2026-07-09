const API_URL = import.meta.env.VITE_API_URL || ''

async function post(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível completar a ação.')
  }

  return data
}

export function loginUser(credentials) {
  return post('/auth/login', credentials)
}

export function registerUser(userData) {
  return post('/auth/register', userData)
}

export function saveSession(data) {
  localStorage.setItem('authToken', data.token)
  localStorage.setItem('authUser', JSON.stringify(data.user))
}

export function getSession() {
  return {
    token: localStorage.getItem('authToken'),
    user: JSON.parse(localStorage.getItem('authUser') || 'null'),
  }
}

export function clearSession() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('authUser')
}
