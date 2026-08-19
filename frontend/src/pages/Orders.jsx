import { useCallback, useEffect, useState } from 'react';
import FormMessage from '../components/FormMessage';
import { confirmOrderReceived, getOrders } from '../services/orderApi';
import { formatCurrency } from '../utils/format';
import '../styles/Products.css';

function normalizeOrders(data) {
  return data.orders || [];
}

function Orders({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(async function loadOrders() {
    setLoading(true);

    try {
      const data = await getOrders();
      setOrders(normalizeOrders(data));
      setMessage('');
      setMessageType('');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadOrders();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadOrders]);

  async function handleReceived(orderId) {
    setUpdatingId(orderId);

    try {
      await confirmOrderReceived(orderId);
      setMessage('Pedido marcado como recebido.');
      setMessageType('success');
      await loadOrders();
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="products-page">
      <section className="products-header">
        <div>
          <h1>Meus pedidos</h1>
          <p>Acompanhe o status de todos os seus pedidos.</p>
        </div>
        <button type="button" onClick={() => onNavigate('/products')}>
          Comprar mais
        </button>
      </section>

      <section className="products-panel orders-panel">
        <div className="panel-header">
          <h2>Histórico</h2>
          <button type="button" onClick={loadOrders} disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>

        <FormMessage message={message} type={messageType} />

        {loading ? (
          <p className="empty-state">Carregando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="empty-state">Nenhum pedido encontrado.</p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-header">
                  <div>
                    <h3>Pedido #{order.id}</h3>
                    <p>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span>{order.status}</span>
                </div>

                <dl>
                  <div>
                    <dt>Fragrâncias</dt>
                    <dd>{formatCurrency(order.subtotal)}</dd>
                  </div>
                  <div>
                    <dt>Entrega</dt>
                    <dd>{formatCurrency(order.deliveryFee)}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatCurrency(order.total)}</dd>
                  </div>
                  {order.status === 'Enviado' && order.trackingCode ? (
                    <div>
                      <dt>Código de postagem</dt>
                      <dd>{order.trackingCode}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="order-items">
                  {order.items?.map((item) => (
                    <p key={item.productId}>
                      {item.quantity}x {item.name}
                    </p>
                  ))}
                </div>

                {order.status === 'Enviado' ? (
                  <div className="order-actions">
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => handleReceived(order.id)}
                    >
                      Recebido
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Orders;
