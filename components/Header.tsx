'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isAdmin, isOwner } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold" href="/">
          <i className="bi bi-building-fill me-2"></i>
          Virpanix Real Estate
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Nav Items */}
        <div className="navbar-nav w-100" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* Public */}
            <li className="nav-item">
              <Link className="nav-link" href="/">
                <i className="bi bi-house me-1" />
                Home
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" href="/properties">
                <i className="bi bi-building me-1" />
                Properties
              </Link>
            </li>

            {/* Authenticated User */}
            {isAuthenticated && (
              <li className="nav-item">
                <Link className="nav-link" href="/cart">
                  <i className="bi bi-cart3 me-1" />
                  Cart
                </Link>
              </li>
            )}

            {/* Admin (role 2) */}
            {isAuthenticated && isAdmin && (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link text-white"
                  data-bs-toggle="dropdown"
                  type="button"
                >
                  Admin Menu
                </button>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" href="/realestate-admin/dashboard">Dashboard</Link></li>
                  <li><Link className="dropdown-item" href="/realestate-admin/properties">Properties</Link></li>
                  <li><Link className="dropdown-item" href="/realestate-admin/units">Units</Link></li>
                  <li><Link className="dropdown-item" href="/realestate-admin/users">Users</Link></li>
                  <li><Link className="dropdown-item" href="/realestate-admin/leads">Leads</Link></li>
                </ul>
              </li>
            )}

            {/* Owner (role 3) */}
            {isAuthenticated && isOwner && (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link text-white"
                  data-bs-toggle="dropdown"
                  type="button"
                >
                  Owner Panel
                </button>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" href="/realestate-owner-admin/dashboard">Dashboard</Link></li>
                  <li><Link className="dropdown-item" href="/realestate-owner-admin/properties">My Properties</Link></li>
                  <li><Link className="dropdown-item" href="/realestate-owner-admin/leads">Leads</Link></li>
                </ul>
              </li>
            )}
          </ul>

          {/* Right Side */}
          <ul className="navbar-nav ms-auto">
            {!isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/register/user">User Register</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/register/owner">Owner Register</Link>
                </li>
              </>
            ) : (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link text-white"
                  data-bs-toggle="dropdown"
                  type="button"
                >
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.name || 'My Account'}
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                  <li>
                    <Link className="dropdown-item" href="/user/profile">
                      <i className="bi bi-person me-2" />
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/user/dashboard">
                      <i className="bi bi-speedometer2 me-2" />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/user/my-bookings">
                      <i className="bi bi-calendar-check me-2" />
                      My Bookings
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      type="button"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-2" />
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

