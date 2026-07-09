import '../styles/Auth.css'

function AuthLayout({ children, pageClass = '' }) {
  return (
    <main className={`auth-page ${pageClass}`}>
      <section className="auth-card">{children}</section>
    </main>
  )
}

export default AuthLayout
