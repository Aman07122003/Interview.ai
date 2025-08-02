import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FiEdit3, 
  FiSave, 
  FiX, 
  FiEye, 
  FiTrash2, 
  FiUser, 
  FiPhone, 
  FiLinkedin, 
  FiMail, 
  FiBriefcase,
  FiCalendar,
  FiStar,
  FiMenu,
  FiArrowLeft,
  FiUpload,
  FiCamera
} from 'react-icons/fi';
import { logout, getCurrentUser } from '../store/slice/authSlice';
import { updateUserProfile } from '../store/slice/userSlice';
import { updateUserAvatar } from '../services/api/profile';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const isAuthenticated = !!(user && accessToken);
  const fileInputRef = useRef(null);

  // State for editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [roleChangeRequest, setRoleChangeRequest] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Avatar state
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    linkedin: user?.linkedin || '',
    bio: user?.bio || '',
  });

  // Mock data for role change status
  const [roleChangeStatus, setRoleChangeStatus] = useState('none'); // 'none', 'pending', 'approved', 'rejected'

  // Mock data for past interviews
  const [pastInterviews, setPastInterviews] = useState([
    {
      id: 1,
      title: 'Frontend Developer Interview',
      date: '2024-01-15',
      score: 85,
      feedback: 'Excellent problem-solving skills, good communication',
      category: 'Frontend'
    },
    {
      id: 2,
      title: 'Data Structures & Algorithms',
      date: '2024-01-10',
      score: 78,
      feedback: 'Good understanding of basic concepts, needs practice with advanced algorithms',
      category: 'DSA'
    },
    {
      id: 3,
      title: 'System Design Interview',
      date: '2024-01-05',
      score: 92,
      feedback: 'Outstanding system design skills, excellent scalability thinking',
      category: 'System Design'
    }
  ]);

  console.log(formData);

  // Get update status from Redux
  const updateStatus = useSelector((state) => state.user.updateStatus);
  const updateError = useSelector((state) => state.user.updateError);

  // Local state for profile updates
  const [updateLoading, setUpdateLoading] = useState(false);
  const [localUpdateError, setLocalUpdateError] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (accessToken && !user) {
      dispatch(getCurrentUser());
    }
  }, [isAuthenticated, accessToken, user, dispatch, navigate]);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        linkedin: user.linkedin || '',
        bio: user.bio || '',
      });
      setAvatar(user.avatar || null);
    }
  }, [user]);

  // Close avatar options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAvatarOptions && !event.target.closest('.avatar-options')) {
        setShowAvatarOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAvatarOptions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatar(previewUrl);
      
      // Here you would typically upload to your server/cloud storage
      // For now, we'll simulate the upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Avatar uploaded:', file.name);
      setShowAvatarOptions(false);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setAvatar(null);
      // Here you would typically make an API call to delete the avatar
      console.log('Avatar deleted');
      setShowAvatarOptions(false);
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      alert('Failed to delete avatar. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      linkedin: user?.linkedin || '',
      bio: user?.bio || '',
    });
    setAvatar(user?.avatar || null);
    setIsEditing(false);
    setShowAvatarOptions(false);
  };

  const handleRoleChangeRequest = () => {
    if (roleChangeRequest && roleChangeRequest !== user?.role) {
      setRoleChangeStatus('pending');
      setRoleChangeRequest('');
      // Here you would typically make an API call to request role change
    }
  };

  const handleDeleteInterview = (interviewId) => {
    setPastInterviews(prev => prev.filter(interview => interview.id !== interviewId));
    setShowDeleteModal(false);
    setSelectedInterview(null);
  };

  const handleSaveProfile = async () => {
    if (!isEditing) return;

    try {
      setUpdateLoading(true);
      setLocalUpdateError(null);

      // Prepare profile data, handling empty strings
      const profileData = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim() || null,
        linkedin: formData.linkedin.trim() || null,
        bio: formData.bio.trim() || null
      };

      // Remove null values to avoid sending them
      Object.keys(profileData).forEach(key => {
        if (profileData[key] === null || profileData[key] === '') {
          delete profileData[key];
        }
      });

      console.log('Sending profile data:', profileData);

      const result = await dispatch(updateUserProfile(profileData)).unwrap();
      
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setLocalUpdateError(error.message || 'Failed to update profile');
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'No Request';
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 bg-black/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all duration-300 lg:hidden"
          >
            <FiArrowLeft size={20} />
          </button>
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            interview.ai
          </span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105"
          >
            Home
          </button>
          <button
            onClick={() => navigate('/interview')}
            className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105"
          >
            Interview
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all duration-300"
        >
          <FiMenu size={20} />
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 lg:hidden">
          <div className="flex flex-col space-y-2 p-4">
            <button
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
              className="text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300"
            >
              Home
            </button>
            <button
              onClick={() => {
                navigate('/interview');
                setIsMobileMenuOpen(false);
              }}
              className="text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-300"
            >
              Interview
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-20 sm:pt-24 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Profile
            </h1>
            <p className="text-lg sm:text-xl text-gray-300">
              Manage your account settings and view your interview history
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - User Info & Editable Fields */}
            <div className="xl:col-span-2 space-y-6 sm:space-y-8">
              {/* User Info Card */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/50">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-0">
                    {/* Avatar Section */}
                    <div className="avatar-options relative group">
                      <div className="relative">
                        <img
                          src={avatar || "https://via.placeholder.com/80"}
                          alt={user.fullName}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-purple-500/50 transition-all duration-300 group-hover:border-purple-400"
                        />
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Avatar Options Overlay */}
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => setShowAvatarOptions(!showAvatarOptions)}
                            className="p-2 bg-purple-600/80 hover:bg-purple-600 rounded-full text-white transition-all duration-300"
                          >
                            <FiCamera size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Avatar Options Dropdown */}
                    {showAvatarOptions && isEditing && (
                      <div className="avatar-options absolute top-0 left-0 mt-20 ml-0 sm:ml-20 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10 min-w-[200px]">
                        <div className="p-2 space-y-1">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                          >
                            <FiUpload size={16} />
                            <span>Upload New Photo</span>
                          </button>
                          {avatar && (
                            <button
                              onClick={handleDeleteAvatar}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
                            >
                              <FiTrash2 size={16} />
                              <span>Remove Photo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">{user.fullName}</h2>
                      <p className="text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base">{user.role || 'User'}</p>
                      <p className="text-gray-400 text-sm sm:text-base truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 sm:p-3 rounded-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 transition-all duration-300"
                    >
                      <FiEdit3 size={18} className="sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Role Change Section */}
                <div className="border-t border-gray-700/50 pt-4 sm:pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Role Management</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                          <span className="text-gray-300 text-sm sm:text-base">Current Role: {user.role || 'User'}</span>
                          {roleChangeStatus !== 'none' && (
                            <span className={`text-sm ${getStatusColor(roleChangeStatus)}`}>
                              {getStatusText(roleChangeStatus)}
                            </span>
                          )}
                        </div>
                        
                        {user.role !== 'Admin' && (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <select
                              value={roleChangeRequest}
                              onChange={(e) => setRoleChangeRequest(e.target.value)}
                              className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                            >
                              <option value="">Select New Role</option>
                              <option value="Recruiter">Recruiter</option>
                              <option value="Manager">Manager</option>
                            </select>
                            <button
                              onClick={handleRoleChangeRequest}
                              disabled={!roleChangeRequest}
                              className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base"
                            >
                              Request Change
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Fields Section */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-700/50">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Profile Information</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold text-sm sm:text-base">Full Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:bg-gray-800/50 disabled:cursor-not-allowed text-sm sm:text-base"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold text-sm sm:text-base">Phone Number</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        name="phone"
                        value={user.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:bg-gray-800/50 disabled:cursor-not-allowed text-sm sm:text-base"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold text-sm sm:text-base">Email</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full pl-10 pr-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed text-sm sm:text-base"
                        placeholder="Email address"
                      />
                    </div>
                  </div>

                  {/* Role (Read-only) */}
                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold text-sm sm:text-base">Role</label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={user.role || 'User'}
                        disabled
                        className="w-full pl-10 pr-4 py-2 sm:py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed text-sm sm:text-base"
                        placeholder="User role"
                      />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="lg:col-span-2">
                    <label className="block text-gray-300 mb-2 font-semibold text-sm sm:text-base">LinkedIn Profile</label>
                    <div className="relative">
                      <FiLinkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="url"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:bg-gray-800/50 disabled:cursor-not-allowed text-sm sm:text-base"
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="lg:col-span-2">
                    <label className="block text-gray-300 mb-2 font-semibold text-sm sm:text-base">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full px-4 py-2 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:bg-gray-800/50 disabled:cursor-not-allowed resize-none text-sm sm:text-base"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="space-y-4">
                    {/* Error Message */}
                    {localUpdateError && (
                      <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3 text-red-400 text-sm">
                        {localUpdateError}
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-700/50">
                      <button
                        onClick={handleCancelEdit}
                        disabled={updateLoading}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        <FiX size={16} />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={updateLoading}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        {updateLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <FiSave size={16} />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Past Interviews */}
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Past Interviews</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  {pastInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="bg-gray-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-600/50 hover:border-purple-500/50 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-white mb-1 text-sm sm:text-base truncate">{interview.title}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-300">
                            <div className="flex items-center space-x-1">
                              <FiCalendar size={12} className="sm:w-[14px] sm:h-[14px]" />
                              <span>{new Date(interview.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FiStar size={12} className="sm:w-[14px] sm:h-[14px]" />
                              <span>{interview.score}/100</span>
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full ml-2 flex-shrink-0">
                          {interview.category}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 text-xs sm:text-sm mb-3 line-clamp-2">
                        {interview.feedback}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          onClick={() => navigate(`/interview/history/${interview.id}`)}
                          className="flex items-center justify-center space-x-1 px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 rounded-lg text-xs sm:text-sm transition-all duration-300"
                        >
                          <FiEye size={12} className="sm:w-[14px] sm:h-[14px]" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInterview(interview);
                            setShowDeleteModal(true);
                          }}
                          className="flex items-center justify-center space-x-1 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg text-xs sm:text-sm transition-all duration-300"
                        >
                          <FiTrash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedInterview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Delete Interview</h3>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Are you sure you want to delete "{selectedInterview.title}"? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedInterview(null);
                }}
                className="px-4 py-2 border border-gray-600 hover:border-gray-500 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteInterview(selectedInterview.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 