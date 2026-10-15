import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API calls to the backend so the browser sees everything as
    // same-origin (backend has no CORS headers configured).
    proxy: {
      '/customers': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/products': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // /products is also a React route: when the browser loads the page itself
        // (typing the URL or refreshing), serve the React app instead of the API.
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) return '/index.html'
        },
      },
      '/wishlist': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // /wishlist is also a React route, same as /products above
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) return '/index.html'
        },
      },
      '/cart': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // /cart is also a React route, same as /products above
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) return '/index.html'
        },
      },
      '/orders': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // /orders and /orders/:id are also React routes, same as /products above
        bypass: (req) => {
          if (req.headers.accept?.includes('text/html')) return '/index.html'
        },
      },
    },
  },
})
