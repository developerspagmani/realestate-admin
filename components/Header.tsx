'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { selectUser, selectIsAuthenticated, logout } from '@/store';

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold" href="/">
          CoWorking Hub Public
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
        <div className="navbar-nav" id="">
          <ul className="navbar-nav me-auto">

            {/* Public */}
            <li className="nav-item">
              <Link className="nav-link" href="/">
                <i className="bi bi-house me-1" />
                Home
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" href="/workspace">
                <i className="bi bi-building me-1" />
                WorkSpace
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" href="/seats">
                <i className="bi bi-building me-1" />
                Seats
              </Link>
            </li>

            {/* Authenticated User */}
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/cart">
                    <i className="bi bi-cart3 me-1" />
                    Cart
                  </Link>
                </li>
              </>
            )}


            {/* Admin */}
            {isAuthenticated && user?.role === 2 && (
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
                  <li><Link className="dropdown-item" href="/realestate-admin/workspace">Spaces</Link></li>
                  <li><Link className="dropdown-item" href="/realestate-admin/workspaces">Workspaces</Link></li>
                  <li><Link className="dropdown-item" href="/realestate-admin/users">Users</Link></li>
                  <li><Link className="dropdown-item" href="/realestate-admin/bookings">Bookings</Link></li>
                  <li><Link className="dropdown-item" href="/realestate-admin/owners">Owners</Link></li>
                </ul>
              </li>
            )}

            {/* Owner */}
            {isAuthenticated && user?.role === 1 && (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link text-white"
                  data-bs-toggle="dropdown"
                  type="button"
                >
                  Owner
                </button>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" href="/owner-admin/dashboard">Dashboard</Link></li>
                  <li><Link className="dropdown-item" href="/owner-admin/workspace">Spaces</Link></li>
                  <li><Link className="dropdown-item" href="/owner-admin/workspaces">Workspaces</Link></li>
                  <li><Link className="dropdown-item" href="/owner-admin/bookings">Bookings</Link></li>
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
                  {user?.name}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
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
                      <i className="bi bi-calendar me-2" />
                      My Bookings
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item"
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
