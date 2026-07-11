import { useState } from 'react';
import FormMessage from '../components/FormMessage';
import ProductForm from '../components/ProductForm';
import { createProduct } from '../services/productApi';
import '../styles/Products.css';

function AdminProductCreate({ onNavigate }) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreateProduct(product, resetForm) {
    if (!product.name.trim() || !product.price || !product.stock) {
      setMessage('Preencha nome, preço e estoque.');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('Salvando produto...');
    setMessageType('');

    try {
      await createProduct({
        ...product,
        price: Number(product.price),
        stock: Number(product.stock),
      });
      resetForm();
      setMessage('Produto cadastrado com sucesso.');
      setMessageType('success');
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
          <h1>Novo produto</h1>
          <p>Cadastre um produto para aparecer na loja.</p>
        </div>
        <button type="button" onClick={() => onNavigate('/admin/products')}>
          Gerenciar produtos
        </button>
      </section>

      <section className="products-panel form-page-panel">
        <div className="panel-header">
          <h2>Dados do produto</h2>
        </div>
        <FormMessage message={message} type={messageType} />
        <ProductForm buttonLabel="Cadastrar produto" loading={saving} onSubmit={handleCreateProduct} />
      </section>
    </main>
  );
}

export default AdminProductCreate;
