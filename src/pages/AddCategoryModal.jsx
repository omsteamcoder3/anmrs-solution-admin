// src/components/AddCategoryModal.jsx
import React, { useState, useEffect } from 'react';

const AddCategoryModal = ({ isOpen, onClose, onCategoryAdded, categoryToEdit = null }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState([
    { label: '', type: 'text', unit: '', options: '' }
  ]);

  // Initialize form when editing
  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      
      const formattedFields = categoryToEdit.fields.map(field => ({
        label: field.label,
        type: field.type,
        unit: field.unit || '',
        options: field.type === 'select' 
          ? (Array.isArray(field.options) ? field.options.join(', ') : field.options)
          : '',
        _id: field._id
      }));

      setFields(formattedFields.length > 0 ? formattedFields : [
        { label: '', type: 'text', unit: '', options: '' }
      ]);
    } else {
      resetForm();
    }
  }, [categoryToEdit, isOpen]);

  const resetForm = () => {
    setName('');
    setFields([{ label: '', type: 'text', unit: '', options: '' }]);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addField = () => {
    setFields(prev => [...prev, { label: '', type: 'text', unit: '', options: '' }]);
  };

  const removeField = (index) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    setFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };

      // Handle conditional field updates
      if (key === 'type') {
        if (value === 'number') {
          updated[index].options = '';
        }
        if (value !== 'number') {
          updated[index].unit = '';
        }
        if (value !== 'select') {
          updated[index].options = '';
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    // Format fields for API
    const formattedFields = fields
      .filter(f => f.label.trim())
      .map(f => ({
        label: f.label,
        type: f.type,
        unit: f.type === 'number' ? f.unit : '',
        options: f.type === 'select'
          ? (Array.isArray(f.options) 
              ? f.options 
              : f.options.split(',').map(o => o.trim()))
          : [],
      }));

    try {
      setLoading(true);
      setError('');

const url = categoryToEdit
  ? `${import.meta.env.VITE_API_FILE_URL}/api/categories/${categoryToEdit.slug}` // Use slug instead of _id
  : `${import.meta.env.VITE_API_FILE_URL}/api/categories`;

      const method = categoryToEdit ? 'PUT' : 'POST';

const token = localStorage.getItem("token");

const res = await fetch(url, {
  method,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({ name, fields: formattedFields }),
});

      if (!res.ok) {
        throw new Error(categoryToEdit ? 'Failed to update category' : 'Failed to create category');
      }

      const data = await res.json();
      
      // Call the callback with the result
      if (onCategoryAdded) {
        onCategoryAdded(data, categoryToEdit ? 'updated' : 'created');
      }
      
      handleClose();
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg w-full max-w-4xl my-4 sm:my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-gradient-to-r from-orange-50 to-red-50">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
              {categoryToEdit ? 'Edit Category' : 'Add New Category'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {categoryToEdit 
                ? 'Modify category details and attributes' 
                : 'Create a new category with custom attributes'}
            </p>
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-full transition-all duration-300"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Category Name */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 sm:p-6 rounded-xl border border-orange-100">
            <label className="block font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></span>
              Category Name
            </label>
            <input
              type="text"
              className="w-full bg-white border-2 border-orange-100 rounded-lg px-4 py-3 text-gray-800 focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all duration-300"
              placeholder="E.g. Electronics, Clothing, Furniture"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {/* Dynamic Fields Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Attribute Fields</h3>
                <p className="text-sm text-gray-500">Define custom attributes for products in this category</p>
              </div>
              <button
                type="button"
                onClick={addField}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Attribute
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field, i) => (
                <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:border-red-200 transition-all duration-300">
                  {/* Field Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-400 to-orange-400"></div>
                      <span className="text-xs font-medium text-gray-500">Field #{i + 1}</span>
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(i)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-all duration-300"
                        title="Remove field"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Field Content */}
                  <div className="space-y-3">
                    {/* Label */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Attribute Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Size, Color, Weight"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:outline-none"
                        value={field.label}
                        onChange={e => updateField(i, 'label', e.target.value)}
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Data Type</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['text', 'number', 'select'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateField(i, 'type', type)}
                            className={`px-2 py-1.5 rounded text-xs font-medium transition-all duration-300 ${
                              field.type === type
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Conditional Inputs */}
                    {field.type === 'number' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                        <input
                          type="text"
                          placeholder="e.g., kg, cm, GB"
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:outline-none"
                          value={field.unit}
                          onChange={e => updateField(i, 'unit', e.target.value)}
                        />
                      </div>
                    )}

                    {field.type === 'select' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Options (comma separated)</label>
                        <input
                          type="text"
                          placeholder="e.g., Small, Medium, Large"
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:outline-none"
                          value={field.options}
                          onChange={e => updateField(i, 'options', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                loading || !name.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{categoryToEdit ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    {categoryToEdit ? (
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    ) : (
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    )}
                  </svg>
                  <span>{categoryToEdit ? 'Update Category' : 'Create Category'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;