import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { brandAssets } from '../../config/brandAssets';
import { PATHS } from '../../config/paths';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/authApi';

function InputIcon({ type }) {
  return (
    <svg className="h-5 w-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      {type === 'user' ? <path d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /> : null}
      {type === 'email' ? <path d="M4 6h16v12H4V6Zm0 0 8 7 8-7" /> : null}
      {type === 'phone' ? <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.5a2 2 0 0 1-.5 1.7L7.7 9.2a16 16 0 0 0 7.1 7.1l1.3-1.3a2 2 0 0 1 1.7-.5l2.5.4a2 2 0 0 1 1.7 2Z" /> : null}
      {type === 'lock' ? <path d="M7 11V8a5 5 0 0 1 10 0v3m-12 0h14v10H5V11Z" /> : null}
      {type === 'eye' ? <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /> : null}
      {type === 'briefcase' ? <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1m-9 0h14v13H5V6Zm0 5h14" /> : null}
    </svg>
  );
}

function FormField({ children, hint, label }) {
  return (
    <label className="block text-[13px] font-bold text-[#374151] text-left w-full">
      {label}
      {children}
      {hint ? <span className="mt-2 block text-[11px] font-semibold text-[#6b7280]">◎ {hint}</span> : null}
    </label>
  );
}

function IconInput({ icon, children, className = '' }) {
  return (
    <div className={`mt-2 flex h-12 items-center rounded-lg border border-[#cbd5e1] bg-white px-3 focus-within:border-[#13448a] focus-within:ring-1 focus-within:ring-[#13448a] transition-all ${className}`}>
      <InputIcon type={icon} />
      {children}
    </div>
  );
}export default function Register() {
  const location = useLocation();
  const initialRole = location.state?.role === 'agent' ? 'agent' : 'citizen';
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm({ defaultValues: { role: initialRole } });
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (values) => {
    setSuccessMessage('');
    setErrorMessage('');

    if (values.password !== values.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    const [firstName, ...restName] = values.fullName.trim().split(/\s+/);
    const payload = {
      firstName,
      lastName: restName.join(' ') || firstName,
      email: values.email,
      phone: values.phone,
      password: values.password,
      role: selectedRole,
    };

    try {
      if (selectedRole === 'agent') {
        await authApi.register(payload);
        setSuccessMessage(
          <span>
            Your agent application was submitted. Verify your email and wait for administrator approval before accessing agent services.{' '}
            <Link to={PATHS.RESEND_VERIFICATION} className="underline font-bold text-emerald-800 hover:text-emerald-900">
              Resend verification link
            </Link>
          </span>
        );
      } else {
        await registerUser(payload);
        navigate(PATHS.CITIZEN_DASHBOARD, { replace: true });
      }
    } catch (err) {
      const apiResponse = err.response?.data;
      if (apiResponse?.details && Array.isArray(apiResponse.details) && apiResponse.details.length > 0) {
        const firstError = apiResponse.details[0];
        setErrorMessage(`${firstError.field}: ${firstError.message}`);
      } else {
        setErrorMessage(apiResponse?.message || 'Registration failed. Please try again.');
      }
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827]">


      {/* Main Section with loginBanner.png background */}
      <main 
        className="flex-1 relative overflow-hidden bg-cover bg-center bg-no-repeat px-6 py-16 flex items-center justify-center"
        style={{ backgroundImage: `url(${brandAssets.loginBanner})` }}
      >
        <div className="relative w-full max-w-[500px]">
          {/* Card Container */}
          <section className="relative w-full bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#e2e8f0] p-8" aria-labelledby="registration-title">
            
            {/* Round Avatar Shield Badge */}
            <div className="flex flex-col items-center text-center">
              <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-md border border-[#e2e8f0]">
                <img src={brandAssets.favicon} alt="SevaSetu Shield Emblem" className="h-11 w-11 object-contain" />
              </div>
              <h1 id="registration-title" className="mt-4 text-[26px] font-extrabold text-[#0f294a] tracking-tight">Create Account</h1>
              <p className="mt-1 text-[13px] font-medium text-[#6b7280]">Join the national portal for government services</p>
            </div>

            {successMessage && (
              <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-[13px] font-semibold text-emerald-700 text-left">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-[13px] font-semibold text-red-600 text-left">
                {errorMessage}
              </div>
            )}
            {/* Role Tabs */}
            <div className="mt-6 grid grid-cols-2 border-b border-[#e2e8f0]" role="tablist" aria-label="Registration role">
              <button
                type="button"
                onClick={() => handleRoleChange('citizen')}
                className={`flex h-12 items-center justify-center gap-2 text-[14px] font-bold transition-all ${
                  selectedRole === 'citizen' 
                    ? 'border-b-2 border-[#13448a] text-[#13448a]' 
                    : 'text-[#94a3b8] hover:text-[#13448a]'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                </svg>
                Citizen
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('agent')}
                className={`flex h-12 items-center justify-center gap-2 text-[14px] font-bold transition-all ${
                  selectedRole === 'agent' 
                    ? 'border-b-2 border-[#13448a] text-[#13448a]' 
                    : 'text-[#94a3b8] hover:text-[#13448a]'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1m-9 0h14v13H5V6Zm0 5h14" />
                </svg>
                Agent
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <input type="hidden" {...register('role')} />

              <FormField label="Full Name" hint="As per your Aadhaar or official ID">
                <IconInput icon="user">
                  <input
                    type="text"
                    placeholder="Enter your legal name"
                    className="h-full min-w-0 flex-1 border-0 px-2.5 text-[14px] font-medium text-[#111827] outline-none placeholder:text-[#94a3b8]"
                    {...register('fullName')}
                    required
                  />
                </IconInput>
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email Address">
                  <IconInput icon="email">
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="h-full min-w-0 flex-1 border-0 px-2.5 text-[14px] font-medium text-[#111827] outline-none placeholder:text-[#94a3b8]"
                      {...register('email')}
                      required
                    />
                  </IconInput>
                </FormField>
                <FormField label="Phone Number">
                  <IconInput icon="phone">
                    <input
                      type="tel"
                      placeholder="+91 00000 00000"
                      className="h-full min-w-0 flex-1 border-0 px-2.5 text-[14px] font-medium text-[#111827] outline-none placeholder:text-[#94a3b8]"
                      {...register('phone')}
                      required
                    />
                  </IconInput>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Create Password">
                  <IconInput icon="lock">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-full min-w-0 flex-1 border-0 px-2.5 text-[14px] font-medium text-[#111827] outline-none placeholder:text-[#94a3b8]"
                      {...register('password')}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-[#13448a] shrink-0 transition-colors mr-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24m-1.41-5.65a3.001 3.001 0 0 0-4.24 4.24m6.36-6.36A10.88 10.88 0 0 0 12 5c-5.5 0-10 7-10 7a14.7 14.7 0 0 0 2.8 3.8m2.2 2.2c1.4.9 3.1 1.5 5 1.5 5.5 0 10-7 10-7a14.7 14.7 0 0 0-2.8-3.8l-7.2 7.2" />
                          <line x1="3" y1="3" x2="21" y2="21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        </svg>
                      )}
                    </button>
                  </IconInput>
                </FormField>
                <FormField label="Confirm Password">
                  <IconInput icon="lock">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="h-full min-w-0 flex-1 border-0 px-2.5 text-[14px] font-medium text-[#111827] outline-none placeholder:text-[#94a3b8]"
                      {...register('confirmPassword')}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-[#13448a] shrink-0 transition-colors mr-1"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24m-1.41-5.65a3.001 3.001 0 0 0-4.24 4.24m6.36-6.36A10.88 10.88 0 0 0 12 5c-5.5 0-10 7-10 7a14.7 14.7 0 0 0 2.8 3.8m2.2 2.2c1.4.9 3.1 1.5 5 1.5 5.5 0 10-7 10-7a14.7 14.7 0 0 0-2.8-3.8l-7.2 7.2" />
                          <line x1="3" y1="3" x2="21" y2="21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        </svg>
                      )}
                    </button>
                  </IconInput>
                </FormField>
              </div>

              <label className="flex items-start gap-3 text-[13px] font-medium leading-relaxed text-[#6b7280] cursor-pointer text-left">
                <input 
                  type="checkbox" 
                  className="mt-1 h-4 w-4 rounded border-[#cbd5e1] text-[#13448a] focus:ring-[#13448a]" 
                  {...register('termsAccepted')} 
                  required
                />
                <span>
                  I agree to the <a href="/#" className="font-bold text-[#13448a] hover:underline">Terms of Service</a> and{' '}
                  <a href="/#" className="font-bold text-[#13448a] hover:underline">Privacy Policy</a>.
                </span>
              </label>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="h-12 w-full rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registering...' : (
                  <>Complete Registration <span>→</span></>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-[14px] font-medium text-[#6b7280]">
              Already have an account?{' '}
              <Link to={PATHS.LOGIN} className="font-extrabold text-[#13448a] hover:underline no-underline">
                Sign In
              </Link>
            </p>

            {/* Bottom Verification Green Badges */}
            <div className="grid grid-cols-3 gap-2 mt-6">
              <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#e6f4ea] border border-[#ceead6] px-2 py-1.5 text-[10px] font-bold text-[#137333]">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Aadhaar Verified
              </div>
              <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#e6f4ea] border border-[#ceead6] px-2 py-1.5 text-[10px] font-bold text-[#137333]">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                SSL Encrypted
              </div>
              <div className="flex items-center justify-center gap-1.5 rounded-full bg-[#e6f4ea] border border-[#ceead6] px-2 py-1.5 text-[10px] font-bold text-[#137333]">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Govt Approved
              </div>
            </div>

            {/* SSL Note */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#94a3b8]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure 256-bit SSL Encrypted Connection
            </div>

          </section>
        </div>
      </main>

    </div>
  );
}
