import { useState } from 'react';

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  stock: '',
  imgUrl: '',
  imageFile: null,
};

function toFormProduct(product) {
  if (!product) {
    return emptyProduct;
  }

  return {
    name: product.name || '',
    description: product.description || '',
    price: product.price ?? '',
    stock: product.stock ?? '',
    imgUrl: product.imgUrl || product.imageUrl || product['img-url'] || '',
    imageFile: null,
  };
}

function ProductForm({ buttonLabel = 'Salvar perfume', initialProduct, loading, onSubmit }) {
  const [product, setProduct] = useState(() => toFormProduct(initialProduct));
  const [previewUrl, setPreviewUrl] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setProduct((currentProduct) => ({
      ...currentProduct,
      [name]: value,
    }));
  }

  function updateFile(event) {
    const file = event.target.files?.[0] || null;
    setProduct((currentProduct) => ({
      ...currentProduct,
      imageFile: file,
    }));

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : '');
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(product, () => {
      setProduct(emptyProduct);
      setPreviewUrl('');
    });
  }

  const currentImage = previewUrl || product.imgUrl;

  return (
    <form className="product-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="productName">
        Nome
        <input
          id="productName"
          name="name"
          type="text"
          value={product.name}
          onChange={updateField}
        />
      </label>

      <label htmlFor="productPrice">
        Preço
        <input
          id="productPrice"
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={product.price}
          onChange={updateField}
        />
      </label>

      <label htmlFor="productStock">
        Estoque
        <input
          id="productStock"
          name="stock"
          type="number"
          min="0"
          step="1"
          value={product.stock}
          onChange={updateField}
        />
      </label>

      <label className="full-field" htmlFor="productImageUrl">
        URL da imagem do perfume
        <input
          id="productImageUrl"
          name="imgUrl"
          type="url"
          value={product.imgUrl}
          onChange={updateField}
        />
      </label>

      <label className="full-field" htmlFor="productImageFile">
        Imagem do computador
        <input id="productImageFile" name="imageFile" type="file" accept="image/*" onChange={updateFile} />
      </label>

      {currentImage ? (
        <img className="product-preview" src={currentImage} alt="Prévia do perfume" />
      ) : null}

      <label className="full-field" htmlFor="productDescription">
        Descrição
        <textarea
          id="productDescription"
          name="description"
          rows="4"
          value={product.description}
          onChange={updateField}
        />
      </label>

      <button className="product-primary full-field" type="submit" disabled={loading}>
        {loading ? 'Salvando...' : buttonLabel}
      </button>
    </form>
  );
}

export default ProductForm;
