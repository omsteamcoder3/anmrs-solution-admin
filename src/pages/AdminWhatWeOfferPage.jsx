import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const AdminWhatWeOfferPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [uploadingImages, setUploadingImages] = useState({});
  const [sectionSettings, setSectionSettings] = useState({
    sectionTitle: 'WHAT WE OFFER',
    sectionMainTitle: 'OUR SERVICES',
    isActive: true
  });

  // Fetch services on load
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_FILE_URL}/api/admin/what-we-offer`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch services');
      
      const data = await response.json();
      if (data.success) {
        setServices(data.data.services || []);
        setSectionSettings(data.data.sectionSettings || {
          sectionTitle: 'WHAT WE OFFER',
          sectionMainTitle: 'OUR SERVICES',
          isActive: true
        });
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSectionSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...services];
    updatedServices[index][field] = value;
    setServices(updatedServices);
  };

  const addNewService = () => {
    setServices([
      ...services,
      {
        title: '',
        desc: '',
        image: '',
        order: services.length
      }
    ]);
  };

  const removeService = (index) => {
    if (confirm('Are you sure you want to remove this service?')) {
      const updatedServices = services.filter((_, i) => i !== index);
      setServices(updatedServices);
    }
  };

  const handleImageUpload = async (file, index) => {
    const formData = new FormData();
    formData.append('images', file);

    try {
      setUploadingImages(prev => ({ ...prev, [index]: true }));
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${import.meta.env.VITE_API_FILE_URL}/api/admin/what-we-offer/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      if (data.success) {
        const imageUrl = data.data.imageUrl;
        const fullImageUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : `${import.meta.env.VITE_API_FILE_URL}${imageUrl}`;
        
        const updatedServices = [...services];
        updatedServices[index].image = fullImageUrl;
        setServices(updatedServices);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(services);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const reorderedServices = items.map((item, idx) => ({
      ...item,
      order: idx
    }));
    
    setServices(reorderedServices);
    toast.success('Order updated');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      const payload = {
        services: services.map((service, index) => ({
          ...service,
          order: index
        })),
        sectionSettings
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_FILE_URL}/api/admin/what-we-offer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to update services');

      const data = await response.json();
      if (data.success) {
        toast.success('Services updated successfully');
        await fetchServices();
      }
    } catch (error) {
      console.error('Error saving services:', error);
      toast.error('Failed to save services');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">What We Offer Management</h1>
          <p className="text-gray-600 mt-2">Manage the services and features displayed in the what we offer section</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Section Settings</h2>
              <p className="text-sm text-gray-600 mt-1">Configure the section header and visibility</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Badge Text
                </label>
                <input
                  type="text"
                  name="sectionTitle"
                  value={sectionSettings.sectionTitle}
                  onChange={handleSectionSettingChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="WHAT WE OFFER"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Main Title
                </label>
                <input
                  type="text"
                  name="sectionMainTitle"
                  value={sectionSettings.sectionMainTitle}
                  onChange={handleSectionSettingChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="OUR SERVICES"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={sectionSettings.isActive}
                  onChange={handleSectionSettingChange}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Active (Show this section on the website)
                </label>
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Services</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage your services (drag to reorder)</p>
                </div>
                <button
                  type="button"
                  onClick={addNewService}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  + Add New Service
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="services">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {services.map((service, index) => (
                        <Draggable key={index} draggableId={`service-${index}`} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-move text-gray-400 hover:text-gray-600 mt-2"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>

                                <div className="flex-1 space-y-4">
                                  <div className="grid grid-cols-1 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Service Title
                                      </label>
                                      <input
                                        type="text"
                                        value={service.title}
                                        onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="e.g., ID Card Manufacturing"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                      </label>
                                      <textarea
                                        value={service.desc}
                                        onChange={(e) => handleServiceChange(index, 'desc', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Describe this service..."
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Service Image
                                      </label>
                                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-400 transition-colors duration-300">
                                        <div className="space-y-1 text-center">
                                          {service.image ? (
                                            <div className="mb-4">
                                              <img
                                                src={service.image}
                                                alt={service.title}
                                                className="mx-auto h-32 w-32 object-cover rounded-lg shadow-md"
                                                onError={(e) => {
                                                  e.target.src = 'https://via.placeholder.com/128x128?text=No+Image';
                                                }}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updatedServices = [...services];
                                                  updatedServices[index].image = '';
                                                  setServices(updatedServices);
                                                }}
                                                className="mt-2 text-sm text-red-600 hover:text-red-700"
                                              >
                                                Remove Image
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
                                              htmlFor={`image-upload-${index}`}
                                              className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                                            >
                                              <span>Upload an image</span>
                                              <input
                                                id={`image-upload-${index}`}
                                                name={`image-upload-${index}`}
                                                type="file"
                                                className="sr-only"
                                                accept="image/*"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    handleImageUpload(file, index);
                                                  }
                                                }}
                                                disabled={uploadingImages[index]}
                                              />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                          </div>
                                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                          {uploadingImages[index] && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
                                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                                              Uploading...
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeService(index)}
                                  className="text-red-600 hover:text-red-700 mt-2"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {services.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No services added yet. Click "Add New Service" to get started.</p>
                </div>
              )}
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
  );
};

export default AdminWhatWeOfferPage;