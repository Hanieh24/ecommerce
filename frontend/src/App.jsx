import { useEffect, useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

const routes = {
  '/login': 'login',
  '/cadastro': 'register',
  '/register': 'register',
}

function getCurrentPage() {
  return routes[window.location.pathname] || 'login'
}

function App() {
  const [page, setPage] = useState(getCurrentPage)

  useEffect(() => {
    function handlePopState() {
      setPage(getCurrentPage())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(path) {
    window.history.pushState({}, '', path)
    setPage(getCurrentPage())
  }

  if (page === 'register') {
    return <Register onNavigate={navigate} />
  }

  return <Login onNavigate={navigate} />
}

export default App
