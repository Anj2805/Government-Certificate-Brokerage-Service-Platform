import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { brandAssets } from '../../config/brandAssets';
import { PATHS } from '../../config/paths';
import { useAuth } from '../../hooks/useAuth';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { clearSession } = useAuth();
  const [showPasswords, setShowPasswords] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const newPassword = watch('newPassword');

  const onSubmit = async (values) => {
    setErrorMessage('');
    try {
      await authApi.resetPassword({
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      clearSession();
      navigate(PATHS.LOGIN, {
        replace: true,
        state: { message: 'Password reset successfully. Please sign in with your new password.' },
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message === 'Password reset token is invalid or has expired.'
          ? 'This password reset link is invalid or has expired. Request a new password reset link.'
          : error.response?.data?.details?.[0]?.message || error.response?.data?.message || 'Unable to reset password.',
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827]">
      <main
        className="flex-1 relative overflow-hidden bg-cover bg-center bg-no-repeat px-6 py-16 flex items-center justify-center"
        style={{ backgroundImage: `url(${brandAssets.loginBanner})` }}
      >
        <div className="relative w-full max-w-[480px]">
          <section className="relative w-full bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#e2e8f0] p-8" aria-labelledby="reset-title">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-md border border-[#e2e8f0]">
                <img src={brandAssets.favicon} alt="SevaSetu Shield Emblem" className="h-11 w-11 object-contain" />
              </div>
              <h1 id="reset-title" className="mt-4 text-[26px] font-extrabold text-[#0f294a] tracking-tight">Reset Password</h1>
              <p className="mt-2 text-[13px] font-medium text-[#6b7280] leading-relaxed">
                Enter a new password for your SevaSetu account.
              </p>
            </div>

            {errorMessage && (
              <div aria-live="assertive" className="mt-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-[13px] font-semibold text-red-600 text-left">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div>
                <label htmlFor="reset-new-password" className="block text-left text-[13px] font-bold text-[#374151]">
                  New Password
                </label>
                <input
                  id="reset-new-password"
                  type={showPasswords ? 'text' : 'password'}
                  className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] px-3 text-[14px] font-medium text-[#111827] outline-none focus:border-[#13448a] focus:ring-1 focus:ring-[#13448a]"
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    validate: {
                      lowercase: (value) => /[a-z]/.test(value) || 'Password must contain a lowercase letter',
                      uppercase: (value) => /[A-Z]/.test(value) || 'Password must contain an uppercase letter',
                      number: (value) => /\d/.test(value) || 'Password must contain a number',
                    },
                  })}
                />
                {errors.newPassword && <p className="mt-1.5 text-[12px] font-bold text-red-600">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label htmlFor="reset-confirm-password" className="block text-left text-[13px] font-bold text-[#374151]">
                  Confirm Password
                </label>
                <input
                  id="reset-confirm-password"
                  type={showPasswords ? 'text' : 'password'}
                  className="mt-2 h-12 w-full rounded-lg border border-[#cbd5e1] px-3 text-[14px] font-medium text-[#111827] outline-none focus:border-[#13448a] focus:ring-1 focus:ring-[#13448a]"
                  {...register('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: (value) => value === newPassword || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && <p className="mt-1.5 text-[12px] font-bold text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              <div className="rounded-lg bg-[#eff6ff] border border-[#dbeafe] p-4 text-[12.5px] font-semibold text-[#13448a]">
                Password must be 8-128 characters and include uppercase, lowercase, and number characters.
              </div>

              <label className="flex items-center gap-2 text-[13px] font-bold text-gray-600">
                <input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} />
                Show passwords
              </label>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="h-12 w-full rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-6 grid gap-3">
              <Link to={PATHS.FORGOT_PASSWORD} className="flex h-11 w-full items-center justify-center rounded-lg border border-[#13448a] text-[13px] font-bold text-[#13448a] hover:bg-[#f4f8ff] transition-all no-underline">
                Request New Link
              </Link>
              <Link to={PATHS.LOGIN} className="text-center text-[13px] font-bold text-[#6b7280] hover:text-[#13448a] no-underline">
                Back to Login
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
