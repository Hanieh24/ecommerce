import { useCallback, useEffect, useState } from 'react';
import FormMessage from '../components/FormMessage';
import ProductCard from '../components/ProductCard';
import { addCartItem } from '../services/cartApi';
import { getSession } from '../services/authApi';
import { getProductById, getProducts } from '../services/productApi';
import { formatCurrency } from '../utils/format';
import { setPendingCartItem, setPostLoginRedirect } from '../utils/authRedirect';
import '../styles/Products.css';

function normalizeProducts(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data.products || data.productos || data.produtos || [];
}

function Products({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

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
      setQuantity(1);
      setMessage('');
      setMessageType('');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleAddToCart() {
    if (!selectedProduct) {
      return;
    }

    const { token } = getSession();

    if (!token) {
      setPendingCartItem(selectedProduct.id, Number(quantity));
      setPostLoginRedirect('/cart');
      setMessage('Faça login ou cadastre-se para adicionar fragrâncias ao carrinho.');
      setMessageType('error');
      onNavigate('/cadastro');
      return;
    }

    setAddingToCart(true);
    setMessage('Adicionando ao carrinho...');
    setMessageType('');

    try {
      await addCartItem(selectedProduct.id, Number(quantity));
      setMessage('Perfume adicionado ao carrinho.');
      setMessageType('success');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <main className="products-page">
      <section className="products-header">
        <div>
          <span className="arabic-kicker" lang="ar">لطافة</span>
          <h1>Fragrâncias árabes Lattaffa</h1>
          <p>Explore perfumes com presença marcante, notas de oud, âmbar e musk.</p>
        </div>
        <button type="button" onClick={() => onNavigate('/cart')}>
          Ver carrinho
        </button>
      </section>

      <section className="products-grid public-products-grid">
        <div className="products-panel">
          <div className="panel-header">
            <h2>Lista de fragrâncias</h2>
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
            <>
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
              <div className="detail-cart-actions">
                <label htmlFor="detailQuantity">
                  Quantidade
                  <input
                    id="detailQuantity"
                    min="1"
                    max={selectedProduct.stock}
                    type="number"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </label>
                <button
                  className="product-primary"
                  type="button"
                  disabled={addingToCart || Number(selectedProduct.stock) <= 0}
                  onClick={handleAddToCart}
                >
                  {addingToCart ? 'Adicionando...' : 'Adicionar ao carrinho'}
                </button>
              </div>
            </>
          ) : (
            <p className="empty-state">Selecione uma fragrância para ver os detalhes.</p>
          )}
        </aside>
      </section>
    </main>
  );
}

export default Products;
