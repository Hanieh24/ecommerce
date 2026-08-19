import { useCallback, useEffect, useState } from 'react';
import FormMessage from '../components/FormMessage';
import ProductForm from '../components/ProductForm';
import { getProductById, updateProduct } from '../services/productApi';
import '../styles/Products.css';

function AdminProductEdit({ onNavigate, productId }) {
  const [product, setProduct] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProduct = useCallback(async function loadProduct() {
    setLoading(true);

    try {
      const data = await getProductById(productId);
      setProduct(data.product || data);
      setMessage('');
      setMessageType('');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadProduct();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadProduct]);

  async function handleUpdateProduct(formProduct) {
    if (!formProduct.name.trim() || !formProduct.price || !formProduct.stock) {
      setMessage('Preencha nome, preço e estoque.');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('Salvando alterações...');
    setMessageType('');

    try {
      await updateProduct(productId, {
        ...formProduct,
        price: Number(formProduct.price),
        stock: Number(formProduct.stock),
      });
      setMessage('Perfume atualizado com sucesso.');
      setMessageType('success');
      await loadProduct();
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="products-page">
      <section className="products-header">
        <div>
          <h1>Editar perfume</h1>
          <p>Atualize as informações da fragrância.</p>
        </div>
        <button type="button" onClick={() => onNavigate('/admin/products')}>
          Voltar para gerenciamento
        </button>
      </section>

      <section className="products-panel form-page-panel">
        <div className="panel-header">
          <h2>Dados da fragrância</h2>
        </div>
        <FormMessage message={message} type={messageType} />
        {loading ? (
          <p className="empty-state">Carregando fragrância...</p>
        ) : product ? (
          <ProductForm
            buttonLabel="Salvar alterações"
            key={product.id}
            initialProduct={product}
            loading={saving}
            onSubmit={handleUpdateProduct}
          />
        ) : (
          <p className="empty-state">Fragrância não encontrada.</p>
        )}
      </section>
    </main>
  );
}

export default AdminProductEdit;
