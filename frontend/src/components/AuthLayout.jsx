import '../styles/Auth.css';

function AuthLayout({ children, pageClass = '' }) {
  return (
    <main className={`auth-page ${pageClass}`.trim()}>
      <section className="auth-card" aria-label="Formulário de autenticação">
        {children}
      </section>
    </main>
  );
}

export default AuthLayout;
