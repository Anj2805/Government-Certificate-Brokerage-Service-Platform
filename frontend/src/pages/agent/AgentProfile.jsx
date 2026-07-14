import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { agentProfileApi } from '../../api/agentProfileApi';
import { getProfilePhotoUrl } from '../../api/httpClient';
import { tokenStorage } from '../../utils/tokenStorage';
import toast from 'react-hot-toast';

export default function AgentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Photo state
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, performanceData] = await Promise.all([
        agentProfileApi.getProfile(),
        agentProfileApi.getProfilePerformance(),
      ]);
      setProfile(profileData.profile);
      setPerformance(performanceData.stats);
      setEditForm({
        firstName: profileData.profile.firstName || '',
        lastName: profileData.profile.lastName || '',
        phone: profileData.profile.phone || '',
        address: profileData.profile.address || '',
        city: profileData.profile.city || '',
        state: profileData.profile.state || '',
        postalCode: profileData.profile.postalCode || '',
        preferredLanguage: profileData.profile.preferredLanguage || 'English',
        languagesSupported: profileData.profile.languagesSupported?.join(', ') || '',
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
      await agentProfileApi.updateProfile(payload);
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
      await agentProfileApi.uploadProfilePhoto(file);
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

  const handleRemovePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      await agentProfileApi.removeProfilePhoto();
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

  const avatarUrl = profile.profilePhoto ? getProfilePhotoUrl(tokenStorage.getAccessToken()) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">Agent Profile</h1>

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
              {profile.agentStatus === 'approved' ? 'Approved' : 'Pending'}
            </span>
            {profile.agentIdentifier && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {profile.agentIdentifier}
              </span>
            )}
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
              <label className="block text-sm font-medium text-gray-700">Languages Supported</label>
              {isEditing ? (
                <input type="text" name="languagesSupported" placeholder="English, Hindi, Spanish" value={editForm.languagesSupported} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{profile.languagesSupported?.join(', ') || '-'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Professional Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Designation</label>
                <p className="mt-1 text-sm text-gray-900">{profile.designation || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Department</label>
                <p className="mt-1 text-sm text-gray-900">{profile.department || 'Not specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Service Specialization</label>
                <p className="mt-1 text-sm text-gray-900">{profile.serviceSpecialization || 'General'}</p>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          {performance && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Total Assigned</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{performance.totalAssignedRequests}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">{performance.completedRequests}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{performance.inProgressRequests}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Action Required</p>
                  <p className="mt-1 text-2xl font-bold text-orange-600">{performance.documentsRequiredRequests}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
