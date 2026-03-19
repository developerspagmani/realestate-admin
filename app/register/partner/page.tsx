'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PartnerRegistrationPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    website: '',
    monthlyClientBase: '',
    country: 'India',
    salesCapability: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Minimum 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/partners/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: `${formData.firstName} ${formData.lastName}`
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setErrors({ form: result.message || 'Registration failed' });
      }
    } catch (err: any) {
      setErrors({ form: 'Connection error. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (success) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card border-0 shadow-lg rounded-5 p-5 text-center" style={{ maxWidth: '500px' }}>
          <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
            <i className="bi bi-shield-check display-4 text-danger"></i>
          </div>
          <h3 className="fw-900 mb-3 tracking-tighter">Application Logged</h3>
          <p className="text-muted small mb-5 leading-relaxed">
            Your partner application is being processed by the <strong>VIPRANIX Security Protocol</strong>. 
            Verification takes 24-48 hours. We'll email you at <strong>{formData.email}</strong> once approved.
          </p>
          <div className="d-grid">
            <Link href="/login" className="btn btn-dark rounded-pill py-3 fw-bold shadow-lg">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-white py-5 font-inter">
      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="text-center mb-5">
           <div className="bg-danger text-white rounded-circle d-inline-flex p-3 mb-4 shadow-lg">
             <i className="bi bi-person-badge fs-3"></i>
           </div>
           <h1 className="fw-900 display-5 tracking-tighter">Join the Partner Hub</h1>
           <p className="text-muted max-w-500 mx-auto">Apply for the VIPRANIX Elite Partner program and start earning recurring commissions.</p>
        </div>

        <div className="card border-0 shadow-xl rounded-2xl overflow-hidden mb-5">
           <div className="row g-0">
             <div className="col-lg-4 bg-dark text-white p-5 d-none d-lg-flex flex-column justify-content-between">
               <div>
                 <h4 className="fw-bold mb-4">Partner Protocol</h4>
                 <div className="d-flex align-items-start gap-3 mb-4">
                   <i className="bi bi-check-circle text-danger fs-5"></i>
                   <div>
                     <div className="fw-bold small">30% Revenue Share</div>
                     <div className="extra-small opacity-50">Liftime recurring payouts</div>
                   </div>
                 </div>
                 <div className="d-flex align-items-start gap-3 mb-4">
                   <i className="bi bi-check-circle text-danger fs-5"></i>
                   <div>
                     <div className="fw-bold small">Priority Backend</div>
                     <div className="extra-small opacity-50">24/7 technical assistance</div>
                   </div>
                 </div>
                 <div className="d-flex align-items-start gap-3">
                   <i className="bi bi-check-circle text-danger fs-5"></i>
                   <div>
                     <div className="fw-bold small">Whitelabel Assets</div>
                     <div className="extra-small opacity-50">Custom sales collateral</div>
                   </div>
                 </div>
               </div>
               <div className="opacity-30 extra-small font-monospace">
                 SECURE_CONNECTION_ENABLED<br />
                 VERIFICATION_VERSION: 4.2.0
               </div>
             </div>
             
             <div className="col-lg-8 p-5 p-lg-10">
                <form onSubmit={handleSubmit}>
                   <div className="row g-4">
                      <div className="col-md-6">
                        <label className="small-caps mb-2 d-block">First Name</label>
                        <input type="text" name="firstName" className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} value={formData.firstName} onChange={handleChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="small-caps mb-2 d-block">Last Name</label>
                        <input type="text" name="lastName" className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} value={formData.lastName} onChange={handleChange} required />
                      </div>
                      <div className="col-12">
                        <label className="small-caps mb-2 d-block">Agency / Company Name</label>
                        <input type="text" name="companyName" className={`form-control ${errors.companyName ? 'is-invalid' : ''}`} value={formData.companyName} onChange={handleChange} required />
                      </div>
                      <div className="col-12">
                        <label className="small-caps mb-2 d-block">Company Website</label>
                        <input type="url" name="website" className="form-control" value={formData.website} onChange={handleChange} placeholder="https://" />
                      </div>
                      <div className="col-md-12">
                        <label className="small-caps mb-2 d-block">Work Email</label>
                        <input type="email" name="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={handleChange} required />
                      </div>
                      <div className="col-12">
                        <label className="small-caps mb-2 d-block">Monthly Reach (Clients)</label>
                        <select name="monthlyClientBase" className="form-select" value={formData.monthlyClientBase} onChange={handleChange} required>
                          <option value="">Select range...</option>
                          <option value="0-10">0 - 10 Clients</option>
                          <option value="11-50">11 - 50 Clients</option>
                          <option value="51-200">51 - 200 Clients</option>
                          <option value="200+">Above 200 Clients</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="small-caps mb-2 d-block">Password</label>
                        <input type="password" name="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={formData.password} onChange={handleChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="small-caps mb-2 d-block">Confirm Password</label>
                        <input type="password" name="confirmPassword" className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} value={formData.confirmPassword} onChange={handleChange} required />
                      </div>
                      
                      <div className="col-12 mt-5">
                         <div className="form-check mb-4">
                           <input type="checkbox" className="form-check-input" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} id="partnerAgree" />
                           <label className="form-check-label extra-small text-muted" htmlFor="partnerAgree">
                             I agree to the <Link href="/legal/partner-terms" className="text-dark fw-bold">Partner Agreement</Link> and data processing protocols.
                           </label>
                           {errors.agreeTerms && <div className="text-danger extra-small mt-1">{errors.agreeTerms}</div>}
                         </div>
                         
                         {errors.form && <div className="alert alert-danger border-0 rounded-4 small mb-4">{errors.form}</div>}
                         
                         <button type="submit" className="btn btn-danger btn-lg w-100 py-3 rounded-pill fw-bold shadow-lg" disabled={loading}>
                           {loading ? <><span className="spinner-border spinner-border-sm me-2"></span> Initializing...</> : 'Launch Application'}
                         </button>
                      </div>
                   </div>
                </form>
             </div>
           </div>
        </div>
        
        <div className="text-center opacity-50 extra-small">
          Secure Registration Flow • Processed via VIPRANIX Cloud Security • © 2026
        </div>
      </div>

      <style jsx>{`
        .font-inter { font-family: 'Inter', sans-serif; }
        .fw-900 { font-weight: 900; }
        .tracking-tighter { letter-spacing: -0.05em; }
        .small-caps { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: #64748b; }
        .extra-small { font-size: 0.72rem; }
        .form-control, .form-select { border-radius: 14px; padding: 0.8rem 1.2rem; border: 1.5px solid #f1f5f9; background: #f8fafc; font-size: 15px; }
        .form-control:focus, .form-select:focus { background: #fff; border-color: #ff4d4d; box-shadow: 0 0 10px rgba(255, 77, 77, 0.1); }
        .card { border-radius: 2rem; }
        .shadow-xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08); }
        .rounded-2xl { border-radius: 2rem; }
        .leading-relaxed { line-height: 1.6; }
        .max-w-500 { max-width: 500px; }
      `}</style>
      
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" />
    </div>
  );
}
