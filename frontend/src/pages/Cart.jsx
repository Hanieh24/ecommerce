import { useCallback, useEffect, useState } from 'react';
import FormMessage from '../components/FormMessage';
import {
  createCheckout,
  getAddressTitles,
  getAddresses,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../services/cartApi';
import { getSession } from '../services/authApi';
import { setPostLoginRedirect } from '../utils/authRedirect';
import { formatCurrency } from '../utils/format';
import '../styles/Products.css';

const emptyAddress = {
  title: 'Casa',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  complemento: '',
};
const fallbackAddressTitles = [
  { id: 'fallback-casa', name: 'Casa' },
  { id: 'fallback-trabalho', name: 'Trabalho' },
  { id: 'fallback-outro', name: 'Outro' },
];

function normalizeCart(data) {
  return data.cart || {
    items: [],
    subtotal: 0,
    itemCount: 0,
  };
}

function Cart({ onNavigate }) {
  const [cart, setCart] = useState(() => normalizeCart({}));
  const [addressTitles, setAddressTitles] = useState(fallbackAddressTitles);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [address, setAddress] = useState(emptyAddress);
  const [cepAutofill, setCepAutofill] = useState({
    logradouro: false,
    bairro: false,
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const loadCart = useCallback(async function loadCart() {
    setLoading(true);

    try {
      const { token } = getSession();

      if (!token) {
        setPostLoginRedirect('/cart');
        onNavigate('/login');
        return;
      }

      const data = await getCart();
      setCart(normalizeCart(data));
      setMessage('');
      setMessageType('');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [onNavigate]);

  const loadAddressTitles = useCallback(async function loadAddressTitles() {
    try {
      const data = await getAddressTitles();
      const titles = data.titles || [];
      const nextTitles = titles.length > 0 ? titles : fallbackAddressTitles;
      setAddressTitles(nextTitles);

      setAddress((currentAddress) => ({
        ...currentAddress,
        title: nextTitles.some((title) => title.name === currentAddress.title)
          ? currentAddress.title
          : nextTitles[0].name,
      }));
    } catch {
      setAddressTitles(fallbackAddressTitles);
    }
  }, []);

  const loadAddresses = useCallback(async function loadAddresses() {
    try {
      const data = await getAddresses();
      const userAddresses = data.addresses || [];
      setAddresses(userAddresses);
      
      if (userAddresses.length === 0) {
        setShowAddressForm(true);
      } else {
        setSelectedAddressId(prevId => prevId || userAddresses[0].id);
      }
    } catch {
      setAddresses([]);
      setShowAddressForm(true);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadCart();
      loadAddressTitles();
      loadAddresses();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadAddressTitles, loadCart, loadAddresses]);

  function updateAddressField(event) {
    const { name, value } = event.target;
    setAddress((currentAddress) => ({
      ...currentAddress,
      [name]: value,
    }));
  }

  async function handleCepBlur() {
    const cep = address.cep.replace(/\D/g, '');

    if (cep.length !== 8) {
      return;
    }

    setLoadingCep(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setMessage('CEP não encontrado.');
        setMessageType('error');
        return;
      }

      setAddress((currentAddress) => ({
        ...currentAddress,
        cep,
        logradouro: data.logradouro || currentAddress.logradouro,
        bairro: data.bairro || currentAddress.bairro,
      }));
      setCepAutofill({
        logradouro: Boolean(data.logradouro),
        bairro: Boolean(data.bairro),
      });
      setMessage('Endereço encontrado pelo CEP. Complete o número e complemento.');
      setMessageType('success');
    } catch {
      setMessage('Não foi possível buscar o CEP agora.');
      setMessageType('error');
    } finally {
      setLoadingCep(false);
    }
  }

  async function handleUpdateQuantity(productId, quantity) {
    try {
      const data = await updateCartItem(productId, Number(quantity));
      setCart(normalizeCart(data));
      setMessage('Carrinho atualizado.');
      setMessageType('success');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    }
  }

  async function handleRemove(productId) {
    try {
      const data = await removeCartItem(productId);
      setCart(normalizeCart(data));
      setMessage('Perfume removido do carrinho.');
      setMessageType('success');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    }
  }

  async function handleCheckout() {
    const { token } = getSession();

    if (!token) {
      setPostLoginRedirect('/cart');
      onNavigate('/login');
      return;
    }

    setCheckingOut(true);
    setMessage('Preparando pagamento...');
    setMessageType('');

    try {
      let checkoutPayload = {};
      
      if (showAddressForm) {
        checkoutPayload = { address };
        console.log('Sending checkout with new address:', checkoutPayload);
      } else if (selectedAddressId) {
        checkoutPayload = { addressId: selectedAddressId };
        console.log('Sending checkout with existing address ID:', checkoutPayload);
      } else {
        console.log('Sending checkout without address:', checkoutPayload);
      }
      
      const data = await createCheckout(checkoutPayload);

      if (data.checkout?.url) {
        window.location.href = data.checkout.url;
        return;
      }

      setMessage('Pedido criado, mas o link do pagamento não foi recebido.');
      setMessageType('error');
    } catch (error) {
      console.error('Checkout error:', error);
      if (error.data?.addressRequired) {
        setShowAddressForm(true);
      }

      setMessage(error.message);
      setMessageType('error');
    } finally {
      setCheckingOut(false);
    }
  }

  const estimatedDeliveryFee = 15;
  const estimatedTotal = Number(cart.subtotal || 0) + estimatedDeliveryFee;

  return (
    <main className="products-page">
      <section className="products-header">
        <div>
          <h1>Carrinho</h1>
          <p>Revise suas fragrâncias antes de finalizar o pedido.</p>
        </div>
        <button type="button" onClick={() => onNavigate('/products')}>
          Continuar comprando
        </button>
      </section>

      <section className="products-grid public-products-grid">
        <div className="products-panel">
          <div className="panel-header">
            <h2>Fragrâncias no carrinho</h2>
            <button type="button" onClick={loadCart} disabled={loading}>
              {loading ? 'Carregando...' : 'Atualizar'}
            </button>
          </div>

          <FormMessage message={message} type={messageType} />

          {loading ? (
            <p className="empty-state">Carregando carrinho...</p>
          ) : cart.items.length === 0 ? (
            <p className="empty-state">Seu carrinho está vazio.</p>
          ) : (
            <div className="cart-list">
              {cart.items.map((item) => (
                <article className="cart-item" key={item.productId}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{formatCurrency(item.price)} cada</p>
                  </div>

                  <label htmlFor={`cartQuantity-${item.productId}`}>
                    Quantidade
                    <input
                      id={`cartQuantity-${item.productId}`}
                      min="0"
                      max={item.stock}
                      type="number"
                      value={item.quantity}
                      onChange={(event) => handleUpdateQuantity(item.productId, event.target.value)}
                    />
                  </label>

                  <strong>{formatCurrency(item.total)}</strong>

                  <button type="button" onClick={() => handleRemove(item.productId)}>
                    Remover
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="products-panel product-detail">
          <div className="panel-header">
            <h2>Resumo</h2>
          </div>

          <dl>
            <div>
              <dt>Fragrâncias</dt>
              <dd>{formatCurrency(cart.subtotal)}</dd>
            </div>
            <div>
              <dt>Entrega</dt>
              <dd>{formatCurrency(estimatedDeliveryFee)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatCurrency(estimatedTotal)}</dd>
            </div>
          </dl>

          {addresses.length > 0 && !showAddressForm ? (
            <div className="address-selection">
              <label htmlFor="addressSelect">
                Endereço de entrega
                <select 
                  id="addressSelect" 
                  value={selectedAddressId || ''} 
                  onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                >
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.title} - {addr.logradouro}, {addr.numero}
                    </option>
                  ))}
                </select>
              </label>
              <button 
                type="button" 
                onClick={() => setShowAddressForm(true)}
                className="secondary-button"
              >
                Usar novo endereço
              </button>
            </div>
          ) : null}

          {showAddressForm ? (
            <form className="checkout-address" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="addressTitle">
                Título
                <select id="addressTitle" name="title" value={address.title} onChange={updateAddressField}>
                  {addressTitles.map((title) => (
                    <option key={title.id} value={title.name}>
                      {title.name}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="addressCep">
                {loadingCep ? 'Buscando CEP...' : 'CEP'}
                <input
                  id="addressCep"
                  name="cep"
                  value={address.cep}
                  onBlur={handleCepBlur}
                  onChange={updateAddressField}
                />
              </label>
              <label htmlFor="addressStreet">
                Logradouro
                <input
                  id="addressStreet"
                  name="logradouro"
                  value={address.logradouro}
                  onChange={updateAddressField}
                  readOnly={cepAutofill.logradouro}
                />
              </label>
              <label htmlFor="addressNumber">
                Número
                <input id="addressNumber" name="numero" value={address.numero} onChange={updateAddressField} />
              </label>
              <label htmlFor="addressNeighborhood">
                Bairro
                <input
                  id="addressNeighborhood"
                  name="bairro"
                  value={address.bairro}
                  onChange={updateAddressField}
                  readOnly={cepAutofill.bairro}
                />
              </label>
              <label htmlFor="addressComplement">
                Complemento
                <input id="addressComplement" name="complemento" value={address.complemento} onChange={updateAddressField} />
              </label>
            </form>
          ) : null}

          <div className="checkout-actions">
            <button
              className="product-primary"
              type="button"
              disabled={checkingOut || cart.items.length === 0}
              onClick={handleCheckout}
            >
              {checkingOut ? 'Abrindo pagamento...' : 'Finalizar pedido'}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default Cart;
