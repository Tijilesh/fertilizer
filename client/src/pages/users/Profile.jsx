import { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Maximize, Sprout, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import api from '../../utils/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    farm_size: '',
    crop_type: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.username || response.data.name || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        location: response.data.location || '',
        farm_size: response.data.farm_size || '',
        crop_type: response.data.crop_type || ''
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put('/users/profile', formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    if (profile) {
      setFormData({
        name: profile.username || profile.name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        location: profile.location || '',
        farm_size: profile.farm_size || '',
        crop_type: profile.crop_type || ''
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal information, farm details, and view your credit status.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Content */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Profile Details</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4 border-b pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Farm Details */}
                  <div className="pt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-4 border-b pb-2">Farm Details (Optional)</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Location / Address</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Farm Size</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Maximize className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="farm_size"
                            value={formData.farm_size}
                            onChange={handleChange}
                            placeholder="e.g. 5"
                            className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Crop Type</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Sprout className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="crop_type"
                            value={formData.crop_type}
                            onChange={handleChange}
                            placeholder="e.g. Cotton, Wheat"
                            className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 border-b pb-2">Personal Information</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center"><User className="h-4 w-4 mr-2" /> Full Name</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">{profile?.username || profile?.name || 'Not added'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center"><Mail className="h-4 w-4 mr-2" /> Email Address</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">{profile?.email || 'Not added'}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center"><Phone className="h-4 w-4 mr-2" /> Phone Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{profile?.phone || <span className="text-gray-400 italic">Not added</span>}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 border-b pb-2">Farm Details</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 flex items-center"><MapPin className="h-4 w-4 mr-2" /> Location / Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">{profile?.location || <span className="text-gray-400 italic">Not added</span>}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center"><Maximize className="h-4 w-4 mr-2" /> Farm Size</dt>
                      <dd className="mt-1 text-sm text-gray-900">{profile?.farm_size ? `${profile.farm_size} Acres` : <span className="text-gray-400 italic">Not added</span>}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 flex items-center"><Sprout className="h-4 w-4 mr-2" /> Crop Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{profile?.crop_type || <span className="text-gray-400 italic">Not added</span>}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Credit Information Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                Credit Status
              </h2>
            </div>
            
            <div className="p-6">
              {profile?.farmer_id ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500 flex items-center"><DollarSign className="h-4 w-4 mr-1 text-gray-400" /> Credit Limit</span>
                    <span className="text-sm font-medium text-gray-900">₹{parseFloat(profile.credit_limit || 0).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Available Credit</span>
                    <span className="text-sm font-bold text-green-600">₹{parseFloat(profile.available_credit || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Current Used Credit</span>
                    <span className="text-sm font-medium text-gray-900">₹{parseFloat(profile.current_credit || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500 flex items-center"><TrendingUp className="h-4 w-4 mr-1 text-gray-400" /> Interest Rate</span>
                    <span className="text-sm font-medium text-gray-900">{parseFloat(profile.interest_rate || 0)}% / mo</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Accrued Interest</span>
                    <span className="text-sm font-medium text-orange-600">₹{parseFloat(profile.accrued_interest || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 mt-4 bg-gray-50 p-3 rounded-md">
                    <span className="text-sm font-bold text-gray-900">Total Payable</span>
                    <span className="text-lg font-bold text-red-600">₹{parseFloat(profile.total_payable || 0).toFixed(2)}</span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Please contact the shop owner to make a payment or for any credit related queries.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                    <CreditCard className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Credit account not linked</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your profile is not yet linked to an in-store credit account. Please speak with the shop owner to set one up.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
