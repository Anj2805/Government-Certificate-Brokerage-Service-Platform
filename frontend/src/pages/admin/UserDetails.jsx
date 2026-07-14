import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { adminApi } from '../../api/adminApi';
import { userApi } from '../../api/userApi';
import { User, Mail, Phone, Calendar, ArrowLeft, FileText, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { tokenStorage } from '../../utils/tokenStorage';

export default function UserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await adminApi.getUserDetails(id);
        if (response.data) {
          setUser(response.data.user);
        }
      } catch (error) {
        toast.error('Failed to load user details');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdatingId, setIsUpdatingId] = useState(false);

  const handleIdVerify = async (status) => {
    if (status === 'rejected' && !rejectionReason.trim()) {
      return toast.error('Please provide a rejection reason');
    }
    
    setIsUpdatingId(true);
    try {
      await userApi.verifyIdProof(id, {
        status,
        reason: status === 'rejected' ? rejectionReason : undefined
      });
      toast.success(`ID proof ${status} successfully`);
      const response = await adminApi.getUserDetails(id);
      if (response.data) setUser(response.data.user);
      setRejectionReason('');
    } catch (err) {
      toast.error('Failed to update ID proof status');
    } finally {
      setIsUpdatingId(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-semibold">User not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        <Link 
          to={PATHS.ADMIN_USERS}
          className="inline-flex items-center gap-2 text-[14px] font-bold text-gray-500 hover:text-[#13448a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Citizens
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          <div className="h-24 w-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-3xl uppercase flex-shrink-0">
            {user.firstName?.[0] || 'C'}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[12px] font-bold uppercase tracking-wider">
                Citizen Account
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                  <span className="block text-[14px] font-semibold text-gray-800 mt-0.5">{user.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone</span>
                  <span className="block text-[14px] font-semibold text-gray-800 mt-0.5">{user.phone || 'Not provided'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Joined</span>
                  <span className="block text-[14px] font-semibold text-gray-800 mt-0.5">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ID Verification Section */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
          <h2 className="text-[18px] font-extrabold text-[#0f294a] mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#13448a]" />
            ID Verification Status
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-sm font-medium text-gray-500">Current Status</span>
                <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${
                  user.idProofStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                  user.idProofStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                  user.idProofStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user.idProofStatus || 'unverified'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-sm font-medium text-gray-500">ID Type</span>
                <span className="text-sm font-bold text-gray-900">{user.idProofType || '-'}</span>
              </div>
              
              {user.idProofStatus === 'pending' && user.idProofDocument && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                  <p className="text-[13px] font-bold text-gray-700">Review Submitted ID Document</p>
                  
                  <button 
                    onClick={async () => {
                      try {
                        const response = await adminApi.downloadDocument(user.idProofDocument);
                        window.open(response.data.data.url, '_blank');
                      } catch (error) {
                        if (error.response?.status === 404) {
                          toast.error("Document file not found. Automatically requesting re-upload from citizen.");
                          try {
                            await userApi.verifyIdProof(id, { 
                              status: 'rejected', 
                              reason: 'Document file not found on server. Please re-upload.' 
                            });
                            const refreshed = await adminApi.getUserDetails(id);
                            if (refreshed.data) setUser(refreshed.data.user);
                          } catch (err) {
                            toast.error(err?.response?.data?.message || 'An error occurred');
        console.error(err);
                          }
                        } else {
                          toast.error("Failed to load document");
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center h-10 bg-white border border-[#13448a] text-[#13448a] text-[13px] font-bold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Document
                  </button>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <input 
                      type="text" 
                      placeholder="Rejection Reason (if rejecting)" 
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-[#13448a] focus:border-[#13448a]"
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleIdVerify('verified')}
                        disabled={isUpdatingId}
                        className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleIdVerify('rejected')}
                        disabled={isUpdatingId}
                        className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Request History */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
          <h2 className="text-[18px] font-extrabold text-[#0f294a] mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#13448a]" />
            Recent Requests
          </h2>
          
          <div className="space-y-4">
            {user.requestHistory?.length === 0 ? (
              <p className="text-[14.5px] font-semibold text-gray-500">No requests submitted yet.</p>
            ) : (
              user.requestHistory?.map(req => (
                <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors gap-4">
                  <div className="space-y-1">
                    <span className="text-[14.5px] font-extrabold text-gray-800">{req.service?.name}</span>
                    <span className="block text-[12px] font-semibold text-gray-500 font-mono">{req.requestNumber}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[13px] font-semibold text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase ${
                      req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      req.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {req.status}
                    </span>
                    <Link 
                      to={PATHS.ADMIN_REQUEST_DETAILS.replace(':id', req._id)}
                      className="text-[#13448a] hover:underline text-[13px] font-bold"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
