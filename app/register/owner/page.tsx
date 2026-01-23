'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch, loginStart, loginSuccess, loginFailure } from '@/store';

export default function CoworkingOwnerRegistrationPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    companyAddress: '',
    companyWebsite: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.companyAddress.trim()) newErrors.companyAddress = 'Company address is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    dispatch(loginStart());
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newUser = {
        id: Date.now().toString(),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        companyWebsite: formData.companyWebsite,
        role: 'coworking-owner' as const,
        createdAt: new Date().toISOString(),
        status: 'pending' // Pending approval from admin
      };

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }));
      
      // Store owner data separately
      const existingOwners = JSON.parse(localStorage.getItem('owners') || '[]');
      existingOwners.push(newUser);
      localStorage.setItem('owners', JSON.stringify(existingOwners));
      
      // Set cookies for middleware
      document.cookie = `auth-token=true; path=/; max-age=86400`;
      document.cookie = `user-role=${newUser.role}; path=/; max-age=86400`;
      
      dispatch(loginSuccess(newUser));
      router.push('/owner-admin/dashboard');
    } catch (err) {
      dispatch(loginFailure('Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow" style={{ width: '600px' }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">
            <i className="bi bi-building text-primary me-2"></i>
            Co-working Owner Registration
          </h2>
          
          <p className="text-center text-muted mb-4">
            Register as a co-working space owner to manage your properties
          </p>

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
            </div>

            <hr className="my-4" />
            
            <h5 className="mb-3">Company Information</h5>

            <div className="mb-3">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className={`form-control ${errors.companyName ? 'is-invalid' : ''}`}
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
              {errors.companyName && <div className="invalid-feedback">{errors.companyName}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Company Address</label>
              <input
                type="text"
                className={`form-control ${errors.companyAddress ? 'is-invalid' : ''}`}
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                required
              />
              {errors.companyAddress && <div className="invalid-feedback">{errors.companyAddress}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Company Website (Optional)</label>
              <input
                type="url"
                className="form-control"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>

            <hr className="my-4" />

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              
              <div className="col-md-6 mb-3">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
              </div>
            </div>

            <div className="mb-4">
              <div className="form-check">
                <input
                  type="checkbox"
                  className={`form-check-input ${errors.agreeTerms ? 'is-invalid' : ''}`}
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  id="agreeTerms"
                />
                <label className="form-check-label" htmlFor="agreeTerms">
                  I agree to the <a href="#" className="text-primary">Terms and Conditions</a> and <a href="#" className="text-primary">Privacy Policy</a>
                </label>
                {errors.agreeTerms && <div className="invalid-feedback">{errors.agreeTerms}</div>}
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2">
                Registering</span>
              ) : (
                <i className="bi bi-person-plus me-2"></i>
              )}
              Register as Co-working Owner
            </button>
          </form>

          <div className="text-center mt-4">
            <small className="text-muted">
              Already have an account? <a href="/login" className="text-primary">Login here</a>
            </small>
          </div>

          <div className="text-center mt-3">
            <small className="text-muted">
              Want to register as a regular user? <a href="/register/user" className="text-primary">User Registration</a>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
