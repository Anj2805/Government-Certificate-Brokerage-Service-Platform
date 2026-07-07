import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { brandAssets } from '../../config/brandAssets';
import { PATHS } from '../../config/paths';

const GENERIC_MESSAGE = "If an account exists for this email, password reset instructions have been sent.";

export default function ForgotPassword() {
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      const response = await authApi.forgotPassword({ email: values.email });
      setStatusMessage(response.message || GENERIC_MESSAGE);
    } catch (error) {
      setErrorMessage(error.response?.data?.details?.[0]?.message || error.response?.data?.message || 'Unable to submit password reset request.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827]">
      <main
        className="flex-1 relative overflow-hidden bg-cover bg-center bg-no-repeat px-6 py-16 flex items-center justify-center"
        style={{ backgroundImage: `url(${brandAssets.loginBanner})` }}
      >
        <div className="relative w-full max-w-[480px]">
          <section className="relative w-full bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#e2e8f0] p-8" aria-labelledby="forgot-title">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-md border border-[#e2e8f0]">
                <img src={brandAssets.favicon} alt="SevaSetu Shield Emblem" className="h-11 w-11 object-contain" />
              </div>
              <h1 id="forgot-title" className="mt-4 text-[26px] font-extrabold text-[#0f294a] tracking-tight">Forgot Password</h1>
              <p className="mt-2 text-[13px] font-medium text-[#6b7280] leading-relaxed">
                Enter the email address associated with your account. If an account exists, we'll send password reset instructions.
              </p>
            </div>

            {statusMessage && (
              <div aria-live="polite" className="mt-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[13px] font-semibold text-emerald-700 text-left">
                {statusMessage}
              </div>
            )}

            {errorMessage && (
              <div aria-live="assertive" className="mt-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-[13px] font-semibold text-red-600 text-left">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div>
                <label htmlFor="forgot-email" className="block text-left text-[13px] font-bold text-[#374151]">
                  Email Address
                </label>
                <div className="mt-2 flex h-12 items-center rounded-lg border border-[#cbd5e1] bg-white px-3 focus-within:border-[#13448a] focus-within:ring-1 focus-within:ring-[#13448a] transition-all">
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email address"
                    className="h-full min-w-0 flex-1 border-0 px-2.5 text-[14px] font-medium text-[#111827] outline-none placeholder:text-[#94a3b8]"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-[12px] font-bold text-red-600">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>

            <Link to={PATHS.LOGIN} className="mt-6 flex h-11 w-full items-center justify-center rounded-lg border border-[#13448a] text-[13px] font-bold text-[#13448a] hover:bg-[#f4f8ff] transition-all no-underline">
              Back to Login
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
