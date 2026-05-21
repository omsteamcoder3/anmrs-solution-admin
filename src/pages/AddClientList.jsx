// AddClientList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const AddClientList = ({ onClientAdded, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    image: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditPage, setShowEditPage] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  // Fetch all clients
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_FILE_URL}/api/clients`);
      if (response.data.success) {
        setClients(response.data.clients);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  // Load clients when edit page opens
  useEffect(() => {
    if (showEditPage) {
      fetchClients();
    }
  }, [showEditPage]);

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, WEBP, GIF, AVIF)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      image: file
    }));
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    
    if (error) setError('');
  };

  // Handle edit client
// Handle edit client
const handleEditClient = (client) => {
  setFormData({
    id: client._id || client.id,  // Use _id for MongoDB
    name: client.name,
    image: null
  });
  // Don't use getImageUrl here, just set the raw URL
  setPreviewUrl(client.imageUrl);
  setEditMode(true);
  setShowEditPage(false);
};
  // Handle delete client
  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_FILE_URL}/api/clients/${clientId}`);
      if (response.data.success) {
        setSuccess('Client deleted successfully!');
        fetchClients(); // Refresh the list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message || 'Failed to delete client');
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client. Please try again.');
    }
  };

  // Handle form submission (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Please enter client name');
      return;
    }
    
    if (!editMode && !formData.image) {
      setError('Please select an image');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      
      let response;
      if (editMode && formData.id) {
        // Update existing client
        response = await axios.put(`${import.meta.env.VITE_API_FILE_URL}/api/clients/${formData.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Add new client
        response = await axios.post(`${import.meta.env.VITE_API_FILE_URL}/api/clients`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      if (response.data.success) {
        setSuccess(editMode ? 'Client updated successfully!' : 'Client added successfully!');
        setFormData({ id: null, name: '', image: null });
        setPreviewUrl(null);
        setEditMode(false);
        
        if (document.getElementById('image-input')) {
          document.getElementById('image-input').value = '';
        }
        
        if (onClientAdded) {
          onClientAdded(response.data.client);
        }
        
        if (onSuccess) {
          onSuccess(response.data.client);
        }
        
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to save client');
      }
    } catch (err) {
      console.error('Error saving client:', err);
      setError(err.response?.data?.message || 'Failed to save client. Please try again.');
    } finally {
      setLoading(false);
    }
  };


const handleCancel = () => {
  // Reset states
  resetForm();

  // Close edit page
  setShowEditPage(false);

  // Redirect to dashboard
  navigate('/dashboard');
};
  // Reset form
  const resetForm = () => {
    setFormData({ id: null, name: '', image: null });
    setPreviewUrl(null);
    setEditMode(false);
    setError('');
    setSuccess('');
    if (document.getElementById('image-input')) {
      document.getElementById('image-input').value = '';
    }
  };
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('blob:')) return imagePath;
  if (imagePath.startsWith('data:')) return imagePath;
  // For paths like /uploads/filename.webp
  return `${import.meta.env.VITE_API_FILE_URL}${imagePath}`;
};
  // Main Add Form
  const AddForm = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
     <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
  
  {/* Close Button */}
  <button
    onClick={handleCancel}
    className="absolute top-0 right-0 z-50 w-9 h-9 rounded-full bg-white/90 hover:bg-red-500 text-gray-700 hover:text-white shadow-lg flex items-center justify-center transition-all duration-300"
  >
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editMode ? 'Edit Client' : 'Add New Client'}
            </h2>
            <p className="text-orange-100 text-sm mt-1">
              {editMode ? 'Update client information' : 'Add client to the ticker'}
            </p>
          </div>
          <button
            onClick={() => setShowEditPage(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all"
          >
            Manage Clients
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Client Name <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter client name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all"
              disabled={loading}
              autoFocus
            />
          </div>
          
          {/* Image Upload */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Client Logo/Image <span className="text-orange-500">*</span>
            </label>
            
            <div className="mt-2 flex flex-col items-center">
              {previewUrl ? (
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 ring-4 ring-orange-500/30 mb-3">
                   <img
  src={getImageUrl(previewUrl)}
  alt="Preview"
  className="w-full h-full object-cover"
/>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, image: null }));
                      setPreviewUrl(null);
                      if (document.getElementById('image-input')) {
                        document.getElementById('image-input').value = '';
                      }
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-3 border-2 border-dashed border-gray-300">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              <label className="relative cursor-pointer">
                <input
                  id="image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp,image/gif,image/avif"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={loading}
                />
                <div className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium">
                  {previewUrl ? 'Change Image' : 'Select Image'}
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                JPEG, PNG, WEBP, GIF, AVIF (Max 5MB)
              </p>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {editMode ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                editMode ? 'Update Client' : 'Add Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Edit Page - Shows all clients
  const EditPage = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">

  {/* Close Button */}
  <button
    onClick={handleCancel}
    className="absolute top-0 right-0 z-50 w-9 h-9 rounded-full bg-white/90 hover:bg-red-500 text-gray-700 hover:text-white shadow-lg flex items-center justify-center transition-all duration-300"
  >
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Clients</h2>
            <p className="text-orange-100 text-sm mt-1">View, edit or delete existing clients</p>
          </div>
          <button
            onClick={() => {
              setShowEditPage(false);
              resetForm();
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all"
          >
            Add New
          </button>
        </div>
        
        {/* Clients List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loadingClients ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-orange-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No clients found</p>
              <p className="text-gray-400 text-sm mt-1">Click "Add New" to create your first client</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map((client) => (
                <div
                  key={client._id}
                  className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition-shadow border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Client Image */}
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                   <img
  src={getImageUrl(client.imageUrl)}
  alt={client.name}
  className="w-full h-full object-cover"
/>
                    </div>
                    
                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 font-semibold text-lg truncate">
                        {client.name}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Slug: {client.slug}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Added: {new Date(client.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClient(client)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        title="Edit client"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client._id)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        title="Delete client"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <p className="text-gray-600 text-sm text-center">
            Total Clients: <span className="font-semibold text-orange-600">{clients.length}</span>
          </p>
        </div>
      </div>
    </div>
  );

  return showEditPage ? <EditPage /> : <AddForm />;
};

export default AddClientList;