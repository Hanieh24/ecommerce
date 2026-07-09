import { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import FormMessage from '../components/FormMessage'
import { loginUser, saveSession } from '../services/authApi'
import '../styles/Login.css'

function Login({ onNavigate }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('Entrando...')
    setMessageType('')

    try {
      const data = await loginUser(form)
      saveSession(data)
      setMessage('Login realizado com sucesso.')
      setMessageType('success')
    } catch (error) {
      setMessage(error.message)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout pageClass="login-page">
      <div aria-label="Login">
        <div className="auth-card-header">
          <span className="auth-kicker">Ecommerce</span>
          <h1>Bem-vindo de volta</h1>
          <p>Entre na sua conta para continuar.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">
            Email
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>

          <label htmlFor="password">
            Senha
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={updateField}
              required
            />
          </label>

          <FormMessage message={message} type={messageType} />

          <button className="auth-primary" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-switch">
          <span>Ainda não tem conta?</span>
          <button type="button" onClick={() => onNavigate('/cadastro')}>
            Criar cadastro
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}

export default Login
