import axios from "axios";
//JavaScript library used to send HTTP requests from your frontend to your backend.
// Relative baseURL: Vite's dev server proxies /customers/* to the backend
// (see vite.config.js), so requests stay same-origin and the HttpOnly
// cookie works without needing CORS(browser security mech) configuration on the backend.

const api = axios.create({
  baseURL: "/customers",
  withCredentials: true,
});

export default api;
