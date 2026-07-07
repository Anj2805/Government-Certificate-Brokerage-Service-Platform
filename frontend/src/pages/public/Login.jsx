import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { brandAssets } from '../../config/brandAssets';
import { PATHS } from '../../config/paths';
import { getDashboardPathByRole } from '../../config/roleRoutes';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState('citizen');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const successMessage = location.state?.message;

  const onSubmit = async (values) => {
    setErrorMessage('');
    try {
      const user = await login({ ...values, role: selectedRole });
      if (user.role === 'agent') {
        if (!user.emailVerified) {
          await logout();
          setErrorMessage(
            <span>
              Email verification is required to access agent services.{' '}
              <Link to={PATHS.RESEND_VERIFICATION} className="underline font-bold text-red-700 hover:text-red-800">
                Resend verification link
              </Link>
            </span>
          );
          return;
        }
        if (user.agentStatus === 'pending') {
          await logout();
          setErrorMessage('Your agent account application is pending administrator approval. Please wait for an administrator to review and approve your account.');
          return;
        }
      }
      const fromLocation = location.state?.from;
      const redirectTo = fromLocation?.pathname || (typeof fromLocation === 'string' ? fromLocation : getDashboardPathByRole(user.role));
      const carryState = fromLocation?.state || {};
      navigate(redirectTo, { 
        replace: true, 
        state: { ...carryState, ...location.state } 
      });
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827]">
      
      {/* Main Section with loginBanner.png background */}
      <main 
        className="flex-1 relative overflow-hidden bg-cover bg-center bg-no-repeat px-6 py-16 flex items-center justify-center"
        style={{ backgroundImage: `url(${brandAssets.loginBanner})` }}
      >
        <div className="relative w-full max-w-[480px]">
          {/* Card Container */}
          <section className="relative w-full bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#e2e8f0] p-8" aria-labelledby="login-title">
            
            {/* Round Avatar Shield Badge */}
            <div className="flex flex-col items-center text-center">
              <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-md border border-[#e2e8f0]">
                <img src={brandAssets.favicon} alt="SevaSetu Shield Emblem" className="h-11 w-11 object-contain" />
              </div>
              <h1 id="login-title" className="mt-4 text-[26px] font-extrabold text-[#0f294a] tracking-tight">Welcome Back!</h1>
              <p className="mt-1 text-[13px] font-medium text-[#6b7280]">Secure access to government services</p>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-[13px] font-semibold text-red-600 text-left">
                {errorMessage}
              </div>
            )}

            {successMessage && !errorMessage && (
              <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[13px] font-semibold text-emerald-700 text-left">
                {successMessage}
              </div>
            )}

            {/* Role Tabs */}
            <div className="mt-6 grid grid-cols-2 border-b border-[#e2e8f0]" role="tablist" aria-label="Login role">
              <button
                type="button"
                onClick={() => setSelectedRole('citizen')}
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
                onClick={() => setSelectedRole('agent')}
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
              {/* Username/Email Field */}
              <div>
                <label htmlFor="login-email" className="block text-left text-[13px] font-bold text-[#374151]">
                  Email Address or Mobile Number
                </label>
                <div className="mt-2 flex h-12 items-center rounded-lg border border-[#cbd5e1] bg-white px-3 focus-within:border-[#13448a] focus-within:ring-1 focus-within:ring-[#13448a] transition-all">
                  <svg className="h-5 w-5 text-[#94a3b8] shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M4 6h16v12H4V6Zm0 0 8 7 8-7" />
                  </svg>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="Enter email address or mobile number"
                    className="h-full min-w-0 flex-1 border-0 px-2.5 text-[14px] font-medium text-[#111827] outline-none placeholder:text-[#94a3b8]"
                    {...register('email')}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="login-password" className="block text-left text-[13px] font-bold text-[#374151]">
                  Password
                </label>
                <div className="mt-2 flex h-12 items-center rounded-lg border border-[#cbd5e1] bg-white px-3 focus-within:border-[#13448a] focus-within:ring-1 focus-within:ring-[#13448a] transition-all">
                  <svg className="h-5 w-5 text-[#94a3b8] shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M7 11V8a5 5 0 0 1 10 0v3m-12 0h14v10H5V11Z" />
                  </svg>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
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
                </div>
              </div>

              {/* Checkbox and Forgot Password */}
              <div className="flex items-center justify-between text-[13px]">
                <label className="flex items-center gap-2 font-semibold text-[#6b7280] cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-[#cbd5e1] text-[#13448a] focus:ring-[#13448a]" 
                    {...register('rememberMe')} 
                  />
                  Remember me
                </label>
                <Link to={PATHS.FORGOT_PASSWORD} className="font-bold text-[#13448a] hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Secure Login Button */}
              <button 
                type="submit" 
                className="h-12 w-full rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                Secure Login <span>→</span>
              </button>
            </form>

            {/* Separator */}
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#e2e8f0]" />
              <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">New here?</span>
              <span className="h-px flex-1 bg-[#e2e8f0]" />
            </div>

            {/* Create Account Link Button */}
            <Link 
              to={PATHS.REGISTER}
              state={{ role: selectedRole }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#13448a] text-[13px] font-bold text-[#13448a] hover:bg-[#f4f8ff] transition-all no-underline"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Create New {selectedRole === 'agent' ? 'Agent' : 'Citizen'} Account
            </Link>

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
