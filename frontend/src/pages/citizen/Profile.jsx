import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../hooks/useAuth';

const getApiMessage = (error, fallback) =>
  error.response?.data?.details?.[0]?.message || error.response?.data?.message || fallback;

const formatDate = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function CitizenProfile() {
  const { updateCurrentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  const initials = useMemo(() => {
    const first = profile?.firstName?.[0] || '';
    const last = profile?.lastName?.[0] || '';
    return `${first}${last}` || 'U';
  }, [profile]);

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await userApi.getMyProfile();
      setProfile(user);
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    } catch (error) {
      setErrorMessage(getApiMessage(error, 'Unable to load profile.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleCancel = () => {
    reset({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
    });
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditing(false);
  };

  const onSubmit = async (values) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updatedUser = await userApi.updateMyProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone?.trim() || null,
      });
      setProfile(updatedUser);
      updateCurrentUser(updatedUser);
      reset({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        phone: updatedUser.phone || '',
      });
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully.');
    } catch (error) {
      setErrorMessage(getApiMessage(error, 'Unable to update profile.'));
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 py-16 text-center">
        <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-[14px] font-bold text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">Profile & Account</h1>
          <p className="text-[14px] text-gray-500 font-semibold mt-1">
            Review your account details and update editable personal information.
          </p>
        </div>
        <Link to={profile?.role === 'agent' ? PATHS.AGENT_CHANGE_PASSWORD : PATHS.CITIZEN_CHANGE_PASSWORD} className="h-11 px-5 rounded-lg border border-[#dbeafe] bg-white text-[#13448a] text-[13px] font-extrabold no-underline flex items-center justify-center">
          Change Password
        </Link>
      </div>

      {errorMessage && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">{errorMessage}</div>}
      {successMessage && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-700">{successMessage}</div>}

      <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-[#eff6ff] text-[#13448a] flex items-center justify-center text-[20px] font-extrabold border border-blue-100 uppercase">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="text-[20px] font-extrabold text-gray-900">{profile?.firstName} {profile?.lastName}</h2>
          <p className="text-[13px] font-semibold text-gray-500 mt-1">{profile?.email}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-[11px] font-extrabold uppercase text-[#13448a]">{profile?.role}</span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${profile?.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {profile?.isActive ? 'Active Account' : 'Inactive Account'}
            </span>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-[17px] font-extrabold text-[#0f294a]">Personal Information</h2>
              <p className="text-[12.5px] font-semibold text-gray-400 mt-1">Email is read-only in this phase.</p>
            </div>
            {!isEditing && (
              <button type="button" onClick={() => setIsEditing(true)} className="h-9 px-4 rounded-lg bg-[#13448a] text-white text-[12.5px] font-extrabold">
                Edit Profile
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-bold text-gray-500">First Name</span>
              <input
                disabled={!isEditing}
                className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] px-3 text-[13.5px] font-semibold text-gray-800 disabled:bg-gray-50 disabled:text-gray-500"
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: { value: 2, message: 'First name must be at least 2 characters' },
                  maxLength: { value: 80, message: 'First name must be 80 characters or fewer' },
                })}
              />
              {errors.firstName && <span className="mt-1 block text-[11.5px] font-bold text-red-600">{errors.firstName.message}</span>}
            </label>

            <label className="block">
              <span className="text-[12px] font-bold text-gray-500">Last Name</span>
              <input
                disabled={!isEditing}
                className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] px-3 text-[13.5px] font-semibold text-gray-800 disabled:bg-gray-50 disabled:text-gray-500"
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: { value: 2, message: 'Last name must be at least 2 characters' },
                  maxLength: { value: 80, message: 'Last name must be 80 characters or fewer' },
                })}
              />
              {errors.lastName && <span className="mt-1 block text-[11.5px] font-bold text-red-600">{errors.lastName.message}</span>}
            </label>
          </div>

          <label className="block">
            <span className="text-[12px] font-bold text-gray-500">Email</span>
            <input
              value={profile?.email || ''}
              readOnly
              className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] bg-gray-50 px-3 text-[13.5px] font-semibold text-gray-500"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-bold text-gray-500">Phone</span>
            <input
              disabled={!isEditing}
              placeholder="Add phone number"
              className="mt-2 h-11 w-full rounded-lg border border-[#cbd5e1] px-3 text-[13.5px] font-semibold text-gray-800 disabled:bg-gray-50 disabled:text-gray-500"
              {...register('phone')}
            />
          </label>

          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="h-11 px-5 rounded-lg bg-[#13448a] text-white text-[13px] font-extrabold disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={handleCancel} className="h-11 px-5 rounded-lg border border-gray-200 bg-white text-[13px] font-extrabold text-gray-700">
                Cancel
              </button>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
          <h2 className="text-[17px] font-extrabold text-[#0f294a] border-b border-gray-100 pb-4">Account Information</h2>
          {[
            ['Role', profile?.role],
            ['Account Status', profile?.isActive ? 'Active' : 'Inactive'],
            ['Email Verified', profile?.emailVerified ? 'Yes' : 'No'],
            ['Member Since', formatDate(profile?.createdAt)],
            ['Last Updated', formatDate(profile?.updatedAt)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 border-b border-gray-50 pb-3 last:border-0">
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
              <span className="text-[13px] font-extrabold text-gray-800 capitalize text-right">{value || 'Not available'}</span>
            </div>
          ))}
        </section>
      </form>
    </div>
  );
}
