// Shown instead of the browser's broken-image icon when a product image fails to load.
const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#fff4e8"/>' +
      '<text x="200" y="158" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#9a6b45" text-anchor="middle">Image unavailable</text>' +
      "</svg>"
  );

export const handleImageError = (e) => {
  // guard so a failing fallback can't loop
  if (e.currentTarget.src !== FALLBACK_IMAGE) e.currentTarget.src = FALLBACK_IMAGE;
};
