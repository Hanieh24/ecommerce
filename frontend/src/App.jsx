import { useEffect, useState } from 'react'
import AdminOnly from './components/AdminOnly'
import AdminProductCreate from './pages/AdminProductCreate'
import AdminProductEdit from './pages/AdminProductEdit'
import AdminProducts from './pages/AdminProducts'
import Login from './pages/Login'
import Products from './pages/Products'
import Register from './pages/Register'
import './App.css'

const routes = {
  '/login': 'login',
  '/cadastro': 'register',
  '/register': 'register',
  '/products': 'products',
  '/produtos': 'products',
  '/admin/products': 'adminProducts',
  '/admin/produtos': 'adminProducts',
  '/admin/products/new': 'adminProductCreate',
  '/admin/produtos/novo': 'adminProductCreate',
}

function getCurrentPage() {
  const path = window.location.pathname
  const editMatch = path.match(/^\/admin\/products\/([^/]+)\/edit$/)

  if (editMatch) {
    return {
      name: 'adminProductEdit',
      productId: editMatch[1],
    }
  }

  return {
    name: routes[path] || 'login',
    productId: null,
  }
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

  if (page.name === 'register') {
    return <Register onNavigate={navigate} />
  }

  if (page.name === 'products') {
    return <Products />
  }

  if (page.name === 'adminProductCreate') {
    return (
      <AdminOnly onNavigate={navigate}>
        <AdminProductCreate onNavigate={navigate} />
      </AdminOnly>
    )
  }

  if (page.name === 'adminProducts') {
    return (
      <AdminOnly onNavigate={navigate}>
        <AdminProducts onNavigate={navigate} />
      </AdminOnly>
    )
  }

  if (page.name === 'adminProductEdit') {
    return (
      <AdminOnly onNavigate={navigate}>
        <AdminProductEdit onNavigate={navigate} productId={page.productId} />
      </AdminOnly>
    )
  }

  return <Login onNavigate={navigate} />
}

export default App
