import { useEffect, useState } from 'react'
import AdminOnly from './components/AdminOnly'
import AdminDashboard from './pages/AdminDashboard'
import AdminOrders from './pages/AdminOrders'
import AdminProductCreate from './pages/AdminProductCreate'
import AdminProductEdit from './pages/AdminProductEdit'
import AdminProducts from './pages/AdminProducts'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Register from './pages/Register'
import SiteLayout from './components/SiteLayout'
import './App.css'

const routes = {
  '/login': 'login',
  '/cadastro': 'register',
  '/register': 'register',
  '/products': 'products',
  '/produtos': 'products',
  '/cart': 'cart',
  '/carrinho': 'cart',
  '/orders': 'orders',
  '/pedidos': 'orders',
  '/admin': 'adminDashboard',
  '/admin/dashboard': 'adminDashboard',
  '/admin/painel': 'adminDashboard',
  '/admin/orders': 'adminOrders',
  '/admin/pedidos': 'adminOrders',
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
    name: routes[path] || 'products',
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
    return (
      <SiteLayout onNavigate={navigate}>
        <Register onNavigate={navigate} />
      </SiteLayout>
    )
  }

  if (page.name === 'products') {
    return (
      <SiteLayout onNavigate={navigate}>
        <Products onNavigate={navigate} />
      </SiteLayout>
    )
  }

  if (page.name === 'cart') {
    return (
      <SiteLayout onNavigate={navigate}>
        <Cart onNavigate={navigate} />
      </SiteLayout>
    )
  }

  if (page.name === 'orders') {
    return (
      <SiteLayout onNavigate={navigate}>
        <Orders onNavigate={navigate} />
      </SiteLayout>
    )
  }

  if (page.name === 'adminDashboard') {
    return (
      <SiteLayout onNavigate={navigate}>
        <AdminOnly onNavigate={navigate}>
          <AdminDashboard onNavigate={navigate} />
        </AdminOnly>
      </SiteLayout>
    )
  }

  if (page.name === 'adminProductCreate') {
    return (
      <SiteLayout onNavigate={navigate}>
        <AdminOnly onNavigate={navigate}>
          <AdminProductCreate onNavigate={navigate} />
        </AdminOnly>
      </SiteLayout>
    )
  }

  if (page.name === 'adminOrders') {
    return (
      <SiteLayout onNavigate={navigate}>
        <AdminOnly onNavigate={navigate}>
          <AdminOrders onNavigate={navigate} />
        </AdminOnly>
      </SiteLayout>
    )
  }

  if (page.name === 'adminProducts') {
    return (
      <SiteLayout onNavigate={navigate}>
        <AdminOnly onNavigate={navigate}>
          <AdminProducts onNavigate={navigate} />
        </AdminOnly>
      </SiteLayout>
    )
  }

  if (page.name === 'adminProductEdit') {
    return (
      <SiteLayout onNavigate={navigate}>
        <AdminOnly onNavigate={navigate}>
          <AdminProductEdit onNavigate={navigate} productId={page.productId} />
        </AdminOnly>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout onNavigate={navigate}>
      <Login onNavigate={navigate} />
    </SiteLayout>
  )
}

export default App
