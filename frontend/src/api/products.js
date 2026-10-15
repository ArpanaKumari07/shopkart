import axios from "axios";
// Same pattern as api/axios.js: relative baseURL so Vite's dev server
// proxies /products/* to the backend and requests stay same-origin.

const productApi = axios.create({
  baseURL: "/products",
  withCredentials: true,
});

export const getProducts = (params) => productApi.get("/", { params });

export const getProductById = (id) => productApi.get(`/${id}`);
