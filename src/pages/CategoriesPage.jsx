// src/pages/CategoriesPage.jsx
import React, { useState, useEffect } from 'react';
import AddCategoryModal from './AddCategoryModal';
import Sidebar from '../components/Sidebar';
const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState({});

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
   const token = localStorage.getItem("token");

const res = await fetch(`${import.meta.env.VITE_API_FILE_URL}/api/categories`, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCategoryAdded = async (data, action) => {
    await fetchCategories(); // Refresh the list
  };

  const handleDeleteCategory = async (categoryId, categoryName, categorySlug) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [categoryId]: true }));
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_FILE_URL}/api/categories/${categorySlug}`, {
      method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

      if (!res.ok) throw new Error('Failed to delete category');

      alert(`✅ Category "${categoryName}" deleted successfully!`);
      await fetchCategories();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  // Helper to get field type badge color
  const getFieldTypeColor = (type) => {
    switch(type) {
      case 'text': return 'bg-blue-100 text-blue-700';
      case 'number': return 'bg-green-100 text-green-700';
      case 'select': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };


  return (
  <div className="flex min-h-screen">
    
    <Sidebar />

    <div className="flex-1 bg-gray-50 p-4 md:p-8 overflow-x-auto">

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-2">Manage your product categories and their attributes</p>
          </div>
          <button
            onClick={handleAddCategory}
            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add New Category
          </button>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Categories Yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first category</p>
            <button
              onClick={handleAddCategory}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700"
            >
              Create Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
              >
                <div className="p-6">
                  {/* Category Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{category.name}</h3>
                        <p className="text-sm text-gray-500">Slug: {category.slug}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {category.fields?.length || 0} fields
                    </span>
                  </div>

                  {/* Fields Preview */}
                  {category.fields && category.fields.length > 0 ? (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Attributes:</p>
                      <div className="flex flex-wrap gap-2">
                        {category.fields.slice(0, 3).map((field, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${getFieldTypeColor(field.type)}`}
                          >
                            {field.label}
                            {field.type === 'number' && field.unit && (
                              <span className="ml-1 opacity-75">({field.unit})</span>
                            )}
                          </span>
                        ))}
                        {category.fields.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                            +{category.fields.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic mb-4">No attributes defined</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Edit category"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id, category.name, category.slug)}
                      disabled={deleteLoading[category._id]}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      title="Delete category"
                    >
                      {deleteLoading[category._id] ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onCategoryAdded={handleCategoryAdded}
        categoryToEdit={editingCategory}
      />
    </div>
    </div>
  );
};

export default CategoriesPage;