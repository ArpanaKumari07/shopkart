import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />
      <main className="page">
        <header className="page-header">
          <div>
            <h1 className="page-title">Welcome, {user.fullName}!</h1>
            <p className="page-subtitle">Your ShopKart account details.</p>
          </div>
        </header>

        <section className="card account-card" aria-labelledby="account-title">
          <h2 className="section-title" id="account-title">Account</h2>
          <dl className="account-list">
            <div className="account-row">
              <dt>Name</dt>
              <dd>{user.fullName}</dd>
            </div>
            <div className="account-row">
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="account-row">
              <dt>Phone</dt>
              <dd>{user.phone}</dd>
            </div>
          </dl>

          <div className="home-actions">
            <Link className="btn btn-primary" to="/products">
              Browse Products
            </Link>
            <Link className="btn btn-outline" to="/orders">
              My Orders
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
