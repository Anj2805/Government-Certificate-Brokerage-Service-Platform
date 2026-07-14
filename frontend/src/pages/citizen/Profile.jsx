import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../api/userApi';
import { getCitizenProfilePhotoUrl } from '../../api/httpClient';
import { tokenStorage } from '../../utils/tokenStorage';
import toast from 'react-hot-toast';

export default function CitizenProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Photo state
  const fileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // ID Verification State
  const idFileInputRef = useRef(null);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [idProofType, setIdProofType] = useState('Aadhar');

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    if (profile?.idProofStatus === 'rejected') {
      toast.error('Your ID proof was rejected or missing. Please re-upload.');
    }
  }, [profile?.idProofStatus]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const profileData = await userApi.getMyProfile();
      setProfile(profileData);
      setEditForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        postalCode: profileData.postalCode || '',
        preferredLanguage: profileData.preferredLanguage || 'English',
        languagesSupported: profileData.languagesSupported?.join(', ') || '',
      });
    } catch (err) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const payload = {
        ...editForm,
        languagesSupported: editForm.languagesSupported.split(',').map(l => l.trim()).filter(Boolean),
      };
      await userApi.updateMyProfile(payload);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      window.dispatchEvent(new Event('auth-refresh')); // Refresh context
      await loadProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return toast.error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('File size must be less than 5MB');
    }

    try {
      setIsUploadingPhoto(true);
      await userApi.uploadProfilePhoto(file);
      toast.success('Profile photo updated successfully');
      window.dispatchEvent(new Event('auth-refresh'));
      await loadProfileData();
    } catch (err) {
      toast.error('Failed to upload profile photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleIdSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      return toast.error('Invalid file type. Only JPEG, PNG, and PDF are allowed.');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('File size must be less than 5MB');
    }

    try {
      setIsUploadingId(true);
      await userApi.uploadIdProof({ idProofType }, file);
      toast.success('ID proof uploaded successfully. Awaiting verification.');
      await loadProfileData();
    } catch (err) {
      toast.error('Failed to upload ID proof');
    } finally {
      setIsUploadingId(false);
      if (idFileInputRef.current) idFileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      await userApi.removeProfilePhoto();
      toast.success('Profile photo removed successfully');
      window.dispatchEvent(new Event('auth-refresh'));
      await loadProfileData();
    } catch (err) {
      toast.error('Failed to remove profile photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  const avatarUrl = profile.profilePhoto ? getCitizenProfilePhotoUrl(tokenStorage.getAccessToken()) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">Citizen Profile</h1>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold overflow-hidden">
            {avatarUrl ? (
              <img src={`${avatarUrl}&t=${Date.now()}`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
            )}
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="text-white text-xs hover:underline">Change</button>
            {avatarUrl && <button onClick={handleRemovePhoto} className="text-red-400 text-xs hover:underline">Remove</button>}
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/jpeg,image/png,image/webp" className="hidden" />
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-1">
          <h2 className="text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
          <p className="text-gray-500">{profile.email}</p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Verified
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Citizen
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-blue-600 hover:text-blue-700">Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleSaveProfile} disabled={isSaving} className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50">Save</button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                {isEditing ? (
                  <input type="text" name="firstName" value={editForm.firstName} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                {isEditing ? (
                  <input type="text" name="lastName" value={editForm.lastName} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.lastName}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              {isEditing ? (
                <input type="text" name="phone" value={editForm.phone} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profile.phone || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              {isEditing ? (
                <input type="text" name="address" value={editForm.address} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profile.address || '-'}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                {isEditing ? (
                  <input type="text" name="city" value={editForm.city} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.city || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                {isEditing ? (
                  <input type="text" name="state" value={editForm.state} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.state || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Postal</label>
                {isEditing ? (
                  <input type="text" name="postalCode" value={editForm.postalCode} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.postalCode || '-'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Languages</label>
              {isEditing ? (
                <input type="text" name="languagesSupported" placeholder="English, Hindi, Spanish" value={editForm.languagesSupported} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profile.languagesSupported?.join(', ') || '-'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-sm font-medium text-gray-500">Role</span>
                <span className="text-sm font-bold text-gray-900 capitalize">{profile.role}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-sm font-medium text-gray-500">Account Status</span>
                <span className="text-sm font-bold text-green-600">Active</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-sm font-medium text-gray-500">Member Since</span>
                <span className="text-sm font-bold text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* ID Verification Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ID Verification</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                  profile.idProofStatus === 'verified' ? 'bg-green-100 text-green-800' :
                  profile.idProofStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  profile.idProofStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.idProofStatus ? profile.idProofStatus.toUpperCase() : 'UNVERIFIED'}
                </span>
              </div>
              
              {profile.idProofStatus === 'rejected' && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  <strong>Reason for rejection:</strong> {profile.idProofRejectionReason || 'Invalid document.'}
                </div>
              )}

              {profile.idProofStatus === 'verified' && profile.idProofType && (
                <div className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-sm font-medium text-gray-500">ID Type</span>
                  <span className="text-sm font-bold text-gray-900">{profile.idProofType}</span>
                </div>
              )}

              {profile.idProofStatus !== 'verified' && (
                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload ID Proof</label>
                  <select 
                    value={idProofType} 
                    onChange={(e) => setIdProofType(e.target.value)}
                    className="mb-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  >
                    <option value="Aadhar">Aadhar</option>
                    <option value="PAN">PAN</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="College ID">College ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Other">Other</option>
                  </select>
                  
                  <input
                    type="file"
                    ref={idFileInputRef}
                    onChange={handleIdSelect}
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                  />
                  <button
                    onClick={() => idFileInputRef.current?.click()}
                    disabled={isUploadingId}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 rounded-lg text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50"
                  >
                    {isUploadingId ? 'Uploading...' : 'Choose File to Upload'}
                  </button>
                  <p className="mt-2 text-xs text-gray-500 text-center">JPEG, PNG, or PDF up to 5MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
