'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RealEstateOwner {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName: string; // Tenant Name
    website?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    password: string;
    confirmPassword: string;
}

export default function RealEstateRegisterPage() {
    const [formData, setFormData] = useState<RealEstateOwner>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        website: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: 'India',
        zipCode: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [countrySearch, setCountrySearch] = useState('India');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const router = useRouter();

    const countries = [
        "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
        "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
        "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
        "Denmark", "Djibouti", "Dominica", "Dominican Republic",
        "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
        "Fiji", "Finland", "France",
        "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
        "Haiti", "Honduras", "Hungary",
        "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
        "Jamaica", "Japan", "Jordan",
        "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
        "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
        "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
        "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
        "Oman",
        "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
        "Qatar",
        "Romania", "Russia", "Rwanda",
        "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
        "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
        "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
        "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
        "Yemen",
        "Zambia", "Zimbabwe"
    ];

    const filteredCountries = countries.filter(c =>
        c.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = (): boolean => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.companyName || !formData.password ||
            !formData.confirmPassword || !formData.addressLine1 || !formData.city || !formData.state ||
            !formData.country || !formData.zipCode) {
            setError('Please fill in all required fields');
            return false;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            const { authService } = await import('@/app/services/api');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { confirmPassword, ...registrationData } = formData;
            const response = await authService.register({ ...registrationData, type: 1 });

            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.message || 'Registration failed');
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
            <div className="container" style={{ maxWidth: '850px' }}>
                <div className="card shadow-lg border-0 rounded-4 overflow-hidden animate-fade-in">
                    <div className="row g-0">
                        {/* Side Branding */}
                        <div className="col-lg-4 bg-dark text-white p-5 d-none d-lg-flex flex-column justify-content-center">
                            <div className="mb-4">
                                <i className="bi bi-building-check display-1 text-white opacity-25"></i>
                            </div>
                            <h3 className="fw-extrabold mb-3 text-white">Real Estate Pro</h3>
                            <p className="small opacity-75 mb-4">Enterprise-grade property management tools for modern agencies and portfolio owners.</p>



                            <div className="mt-auto pt-3 border-top border-white/10">
                                <div className="modules-grid mb-2">
                                    {/* <div className="extra-small fw-800 text-white opacity-40 uppercase tracking-widest mb-3 border-bottom border-white/10 pb-2">Institutional Modules</div> */}
                                    <div className="row g-2">
                                        {[
                                            { n: 'AI Neural Layer', i: 'bi-cpu' },
                                            { n: 'Intelligent CRM', i: 'bi-people' },
                                            { n: 'Global Inventory', i: 'bi-building' },
                                            { n: 'Social Hub (WA)', i: 'bi-whatsapp' },
                                            { n: 'Voice Hub', i: 'bi-mic' },
                                            { n: 'Interactive Maps', i: 'bi-map' },
                                            { n: 'Analytics Pro', i: 'bi-graph-up' },
                                            { n: 'Matching Engine', i: 'bi-link' },
                                            { n: 'Marketing Hub', i: 'bi-megaphone' },
                                            { n: 'Secure Protocol', i: 'bi-shield-lock' }
                                        ].map((m, idx) => (
                                            <div key={idx} className="col-12">
                                                <div className="d-flex align-items-center gap-2 opacity-80 hvr-translate-right pointer py-1">
                                                    <i className={`bi ${m.i} text-white extra-small`}></i>
                                                    <span className="extra-small truncate" style={{ fontSize: '0.65rem' }}>{m.n}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Area */}
                        <div className="col-lg-8 bg-white p-4 p-md-5">
                            {success ? (
                                <div className="text-center py-5">
                                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-4 mb-4">
                                        <i className="bi bi-envelope-heart display-4 text-success"></i>
                                    </div>
                                    <h3 className="fw-extrabold text-dark mb-3">Portfolio Registered!</h3>
                                    <p className="text-muted small mb-4">Verification link sent to <strong>{formData.email}</strong>.<br />Please authorize your account to continue.</p>
                                    <Link href="/login" className="btn btn-primary rounded-4 px-5 py-3 fw-bold shadow-sm">
                                        Go to Login
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 d-flex justify-content-between align-items-start">
                                        <div>
                                            <h2 className="fw-extrabold text-dark mb-1">Real Estate Registration</h2>
                                            <p className="text-muted small">Establish your property agency workspace</p>
                                        </div>
                                        <div className="badge bg-dark text-white rounded-4 px-3 py-2 small">Property Owner</div>
                                    </div>

                                    {error && (
                                        <div className="alert alert-danger border-0 rounded-3 small mb-4">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit}>
                                        <div className="section-label small-caps mb-3">Personal Details</div>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">First Name</label>
                                                <input type="text" name="firstName" className="form-control" value={formData.firstName} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Last Name</label>
                                                <input type="text" name="lastName" className="form-control" value={formData.lastName} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Business Email</label>
                                                <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Phone Number</label>
                                                <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
                                            </div>
                                        </div>

                                        <div className="section-label small-caps mb-3 border-top py-2">Agency Information</div>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-12">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Company / Agency Name</label>
                                                <input type="text" name="companyName" className="form-control" value={formData.companyName} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Primary Address</label>
                                                <input type="text" name="addressLine1" className="form-control" value={formData.addressLine1} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">City</label>
                                                <input type="text" name="city" className="form-control" value={formData.city} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">State</label>
                                                <input type="text" name="state" className="form-control" value={formData.state} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Postal Code</label>
                                                <input type="text" name="zipCode" className="form-control" value={formData.zipCode} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6 position-relative">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Country</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0 rounded-start-3"><i className="bi bi-geo-alt text-muted"></i></span>
                                                    <input
                                                        type="text"
                                                        className="form-control bg-light border-start-0 ps-0"
                                                        placeholder="Search country..."
                                                        value={countrySearch}
                                                        onChange={(e) => {
                                                            setCountrySearch(e.target.value);
                                                            setShowCountryDropdown(true);
                                                        }}
                                                        onFocus={() => setShowCountryDropdown(true)}
                                                        onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                                                        required
                                                    />
                                                </div>
                                                {showCountryDropdown && (
                                                    <div className="country-dropdown shadow-lg rounded-3 mt-1 position-absolute w-100 bg-white border overflow-auto" style={{ maxHeight: '200px', zIndex: 100, left: 0 }}>
                                                        {filteredCountries.length > 0 ? (
                                                            filteredCountries.map(c => (
                                                                <div
                                                                    key={c}
                                                                    className="dropdown-item px-3 py-2 cursor-pointer hover-bg-light"
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, country: c });
                                                                        setCountrySearch(c);
                                                                        setShowCountryDropdown(false);
                                                                    }}
                                                                >
                                                                    {c}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="px-3 py-2 text-muted small">No countries found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="section-label small-caps mb-3 border-top py-2">Security</div>
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Password</label>
                                                <div className="input-group">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="password"
                                                        className="form-control rounded-start-3"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-light border-light-subtle text-muted"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label extra-small fw-bold text-uppercase text-muted">Confirm Password</label>
                                                <div className="input-group">
                                                    <input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        name="confirmPassword"
                                                        className="form-control rounded-start-3"
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-light border-light-subtle text-muted"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <button type="submit" className="btn btn-primary w-100 py-3 rounded-4 fw-bold shadow-lg mt-3" disabled={loading}>
                                            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-lightning-charge-fill me-2"></i>}
                                            {loading ? 'Creating Agency...' : 'Register Agency'}
                                        </button>

                                        <div className="text-center mt-4 pt-3 border-top">
                                            <Link href="/register" className="extra-small text-muted fw-bold text-decoration-none me-3"><i className="bi bi-arrow-left"></i> Back</Link>
                                            <span className="extra-small text-muted">Account exists? <Link href="/login" className="text-dark fw-bold text-decoration-none">Sign In</Link></span>
                                        </div>
                                    </form>
                                </>
                            )}
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
                .form-control { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 1rem; font-size: 0.875rem; }
                .form-control:focus { background-color: #fff; border-color: #000; box-shadow: 0 0 0 4px rgba(0,0,0,0.05); }
                .btn-primary { background-color: #000; border: none; }
                .btn-primary:hover { background-color: #222; transform: translateY(-1px); }
                .cursor-pointer { cursor: pointer; }
                .hover-bg-light:hover { background-color: #f8fafc; }
                .hvr-translate-right { transition: all 0.3s ease; }
                .hvr-translate-right:hover { transform: translateX(5px); opacity: 1 !important; }
                .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .country-dropdown { z-index: 1000; border: 1px solid #e2e8f0; }
                .dropdown-item { font-size: 0.875rem; color: #334155; }
                .dropdown-item:hover { color: #000; }
                .input-group-text { border: 1px solid #e2e8f0; border-radius: 12px 0 0 12px; }
            `}</style>
            </div>
        </div>

    );
}
