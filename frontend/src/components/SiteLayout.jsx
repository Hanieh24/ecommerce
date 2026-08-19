import { clearSession, getSession } from '../services/authApi';
import '../App.css';

function SiteLayout({ children, onNavigate }) {
  const { user } = getSession();

  function handleLogout() {
    clearSession();
    onNavigate('/login');
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <button className="brand-button" type="button" onClick={() => onNavigate('/products')}>
          <span>Lattaffa perfumes</span>
          <small>لطافة</small>
        </button>

        <nav className="site-nav" aria-label="Navegação principal">
          <button type="button" onClick={() => onNavigate('/products')}>
            Fragrâncias
          </button>
          <button type="button" onClick={() => onNavigate('/cart')}>
            Carrinho
          </button>
          <button type="button" onClick={() => onNavigate('/orders')}>
            Meus pedidos
          </button>
          {user?.isAdmin ? (
            <button type="button" onClick={() => onNavigate('/admin')}>
              Admin
            </button>
          ) : null}
        </nav>

        <div className="site-session">
          {user ? (
            <>
              <span>{user.name}</span>
              <button type="button" onClick={handleLogout}>
                Sair
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => onNavigate('/login')}>
                Entrar
              </button>
              <button type="button" onClick={() => onNavigate('/cadastro')}>
                Cadastrar
              </button>
            </>
          )}
        </div>
      </header>

      <div className="site-content">{children}</div>

      <footer className="site-footer">
        <span>Lattaffa perfumes</span>
        <span>Fragrâncias árabes, pagamento seguro e acompanhamento em um só lugar.</span>
      </footer>
    </div>
  );
}

export default SiteLayout;
