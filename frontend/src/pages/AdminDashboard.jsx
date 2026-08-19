import '../styles/Products.css';

function AdminDashboard({ onNavigate }) {
  return (
    <main className="products-page">
      <section className="products-header">
        <div>
          <h1>Painel administrativo</h1>
          <p>Gerencie a curadoria, estoque e pedidos da Lattaffa perfumes.</p>
        </div>
      </section>

      <section className="admin-dashboard">
        <button type="button" onClick={() => onNavigate('/admin/products')}>
          <strong>Fragrâncias</strong>
          <span>Cadastrar, editar e remover perfumes.</span>
        </button>

        <button type="button" onClick={() => onNavigate('/admin/orders')}>
          <strong>Pedidos</strong>
          <span>Aceitar, rejeitar e acompanhar pedidos.</span>
        </button>
      </section>
    </main>
  );
}

export default AdminDashboard;
