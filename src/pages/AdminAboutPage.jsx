import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
const AdminAboutPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState({
    mainTitle: '',
    badgeText: '',
    paragraph1: '',
    paragraph2: '',
    buttonText: '',
    buttonLink: '',
    mainImage: '',
    floatingImage: '',
    floatingBadgeText: '',
    metaTitle: '',
    metaDescription: '',
    isActive: true
  });
  
  // Track local file previews (not uploaded yet)
  const [localMainImageFile, setLocalMainImageFile] = useState(null);
  const [localFloatingImageFile, setLocalFloatingImageFile] = useState(null);
  const [previewMainImage, setPreviewMainImage] = useState('');
  const [previewFloatingImage, setPreviewFloatingImage] = useState('');

  // Fetch about content on load
  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_FILE_URL}/api/admin/about`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch content');
      
      const data = await response.json();
      if (data.success) {
        setContent(data.data);
        // Set preview URLs from existing images in database
        if (data.data.mainImage) {
          const fullImageUrl = data.data.mainImage.startsWith('http') 
            ? data.data.mainImage 
            : `${import.meta.env.VITE_API_FILE_URL}${data.data.mainImage}`;
          setPreviewMainImage(fullImageUrl);
        }
        if (data.data.floatingImage) {
          const fullImageUrl = data.data.floatingImage.startsWith('http') 
            ? data.data.floatingImage 
            : `${import.meta.env.VITE_API_FILE_URL}${data.data.floatingImage}`;
          setPreviewFloatingImage(fullImageUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching about content:', error);
      toast.error('Failed to load about content');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContent(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle image selection (just store locally, don't upload yet)
  const handleImageSelect = (file, type) => {
    if (!file) return;
    
    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'main') {
      setLocalMainImageFile(file);
      setPreviewMainImage(previewUrl);
      // Clear any existing image URL from content (will be replaced on save)
      setContent(prev => ({ ...prev, mainImage: '' }));
    } else {
      setLocalFloatingImageFile(file);
      setPreviewFloatingImage(previewUrl);
      setContent(prev => ({ ...prev, floatingImage: '' }));
    }
  };

  // Upload image to server (called only on save)
  const uploadImageToServer = async (file, type) => {
    const formData = new FormData();
    formData.append('images', file);

    try {
      const token = localStorage.getItem("token");
      const endpoint = type === 'main' 
        ? `${import.meta.env.VITE_API_FILE_URL}/api/admin/about/upload/main-image`
        : `${import.meta.env.VITE_API_FILE_URL}/api/admin/about/upload/floating-image`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
if (data.success) {
  // RETURN ONLY RELATIVE PATH
  return data.data.imageUrl;
}
      throw new Error('Upload response indicated failure');
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      // Prepare the content to save
      let updatedContent = { ...content };
      
      // Upload images if there are new ones selected
      if (localMainImageFile) {
        toast.loading('Uploading main image...', { id: 'main-upload' });
        const mainImageUrl = await uploadImageToServer(localMainImageFile, 'main');
        updatedContent.mainImage = mainImageUrl;
        toast.success('Main image uploaded', { id: 'main-upload' });
      }
      
      if (localFloatingImageFile) {
        toast.loading('Uploading floating image...', { id: 'floating-upload' });
        const floatingImageUrl = await uploadImageToServer(localFloatingImageFile, 'floating');
        updatedContent.floatingImage = floatingImageUrl;
        toast.success('Floating image uploaded', { id: 'floating-upload' });
      }
      
      // Save all content (including image URLs) to database
      const response = await fetch(`${import.meta.env.VITE_API_FILE_URL}/api/admin/about`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedContent)
      });

      if (!response.ok) throw new Error('Failed to update content');

      const data = await response.json();
      if (data.success) {
        toast.success('About content updated successfully');
        
        // Clear local file states since they're now saved
        setLocalMainImageFile(null);
        setLocalFloatingImageFile(null);
        
        // Refresh content to get latest data
        await fetchAboutContent();
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save about content');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset to default content? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_FILE_URL}/api/admin/about/reset`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to reset content');

      const data = await response.json();
      if (data.success) {
        toast.success('Content reset to default');
        // Clear local files
        setLocalMainImageFile(null);
        setLocalFloatingImageFile(null);
        await fetchAboutContent();
      }
    } catch (error) {
      console.error('Error resetting content:', error);
      toast.error('Failed to reset content');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to get image URL for display
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('blob:')) return imagePath;
    return `${import.meta.env.VITE_API_FILE_URL}${imagePath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading about content...</p>
        </div>
      </div>
    );
  }

  return (
     <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">About Page Management</h1>
              <p className="text-gray-600 mt-2">Manage the content displayed on the about section of your website</p>
            </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Content Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Main Content</h2>
              <p className="text-sm text-gray-600 mt-1">Edit the main text content of the about section</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Badge Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge Text
                </label>
                <input
                  type="text"
                  name="badgeText"
                  value={content.badgeText}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., ANMRS IT SOLUTIONS E-COMMERCE"
                />
                <p className="text-xs text-gray-500 mt-1">Small uppercase text above the main title</p>
              </div>

              {/* Main Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Title <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="mainTitle"
                  value={content.mainTitle}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="YOUR ONE-STOP SECURITY & ID SOLUTIONS STORE"
                />
                <p className="text-xs text-gray-500 mt-1">Use &lt;br /&gt; for line breaks</p>
              </div>

              {/* Paragraph 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Paragraph
                </label>
                <textarea
                  name="paragraph1"
                  value={content.paragraph1}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Paragraph 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Second Paragraph
                </label>
                <textarea
                  name="paragraph2"
                  value={content.paragraph2}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Button Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Text
                  </label>
                  <input
                    type="text"
                    name="buttonText"
                    value={content.buttonText}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="SHOP OUR PRODUCTS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Link
                  </label>
                  <input
                    type="text"
                    name="buttonLink"
                    value={content.buttonLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="/shop"
                  />
                </div>
              </div>

              {/* Floating Badge Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floating Badge Text
                </label>
                <input
                  type="text"
                  name="floatingBadgeText"
                  value={content.floatingBadgeText}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="⚡ Fast Shipping • Secure Payments"
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Images</h2>
              <p className="text-sm text-gray-600 mt-1">Manage the images displayed in the about section</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Main Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-400 transition-colors duration-300">
                  <div className="space-y-1 text-center">
                    {previewMainImage ? (
                      <div className="mb-4">
                        <img
                          src={previewMainImage}
                          alt="Main preview"
                          className="mx-auto h-48 w-auto object-cover rounded-lg shadow-md"
                          onError={(e) => {
                            console.error('Image failed to load:', previewMainImage);
                            e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLocalMainImageFile(null);
                            setPreviewMainImage(content.mainImage ? getImageUrl(content.mainImage) : '');
                            setContent(prev => ({ ...prev, mainImage: content.mainImage }));
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="main-image-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="main-image-upload"
                          name="main-image-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageSelect(file, 'main');
                            }
                          }}
                          disabled={saving}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {localMainImageFile ? '📸 New image ready to save' : 'PNG, JPG, GIF up to 10MB'}
                    </p>
                    {localMainImageFile && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Image selected - will be uploaded when you save
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Floating Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floating Image (PVC Cards & ID Cards)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-400 transition-colors duration-300">
                  <div className="space-y-1 text-center">
                    {previewFloatingImage ? (
                      <div className="mb-4">
                        <img
                          src={previewFloatingImage}
                          alt="Floating preview"
                          className="mx-auto h-32 w-32 object-cover rounded-full shadow-md"
                          onError={(e) => {
                            console.error('Image failed to load:', previewFloatingImage);
                            e.target.src = 'https://via.placeholder.com/128x128?text=Invalid+Image';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLocalFloatingImageFile(null);
                            setPreviewFloatingImage(content.floatingImage ? getImageUrl(content.floatingImage) : '');
                            setContent(prev => ({ ...prev, floatingImage: content.floatingImage }));
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="floating-image-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="floating-image-upload"
                          name="floating-image-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageSelect(file, 'floating');
                            }
                          }}
                          disabled={saving}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Square image recommended for circular display
                    </p>
                    {localFloatingImageFile && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Image selected - will be uploaded when you save
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">SEO Settings</h2>
              <p className="text-sm text-gray-600 mt-1">Optimize your about page for search engines</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={content.metaTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="About Us - ANMRS IT Solutions E-Commerce"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended length: 50-60 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  name="metaDescription"
                  value={content.metaDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Learn about our e-commerce platform for ID card manufacturing, RFID technology..."
                />
                <p className="text-xs text-gray-500 mt-1">Recommended length: 150-160 characters</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={content.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Active (Show this section on the website)
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-gray-50 py-4 border-t">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset to Default
            </button>
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

export default AdminAboutPage;