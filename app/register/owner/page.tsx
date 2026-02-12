'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { subscriptionService, licenseKeyService, authService } from '@/app/services/api';

export default function OwnerRegistrationPage() {
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    addressLine1: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: '',
    password: '',
    confirmPassword: '',
    licenseKey: '',
    agreeTerms: false
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await subscriptionService.getPlans();
      if (res.success) setPlans(res.data.plans);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const validateStep = (currentStep: number) => {
    const newErrors: { [key: string]: string } = {};

    if (currentStep === 1 && !selectedPlan) {
      newErrors.plan = 'Please select a plan to continue';
    }

    if (currentStep === 2) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Minimum 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    if (currentStep === 3) {
      if (!formData.licenseKey.trim()) newErrors.licenseKey = 'License key is required';
      if (!formData.agreeTerms) newErrors.agreeTerms = 'Accept terms to proceed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const res = await authService.register({
        ...formData,
        planId: selectedPlan.id,
        type: 1 // Real Estate
      });

      if (res.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setErrors({ form: err.message || 'Registration failed' });
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
        <div className="card border-0 shadow-lg rounded-4 p-5 text-center" style={{ maxWidth: '500px' }}>
          <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
            <i className="bi bi-check-circle-fill display-4 text-success"></i>
          </div>
          <h3 className="fw-bold mb-3">Welcome Aboard!</h3>
          <p className="text-muted small mb-4">Your workspace is being prepared. We've sent an activation link to <strong>{formData.email}</strong>.</p>
          <Link href="/login" className="btn btn-primary rounded-4 px-5 fw-bold">Login to Continue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-white py-5">
      <div className="container" style={{ maxWidth: '1000px' }}>
        {/* Stepper Header */}
        <div className="row justify-content-center mb-5">
          <div className="col-md-8">
            <div className="d-flex justify-content-between stepper-line position-relative">
              {[1, 2, 3].map(s => (
                <div key={s} className={`step-item ${step >= s ? 'active' : ''}`}>
                  <div className="step-number">{s}</div>
                  <div className="step-label d-none d-md-block">{s === 1 ? 'Select Plan' : s === 2 ? 'Account' : 'Activation'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row g-5">
          {/* Left Panel - Dynamic Content based on Step */}
          <div className="col-lg-12">
            {step === 1 && (
              <div className="animate-fade-in">
                <div className="text-center mb-5">
                  <h2 className="fw-extrabold display-6">Choose Your Workspace Plan</h2>
                  <p className="text-muted">Start with the plan that fits your property portfolio</p>
                </div>
                <div className="row g-4 justify-content-center">
                  {plans.map(plan => (
                    <div className="col-md-5 col-lg-4" key={plan.id}>
                      <div className={`card h-100 border-2 rounded-4 p-4 transition-all plan-card ${selectedPlan?.id === plan.id ? 'border-primary selected' : 'border-light'}`} onClick={() => setSelectedPlan(plan)}>
                        <div className="d-flex justify-content-between mb-3">
                          <h5 className="fw-bold mb-0">{plan.name}</h5>
                          {selectedPlan?.id === plan.id && <i className="bi bi-check-circle-fill text-primary"></i>}
                        </div>
                        <div className="display-6 fw-bold mb-3">${plan.price}<span className="fs-6 text-muted fw-normal">/{plan.interval}</span></div>
                        <p className="small text-muted mb-4">{plan.description}</p>
                        <ul className="list-unstyled extra-small mb-0">
                          <li className="mb-2"><i className="bi bi-check text-success me-2"></i> Core Management</li>
                          <li className="mb-2"><i className="bi bi-check text-success me-2"></i> Admin Portal Access</li>
                          {plan.price > 0 && <li className="mb-2"><i className="bi bi-star-fill text-warning me-2"></i> Premium Support</li>}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.plan && <div className="text-center text-danger mt-3 small">{errors.plan}</div>}
                <div className="text-center mt-5">
                  <button className="btn btn-dark btn-lg px-5 rounded-4 fw-bold" onClick={handleNext}>Next: Account Details</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in mx-auto" style={{ maxWidth: '800px' }}>
                <div className="mb-5">
                  <h3 className="fw-bold">Step 2: Account Details</h3>
                  <p className="text-muted small">Enter your personal and company information</p>
                </div>
                <form className="row g-4">
                  <div className="col-md-6">
                    <label className="form-label extra-small fw-bold text-muted text-uppercase">First Name</label>
                    <input type="text" name="firstName" className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} value={formData.firstName} onChange={handleChange} placeholder="John" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Last Name</label>
                    <input type="text" name="lastName" className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} value={formData.lastName} onChange={handleChange} placeholder="Doe" />
                  </div>
                  <div className="col-12">
                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Company Name</label>
                    <input type="text" name="companyName" className={`form-control ${errors.companyName ? 'is-invalid' : ''}`} value={formData.companyName} onChange={handleChange} placeholder="Elite Properties Ltd." />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Work Email</label>
                    <input type="email" name="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={handleChange} placeholder="john@company.com" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Phone</label>
                    <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleChange} placeholder="+1..." />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Password</label>
                    <input type="password" name="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={formData.password} onChange={handleChange} placeholder="••••••••" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label extra-small fw-bold text-muted text-uppercase">Confirm Password</label>
                    <input type="password" name="confirmPassword" className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                  </div>
                  <div className="col-12 d-flex gap-3 mt-5">
                    <button type="button" className="btn btn-light px-4 rounded-4" onClick={handleBack}>Back</button>
                    <button type="button" className="btn btn-dark px-5 rounded-4 fw-bold" onClick={handleNext}>Next: Activate License</button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in mx-auto" style={{ maxWidth: '600px' }}>
                <div className="text-center mb-5">
                  <div className="bg-dark text-white rounded-circle d-inline-flex p-3 mb-4">
                    <i className="bi bi-key-fill fs-3"></i>
                  </div>
                  <h3 className="fw-bold">Step 3: Activate Your Plan</h3>
                  <p className="text-muted">Enter the license key provided to you by our sales team</p>
                </div>
                <div className="card border-0 bg-light rounded-4 p-5 mb-4 shadow-sm">
                  <label className="form-label small fw-bold text-muted mb-3">LICENSE KEY</label>
                  <input
                    type="text"
                    name="licenseKey"
                    className={`form-control form-control-lg bg-white border-2 text-center font-monospace ${errors.licenseKey ? 'is-invalid' : ''}`}
                    value={formData.licenseKey}
                    onChange={handleChange}
                    placeholder="KEY-XXXX-XXXX-XXXX"
                    style={{ letterSpacing: '2px', fontSize: '1.2rem' }}
                  />
                  {errors.licenseKey && <div className="invalid-feedback text-center mt-2">{errors.licenseKey}</div>}

                  <div className="mt-4 border-top pt-4">
                    <div className="d-flex align-items-center mb-2">
                      <span className="small text-muted me-2">Selected Plan:</span>
                      <span className="badge bg-primary rounded-4">{selectedPlan?.name}</span>
                    </div>
                    <p className="extra-small text-muted">Activation will start your 365-day access to {selectedPlan?.name} features.</p>
                  </div>
                </div>

                <div className="form-check mb-5">
                  <input type="checkbox" className="form-check-input" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange} id="finalAgree" />
                  <label className="form-check-label extra-small text-muted" htmlFor="finalAgree">
                    I confirm that all details are correct and I agree to the <Link href="/terms" className="text-dark fw-bold">Terms of Service</Link>
                  </label>
                  {errors.agreeTerms && <div className="text-danger extra-small mt-1">{errors.agreeTerms}</div>}
                </div>

                {errors.form && <div className="alert alert-danger border-0 rounded-3 small mb-4">{errors.form}</div>}

                <div className="d-flex gap-3">
                  <button type="button" className="btn btn-light px-4 rounded-4" onClick={handleBack} disabled={loading}>Back</button>
                  <button type="button" className="btn btn-dark w-100 py-3 rounded-4 fw-bold shadow-lg" onClick={handleSubmit} disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-shield-lock-fill me-2"></i>}
                    {loading ? 'Processing...' : 'Complete & Launch Workspace'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
                .fw-extrabold { font-weight: 800; }
                .extra-small { font-size: 0.72rem; }
                .stepper-line::after { content: ''; position: absolute; top: 1.2rem; left: 0; right: 0; height: 2px; background: #e2e8f0; z-index: 1; }
                .step-item { position: relative; z-index: 2; text-align: center; }
                .step-number { width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto 0.5rem; transition: all 0.3s; }
                .step-item.active .step-number { background: #000; color: #fff; transform: scale(1.1); }
                .step-label { font-size: 0.75rem; font-weight: 600; color: #64748b; }
                .step-item.active .step-label { color: #000; }
                .plan-card { cursor: pointer; border-color: #f1f5f9; background: #fff; }
                .plan-card:hover { border-color: #000; background: #fafafa; transform: translateY(-5px); }
                .plan-card.selected { border-color: #000; background: #f8fafc; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
                .form-control { border-radius: 12px; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; background: #f8fafc; }
                .form-control:focus { background: #fff; border-color: #000; box-shadow: none; }
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .small-caps { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: #94a3b8; }
            `}</style>
    </div>
  );
}

