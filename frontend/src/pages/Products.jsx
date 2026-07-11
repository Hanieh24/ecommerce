import { useCallback, useEffect, useState } from 'react';
import FormMessage from '../components/FormMessage';
import ProductCard from '../components/ProductCard';
import { getProductById, getProducts } from '../services/productApi';
import { formatCurrency } from '../utils/format';
import '../styles/Products.css';

function normalizeProducts(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data.products || data.productos || data.produtos || [];
}

function Products() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
    setLoadingDetail(true);

    try {
      const data = await getProductById(id);
      setSelectedProduct(data.product || data);
      setMessage('');
      setMessageType('');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <main className="products-page">
      <section className="products-header">
        <div>
          <h1>Produtos</h1>
          <p>Confira os produtos disponíveis na loja.</p>
        </div>
      </section>

      <section className="products-grid public-products-grid">
        <div className="products-panel">
          <div className="panel-header">
            <h2>Lista de produtos</h2>
            <button type="button" onClick={loadProducts} disabled={loadingProducts}>
              {loadingProducts ? 'Carregando...' : 'Atualizar'}
            </button>
          </div>

          <FormMessage message={message} type={messageType} />

          {loadingProducts ? (
            <p className="empty-state">Carregando produtos...</p>
          ) : products.length === 0 ? (
            <p className="empty-state">Nenhum produto cadastrado.</p>
          ) : (
            <div className="product-list">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedProduct?.id === product.id}
                  onSelect={handleSelectProduct}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="products-panel product-detail">
          <div className="panel-header">
            <h2>Detalhes</h2>
          </div>

          {loadingDetail ? (
            <p className="empty-state">Carregando detalhes...</p>
          ) : selectedProduct ? (
            <dl>
              <div>
                <dt>Nome</dt>
                <dd>{selectedProduct.name}</dd>
              </div>
              <div>
                <dt>Preço</dt>
                <dd>{formatCurrency(selectedProduct.price)}</dd>
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
            <p className="empty-state">Selecione um produto para ver os detalhes.</p>
          )}
        </aside>
      </section>
    </main>
  );
}

export default Products;
