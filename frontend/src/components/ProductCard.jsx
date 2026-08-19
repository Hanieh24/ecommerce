import heroImage from '../assets/lattaffa-perfume-hero.svg';
import { formatCurrency } from '../utils/format';

function ProductCard({
  deleting,
  onDelete,
  onEdit,
  onSelect,
  product,
  selected,
  showAdminActions = false,
}) {
  const imageUrl = product.imgUrl || product.imageUrl || product['img-url'] || heroImage;
  const stock = Number(product.stock || 0);

  return (
    <article className={`product-card ${selected ? 'selected' : ''}`}>
      <img src={imageUrl} alt={product.name} />

      <div className="product-card-body">
        <div>
          <h3>{product.name}</h3>
          <p>{product.description || 'Sem descrição cadastrada.'}</p>
        </div>

        <div className="product-meta">
          <strong>{formatCurrency(product.price)}</strong>
          <span>{stock} em estoque</span>
        </div>

        <div className="product-actions">
          <button type="button" onClick={() => onSelect(product.id)}>
            Ver detalhes
          </button>
          {showAdminActions ? (
            <>
              <button type="button" onClick={() => onEdit(product.id)}>
                Editar
              </button>
              <button
                className="danger"
                type="button"
                onClick={() => onDelete(product.id)}
                disabled={deleting}
              >
                {deleting ? 'Removendo...' : 'Excluir'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
