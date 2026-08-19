import { useState } from 'react';
import AuthField from '../components/AuthField';
import AuthLayout from '../components/AuthLayout';
import FormMessage from '../components/FormMessage';
import { loginUser, saveSession } from '../services/authApi';

function Login({ onNavigate }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      setMessage('Preencha todos os campos obrigatórios.');
      setMessageType('error');
      return;
    }

    if (!form.email.includes('@')) {
      setMessage('Informe um email válido.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('Entrando...');
    setMessageType('');

    try {
      const data = await loginUser(form);
      saveSession(data);
      setMessage('Login realizado com sucesso.');
      setMessageType('success');
      const redirectPath = sessionStorage.getItem('postLoginRedirect');
      sessionStorage.removeItem('postLoginRedirect');

      if (data.user?.isAdmin) {
        onNavigate('/admin');
      } else {
        onNavigate(redirectPath || '/products');
      }
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout pageClass="login-page">
      <div className="auth-card-header">
        <span className="arabic-kicker" lang="ar">لطافة</span>
        <h1>Bem-vindo de volta</h1>
        <p>Entre para acompanhar suas fragrâncias Lattaffa.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={updateField}
        />

        <AuthField
          id="password"
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={updateField}
        />

        <FormMessage message={message} type={messageType} />

        <button className="auth-primary" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="auth-switch">
        <span>Ainda não tem conta?</span>
        <button type="button" onClick={() => onNavigate('/cadastro')}>
          Cadastre-se
        </button>
      </div>
    </AuthLayout>
  );
}

export default Login;
