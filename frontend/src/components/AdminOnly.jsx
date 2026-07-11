import { getSession } from '../services/authApi';

function AdminOnly({ children, onNavigate }) {
  const { user } = getSession();

  if (!user?.isAdmin) {
    return (
      <main className="products-page">
        <section className="products-panel access-panel">
          <h1>Acesso restrito</h1>
          <p>Somente administradores podem acessar esta página.</p>
          <button type="button" onClick={() => onNavigate('/login')}>
            Fazer login
          </button>
        </section>
      </main>
    );
  }

  return children;
}

export default AdminOnly;
