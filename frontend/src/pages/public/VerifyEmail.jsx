import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { PATHS } from '../../config/paths';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = paramToken || searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        await authApi.verifyEmail({ token });
        setStatus('success');
        setMessage('Your email has been verified successfully. You can now use all features of the platform.');
        toast.success('Email verified successfully!');
        // Force reload session in AuthContext by reloading window or refreshing
        window.dispatchEvent(new Event('auth-refresh'));
      } catch (error) {
        setStatus('error');
        const errMessage = error.response?.data?.message || 'The verification link is invalid or has expired.';
        setMessage(errMessage);
        toast.error(errMessage);
      }
    };
    if (token) verify();
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Verification</h2>
          <div className="mt-4">
            {status === 'loading' && (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Verifying your email address...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-green-800">Verified!</h3>
                <p className="mt-2 text-sm text-green-700">{message}</p>
                <Link
                  to={PATHS.LOGIN}
                  className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Continue to Login
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-red-800">Verification Failed</h3>
                <p className="mt-2 text-sm text-red-700">{message}</p>
                <div className="mt-6 flex flex-col space-y-3">
                  <Link
                    to={PATHS.RESEND_VERIFICATION}
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Request New Link
                  </Link>
                  <Link
                    to={PATHS.HOME}
                    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Return Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
