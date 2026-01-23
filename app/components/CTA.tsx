'use client';

import { useState } from 'react';
import Link from 'next/link';

const CTA = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Subscribing email:', email);
    // Reset form
    setEmail('');
    // Show success message (in real app, you'd show a toast or notification)
    alert('Thank you for subscribing to our newsletter!');
  };

  return (
    <section className="py-5 bg-primary text-white">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="pe-lg-5">
              <h2 className="display-5 fw-bold mb-3">
                Ready to Find Your Perfect Seats?
              </h2>
              <p className="lead mb-4">
                Join thousands of professionals who have already found their ideal coworking space. 
                Get started today and boost your productivity.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3">
                <Link href="/workspace" className="btn btn-light btn-lg flex-fill">
                  <i className="bi bi-search me-2"></i>
                  Explore Spaces
                </Link>
                <Link href="/register/user" className="btn btn-outline-light btn-lg flex-fill">
                  <i className="bi bi-person-plus me-2"></i>
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="bg-white bg-opacity-10 rounded-3 p-4">
              <h3 className="h4 fw-bold mb-3">
                <i className="bi bi-envelope me-2"></i>
                Stay Updated
              </h3>
              <p className="mb-4">
                Get the latest updates on new workspace, exclusive deals, and coworking tips.
              </p>
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-sm-8">
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="col-sm-4">
                  <button type="submit" className="btn btn-light btn-lg w-100">
                    Subscribe
                  </button>
                </div>
              </form>
              <p className="small mb-0 mt-3">
                <i className="bi bi-lock me-1"></i>
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="row mt-5 pt-5 border-top border-white border-opacity-25">
          <div className="col-md-3 text-center mb-4">
            <div className="mb-3">
              <i className="bi bi-shield-check" style={{ fontSize: '2rem' }}></i>
            </div>
            <h5 className="fw-bold mb-2">Secure Booking</h5>
            <p className="small mb-0">Safe and secure payment processing</p>
          </div>
          <div className="col-md-3 text-center mb-4">
            <div className="mb-3">
              <i className="bi bi-headset" style={{ fontSize: '2rem' }}></i>
            </div>
            <h5 className="fw-bold mb-2">24/7 Support</h5>
            <p className="small mb-0">Always here to help you</p>
          </div>
          <div className="col-md-3 text-center mb-4">
            <div className="mb-3">
              <i className="bi bi-arrow-repeat" style={{ fontSize: '2rem' }}></i>
            </div>
            <h5 className="fw-bold mb-2">Free Cancellation</h5>
            <p className="small mb-0">Flexible booking policies</p>
          </div>
          <div className="col-md-3 text-center mb-4">
            <div className="mb-3">
              <i className="bi bi-star" style={{ fontSize: '2rem' }}></i>
            </div>
            <h5 className="fw-bold mb-2">Best Prices</h5>
            <p className="small mb-0">Competitive rates guaranteed</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
