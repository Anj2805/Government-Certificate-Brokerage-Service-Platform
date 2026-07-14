import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi';
import { PATHS } from '../../config/paths';
import { useAuth } from '../../hooks/useAuth';

const getApiMessage = (error, fallback) =>
  error.response?.data?.details?.[0]?.message || error.response?.data?.message || fallback;

export default function ChangePassword() {
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
      await authApi.changePassword(values);
      clearSession();
      navigate(PATHS.LOGIN, {
        replace: true,
        state: { message: 'Password changed successfully. Please sign in again.' },
      });
    } catch (error) {
      const msg = getApiMessage(error, 'Unable to change password.');
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">Change Password</h1>
        <p className="text-[14px] text-gray-500 font-semibold mt-1">
          Update your password. You will be signed out after a successful change.
        </p>
      </div>

      {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">{errorMessage}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-5">
        <label className="block">
          <span className="text-[12px] font-bold text-gray-500">Current Password</span>
          <input
            type={showPasswords ? 'text' : 'password'}
            className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] px-3 text-[13.5px] font-semibold text-gray-800"
            {...register('currentPassword', { required: 'Current password is required' })}
          />
          {errors.currentPassword && <span className="mt-1 block text-[11.5px] font-bold text-red-600">{errors.currentPassword.message}</span>}
        </label>

        <label className="block">
          <span className="text-[12px] font-bold text-gray-500">New Password</span>
          <input
            type={showPasswords ? 'text' : 'password'}
            className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] px-3 text-[13.5px] font-semibold text-gray-800"
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
          {errors.newPassword && <span className="mt-1 block text-[11.5px] font-bold text-red-600">{errors.newPassword.message}</span>}
        </label>

        <label className="block">
          <span className="text-[12px] font-bold text-gray-500">Confirm New Password</span>
          <input
            type={showPasswords ? 'text' : 'password'}
            className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] px-3 text-[13.5px] font-semibold text-gray-800"
            {...register('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (value) => value === newPassword || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && <span className="mt-1 block text-[11.5px] font-bold text-red-600">{errors.confirmPassword.message}</span>}
        </label>

        <div className="rounded-lg bg-[#eff6ff] border border-[#dbeafe] p-4 text-[12.5px] font-semibold text-[#13448a]">
          Password must be 8-128 characters and include uppercase, lowercase, and number characters.
        </div>

        <label className="flex items-center gap-2 text-[13px] font-bold text-gray-600">
          <input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} />
          Show passwords
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 px-5 rounded-lg bg-[#13448a] text-white text-[13px] font-extrabold disabled:opacity-50"
        >
          {isSubmitting ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
