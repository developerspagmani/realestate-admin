'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OwnerRegistrationPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: '',
    companyWebsite: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { authService } = await import('@/app/services/api');
      await authService.register({
        ...formData,
        type: 2 // Assuming 2 for Coworking as per previous code, or update to your preferred default
      });

      setSuccess(true);
    } catch (err: any) {
      setErrors({ form: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden animate-fade-in">
          <div className="row g-0">
            {/* Left Side - Visual/Accent */}
            <div className="col-lg-4 bg-dark d-none d-lg-flex flex-column justify-content-center p-5 text-white">
              <i className="bi bi-shield-check display-1 mb-4 opacity-50"></i>
              <h3 className="fw-bold mb-3">Join the Platform</h3>
              <p className="small opacity-75">Manage your properties with the world's most intelligent real estate management system.</p>
              <div className="mt-auto">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-check-circle-fill text-success"></i>
                  <span className="extra-small">AI Lead Matching</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill text-success"></i>
                  <span className="extra-small">Automated Marketing</span>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="col-lg-8 bg-white p-4 p-md-5">
              {success ? (
                <div className="text-center py-5">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
                    <i className="bi bi-envelope-check-fill display-4 text-success"></i>
                  </div>
                  <h3 className="fw-bold text-dark mb-3">Check your inbox</h3>
                  <p className="text-muted small mb-4">
                    We've sent an activation link to <strong>{formData.email}</strong>.<br />
                    Please verify your account to get started.
                  </p>
                  <Link href="/login" className="btn btn-primary rounded-pill px-5 py-2 fw-bold shadow-sm">
                    Go to Login
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="fw-extrabold text-dark mb-1">Owner Registration</h2>
                    <p className="text-muted small">Set up your property management workspace</p>
                  </div>

                  {errors.form && (
                    <div className="alert alert-danger border-0 rounded-3 small mb-4">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i> {errors.form}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="section-label small-caps mb-3">Personal Information</div>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">First Name</label>
                        <input type="text" name="firstName" className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} value={formData.firstName} onChange={handleChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">Last Name</label>
                        <input type="text" name="lastName" className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} value={formData.lastName} onChange={handleChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">Email Address</label>
                        <input type="email" name="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={handleChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">Phone Number</label>
                        <input type="tel" name="phone" className={`form-control ${errors.phone ? 'is-invalid' : ''}`} value={formData.phone} onChange={handleChange} required />
                      </div>
                    </div>

                    <div className="section-label small-caps mb-3 border-top pt-4">Workspace Details</div>
                    <div className="row g-3 mb-4">
                      <div className="col-12">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">Company Name</label>
                        <input type="text" name="companyName" className={`form-control ${errors.companyName ? 'is-invalid' : ''}`} value={formData.companyName} onChange={handleChange} required />
                      </div>
                      <div className="col-12">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">Address Line 1</label>
                        <input type="text" name="addressLine1" className={`form-control ${errors.addressLine1 ? 'is-invalid' : ''}`} value={formData.addressLine1} onChange={handleChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">City</label>
                        <input type="text" name="city" className={`form-control ${errors.city ? 'is-invalid' : ''}`} value={formData.city} onChange={handleChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">State</label>
                        <input type="text" name="state" className="form-control" value={formData.state} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">Postal Code</label>
                        <input type="text" name="zipCode" className="form-control" value={formData.zipCode} onChange={handleChange} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">Country</label>
                        <input type="text" name="country" className="form-control" value={formData.country} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="section-label small-caps mb-3 border-top pt-4">Security</div>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">Password</label>
                        <input type="password" name="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={formData.password} onChange={handleChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label extra-small fw-bold text-uppercase text-muted">Confirm Password</label>
                        <input type="password" name="confirmPassword" className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} value={formData.confirmPassword} onChange={handleChange} required />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="form-check custom-check">
                        <input type="checkbox" className="form-check-input shadow-none" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} id="agreeTerms" />
                        <label className="form-check-label extra-small text-muted" htmlFor="agreeTerms">
                          I agree to the <a href="#" className="text-dark fw-bold text-decoration-none">Terms and Conditions</a> and <a href="#" className="text-dark fw-bold text-decoration-none">Privacy Policy</a>
                        </label>
                        {errors.agreeTerms && <div className="invalid-feedback d-block">{errors.agreeTerms}</div>}
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-person-plus-fill"></i>}
                      {loading ? 'Creating Account...' : 'Finish Registration'}
                    </button>
                  </form>

                  <div className="text-center mt-4 pt-3 border-top">
                    <p className="extra-small text-muted mb-0">
                      Already have an account? <Link href="/login" className="text-dark fw-bold text-decoration-none">Login here</Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
                .fw-extrabold { font-weight: 800; }
                .extra-small { font-size: 0.72rem; }
                .small-caps { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: #94a3b8; }
                .section-label { display: block; border-left: 3px solid #000; padding-left: 10px; margin-left: -5px; }
                .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .form-control { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 0.75rem 1rem; font-size: 0.875rem; border-radius: 12px; }
                .form-control:focus { background-color: #fff; border-color: #000; box-shadow: 0 0 0 4px rgba(0,0,0,0.05); }
                .btn-primary { background-color: #000; border: none; }
                .btn-primary:hover { background-color: #222; transform: translateY(-1px); }
            `}</style>
    </div>
  );
}
