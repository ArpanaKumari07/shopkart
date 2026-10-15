import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProductById } from "../api/products";
import { handleImageError } from "../utils/imageFallback";
import { ErrorState } from "../components/PageState";
import { IconArrowLeft } from "../components/Icons";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await getProductById(id);
        setProduct(res.data.product);
      } catch (err) {
        // 400 = invalid id, 404 = no product with that id
        const status = err.response?.status;
        if (status === 400 || status === 404) {
          setError("Product not found.");
        } else {
          setError("Something went wrong while loading this product.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  return (
    <div>
      <Navbar />
      <main className="page">
        <Link className="back-link" to="/products">
          <IconArrowLeft />
          Back to Products
        </Link>

        {loading && (
          <div className="details-skeleton" role="status">
            <span className="sr-only">Loading product...</span>
            <div className="skeleton skeleton-media" aria-hidden="true" />
            <div className="skeleton-body" aria-hidden="true">
              <div className="skeleton skeleton-line skeleton-line-short" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-medium" />
              <div className="skeleton skeleton-button" />
            </div>
          </div>
        )}

        {!loading && error && <ErrorState title={error} />}

        {!loading && !error && product && (
          <div className="product-details">
            <div className="product-details-media">
              <img
                className="product-details-image"
                src={product.image}
                alt={product.name}
                onError={handleImageError}
              />
            </div>

            <div className="product-details-info">
              <span className="product-card-category">{product.category}</span>
              <h1 className="product-details-name">{product.name}</h1>
              <div className="product-details-price">₹{product.price.toLocaleString("en-IN")}</div>
              <span
                className={
                  product.stock > 0
                    ? "product-card-stock"
                    : "product-card-stock out-of-stock"
                }
              >
                {product.stock > 0 ? `${product.stock} units left` : "Out of stock"}
              </span>
              <p className="product-details-description">{product.description}</p>

              <div className="product-details-actions">
                {/* UI only for this lab: no cart backend yet */}
                <button className="btn btn-primary" disabled={product.stock === 0}>
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
