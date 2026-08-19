import { useCallback, useEffect, useState } from 'react';
import FormMessage from '../components/FormMessage';
import ProductCard from '../components/ProductCard';
import { deleteProduct, getProductById, getProducts } from '../services/productApi';
import '../styles/Products.css';

function normalizeProducts(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data.products || data.productos || data.produtos || [];
}

function AdminProducts({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = useCallback(async function loadProducts() {
    setLoadingProducts(true);

    try {
      const data = await getProducts();
      setProducts(normalizeProducts(data));
      setMessage('');
      setMessageType('');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadProducts();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadProducts]);

  async function handleSelectProduct(id) {
    try {
      const data = await getProductById(id);
      setSelectedProduct(data.product || data);
      setMessage('');
      setMessageType('');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    }
  }

  async function handleDeleteProduct(id) {
    setDeletingId(id);
    setMessage('Removendo perfume...');
    setMessageType('');

    try {
      await deleteProduct(id);
      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== id));
      setSelectedProduct((currentProduct) => (currentProduct?.id === id ? null : currentProduct));
      setMessage('Perfume removido com sucesso.');
      setMessageType('success');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="products-page">
      <section className="products-header">
        <div>
          <h1>Gerenciar fragrâncias</h1>
          <p>Edite ou remova perfumes cadastrados.</p>
        </div>
        <button type="button" onClick={() => onNavigate('/admin/products/new')}>
          Novo perfume
        </button>
      </section>

      <section className="products-grid public-products-grid">
        <div className="products-panel">
          <div className="panel-header">
            <h2>Fragrâncias cadastradas</h2>
            <button type="button" onClick={loadProducts} disabled={loadingProducts}>
              {loadingProducts ? 'Carregando...' : 'Atualizar'}
            </button>
          </div>

          <FormMessage message={message} type={messageType} />

          {loadingProducts ? (
            <p className="empty-state">Carregando fragrâncias...</p>
          ) : products.length === 0 ? (
            <p className="empty-state">Nenhuma fragrância cadastrada.</p>
          ) : (
            <div className="product-list">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedProduct?.id === product.id}
                  onSelect={handleSelectProduct}
                  onEdit={(id) => onNavigate(`/admin/products/${id}/edit`)}
                  onDelete={handleDeleteProduct}
                  deleting={deletingId === product.id}
                  showAdminActions
                />
              ))}
            </div>
          )}
        </div>

        <aside className="products-panel product-detail">
          <div className="panel-header">
            <h2>Resumo</h2>
          </div>

          {selectedProduct ? (
            <dl>
              <div>
                <dt>Nome</dt>
                <dd>{selectedProduct.name}</dd>
              </div>
              <div>
                <dt>Estoque</dt>
                <dd>{selectedProduct.stock}</dd>
              </div>
              <div>
                <dt>Descrição</dt>
                <dd>{selectedProduct.description || 'Sem descrição cadastrada.'}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty-state">Selecione uma fragrância para ver o resumo.</p>
          )}
        </aside>
      </section>
    </main>
  );
}

export default AdminProducts;
