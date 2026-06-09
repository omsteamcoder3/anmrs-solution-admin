"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';

const AdminMapAndLogoPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    logoAlt: 'Company Logo',
    logoLink: '/',
    mapEmbedUrl: '',
    isActive: true,
    logo: ''
  });
  
  // Local file state
  const [localLogoFile, setLocalLogoFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_FILE_URL

  // Fetch settings on load
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/map-logo`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
        
        if (data.data.logo) {
          setPreviewLogo(`${API_BASE_URL}/uploads/${data.data.logo}`);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setLocalLogoFile(file);
    setPreviewLogo(previewUrl);
    setSettings(prev => ({ ...prev, logo: '' }));
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('images', file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/map-logo/upload/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      if (data.success) {
        return data.data.imageUrl;
      }
      throw new Error(data.message || 'Upload response indicated failure');
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const deleteLogo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/map-logo/logo`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Delete failed');

      const data = await response.json();
      if (data.success) {
        toast.success('Logo deleted successfully');
        setPreviewLogo('');
        setLocalLogoFile(null);
        setSettings(prev => ({ ...prev, logo: '' }));
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('Failed to delete logo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      // Upload image if there's a new one
      if (localLogoFile) {
        toast.loading('Uploading logo...', { id: 'logo-upload' });
        const logoUrl = await uploadImage(localLogoFile);
        setSettings(prev => ({ ...prev, logo: logoUrl }));
        setLocalLogoFile(null);
        toast.success('Logo uploaded', { id: 'logo-upload' });
      }
      
      // Prepare data to save
      const saveData = {
        logoAlt: settings.logoAlt,
        logoLink: settings.logoLink,
        mapEmbedUrl: settings.mapEmbedUrl,
        isActive: settings.isActive
      };
      
      console.log('Saving settings:', saveData);
      
      // Save settings
      const response = await fetch(`${API_BASE_URL}/api/admin/map-logo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(saveData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Settings saved successfully');
        await fetchSettings(); // Refresh to get latest data
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Map & Logo Management</h1>
              <p className="text-gray-600 mt-2">Manage website logo and Google Maps embed URL</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Logo Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Logo Settings</h2>
                  <p className="text-sm text-gray-600 mt-1">Upload and manage your website logo</p>
                </div>
                
                <div className="p-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website Logo
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-400 transition-colors">
                      <div className="space-y-1 text-center">
                        {previewLogo ? (
                          <div className="mb-4">
                            <img
                              src={previewLogo}
                              alt="Logo preview"
                              className="mx-auto h-24 w-auto object-contain"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/200x60?text=Logo';
                              }}
                            />
                            <div className="mt-2 flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={deleteLogo}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              >
                                Remove Logo
                              </button>
                            </div>
                          </div>
                        ) : (
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500">
                            <span>Upload Logo</span>
                            <input
                              id="logo-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageSelect(file);
                              }}
                              disabled={saving}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Recommended: 200x60px. PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo Alt Text
                    </label>
                    <input
                      type="text"
                      name="logoAlt"
                      value={settings.logoAlt}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logo Link URL (where logo clicks to)
                    </label>
                    <input
                      type="text"
                      name="logoLink"
                      value={settings.logoLink}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Map Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Google Maps Settings</h2>
                  <p className="text-sm text-gray-600 mt-1">Configure the map displayed on your contact page</p>
                </div>
                
                <div className="p-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Map Embed URL
                    </label>
                    <input
                      type="text"
                      name="mapEmbedUrl"
                      value={settings.mapEmbedUrl}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="https://www.google.com/maps/embed?pb=..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get embed code from Google Maps → Share → Embed a map. Copy the URL from the src attribute.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">Status</h2>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={settings.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Active (Show logo and map on the website)
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-gray-50 py-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 hover:shadow-lg'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMapAndLogoPage;