'use client';

import { useAuthContext } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuthContext();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <a className="navbar-brand" href="/">
          <i className="bi bi-building me-2"></i>
          CoWorking Space
        </a>
        
        <div className="navbar-nav ms-auto">
          {isAuthenticated && user ? (
            <>
              <span className="navbar-text me-3">
                Welcome, {user.name}
              </span>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                Logout
              </button>
            </>
          ) : (
            <div className="navbar-nav">
              <a className="nav-link" href="/login">
                <i className="bi bi-box-arrow-in-right me-1"></i>
                Login
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
