import { Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { useAuth } from '../../hooks/useAuth';

export default function CitizenSettings() {
  const { user } = useAuth();
  
  return (
    <div className="max-w-[900px] mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">Settings & Preferences</h1>
        <p className="text-[14px] text-gray-500 font-semibold mt-1">
          Notification, language, accessibility, and privacy preferences will be added in later phases.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
        <h2 className="text-[17px] font-extrabold text-[#0f294a]">Email Verification</h2>
        <p className="text-[13px] font-semibold text-gray-500 mt-2">
          Status: {user?.emailVerified ? <span className="text-emerald-600 font-bold">Verified</span> : <span className="text-red-600 font-bold">Not Verified</span>}
        </p>
        {!user?.emailVerified && (
          <div className="mt-4">
            <Link to={PATHS.RESEND_VERIFICATION} className="text-[13px] font-bold text-[#13448a] hover:underline">
              Resend Verification Email
            </Link>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
        <h2 className="text-[17px] font-extrabold text-[#0f294a]">Account Actions</h2>
        <p className="text-[13px] font-semibold text-gray-500 mt-2">
          The available account-management actions in this phase are profile review and password change.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Link to={PATHS.CITIZEN_PROFILE} className="h-11 px-5 rounded-lg bg-[#13448a] text-white text-[13px] font-extrabold no-underline flex items-center justify-center">
            Profile
          </Link>
          <Link to={PATHS.CITIZEN_CHANGE_PASSWORD} className="h-11 px-5 rounded-lg border border-[#dbeafe] bg-white text-[#13448a] text-[13px] font-extrabold no-underline flex items-center justify-center">
            Change Password
          </Link>
          <Link to={PATHS.HOME} className="h-11 px-5 rounded-lg border border-gray-200 bg-white text-gray-700 text-[13px] font-extrabold no-underline flex items-center justify-center">
            Public Portal
          </Link>
        </div>
      </section>
    </div>
  );
}
