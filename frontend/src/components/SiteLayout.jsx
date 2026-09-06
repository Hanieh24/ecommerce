import { clearSession, getSession } from '../services/authApi';
import { setPostLoginRedirect } from '../utils/authRedirect';
import '../App.css';

function SiteLayout({ children, onNavigate }) {
  const { user } = getSession();

  function handleLogout() {
    clearSession();
    onNavigate('/login');
  }

  function handleAuthNavigate(path) {
    const currentPath = window.location.pathname;

    if (!['/login', '/cadastro', '/register'].includes(currentPath)) {
      setPostLoginRedirect(currentPath);
    }

    onNavigate(path);
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
              <button type="button" onClick={() => handleAuthNavigate('/login')}>
                Entrar
              </button>
              <button type="button" onClick={() => handleAuthNavigate('/cadastro')}>
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
