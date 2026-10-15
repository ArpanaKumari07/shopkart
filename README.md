# ShopKart
A full-stack e-commerce web application built using the MERN stack as part of the Engineering Labs at Scaler School of Technology. ShopKart provides a complete shopping experience, from browsing products and managing a wishlist to adding items to a cart, completing checkout with Razorpay Test Mode, and viewing order history.

## Features
###  Authentication
- Customer registration and login
- JWT-based authentication using HttpOnly cookies
- Protected API routes
- Logout functionality
### Product Catalogue
- Browse products fetched from MongoDB
- Product details pages
- Product search and category filtering
- Product stock information
- Cloudinary-hosted product images
### Wishlist
- Add and remove products from a wishlist
- Persistent, customer-specific wishlist
- Wishlist data populated with product information
### Shopping Cart
- Add products to the cart
- Increase and decrease product quantities
- Remove products from the cart
- Stock validation
- Persistent cart stored in MongoDB
- Shared cart state using React Context API
- Dynamically calculated subtotal and navbar cart count
### Checkout and Orders
- Shipping address form with validation
- Server-side price and stock validation
- Razorpay Test Mode payment integration
- Server-side payment signature verification
- Persistent order history
- Order confirmation and detailed order pages
- Cart clearing after successful payment verification



| Layer    | Stack                                                        |
| -------- | ------------------------------------------------------------ |
| Frontend | React 19, React Router 7, Axios, Vite                        |
| Backend  | Node.js, Express 5, Mongoose 9 (MongoDB), JWT (HttpOnly cookie), bcrypt |
| Payments | Razorpay Standard Checkout (Test Mode), server-side signature verification |

## Project structure

```
shopkart/
├── backend/            Express REST API
│   ├── config/         Razorpay client
│   ├── controllers/    Route handlers
│   ├── middlewares/    JWT auth (protect)
│   ├── models/         Customer, Product, Order
│   ├── routes/         /customers, /products, /wishlist, /cart, /orders
│   ├── utils/          JWT helper
│   ├── seed.js         Inserts sample products
│   └── .env.example    Environment variable template
└── frontend/           React + Vite client (proxies API calls to the backend)
```

## Prerequisites

- Node.js 20.19+ or 22.12+ (required by Vite 8)
- A MongoDB database: local MongoDB or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A [Razorpay](https://razorpay.com) account for Test Mode API keys (only needed for checkout)

## Setup

### 1. Clone

```bash
git clone <repository-url>
cd shopkart
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env     # Windows PowerShell: Copy-Item .env.example .env
```

Fill in `backend/.env`:

| Variable              | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| `PORT`                | API port. Keep `5000`, which is what the Vite proxy targets.   |
| `MONGO_URI`           | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/shopkart` |
| `JWT_SECRET`          | Long random string used to sign login tokens                   |
| `RAZORPAY_KEY_ID`     | Razorpay Test Mode Key ID (`rzp_test_...`)                     |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Mode Key Secret (stays on the server)            |

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Seed sample products (**this deletes all existing products first**):

```bash
npm run seed
```

Start the API:

```bash
npm run dev      # with auto-reload (nodemon)
# or
npm start
```

You should see `MongoDB connected` and `Server running on port: 5000`.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Register an account, log in, and browse products.

The Vite dev server proxies `/customers`, `/products`, `/wishlist`, `/cart` and `/orders` to `http://localhost:5000`, so the browser sees one origin and the HttpOnly auth cookie works without CORS.

### Test payments

Checkout uses Razorpay **Test Mode**, so no real money is charged. Use the test cards and UPI IDs from the [Razorpay test docs](https://razorpay.com/docs/payments/payments/test-card-details/).

## Scripts

| Location  | Command           | Purpose                              |
| --------- | ----------------- | ------------------------------------ |
| backend   | `npm run dev`     | Start the API with nodemon           |
| backend   | `npm start`       | Start the API                        |
| backend   | `npm run seed`    | Replace products with sample data    |
| frontend  | `npm run dev`     | Start the Vite dev server            |
| frontend  | `npm run build`   | Production build into `frontend/dist`|
| frontend  | `npm run lint`    | Lint with oxlint                     |

## API overview

| Method | Endpoint                          | Auth | Description                          |
| ------ | --------------------------------- | ---- | ------------------------------------ |
| POST   | `/customers/register`             |      | Register                             |
| POST   | `/customers/login`                |      | Log in (sets HttpOnly `token` cookie)|
| GET    | `/customers/me`                   | ✔    | Current customer                     |
| POST   | `/customers/logout`               | ✔    | Log out                              |
| PATCH  | `/customers/change-password`      | ✔    | Change password                      |
| GET    | `/products?search=&category=`     |      | List / search products               |
| GET    | `/products/:id`                   |      | Product details                      |
| POST   | `/products`                       |      | Create product (no admin auth yet)   |
| GET    | `/wishlist`                       | ✔    | Get wishlist                         |
| POST   | `/wishlist/:productId`            | ✔    | Add to wishlist                      |
| DELETE | `/wishlist/:productId`            | ✔    | Remove from wishlist                 |
| GET    | `/cart`                           | ✔    | Get cart                             |
| POST   | `/cart/:productId`                | ✔    | Add one to cart                      |
| PATCH  | `/cart/:productId`                | ✔    | Set quantity `{ "quantity": n }`     |
| DELETE | `/cart/:productId`                | ✔    | Remove from cart                     |
| POST   | `/orders/create-payment-order`    | ✔    | Create order + Razorpay order        |
| POST   | `/orders/verify-payment`          | ✔    | Verify payment signature, place order|
| GET    | `/orders`                         | ✔    | Order history                        |
| GET    | `/orders/:id`                     | ✔    | Order details                        |
| PATCH  | `/orders/:id/status`              | ✔    | Advance status (development only)    |

## What I Learned

Building ShopKart helped me understand how individual frontend and backend components work together to form a full-stack application.

- REST API development: Designing and implementing CRUD endpoints using Express.js.
- Database modelling: Using Mongoose schemas, ObjectId references, and populated documents to represent relationships between customers, products, wishlists, carts, and orders.
- Authentication and authorization: Implementing JWT authentication, HttpOnly cookies, protected routes, and customer-specific resources.
- React state management: Using Context API to share cart state and keep the Navbar, product cards, and cart page synchronised.
- Derived state: Calculating cart totals and item counts from existing data rather than storing redundant values.
- Business-rule validation: Validating quantities, product stock, request data, and checkout totals on the backend.
- Frontend/backend integration: Connecting React components to Express APIs and handling loading, error, and empty states.
- Payment integration: Understanding server-created payment orders, Razorpay checkout, signature verification, and payment status handling.
- Order management: Creating persistent order records with snapshots of purchased products and prices.
- File uploads: Integrating Multer and Cloudinary for product image uploads.
- Debugging and testing: Using Postman, browser developer tools, server logs, and error responses to diagnose issues.
- Code organisation: Separating routes, controllers, models, API services, React components, context, and styles into maintainable modules.
  
## Security notes

- `.env` files are git-ignored. Only `backend/.env.example` (no real values) is committed.
- Passwords are hashed with bcrypt, and the JWT is stored in an HttpOnly cookie.
- Order totals are always calculated on the server, and payments are verified with an HMAC signature before an order is marked paid.
- `POST /products` has no admin protection. Add it before deploying publicly, and set the cookie `secure: true` when serving over HTTPS.
