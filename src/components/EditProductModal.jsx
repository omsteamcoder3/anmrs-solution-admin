// src/components/EditProductModal.jsx - UPDATED WITH HIERARCHICAL CATEGORIES & ERROR HANDLING
import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../api/categories';
import { productsAPI } from '../api/products';

const EditProductModal = ({ isOpen, onClose, onEditProduct, product }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    basePrice: '',
    description: '',
    category: '',
    seller: '',
    stock: '',
    
    // ✅ SEO Fields
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImageFile: null,
    ogImagePreview: null,
    ogImagePath: '', // ✅ ADD THIS LINE
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mainImageFiles, setMainImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  // Add these state declarations with your other useState hooks
const [categoryFields, setCategoryFields] = useState([]);
const [fieldValues, setFieldValues] = useState({});
  // ✅ Specifications state
  const [specifications, setSpecifications] = useState([]);
  
  // ✅ Key Features state
  const [keyFeatures, setKeyFeatures] = useState([]);
  const [newKeyFeature, setNewKeyFeature] = useState('');

  // ✅ Variants state
  const [variants, setVariants] = useState([]);
  const [variantImageFiles, setVariantImageFiles] = useState({});
  const [variantImagePreviews, setVariantImagePreviews] = useState({});

  // ✅ Offer System state - DISABLED when variants exist
  const [hasOffer, setHasOffer] = useState(false);
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');

  // ✅ Track deleted images for backend deletion
  const [deletedMainImages, setDeletedMainImages] = useState([]);
  const [deletedVariantImages, setDeletedVariantImages] = useState({});
  // ✅ Track deleted OG image
  const [deletedOgImage, setDeletedOgImage] = useState(null);

  // API URL for images
  const API_FILE_URL = import.meta.env.VITE_API_FILE_URL;

  // ============= SCROLL TO ERROR WHEN ERROR OCCURS =============
  useEffect(() => {
    if (error) {
      // Scroll to top of modal smoothly to show error
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) {
        modalContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [error]);

  // Cleanup variant image previews on unmount
  useEffect(() => {
    return () => {
      Object.values(variantImagePreviews).forEach(previews => {
        previews?.forEach(preview => URL.revokeObjectURL(preview));
      });
    };
  }, [variantImagePreviews]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (product) {
        populateFormData();
      }
    }
  }, [isOpen, product]);

// In EditProductModal.jsx, update the fetchCategories function:

const fetchCategories = async () => {
  try {
    setCategoriesLoading(true);
    // Change this line from getActiveCategories to getAllCategories
    const response = await categoriesAPI.getAllCategories(); // ← FIX THIS LINE
    
    let categoriesArray = [];
    if (Array.isArray(response.data)) {
      categoriesArray = response.data;
    } else if (response.data.categories && Array.isArray(response.data.categories)) {
      categoriesArray = response.data.categories;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      categoriesArray = response.data.data;
    }
    
    setCategories(categoriesArray);
  } catch (err) {
    console.error('❌ Error fetching categories:', err);
    setError('Failed to fetch categories');
    // Scroll to show error
    const modalContent = document.querySelector('.overflow-y-auto');
    if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    setCategories([]);
  } finally {
    setCategoriesLoading(false);
  }
};
const fetchCategoryFields = async (categoryId) => {
  if (!categoryId) return;
  
  try {
    setCategoriesLoading(true);
    
    // Find the selected category to get its slug
    const selectedCategory = categories.find(cat => cat._id === categoryId);
    
    if (selectedCategory && selectedCategory.slug) {
      console.log("📡 Fetching fields for category slug:", selectedCategory.slug);
      
      const response = await categoriesAPI.getCategoryFields(selectedCategory.slug);
      
      console.log("📦 Category fields response:", response);
      
      let fields = [];
      
      // Parse response based on your API structure
      if (response.data) {
        if (Array.isArray(response.data)) {
          fields = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          fields = response.data.data;
        } else if (response.data.fields && Array.isArray(response.data.fields)) {
          fields = response.data.fields;
        }
      }
      
      console.log("📋 Extracted fields:", fields);
      setCategoryFields(fields);
      
      // After setting fields, populate fieldValues from product.categoryAttributes
      if (product?.categoryAttributes && Object.keys(product.categoryAttributes).length > 0) {
        console.log("📦 Populating category attributes from product:", product.categoryAttributes);
        
        const populatedValues = {};
        
        // For each field, check if there's a matching value in product.categoryAttributes
        fields.forEach(field => {
          const fieldLabel = field.label || field.name;
          if (fieldLabel && product.categoryAttributes[fieldLabel]) {
            // Extract the value from the nested structure
            populatedValues[fieldLabel] = product.categoryAttributes[fieldLabel].value || '';
            console.log(`✅ Populated ${fieldLabel}: ${populatedValues[fieldLabel]}`);
          }
        });
        
        setFieldValues(populatedValues);
      }
    }
  } catch (err) {
    console.error("❌ Error fetching category fields:", err);
    setCategoryFields([]);
  } finally {
    setCategoriesLoading(false);
  }
};
const handleFieldValueChange = (label, value) => {
  setFieldValues((prev) => ({
    ...prev,
    [label]: value
  }));
};
const populateFormData = () => {
  if (!product) return;

  console.log('📝 Populating form with product data:', product);
  
  // Determine product type from existing data
  const hasVariants = product.variants && product.variants.length > 0;
  const hasProductOffer = product.hasOffer === true;
  
  if (hasVariants) {
    setHasOffer(false);
    setOriginalPrice('');
    setDiscountPercentage('');
  } else if (hasProductOffer) {
    setHasOffer(true);
    setOriginalPrice(product.originalPrice || '');
    setDiscountPercentage(product.discountPercentage || '');
  } else {
    setHasOffer(false);
    setOriginalPrice('');
    setDiscountPercentage('');
  }
  
  // Construct OG image preview
  let ogImagePreview = '';
  let ogImagePath = '';

if (product.ogImage) {
  // Store the clean path for sending to backend
  if (product.ogImage.startsWith('http')) {
    // Extract just the path from URL
    try {
      const url = new URL(product.ogImage);
      ogImagePath = url.pathname; // This gives "/uploads/filename.webp"
    } catch (e) {
      // If URL parsing fails, extract filename
      const filename = product.ogImage.split('/').pop();
      ogImagePath = `/uploads/${filename}`;
    }
    ogImagePreview = product.ogImage; // Keep full URL for display
  } else {
    // Already a path
    ogImagePath = product.ogImage;
    ogImagePreview = product.ogImage.startsWith('/uploads/') 
      ? `${API_FILE_URL}${product.ogImage}`
      : `${API_FILE_URL}/uploads/${product.ogImage}`;
  }
} else if (product.images && product.images.length > 0 && product.images[0].image) {
  // Fallback to first main image
  if (product.images[0].image.startsWith('http')) {
    ogImagePreview = product.images[0].image;
    try {
      const url = new URL(product.images[0].image);
      ogImagePath = url.pathname;
    } catch (e) {
      const filename = product.images[0].image.split('/').pop();
      ogImagePath = `/uploads/${filename}`;
    }
  } else if (product.images[0].image.startsWith('/uploads/')) {
    ogImagePath = product.images[0].image;
    ogImagePreview = `${API_FILE_URL}${product.images[0].image}`;
  } else {
    ogImagePath = `/uploads/${product.images[0].image}`;
    ogImagePreview = `${API_FILE_URL}/uploads/${product.images[0].image}`;
  }
}
  
  console.log('📸 OG Image - Path for backend:', ogImagePath);
  console.log('📸 OG Image - Preview URL:', ogImagePreview);
  
  setFormData({
    name: product.name || '',
    slug: product.slug || '',
    basePrice: product.basePrice || product.price || '',
    description: product.description || '',
    category: product.category?._id || product.category || '',
    seller: product.seller || '',
    stock: product.stock || '',
    
    // SEO Fields
    metaTitle: product.metaTitle || '',
    metaDescription: product.metaDescription || '',
    metaKeywords: product.metaKeywords ? product.metaKeywords.join(', ') : '',
    canonicalUrl: product.canonicalUrl || '',
    ogTitle: product.ogTitle || '',
    ogDescription: product.ogDescription || '',
    ogImageFile: null,
    ogImagePreview: ogImagePreview,
    ogImagePath: ogImagePath,
  });

  // Set existing images
  if (product.images && Array.isArray(product.images)) {
    setExistingImages(product.images.filter(img => img.image));
  } else {
    setExistingImages([]);
  }

  // Set specifications
  if (product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0) {
    setSpecifications(product.specifications.map(spec => ({
      key: spec.key || '',
      value: spec.value || ''
    })));
  } else {
    setSpecifications([]);
  }

  // Set key features
  if (product.keyFeatures && Array.isArray(product.keyFeatures) && product.keyFeatures.length > 0) {
    setKeyFeatures(product.keyFeatures.filter(feature => typeof feature === 'string' && feature.trim() !== ''));
  } else {
    setKeyFeatures([]);
  }

  // Set variants
  if (hasVariants) {
    setVariants(product.variants.map(variant => ({
      variantName: variant.variantName || '',
      price: variant.price || '',
      originalPrice: variant.originalPrice || '',
      description: variant.description || '',
      weight: variant.weight || '',
      weightUnit: variant.weightUnit || 'gram',
      stock: variant.stock || '',
      images: variant.images || [],
      sku: variant.sku || '',
      isDefault: variant.isDefault || false,
      discountPercentage: variant.discountPercentage || 0,
      features: variant.features || []
    })));
  } else {
    setVariants([]);
  }

  // ============= NEW: Populate category attributes =============
  if (product.category && product.categoryAttributes && Object.keys(product.categoryAttributes).length > 0) {
    console.log("📦 Product has category attributes:", product.categoryAttributes);
    
    // Convert the nested structure to simple key-value pairs for fieldValues
    const initialFieldValues = {};
    
    Object.entries(product.categoryAttributes).forEach(([key, valueObj]) => {
      if (valueObj && typeof valueObj === 'object' && valueObj.value !== undefined) {
        initialFieldValues[key] = valueObj.value;
        console.log(`✅ Set initial field value for ${key}: ${valueObj.value}`);
      }
    });
    
    setFieldValues(initialFieldValues);
    
    // Also fetch category fields to get the field definitions
    if (product.category?._id || product.category) {
      const categoryId = product.category._id || product.category;
      setTimeout(() => {
        fetchCategoryFields(categoryId);
      }, 500); // Small delay to ensure categories are loaded
    }
  }
  // =============================================================

  // Reset states
  setMainImageFiles([]);
  setVariantImageFiles({});
  setVariantImagePreviews({});
  setNewKeyFeature('');
  setError('');
  setDeletedMainImages([]);
  setDeletedVariantImages({});
  setDeletedOgImage(null);
};

const handleInputChange = (e) => {
  const { name, value, type, checked } = e.target;
  
  const updatedFormData = {
    ...formData,
    [name]: type === 'checkbox' ? checked : value
  };

  if (name === 'name' && autoGenerateSlug) {
    const generatedSlug = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
    
    updatedFormData.slug = generatedSlug;
  }

  setFormData(updatedFormData);

  // Fetch category fields when category changes
  if (name === 'category' && value) {
    fetchCategoryFields(value);
  }
};
  // ✅ Specifications handlers
  const handleSpecificationChange = (index, field, value) => {
    const updatedSpecifications = [...specifications];
    updatedSpecifications[index] = {
      ...updatedSpecifications[index],
      [field]: value
    };
    setSpecifications(updatedSpecifications);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    const updatedSpecifications = [...specifications];
    updatedSpecifications.splice(index, 1);
    setSpecifications(updatedSpecifications);
  };

  // ✅ Key Features handlers
  const handleAddKeyFeature = () => {
    if (newKeyFeature.trim() !== '') {
      setKeyFeatures([...keyFeatures, newKeyFeature.trim()]);
      setNewKeyFeature('');
    }
  };

  const handleRemoveKeyFeature = (index) => {
    const updatedKeyFeatures = [...keyFeatures];
    updatedKeyFeatures.splice(index, 1);
    setKeyFeatures(updatedKeyFeatures);
  };

  // ✅ Variant handlers
  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    
    if (field === 'price' || field === 'originalPrice') {
      updatedVariants[index] = {
        ...updatedVariants[index],
        [field]: value
      };
      
      // Auto-calculate discount percentage
      const price = field === 'price' ? value : updatedVariants[index].price;
      const original = field === 'originalPrice' ? value : updatedVariants[index].originalPrice;
      
      if (original && price && parseFloat(original) > parseFloat(price)) {
        const discount = ((parseFloat(original) - parseFloat(price)) / parseFloat(original)) * 100;
        updatedVariants[index].discountPercentage = Math.round(discount * 100) / 100;
      } else {
        updatedVariants[index].discountPercentage = 0;
      }
    } else if (field === 'isDefault') {
      updatedVariants.forEach((v, i) => {
        v.isDefault = i === index;
      });
    } else {
      updatedVariants[index] = {
        ...updatedVariants[index],
        [field]: value
      };
    }
    
    setVariants(updatedVariants);
  };

  const addVariant = () => {
    const variantNumber = variants.length + 1;
    const newVariant = {
      variantName: `Pack ${variantNumber}`,
      price: formData.basePrice || '',
      originalPrice: '',
      description: '',
      weight: '',
      weightUnit: 'gram',
      stock: '',
      images: [],
      sku: '',
      isDefault: variants.length === 0,
      discountPercentage: 0,
      features: []
    };
    
    setVariants([...variants, newVariant]);
    
    // ✅ When first variant is added, clear main images and description
    if (variants.length === 0) {
      setMainImageFiles([]);
      setExistingImages([]);
      setFormData(prev => ({ ...prev, description: '' }));
      // ✅ Force disable product-level offer
      setHasOffer(false);
      setOriginalPrice('');
      setDiscountPercentage('');
    }
  };

  const removeVariant = (index) => {
    // Clean up variant image previews
    if (variantImagePreviews[index]) {
      variantImagePreviews[index].forEach(preview => URL.revokeObjectURL(preview));
    }
    
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    
    if (updatedVariants.length > 0 && !updatedVariants.some(v => v.isDefault)) {
      updatedVariants[0].isDefault = true;
    }
    
    setVariants(updatedVariants);
    
    // Update variant image files and previews
    const updatedVariantFiles = {};
    const updatedVariantPreviews = {};
    
    Object.keys(variantImageFiles).forEach(key => {
      const keyNum = parseInt(key);
      if (keyNum < index) {
        updatedVariantFiles[key] = variantImageFiles[key];
        updatedVariantPreviews[key] = variantImagePreviews[key];
      } else if (keyNum > index) {
        updatedVariantFiles[keyNum - 1] = variantImageFiles[key];
        updatedVariantPreviews[keyNum - 1] = variantImagePreviews[key];
      }
    });
    
    setVariantImageFiles(updatedVariantFiles);
    setVariantImagePreviews(updatedVariantPreviews);
  };

  // ✅ Variant image handlers
  const handleVariantImageChange = (e, variantIndex) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Check max images limit
    const currentImages = variantImageFiles[variantIndex] || [];
    const existingCount = variants[variantIndex]?.images?.length || 0;
    
    if (currentImages.length + files.length + existingCount > 10) {
      setError("⚠️ Maximum 10 images allowed per variant");
      // Scroll to show error
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
      e.target.value = '';
      return;
    }
    
    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setVariantImageFiles(prev => ({
      ...prev,
      [variantIndex]: [...(prev[variantIndex] || []), ...files]
    }));
    
    setVariantImagePreviews(prev => ({
      ...prev,
      [variantIndex]: [...(prev[variantIndex] || []), ...newPreviews]
    }));
    
    // Clear any previous errors
    setError('');
    
    // Clear file input
    setTimeout(() => {
      e.target.value = '';
    }, 0);
  };

  const removeVariantImageFile = (variantIndex, imageIndex) => {
    // Revoke object URL
    if (variantImagePreviews[variantIndex]?.[imageIndex]) {
      URL.revokeObjectURL(variantImagePreviews[variantIndex][imageIndex]);
    }
    
    setVariantImagePreviews(prev => {
      const updated = { ...prev };
      if (updated[variantIndex]) {
        updated[variantIndex] = updated[variantIndex].filter((_, i) => i !== imageIndex);
      }
      return updated;
    });
    
    setVariantImageFiles(prev => {
      const updated = { ...prev };
      if (updated[variantIndex]) {
        updated[variantIndex] = updated[variantIndex].filter((_, i) => i !== imageIndex);
      }
      return updated;
    });
  };

  const removeExistingVariantImage = (variantIndex, imageIndex) => {
    const updatedVariants = [...variants];
    const imageToDelete = updatedVariants[variantIndex].images[imageIndex];
    
    // Track deleted variant image
    setDeletedVariantImages(prev => ({
      ...prev,
      [variantIndex]: [...(prev[variantIndex] || []), imageToDelete.image]
    }));
    
    updatedVariants[variantIndex].images = updatedVariants[variantIndex].images.filter(
      (_, idx) => idx !== imageIndex
    );
    setVariants(updatedVariants);
  };

  // ✅ Image handlers
  const handleImageChange = (e) => {
    // Prevent image upload if variants exist
    if (variants.length > 0) {
      setError("❌ Main product images are disabled when variants exist.\n\n✅ Please add images directly to each variant below.");
      // Scroll to show error
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
      e.target.value = '';
      return;
    }
    
    const files = Array.from(e.target.files);
    setMainImageFiles(prev => [...prev, ...files]);
    
    // Clear any previous errors
    setError('');
    
    // Clear file input
    e.target.value = '';
  };

  const removeExistingImage = (index) => {
    const imageToDelete = existingImages[index];
    setDeletedMainImages(prev => [...prev, imageToDelete.image]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImageFile = (index) => {
    setMainImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ OG Image handler
  const removeOgImage = () => {
    if (formData.ogImagePreview && !formData.ogImagePreview.startsWith('blob:')) {
      // This is an existing OG image - track it for deletion
      setDeletedOgImage(formData.ogImagePath || formData.ogImagePreview);
    }
    
    // Clear OG image from form
    setFormData(prev => ({
      ...prev,
      ogImageFile: null,
      ogImagePreview: null,
      ogImagePath: ''
    }));
  };

  const handleSlugToggle = (e) => {
    setAutoGenerateSlug(e.target.checked);
    if (e.target.checked && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug
      }));
    }
  };
const renderCategoryAttributes = () => {
  if (categoriesLoading) {
    return (
      <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          Category Attributes
        </h3>
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading category fields...</p>
        </div>
      </div>
    );
  }
  
if (!categoryFields || categoryFields.length === 0) {
  // If no fields but we have values from product, show them as editable text inputs
  if (Object.keys(fieldValues).length > 0) {
    return (
      <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          Category Attributes
        </h3>
        {Object.entries(fieldValues).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{key}</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleFieldValueChange(key, e.target.value)}  // ← ADD THIS
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"  // ← REMOVE disabled and bg classes
            />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
        Category Attributes
      </h3>
      <p className="text-sm text-gray-500 italic">No custom attributes for this category</p>
    </div>
  );
}
  
  console.log("Rendering category fields:", categoryFields);
  
  return (
    <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
        Category Attributes
      </h3>

      {categoryFields.map((field, index) => {
        const fieldLabel = field.label || field.name || `Field ${index + 1}`;
        const fieldValue = fieldValues[fieldLabel] || '';
        
        return (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {fieldLabel}
              {field.unit && <span className="ml-1 text-xs text-gray-500">({field.unit})</span>}
            </label>

            {field.type === "text" && (
              <input
                type="text"
                placeholder={`Enter ${fieldLabel}`}
                value={fieldValue}
                onChange={(e) => handleFieldValueChange(fieldLabel, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                placeholder={`Enter ${fieldLabel}`}
                value={fieldValue}
                onChange={(e) => handleFieldValueChange(fieldLabel, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}


{field.type === "select" && (
  <div className="space-y-2">
    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
      Selected: {fieldValue || 'Not selected'}
    </div>
    <div className="text-xs text-gray-500">
      <span className="font-medium">Available options:</span> {field.options?.join(', ') || 'None'}
    </div>
  </div>
)}
          </div>
        );
      })}
    </div>
  );
};
// ============= RENDER CATEGORY SELECTOR (SIMPLE VERSION LIKE ADDPRODUCT) =============
const renderCategorySelector = () => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
    {categoriesLoading ? (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-500">Loading categories...</span>
      </div>
    ) : (
      <select
        name="category"
        value={formData.category}
        onChange={handleInputChange}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
      >
        <option value="">Select a category</option>
        {Array.isArray(categories) && categories.length > 0 ? (
          categories.map(category => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))
        ) : (
          <option value="" disabled>No categories available</option>
        )}
      </select>
    )}
  </div>
);
  // ✅ SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError('');
    
    // Validation
    if (!formData.name || !formData.slug || !formData.category || !formData.seller) {
      setError('Please fill in all required fields including category and seller');
      // Scroll to show error
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      // Scroll to show error
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate variants
    if (variants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.variantName.trim()) {
          setError(`Variant #${i + 1} must have a name`);
          // Scroll to show error
          const modalContent = document.querySelector('.overflow-y-auto');
          if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        if (!variant.price || parseFloat(variant.price) <= 0) {
          setError(`Variant "${variant.variantName}" must have a valid price`);
          // Scroll to show error
          const modalContent = document.querySelector('.overflow-y-auto');
          if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        if (!variant.stock || parseInt(variant.stock) < 0) {
          setError(`Variant "${variant.variantName}" must have valid stock quantity`);
          // Scroll to show error
          const modalContent = document.querySelector('.overflow-y-auto');
          if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        // Validate variant has at least one image
        const hasExistingImages = variant.images && variant.images.length > 0;
        const hasNewImages = variantImageFiles[i]?.length > 0;
        if (!hasExistingImages && !hasNewImages) {
          setError(`Variant "${variant.variantName}" must have at least one image`);
          // Scroll to show error
          const modalContent = document.querySelector('.overflow-y-auto');
          if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        // Validate variant description
        if (!variant.description.trim()) {
          setError(`Variant "${variant.variantName}" must have a description`);
          // Scroll to show error
          const modalContent = document.querySelector('.overflow-y-auto');
          if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    } else {
      
      // No variants - validate stock and description
      if (!formData.description) {
        setError('Please enter a product description');
        // Scroll to show error
        const modalContent = document.querySelector('.overflow-y-auto');
        if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!formData.stock || parseInt(formData.stock) < 0) {
        setError('Please enter a valid stock quantity');
        // Scroll to show error
        const modalContent = document.querySelector('.overflow-y-auto');
        if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // Validate product-level offer (only when no variants)
      if (hasOffer) {
        if (!originalPrice || parseFloat(originalPrice) <= 0) {
          setError('Please enter a valid original price for the offer');
          // Scroll to show error
          const modalContent = document.querySelector('.overflow-y-auto');
          if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        if (discountPercentage && (parseFloat(discountPercentage) < 0 || parseFloat(discountPercentage) > 100)) {
          setError('Please enter a valid discount percentage (0-100%)');
          // Scroll to show error
          const modalContent = document.querySelector('.overflow-y-auto');
          if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      
      // Add basic fields
      Object.keys(formData).forEach(key => {
        // Skip SEO fields - they'll be handled separately
        const seoFieldsToSkip = ['metaTitle', 'metaDescription', 'metaKeywords', 'canonicalUrl', 'ogTitle', 'ogDescription', 'ogImageFile', 'ogImagePreview', 'ogImagePath'];
        if (seoFieldsToSkip.includes(key)) {
          return;
        }
        
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      // ============= PRICE & OFFER LOGIC =============
      if (variants.length > 0) {
        // ✅ VARIANTS EXIST - Use default variant's price
        const defaultVariant = variants.find(v => v.isDefault) || variants[0];
        if (defaultVariant.price) {
          submitData.set('basePrice', defaultVariant.price);
          submitData.set('price', defaultVariant.price);
        }
        
        // Check if ANY variant has an offer
        const anyVariantHasOffer = variants.some(v => 
          v.originalPrice && parseFloat(v.originalPrice) > parseFloat(v.price)
        );
        
        submitData.append('hasOffer', anyVariantHasOffer ? 'true' : 'false');
        
        // Do NOT send product-level offer fields
      } else {
        // ✅ NO VARIANTS - Use product-level offer
        if (hasOffer) {
          submitData.append('originalPrice', originalPrice);
          submitData.append('discountPercentage', discountPercentage);
          submitData.append('hasOffer', 'true');
        } else {
          submitData.append('hasOffer', 'false');
        }
        
        // Add stock
        submitData.append('stock', formData.stock);
      }
// Add category attributes
if (Object.keys(fieldValues).length > 0) {
  const categoryAttributes = {};
  
  categoryFields.forEach(field => {
    const fieldLabel = field.label || field.name;
    const value = fieldValues[fieldLabel];
    
    if (value !== undefined && value !== '') {
      categoryAttributes[fieldLabel] = {
        value: value,
        unit: field.unit || ""
      };
    }
  });
  
  if (Object.keys(categoryAttributes).length > 0) {
    submitData.append('categoryAttributes', JSON.stringify(categoryAttributes));
    console.log('📦 Adding category attributes:', categoryAttributes);
  }
}
      // ✅ Send deleted images
      if (deletedMainImages.length > 0) {
        submitData.append('deletedMainImages', JSON.stringify(deletedMainImages));
      }
      if (Object.keys(deletedVariantImages).length > 0) {
        submitData.append('deletedVariantImages', JSON.stringify(deletedVariantImages));
      }
      // ✅ Send deleted OG image
      if (deletedOgImage) {
        submitData.append('deletedOgImage', deletedOgImage);
      }

      // ✅ SEO Fields
      const seoTextFields = ['metaTitle', 'metaDescription', 'canonicalUrl', 'ogTitle', 'ogDescription'];
      seoTextFields.forEach(field => {
        if (formData[field]?.trim()) {
          submitData.append(field, formData[field].trim());
        }
      });

      // ✅ Meta Keywords
      if (formData.metaKeywords) {
        let keywords = formData.metaKeywords;
        if (typeof keywords === 'string' && keywords.trim() !== '') {
          keywords = keywords
            .split(',')
            .map(k => k.trim())
            .filter(k => k !== '');
          submitData.append('metaKeywords', JSON.stringify(keywords));
        }
      }

      // ✅ OG Image - ALWAYS send as path, NEVER as full URL
      if (formData.ogImageFile) {
        // New file upload
        console.log('📤 Sending new OG image file');
        submitData.append('ogImage', formData.ogImageFile);
      } else if (formData.ogImagePath) {
        // Existing image - use the stored path
        console.log('📤 Sending existing OG image path:', formData.ogImagePath);
        submitData.append('ogImage', formData.ogImagePath);
      } else if (formData.ogImagePreview && !formData.ogImagePreview.startsWith('blob:')) {
        // Fallback - extract path from preview URL
        let ogImagePath = formData.ogImagePreview;
        
        // If it's a full URL, extract just the path
        if (ogImagePath.includes('http://')) {
          try {
            const url = new URL(ogImagePath);
            ogImagePath = url.pathname;
            console.log('🔧 Extracted path from URL:', ogImagePath);
          } catch (e) {
            // If URL parsing fails, just take the filename
            const filename = ogImagePath.split('/').pop();
            ogImagePath = `/uploads/${filename}`;
            console.log('🔧 Extracted filename:', ogImagePath);
          }
        }
        
        // Ensure it starts with /uploads/
        if (!ogImagePath.startsWith('/uploads/')) {
          const filename = ogImagePath.split('/').pop();
          ogImagePath = `/uploads/${filename}`;
        }
        
        console.log('✅ Sending OG image path:', ogImagePath);
        submitData.append('ogImage', ogImagePath);
      }

      // ✅ Variants data
      if (variants.length > 0) {
        const variantsForJson = variants.map(variant => ({
          variantName: variant.variantName.trim(),
          price: parseFloat(variant.price),
          originalPrice: variant.originalPrice ? parseFloat(variant.originalPrice) : undefined,
          description: variant.description?.trim() || '',
          weight: variant.weight ? parseFloat(variant.weight) : 0,
          weightUnit: variant.weightUnit || 'gram',
          stock: parseInt(variant.stock),
          images: variant.images || [],
          sku: variant.sku?.trim() || '',
          isDefault: variant.isDefault || false,
          discountPercentage: variant.discountPercentage || 0,
          features: variant.features || []
        }));
        
        submitData.append('variants', JSON.stringify(variantsForJson));
      }

      // ✅ Specifications
      if (specifications.length > 0) {
        const validSpecifications = specifications.filter(spec => 
          spec.key.trim() !== '' && spec.value.trim() !== ''
        );
        if (validSpecifications.length > 0) {
          submitData.append('specifications', JSON.stringify(validSpecifications));
        }
      }

      // ✅ Key Features
      if (keyFeatures.length > 0) {
        submitData.append('keyFeatures', JSON.stringify(keyFeatures));
      }

      // ✅ Main product images - ONLY when no variants
      if (variants.length === 0) {
        mainImageFiles.forEach(file => {
          submitData.append('images', file);
        });
      }

      // ✅ Variant images
      Object.entries(variantImageFiles).forEach(([variantIndex, files]) => {
        files.forEach(file => {
          submitData.append(`variants[${variantIndex}].images`, file);
        });
      });

      // ✅ Calculate total stock
      let totalStock = 0;
      if (variants.length > 0) {
        totalStock = variants.reduce((sum, variant) => sum + (parseInt(variant.stock) || 0), 0);
        submitData.set('stock', totalStock.toString());
      }

      console.log('📤 Submitting update:', {
        id: product._id,
        name: formData.name,
        hasVariants: variants.length > 0,
        hasOffer: variants.length > 0 
          ? variants.some(v => v.originalPrice) 
          : hasOffer,
        variantsCount: variants.length,
        mainImagesCount: variants.length === 0 ? mainImageFiles.length : 0,
        variantImagesCount: Object.values(variantImageFiles).flat().length,
        deletedMainCount: deletedMainImages.length,
        deletedVariantCount: Object.values(deletedVariantImages).flat().length,
        deletedOgImage: deletedOgImage ? 'Yes' : 'No',
        ogImagePath: formData.ogImagePath || 'none'
      });

      await onEditProduct(product._id, submitData);
      handleClose();
      
    } catch (err) {
      console.error('❌ Error updating product:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update product');
      // Scroll to show error
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up variant image previews
    Object.values(variantImagePreviews).forEach(previews => {
      previews?.forEach(preview => URL.revokeObjectURL(preview));
    });
    
    // Clean up main image previews
    mainImageFiles.forEach(file => {
      URL.revokeObjectURL(URL.createObjectURL(file));
    });
    
    resetForm();
    onClose();
  };

  const resetForm = () => {
    // Clean up OG image preview URL if exists
    if (formData.ogImagePreview && formData.ogImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.ogImagePreview);
    }
    
    setFormData({
      name: '', slug: '', basePrice: '', description: '', category: '', seller: '', stock: '',
      metaTitle: '', metaDescription: '', metaKeywords: '', canonicalUrl: '', 
      ogTitle: '', ogDescription: '', ogImageFile: null, ogImagePreview: null, ogImagePath: '',
    });
    setMainImageFiles([]);
    setExistingImages([]);
    setError('');
    setAutoGenerateSlug(true);
    setSpecifications([]);
    setKeyFeatures([]);
    setNewKeyFeature('');
    setVariants([]);
    setVariantImageFiles({});
    setVariantImagePreviews({});
    setHasOffer(false);
    setOriginalPrice('');
    setDiscountPercentage('');
    setDeletedMainImages([]);
    setDeletedVariantImages({});
    setDeletedOgImage(null);
  };

  if (!isOpen || !product) return null;

  // ============= RENDER SIMPLE PRODUCT =============
  const renderSimpleProduct = () => (
    <>
      {/* Basic Information */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoGenerateSlug}
                onChange={handleSlugToggle}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <label className="text-sm text-gray-600">Auto-generate from name</label>
            </div>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              disabled={autoGenerateSlug}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
              placeholder="product-slug"
            />
          </div>
        </div>

        {/* Category Selector - Using the new hierarchical component */}
        {renderCategorySelector()}


{/* Category Attributes */}
{renderCategoryAttributes()}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-0">Selling Price</label>
          <input
            type="text"
            name="basePrice"
            value={formData.basePrice}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Main Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Featured Product Images *</label>
        
        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Images</h4>
            <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
              {existingImages.map((img, index) => (
                <div key={index} className="relative group">
                  <div className="w-full aspect-square sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center bg-gray-50">
                    <img
                      src={`${API_FILE_URL}${img.image}`}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 sm:mr-13 bg-red-500 text-white text-center rounded-full w-6 h-6 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-sm shadow-lg hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* New Images Upload */}
        <input
          type="file"
          multiple
          onChange={handleImageChange}
          accept="image/*"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        
        {/* New Images Preview */}
        {mainImageFiles.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">New Images to Upload:</p>
            <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
              {mainImageFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="w-full aspect-square sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center bg-gray-50">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New ${index + 1}`}
                      className="w-full h-full rounded-lg object-cover border border-gray-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewImageFile(index)}
                    className="absolute -top-2 -right-2 sm:mr-13 bg-red-500 text-white text-center rounded-full w-6 h-6 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-sm shadow-lg hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          placeholder="Enter product description"
        />
      </div>

      {/* Stock */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
        <input
          type="text"
          name="stock"
          value={formData.stock}
          onChange={handleInputChange}
          required
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          placeholder="Enter stock quantity"
        />
      </div>

      {/* Specifications */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Specifications (Optional)</h3>
          <button
            type="button"
            onClick={addSpecification}
            className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            + Add Specification
          </button>
        </div>
        
        {specifications.length > 0 ? (
          <div className="space-y-3">
            {specifications.map((spec, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Specification #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Key *</label>
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g. Material"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Value *</label>
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g., Natural Charcoal"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600">No specifications added yet.</p>
          </div>
        )}
      </div>
      
      {/* Key Features */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Key Features (Optional)</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newKeyFeature}
              onChange={(e) => setNewKeyFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyFeature())}
              placeholder="Enter a key feature"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={handleAddKeyFeature}
              disabled={!newKeyFeature.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          
          {keyFeatures.length > 0 && (
            <div className="space-y-2">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm text-gray-700 flex-1">{feature}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyFeature(index)}
                    className="ml-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Seller */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Seller *</label>
        <input
          type="text"
          name="seller"
          value={formData.seller}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          placeholder="Enter seller name"
        />
      </div>
    </>
  );

  // ============= RENDER OFFER PRODUCT =============
  const renderOfferProduct = () => (
    <>
      {/* Basic Information */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoGenerateSlug}
                onChange={handleSlugToggle}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <label className="text-sm text-gray-600">Auto-generate from name</label>
            </div>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              disabled={autoGenerateSlug}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
              placeholder="product-slug"
            />
          </div>
        </div>

        {/* Category Selector - Using the new hierarchical component */}
        {renderCategorySelector()}

{/* Category Attributes */}
{renderCategoryAttributes()}
        {/* Offer Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={hasOffer}
              onChange={(e) => {
                setHasOffer(e.target.checked);
                if (!e.target.checked) {
                  setOriginalPrice('');
                  setDiscountPercentage('');
                  setFormData(prev => ({ ...prev, basePrice: '' }));
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label className="text-sm font-medium text-gray-700">Add Product-Level Offer</label>
          </div>

          {hasOffer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Original Price (MRP) *</label>
                <input
                  type="text"
                  value={originalPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    setOriginalPrice(value);
                    if (value && discountPercentage) {
                      const discountAmount = (parseFloat(value) * parseFloat(discountPercentage)) / 100;
                      const finalPrice = parseFloat(value) - discountAmount;
                      setFormData(prev => ({ ...prev, basePrice: finalPrice.toFixed(2) }));
                    }
                  }}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="e.g., 1000"
                  required={hasOffer}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Discount Percentage</label>
                <input
                  type="text"
                  value={discountPercentage}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDiscountPercentage(value);
                    if (originalPrice && value) {
                      const discountAmount = (parseFloat(originalPrice) * parseFloat(value)) / 100;
                      const finalPrice = parseFloat(originalPrice) - discountAmount;
                      setFormData(prev => ({ ...prev, basePrice: finalPrice.toFixed(2) }));
                    } else if (originalPrice && !value) {
                      setFormData(prev => ({ ...prev, basePrice: originalPrice }));
                    }
                  }}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="e.g., 20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Selling Price Display */}
        {formData.basePrice && (
          <div className="bg-green-50 p-3 rounded-md border border-green-200">
            <label className="block text-xs font-medium text-green-700 mb-1">Final Selling Price</label>
            <p className="text-lg font-semibold text-green-800">
              ₹{formData.basePrice}
            </p>
          </div>
        )}
      </div>

      {/* Main Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Main Product Images *</label>
        
        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Images</h4>
            <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
              {existingImages.map((img, index) => (
                <div key={index} className="relative group">
                  <div className="w-full aspect-square sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center bg-gray-50">
                    <img
                      src={`${API_FILE_URL}${img.image}`}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExistingImage(index)}
                    className="absolute -top-2 -right-2 sm:mr-13 bg-red-500 text-white text-center rounded-full w-6 h-6 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-sm shadow-lg hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* New Images Upload */}
        <input
          type="file"
          multiple
          onChange={handleImageChange}
          accept="image/*"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        
        {/* New Images Preview */}
        {mainImageFiles.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">New Images to Upload:</p>
            <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
              {mainImageFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="w-full aspect-square sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center bg-gray-50">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New ${index + 1}`}
                      className="w-full h-full rounded-lg object-cover border border-gray-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewImageFile(index)}
                    className="absolute -top-2 -right-2 sm:mr-13 bg-red-500 text-white text-center rounded-full w-6 h-6 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-sm shadow-lg hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          placeholder="Enter product description"
        />
      </div>

      {/* Stock */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
        <input
          type="text"
          name="stock"
          value={formData.stock}
          onChange={handleInputChange}
          required
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          placeholder="Enter stock quantity"
        />
      </div>

      {/* Specifications */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Specifications (Optional)</h3>
          <button
            type="button"
            onClick={addSpecification}
            className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            + Add Specification
          </button>
        </div>
        
        {specifications.length > 0 ? (
          <div className="space-y-3">
            {specifications.map((spec, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Specification #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Key *</label>
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g. Material"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Value *</label>
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g., Natural Charcoal"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600">No specifications added yet.</p>
          </div>
        )}
      </div>
      
      {/* Key Features */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Key Features (Optional)</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newKeyFeature}
              onChange={(e) => setNewKeyFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyFeature())}
              placeholder="Enter a key feature"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={handleAddKeyFeature}
              disabled={!newKeyFeature.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          
          {keyFeatures.length > 0 && (
            <div className="space-y-2">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm text-gray-700 flex-1">{feature}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyFeature(index)}
                    className="ml-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Seller */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Seller *</label>
        <input
          type="text"
          name="seller"
          value={formData.seller}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          placeholder="Enter seller name"
        />
      </div>
    </>
  );

  // ============= RENDER VARIANT PRODUCT =============
  const renderVariantProduct = () => (
    <>
      {/* Basic Information */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoGenerateSlug}
                onChange={handleSlugToggle}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <label className="text-sm text-gray-600">Auto-generate from name</label>
            </div>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              disabled={autoGenerateSlug}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
              placeholder="product-slug"
            />
          </div>
        </div>

        {/* Category Selector - Using the new hierarchical component */}
        {renderCategorySelector()}


{/* Category Attributes */}
{renderCategoryAttributes()}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-0">Base Price</label>
          <p className="text-xs text-red-500 mt-1">* Will be taken from default variant</p>
          <input
            type="text"
            name="basePrice"
            value={formData.basePrice}
            onChange={handleInputChange}
            disabled
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Base Price Display - Auto-calculated from default variant */}
      {variants.some(v => v.isDefault) && (
        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
          <label className="block text-xs font-medium text-blue-700 mb-1">Base Selling Price</label>
          <p className="text-lg font-semibold text-blue-800">
            ₹{variants.find(v => v.isDefault)?.price || '0.00'}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            This price is automatically taken from the default variant
          </p>
        </div>
      )}

      {/* ============= VARIANTS SECTION ============= */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
            Product Variants
          </h3>
          <button
            type="button"
            onClick={addVariant}
            className="px-3 py-1 text-sm font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-50"
          >
            + Add Variant
          </button>
        </div>
        
        {variants.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-3">
              No variants added yet. Add different packs/combo offers.
            </p>
            <p className="text-xs text-amber-600 mb-3">
              ⚠️ Each variant can have its own offer using "Original Price". 
              The first variant you add will be auto-set as default.
            </p>
            <button
              type="button"
              onClick={addVariant}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
            >
              Add Your First Variant
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Variant #{index + 1}: {variant.variantName || 'Unnamed Variant'}
                    </h4>
                    {variant.isDefault && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                        Default (Base Price)
                      </span>
                    )}
                    {variant.originalPrice && variant.price && 
                     parseFloat(variant.originalPrice) > parseFloat(variant.price) && (
                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        {Math.round(((parseFloat(variant.originalPrice) - parseFloat(variant.price)) / parseFloat(variant.originalPrice)) * 100)}% OFF
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Variant Name *
                    </label>
                    <input
                      type="text"
                      value={variant.variantName}
                      onChange={(e) => handleVariantChange(index, 'variantName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="e.g., Pack of 2, Family Pack"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Default Variant
                    </label>
                    <div className="flex items-center h-full">
                      <input
                        type="checkbox"
                        checked={variant.isDefault}
                        onChange={(e) => handleVariantChange(index, 'isDefault', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-xs text-gray-600">Set as default</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Price * (Selling Price)
                    </label>
                    <input
                      type="text"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Selling price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  {/* ⭐ VARIANT OFFER FIELD */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Original Price (MRP) 
                      <span className="text-green-600 ml-1">← Set this for offer</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={variant.originalPrice}
                        onChange={(e) => handleVariantChange(index, 'originalPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="Original price before discount"
                        min="0"
                        step="0.01"
                      />
                      {variant.originalPrice && variant.price && 
                       parseFloat(variant.originalPrice) > parseFloat(variant.price) && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">
                          {Math.round(((parseFloat(variant.originalPrice) - parseFloat(variant.price)) / parseFloat(variant.originalPrice)) * 100)}% OFF
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty if no offer for this variant
                    </p>
                  </div>
                  
                  {/* Weight fields */}
                  {/* <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Weight (Optional)
                    </label>
                    <input
                      type="text"
                      value={variant.weight}
                      onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="e.g., 50, 100, 250"
                      min="0"
                      step="0.01"
                    />
                  </div> */}
                  
                  {/* <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Weight Unit (Optional)
                    </label>
                    <select
                      value={variant.weightUnit || 'gram'}
                      onChange={(e) => handleVariantChange(index, 'weightUnit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="gram">Gram (g)</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="ml">Milliliter (ml)</option>
                      <option value="liter">Liter (L)</option>
                      <option value="piece">Piece</option>
                    </select>
                  </div> */}
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Stock *
                    </label>
                    <input
                      type="text"
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      SKU (Optional)
                    </label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Variant SKU"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Variant Images <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Existing Images */}
                    {variant.images && variant.images.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Existing Images:</p>
                        <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
                          {variant.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative group">
                              <div className="w-full aspect-square sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center bg-gray-50">
                                <img
                                  src={`${API_FILE_URL}${img.image}`}
                                  alt={`Variant ${index + 1} - ${imgIdx + 1}`}
                                  className="w-full h-full rounded-lg object-cover border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeExistingVariantImage(index, imgIdx)}
                                className="absolute -top-2 -right-2 sm:mr-13 bg-red-500 text-white text-center rounded-full w-6 h-6 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-sm shadow-lg hover:bg-red-600"
                                aria-label="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* New Images Upload */}
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleVariantImageChange(e, index)}
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Required - Each variant must have at least one image   
                    </p>
                    
                    {/* New Images Preview */}
                    {variantImagePreviews[index]?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">New Images to Upload:</p>
                        <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
                          {variantImagePreviews[index].map((preview, imgIdx) => (
                            <div key={imgIdx} className="relative group">
                              <div className="w-full aspect-square sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center bg-gray-50">
                                <img
                                  src={preview}
                                  alt={`New ${imgIdx + 1}`}
                                  className="w-full h-full rounded-lg object-cover border border-gray-200"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeVariantImageFile(index, imgIdx)}
                                className="absolute -top-2 -right-2 sm:mr-13 bg-red-500 text-white text-center rounded-full w-6 h-6 flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-sm shadow-lg hover:bg-red-600"
                                aria-label="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Variant Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={variant.description}
                    onChange={(e) => handleVariantChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="Describe this variant (e.g., 'Save 10% when buying 2 packs')"
                    rows="2"
                    required
                  />
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Required - Each variant must have a description
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Specifications */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Specifications (Optional)</h3>
          <button
            type="button"
            onClick={addSpecification}
            className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            + Add Specification
          </button>
        </div>
        
        {specifications.length > 0 ? (
          <div className="space-y-3">
            {specifications.map((spec, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Specification #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Key *</label>
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g. Material"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Value *</label>
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="e.g., Natural Charcoal"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600">No specifications added yet.</p>
          </div>
        )}
      </div>

      {/* Key Features */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Key Features (Optional)</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newKeyFeature}
              onChange={(e) => setNewKeyFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyFeature())}
              placeholder="Enter a key feature"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={handleAddKeyFeature}
              disabled={!newKeyFeature.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          
          {keyFeatures.length > 0 && (
            <div className="space-y-2">
              {keyFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                  <span className="text-sm text-gray-700 flex-1">{feature}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyFeature(index)}
                    className="ml-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seller */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Seller *</label>
        <input
          type="text"
          name="seller"
          value={formData.seller}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          placeholder="Enter seller name"
        />
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-full max-h-full m-0 overflow-hidden flex flex-col">
        {/* Header - stays sticky at top */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-white sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Product</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Error Message - Always at the top with clear styling */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded shadow-md animate-pulse">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Render based on product type */}
            {variants.length === 0 && !hasOffer && renderSimpleProduct()}
            {variants.length === 0 && hasOffer && renderOfferProduct()}
            {variants.length > 0 && renderVariantProduct()}

            {/* SEO Settings - Always show at the bottom */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
                SEO Settings (Optional)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                    <span className="ml-2 text-xs text-gray-500">
                      {formData.metaTitle ? `${formData.metaTitle.length}/60` : '0/60'}
                    </span>
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle || ''}
                    onChange={handleInputChange}
                    maxLength="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Title for search engines (max 60 chars)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                    <span className="ml-2 text-xs text-gray-500">
                      {formData.metaDescription ? `${formData.metaDescription.length}/160` : '0/160'}
                    </span>
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription || ''}
                    onChange={handleInputChange}
                    maxLength="160"
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Description for search engines (max 160 chars)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    name="metaKeywords"
                    value={formData.metaKeywords || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Canonical URL
                  </label>
                  <input
                    type="text"
                    name="canonicalUrl"
                    value={formData.canonicalUrl || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="https://yourstore.com/product-slug"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OG:Title (Facebook/Twitter)
                  </label>
                  <input
                    type="text"
                    name="ogTitle"
                    value={formData.ogTitle || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Title for social media sharing"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OG:Description (Facebook/Twitter)
                  </label>
                  <textarea
                    name="ogDescription"
                    value={formData.ogDescription || ''}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Description for social media sharing"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OG:Image (Social Media Image)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Clean up previous preview
                        if (formData.ogImagePreview && formData.ogImagePreview.startsWith('blob:')) {
                          URL.revokeObjectURL(formData.ogImagePreview);
                        }
                        
                        setFormData(prev => ({
                          ...prev,
                          ogImageFile: file,
                          ogImagePreview: URL.createObjectURL(file),
                          ogImagePath: '' // Clear path when new file is selected
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Image for social media sharing (1200×630px recommended). Will override existing OG image.
                  </p>
                  
                  {/* OG Image Preview with Remove Button */}
                  {formData.ogImagePreview && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Preview:</p>
                      <div className="relative inline-block">
                        <img 
                          src={formData.ogImagePreview} 
                          alt="OG Image Preview" 
                          className="w-32 h-32 object-cover rounded border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeOgImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg"
                          title="Remove OG image"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {formData.metaTitle && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Search Result Preview:</h4>
                  <div className="border border-gray-300 rounded p-3 bg-white">
                    <div className="text-blue-700 text-lg font-medium truncate">
                      {formData.metaTitle || 'Product Name'}
                    </div>
                    <div className="text-green-700 text-sm truncate">
                      https://yourstore.com/products/{formData.slug || 'product-slug'}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      {formData.metaDescription || 'Product description will appear here...'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons - No background, scrolls with content */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || categoriesLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
            >
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;