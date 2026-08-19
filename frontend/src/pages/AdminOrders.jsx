import { useCallback, useEffect, useState } from 'react';
import FormMessage from '../components/FormMessage';
import {
  acceptOrder,
  getAdminOrders,
  rejectOrder,
  updateOrderStatus,
} from '../services/adminOrderApi';
import { formatCurrency } from '../utils/format';
import '../styles/Products.css';

function normalizeOrders(data) {
  return data.orders || [];
}

function AdminOrders({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [trackingCodes, setTrackingCodes] = useState({});

  const loadOrders = useCallback(async function loadOrders() {
    setLoading(true);

    try {
      const data = await getAdminOrders();
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

  async function handleOrderAction(orderId, action) {
    setUpdatingId(orderId);

    try {
      await action(orderId);
      setMessage('Pedido atualizado com sucesso.');
      setMessageType('success');
      await loadOrders();
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleShipOrder(orderId) {
    setUpdatingId(orderId);

    try {
      await updateOrderStatus(orderId, 'Enviado', trackingCodes[orderId]);
      setMessage('Pedido marcado como enviado.');
      setMessageType('success');
      await loadOrders();
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setUpdatingId(null);
    }
  }

  function renderOrderCard(order) {
    const isPaid = order.status === 'Pago';
    const isSeparating = order.status === 'Em Separacao';
    const isShipped = order.status === 'Enviado';

    return (
      <article className="order-card admin-order-card" key={order.id}>
        <div className="order-card-header">
          <div>
            <h3>Pedido #{order.id}</h3>
            <p>{order.user?.name} - {order.user?.email}</p>
          </div>
          <span>{order.status}</span>
        </div>

        <dl>
          <div>
            <dt>Total</dt>
            <dd>{formatCurrency(order.total)}</dd>
          </div>
          <div>
            <dt>Endereço</dt>
            <dd>
              {order.address.logradouro}, {order.address.numero}
            </dd>
          </div>
          {isShipped && order.trackingCode ? (
            <div>
              <dt>Código</dt>
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

        {isPaid ? (
          <div className="admin-order-actions">
            <button
              type="button"
              disabled={updatingId === order.id}
              onClick={() => handleOrderAction(order.id, acceptOrder)}
            >
              Aceitar
            </button>
            <button
              className="danger"
              type="button"
              disabled={updatingId === order.id}
              onClick={() => handleOrderAction(order.id, rejectOrder)}
            >
              Rejeitar
            </button>
          </div>
        ) : null}

        {isSeparating ? (
          <div className="admin-order-actions">
            <label htmlFor={`tracking-${order.id}`}>
              Código de postagem
              <input
                id={`tracking-${order.id}`}
                type="text"
                value={trackingCodes[order.id] || ''}
                disabled={updatingId === order.id}
                onChange={(event) => setTrackingCodes((current) => ({
                  ...current,
                  [order.id]: event.target.value,
                }))}
              />
            </label>
            <button
              type="button"
              disabled={updatingId === order.id}
              onClick={() => handleShipOrder(order.id)}
            >
              Enviado
            </button>
          </div>
        ) : null}
      </article>
    );
  }

  const pendingOrders = orders.filter((order) => order.status === 'Pago');
  const separatingOrders = orders.filter((order) => order.status === 'Em Separacao');
  const otherOrders = orders.filter((order) => !['Pago', 'Em Separacao'].includes(order.status));

  return (
    <main className="products-page">
      <section className="products-header">
        <div>
          <h1>Pedidos</h1>
          <p>Aceite, rejeite e acompanhe os pedidos dos clientes.</p>
        </div>
        <button type="button" onClick={() => onNavigate('/admin')}>
          Voltar ao painel
        </button>
      </section>

      <section className="products-panel admin-orders-panel">
        <div className="panel-header">
          <h2>Pedidos recebidos</h2>
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
          <div className="admin-order-groups">
            <div className="admin-order-group">
              <h3>Aguardando aceite</h3>
              {pendingOrders.length === 0 ? (
                <p className="empty-state">Nenhum pedido pago aguardando aceite.</p>
              ) : (
                <div className="orders-list">
                  {pendingOrders.map(renderOrderCard)}
                </div>
              )}
            </div>

            <div className="admin-order-group">
              <h3>Em Separacao</h3>
              {separatingOrders.length === 0 ? (
                <p className="empty-state">Nenhum pedido em separação.</p>
              ) : (
                <div className="orders-list">
                  {separatingOrders.map(renderOrderCard)}
                </div>
              )}
            </div>

            {otherOrders.length > 0 ? (
              <div className="admin-order-group">
                <h3>Finalizados</h3>
                <div className="orders-list">
                  {otherOrders.map(renderOrderCard)}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminOrders;
