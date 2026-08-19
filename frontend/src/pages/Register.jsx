import { useState } from 'react';
import AuthField from '../components/AuthField';
import AuthLayout from '../components/AuthLayout';
import FormMessage from '../components/FormMessage';
import { registerUser } from '../services/authApi';
import '../styles/Register.css';

const emptyForm = {
  name: '',
  email: '',
  cpf: '',
  phone: '',
  password: '',
};

function Register({ onNavigate }) {
  const [form, setForm] = useState(emptyForm);
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

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.cpf.trim() ||
      !form.phone.trim() ||
      !form.password.trim()
    ) {
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
    setMessage('Criando cadastro...');
    setMessageType('');

    try {
      const data = await registerUser(form);
      setMessage(data.message || 'Cadastro criado com sucesso.');
      setMessageType('success');
      setForm(emptyForm);
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout pageClass="register-page">
      <div className="auth-card-header">
        <span className="arabic-kicker" lang="ar">لطافة</span>
        <h1>Crie sua conta Lattaffa</h1>
      </div>

      <form className="auth-form register-form" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="name"
          label="Nome"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={updateField}
        />

        <AuthField
          id="registerEmail"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={updateField}
        />

        <AuthField
          id="cpf"
          label="CPF"
          name="cpf"
          autoComplete="off"
          maxLength="14"
          placeholder="000.000.000-00"
          value={form.cpf}
          onChange={updateField}
        />

        <AuthField
          id="phone"
          label="Telefone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength="20"
          placeholder="(00) 00000-0000"
          value={form.phone}
          onChange={updateField}
        />

        <AuthField
          id="registerPassword"
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={updateField}
          className="full-field"
        />

        <FormMessage message={message} type={messageType} />

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
    </AuthLayout>
  );
}

export default Register;
