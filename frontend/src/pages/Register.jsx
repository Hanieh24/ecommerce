import { useState } from 'react'
import { registerUser } from '../services/authApi'
import '../styles/Auth.css'
import '../styles/Register.css'

const emptyForm = {
  name: '',
  email: '',
  cpf: '',
  phone: '',
  password: '',
}

function Register({ onNavigate }) {
  const [form, setForm] = useState(emptyForm)
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
    setMessage('Criando cadastro...')
    setMessageType('')

    try {
      const data = await registerUser(form)
      setMessage(data.message || 'Cadastro criado com sucesso.')
      setMessageType('success')
      setForm(emptyForm)
    } catch (error) {
      setMessage(error.message)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page register-page">
      <section className="auth-visual" aria-label="Cadastro na loja">
        <div className="auth-brand">
          <span className="auth-kicker">Nova conta</span>
          <h1>Crie seu cadastro</h1>
          <p>Informe seus dados para testar o cadastro conectado ao backend.</p>
        </div>
      </section>

      <section className="auth-card register-card" aria-label="Cadastro">
        <div className="auth-card-header">
          <h2>Cadastro</h2>
          <p>Nome, email e senha são obrigatórios.</p>
        </div>

        <form className="auth-form register-form" onSubmit={handleSubmit}>
          <label htmlFor="name">
            Nome
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={updateField}
              required
            />
          </label>

          <label htmlFor="registerEmail">
            Email
            <input
              id="registerEmail"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>

          <label htmlFor="cpf">
            CPF
            <input
              id="cpf"
              name="cpf"
              type="text"
              autoComplete="off"
              maxLength="14"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={updateField}
            />
          </label>

          <label htmlFor="phone">
            Telefone
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength="20"
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={updateField}
            />
          </label>

          <label className="full-field" htmlFor="registerPassword">
            Senha
            <input
              id="registerPassword"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={updateField}
              required
            />
          </label>

          <p className={`auth-message ${messageType}`} aria-live="polite">
            {message}
          </p>

          <button className="auth-primary" type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-switch">
          <span>Já tem conta?</span>
          <button type="button" onClick={() => onNavigate('/login')}>
            Fazer login
          </button>
        </div>
      </section>
    </main>
  )
}

export default Register
