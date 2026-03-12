// src/components/AddProductModal.jsx - FINAL VERSION WITH COMPLETE VALIDATION
import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../api/categories';
import { productsAPI } from '../api/products';

const AddProductModal = ({ isOpen, onClose, onAddProduct }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    basePrice: '',
    description: '',
    category: '',
    seller: '',
    stock: '',
    // SEO Fields
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImageFile: null,
    ogImagePreview: null,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mainImageFiles, setMainImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [categoryFields, setCategoryFields] = useState([]);
const [fieldValues, setFieldValues] = useState({});
  // Specifications state
  const [specifications, setSpecifications] = useState([]);
  
  // Key Features state
  const [keyFeatures, setKeyFeatures] = useState([]);
  const [newKeyFeature, setNewKeyFeature] = useState('');

  // ============= VARIANTS STATE =============
  const [variants, setVariants] = useState([]);
  const [showVariants, setShowVariants] = useState(false);
  const [variantImageFiles, setVariantImageFiles] = useState({});
  const [variantImagePreviews, setVariantImagePreviews] = useState({});

  // ============= PRODUCT-LEVEL OFFER STATE =============
  const [productHasOffer, setProductHasOffer] = useState(false);
  const [productOriginalPrice, setProductOriginalPrice] = useState('');
  const [productDiscountPercentage, setProductDiscountPercentage] = useState('');

  // ============= PRODUCT TYPE STATE =============
  const [activeTab, setActiveTab] = useState('simple'); // 'simple', 'offer', 'variant'

  // ============= FUNCTION TO SCROLL TO ELEMENT =============
  const scrollToElement = (elementId) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        const modalContent = document.querySelector('.overflow-y-auto');
        if (modalContent) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + modalContent.scrollTop - 100;
          
          modalContent.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Add highlight effect
          element.classList.add('ring-2', 'ring-red-500', 'border-red-500');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-red-500', 'border-red-500');
          }, 3000);
        }
      }
    }, 100);
  };

  // ============= SCROLL TO ERROR WHEN ERROR OCCURS =============
  useEffect(() => {
    if (error && error.includes('fieldId:')) {
      const fieldId = error.split('fieldId:')[1].split('|')[0];
      scrollToElement(fieldId);
    }
  }, [error]);
// Auto-fill SEO fields with product data when fields are empty
useEffect(() => {
  if (!isOpen) return; // Only run when modal is open
  
  // Don't auto-fill if user has already entered custom values
  // We'll check if the fields are empty before setting them
  
  const updatedSeoData = {};
  
  // Auto-fill metaTitle from product name (if empty)
  if (!formData.metaTitle && formData.name) {
    updatedSeoData.metaTitle = formData.name;
  }
  
  // Auto-fill metaDescription from product description (if empty)
  if (!formData.metaDescription && formData.description) {
    // Truncate to 160 chars for meta description
    const truncatedDesc = formData.description.length > 160 
      ? formData.description.substring(0, 157) + '...' 
      : formData.description;
    updatedSeoData.metaDescription = truncatedDesc;
  }
  
  // Auto-fill ogTitle from metaTitle or product name (if empty)
  if (!formData.ogTitle) {
    updatedSeoData.ogTitle = formData.metaTitle || formData.name || '';
  }
  
  // Auto-fill ogDescription from metaDescription or product description (if empty)
  if (!formData.ogDescription) {
    updatedSeoData.ogDescription = formData.metaDescription || formData.description || '';
  }
  
  // Auto-fill metaKeywords from key features (if empty)
  if (!formData.metaKeywords && keyFeatures.length > 0) {
    updatedSeoData.metaKeywords = keyFeatures.join(', ');
  }
  
  // Only update if there are changes
  if (Object.keys(updatedSeoData).length > 0) {
    setFormData(prev => ({
      ...prev,
      ...updatedSeoData
    }));
  }
}, [formData.name, formData.description, keyFeatures, isOpen]); // Dependencies
// Auto-fill OG image from main images or variant images (if empty and user hasn't uploaded custom OG image)
useEffect(() => {
  if (!isOpen) return;
  
  // Only auto-fill if user hasn't uploaded a custom OG image
  if (!formData.ogImageFile && !formData.ogImagePreview) {
    
    // For non-variant products, use first main image
    if (activeTab !== 'variant' && mainImageFiles.length > 0 && !formData.ogImageFile) {
      // Clean up previous preview if exists
      if (formData.ogImagePreview) {
        URL.revokeObjectURL(formData.ogImagePreview);
      }
      
      // Create preview from first main image
      const preview = URL.createObjectURL(mainImageFiles[0]);
      setFormData(prev => ({
        ...prev,
        ogImageFile: mainImageFiles[0],
        ogImagePreview: preview
      }));
    }
    
    // For variant products, use first variant's first image
    if (activeTab === 'variant' && variantImageFiles[0] && variantImageFiles[0].length > 0 && !formData.ogImageFile) {
      // Clean up previous preview if exists
      if (formData.ogImagePreview) {
        URL.revokeObjectURL(formData.ogImagePreview);
      }
      
      // Create preview from first variant's first image
      const preview = URL.createObjectURL(variantImageFiles[0][0]);
      setFormData(prev => ({
        ...prev,
        ogImageFile: variantImageFiles[0][0],
        ogImagePreview: preview
      }));
    }
  }
}, [mainImageFiles, variantImageFiles, activeTab, isOpen]); // Dependencies
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetForm();
    }
  }, [isOpen]);

  // Cleanup variant image previews on unmount
  useEffect(() => {
    return () => {
      Object.values(variantImagePreviews).forEach(previews => {
        previews?.forEach(preview => URL.revokeObjectURL(preview));
      });
    };
  }, [variantImagePreviews]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
     const response = await categoriesAPI.getAllCategories();
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
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const resetForm = () => {
    // Clean up OG image preview URL if exists
    if (formData.ogImagePreview) {
      URL.revokeObjectURL(formData.ogImagePreview);
    }
    
    setFormData({
      name: '',
      slug: '',
      basePrice: '',
      description: '',
      category: '',
      seller: '',
      stock: '',
      // SEO Fields Reset
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImageFile: null,
      ogImagePreview: null,
    });
    setMainImageFiles([]);
    setImagePreviews([]);
    setError('');
    setAutoGenerateSlug(true);
    setSpecifications([]);
    setKeyFeatures([]);
    setNewKeyFeature('');
    setActiveTab('simple');
    
    // Clean up variant image previews
    Object.values(variantImagePreviews).forEach(previews => {
      previews?.forEach(preview => URL.revokeObjectURL(preview));
    });
    
    // Reset variants
    setVariants([]);
    setShowVariants(false);
    setVariantImageFiles({});
    setVariantImagePreviews({});

    // Reset product-level offer
    setProductHasOffer(false);
    setProductOriginalPrice('');
    setProductDiscountPercentage('');
  };

const handleInputChange = async (e) => {
  const { name, value, type, checked } = e.target;

  const updatedFormData = {
    ...formData,
    [name]: type === "checkbox" ? checked : value
  };

  setFormData(updatedFormData);

  // Fetch category fields when category is selected
  if (name === "category" && value) {
    try {
      // Find the selected category to get its slug
      const selectedCategory = categories.find(cat => cat._id === value);
      console.log("🔍 Selected category:", selectedCategory);
      
      if (selectedCategory && selectedCategory.slug) {
        console.log("📡 Fetching fields for category slug:", selectedCategory.slug);
        setCategoriesLoading(true);
        setError(''); // Clear any previous errors
        
        const response = await categoriesAPI.getCategoryFields(selectedCategory.slug);
        
        // Log the FULL response to see what we're getting
        console.log("📦 Full API Response:", response);
        console.log("📦 Response data type:", typeof response.data);
        console.log("📦 Response data:", response.data);
        
        let fields = [];
        
        // Check all possible response structures
        if (response.data) {
          if (Array.isArray(response.data)) {
            console.log("✅ Response.data is an array");
            fields = response.data;
          } 
          else if (response.data.data && Array.isArray(response.data.data)) {
            console.log("✅ Response.data.data is an array");
            fields = response.data.data;
          }
          else if (response.data.fields && Array.isArray(response.data.fields)) {
            console.log("✅ Response.data.fields is an array");
            fields = response.data.fields;
          }
          else if (response.data.category && response.data.category.fields) {
            console.log("✅ Response.data.category.fields exists");
            fields = response.data.category.fields;
          }
          else if (typeof response.data === 'object') {
            // Try to find any array in the response
            console.log("🔍 Searching for arrays in response object:", Object.keys(response.data));
            for (const key in response.data) {
              if (Array.isArray(response.data[key])) {
                console.log(`✅ Found array in response.data.${key}`);
                fields = response.data[key];
                break;
              }
            }
          }
        }
        
        console.log("📋 Extracted fields:", fields);
        
        if (fields.length === 0) {
          console.warn("⚠️ No fields found in response");
          // Check if the category has fields in its structure
          if (selectedCategory.fields && Array.isArray(selectedCategory.fields)) {
            console.log("✅ Using fields from selectedCategory");
            fields = selectedCategory.fields;
          }
        }
        
        setCategoryFields(fields);
        setFieldValues({}); // reset attribute values when category changes
        
        if (fields.length > 0) {
          console.log(`✅ Successfully loaded ${fields.length} category fields`);
        } else {
          console.log("ℹ️ No category fields to display");
        }
        
      } else {
        console.warn("⚠️ Selected category has no slug:", selectedCategory);
      }
    } catch (err) {
      console.error("❌ Error loading category fields:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      setError(`Failed to load category fields: ${err.response?.data?.message || err.message}`);
      setCategoryFields([]);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    } finally {
      setCategoriesLoading(false);
    }
  }
};

const handleFieldValueChange = (label, value) => {
  setFieldValues((prev) => ({
    ...prev,
    [label]: value
  }));
};

// Add this useEffect to auto-set default values for select fields when category loads
// Replace the existing useEffect with this:

useEffect(() => {
  if (categoryFields.length > 0) {
    const defaultValues = {};
    
    categoryFields.forEach(field => {
      // For ALL field types, we want to set up the structure
      if (field.type === "select" && field.options && field.options.length > 0) {
        // For select fields, store the selected value (first option) 
        // BUT the complete field data will be saved in handleSubmit
        defaultValues[field.label] = field.options[0];
        console.log(`🎯 Auto-setting default selected value for ${field.label}: ${field.options[0]}`);
        console.log(`📋 Available options for ${field.label}:`, field.options);
      }
    });
    
    if (Object.keys(defaultValues).length > 0) {
      setFieldValues(prev => ({
        ...prev,
        ...defaultValues
      }));
    }
  }
}, [categoryFields]);
  // ============= VARIANT HANDLERS =============
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
    const varianttext = variants.length + 1;
    const newVariant = {
      variantName: `Pack ${varianttext}`,
      price: formData.basePrice || '',
      originalPrice: '',
      description: '',
      // Weight fields
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
    setShowVariants(true);
    
    // Clear main product images and description when variants are added
    if (variants.length === 0) {
      setMainImageFiles([]);
      setImagePreviews([]);
      setFormData(prev => ({ ...prev, description: '' }));
    }
  };

  const removeVariant = (index) => {
    // Clean up variant image previews for this variant
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
    
    if (updatedVariants.length === 0) {
      setShowVariants(false);
    }
  };

  const handleVariantImageChange = (e, variantIndex) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Check if trying to add more than 10 images total
    const currentImages = variantImageFiles[variantIndex] || [];
    if (currentImages.length + files.length > 10) {
      setError("⚠️ Maximum 10 images allowed per variant");
      // Scroll to show error
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
      e.target.value = '';
      return;
    }
    
    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    // Update files state
    setVariantImageFiles(prev => ({
      ...prev,
      [variantIndex]: [...(prev[variantIndex] || []), ...files]
    }));
    
    // Update previews state
    setVariantImagePreviews(prev => ({
      ...prev,
      [variantIndex]: [...(prev[variantIndex] || []), ...newPreviews]
    }));
    
    // Clear any previous errors
    setError('');
    
    // Force clear the file input value
    setTimeout(() => {
      e.target.value = '';
    }, 0);
  };

  const removeVariantImage = (variantIndex, imageIndex) => {
    // Revoke the object URL to prevent memory leaks
    if (variantImagePreviews[variantIndex] && variantImagePreviews[variantIndex][imageIndex]) {
      URL.revokeObjectURL(variantImagePreviews[variantIndex][imageIndex]);
    }
    
    // Remove from previews
    setVariantImagePreviews(prev => {
      const updated = { ...prev };
      if (updated[variantIndex]) {
        updated[variantIndex] = updated[variantIndex].filter((_, i) => i !== imageIndex);
      }
      return updated;
    });
    
    // Remove from files
    setVariantImageFiles(prev => {
      const updated = { ...prev };
      if (updated[variantIndex]) {
        updated[variantIndex] = updated[variantIndex].filter((_, i) => i !== imageIndex);
      }
      return updated;
    });
  };

  // ============= KEY FEATURES HANDLERS =============
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

  // ============= SPECIFICATIONS HANDLERS =============
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

  // ============= IMAGE HANDLERS =============
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
    setMainImageFiles(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    
    // Clear any previous errors
    setError('');
    
    // Clear the file input value
    e.target.value = '';
  };

  const removeImagePreview = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newFiles = mainImageFiles.filter((_, i) => i !== index);
    
    setImagePreviews(newPreviews);
    setMainImageFiles(newFiles);
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

  // ============= TAB HANDLERS =============
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(''); // Clear any errors when switching tabs
    
    // Reset relevant states when switching tabs
    if (tab === 'simple') {
      setProductHasOffer(false);
      setVariants([]);
      setShowVariants(false);
      setVariantImageFiles({});
      setVariantImagePreviews({});
      setProductOriginalPrice('');
      setProductDiscountPercentage('');
    } else if (tab === 'offer') {
      setProductHasOffer(true);
      setVariants([]);
      setShowVariants(false);
      setVariantImageFiles({});
      setVariantImagePreviews({});
    } else if (tab === 'variant') {
      setProductHasOffer(false);
      setProductOriginalPrice('');
      setProductDiscountPercentage('');
      setMainImageFiles([]);
      setImagePreviews([]);
      setFormData(prev => ({ ...prev, description: '', stock: '' }));
    }
  };

  // ============= SUBMIT HANDLER =============
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError('');
    
    // Validation for ALL required fields
    if (!formData.name || formData.name.trim() === '') {
      setError('fieldId:product-name|Please enter a product name');
      scrollToElement('product-name');
      return;
    }

    if (!formData.slug || formData.slug.trim() === '') {
      setError('fieldId:product-slug|Please enter a product slug');
      scrollToElement('product-slug');
      return;
    }

    if (!formData.category || formData.category === '') {
      setError('fieldId:product-category|Please select a category');
      scrollToElement('product-category');
      return;
    }

    if (!formData.seller || formData.seller.trim() === '') {
      setError('fieldId:product-seller|Please enter a seller name');
      scrollToElement('product-seller');
      return;
    }

    // Validate based on active tab
    if (activeTab === 'variant') {
      // Variant validation
      if (variants.length === 0) {
        setError('fieldId:add-variant-button|Please add at least one variant');
        scrollToElement('add-variant-button');
        return;
      }

      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.variantName || variant.variantName.trim() === '') {
          setError(`fieldId:variant-name-${i}|Variant #${i + 1} must have a name`);
          scrollToElement(`variant-name-${i}`);
          return;
        }
        if (!variant.price || variant.price === '' || parseFloat(variant.price) <= 0) {
          setError(`fieldId:variant-price-${i}|Variant "${variant.variantName || 'Unnamed'}" must have a valid price`);
          scrollToElement(`variant-price-${i}`);
          return;
        }
        if (!variant.stock || variant.stock === '' || parseInt(variant.stock) < 0) {
          setError(`fieldId:variant-stock-${i}|Variant "${variant.variantName || 'Unnamed'}" must have valid stock quantity`);
          scrollToElement(`variant-stock-${i}`);
          return;
        }
        // Validate variant images - each variant must have at least one image
        const hasImages = variantImageFiles[i] && variantImageFiles[i].length > 0;
        if (!hasImages) {
          setError(`fieldId:variant-images-${i}|Variant "${variant.variantName || 'Unnamed'}" must have at least one image`);
          scrollToElement(`variant-images-${i}`);
          return;
        }
        // Validate variant description
        if (!variant.description || variant.description.trim() === '') {
          setError(`fieldId:variant-description-${i}|Variant "${variant.variantName || 'Unnamed'}" must have a description`);
          scrollToElement(`variant-description-${i}`);
          return;
        }
      }
    } else {
      // Simple or Offer product validation
      
      // Base Price validation - THIS WAS MISSING!
      if (!formData.basePrice || formData.basePrice === '' || parseFloat(formData.basePrice) <= 0) {
        setError('fieldId:product-base-price|Please enter a valid base price');
        scrollToElement('product-base-price');
        return;
      }

      if (!formData.description || formData.description.trim() === '') {
        setError('fieldId:product-description|Please enter a product description');
        scrollToElement('product-description');
        return;
      }

      if (!formData.stock || formData.stock === '' || parseInt(formData.stock) < 0) {
        setError('fieldId:product-stock|Please enter a valid stock quantity');
        scrollToElement('product-stock');
        return;
      }
      
      // Validate main images for non-variant products
      if (mainImageFiles.length === 0) {
        setError('fieldId:product-images|Please upload at least one product image');
        scrollToElement('product-images');
        return;
      }
      
      // Offer validation
      if (activeTab === 'offer' && productHasOffer) {
        if (!productOriginalPrice || productOriginalPrice === '' || parseFloat(productOriginalPrice) <= 0) {
          setError('fieldId:offer-original-price|Please enter a valid original price for the offer');
          scrollToElement('offer-original-price');
          return;
        }
        if (!productDiscountPercentage || productDiscountPercentage === '' || parseFloat(productDiscountPercentage) < 0 || parseFloat(productDiscountPercentage) > 100) {
          setError('fieldId:offer-discount-percentage|Please enter a valid discount percentage (0-100%)');
          scrollToElement('offer-discount-percentage');
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
        const seoFieldsToSkip = ['metaTitle', 'metaDescription', 'metaKeywords', 'canonicalUrl', 'ogTitle', 'ogDescription', 'ogImageFile', 'ogImagePreview'];
        if (seoFieldsToSkip.includes(key)) {
          return;
        }
        
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });
// In handleSubmit function, update the categoryAttributes section:
// In handleSubmit function, update the categoryAttributes section:

// In handleSubmit function, update the categoryAttributes section:

if (Object.keys(fieldValues).length > 0) {
  // Convert fieldValues to a proper object and stringify it
  const categoryAttributes = {};

  categoryFields.forEach(field => {
    const value = fieldValues[field.label];

    if (value !== undefined && value !== '') {
      // For select fields, store the OPTIONS ARRAY as the value
      if (field.type === "select" && field.options && field.options.length > 0) {
        categoryAttributes[field.label] = {
          value: field.options.join(','), // Store ALL options as comma-separated string
          unit: field.unit || "",
          type: field.type,
          label: field.label,
          options: field.options // Still keep the options array if needed
        };
      } else {
        // For non-select fields, store the entered value
        categoryAttributes[field.label] = {
          value: value,
          unit: field.unit || "",
          type: field.type,
          label: field.label,
          ...(field.options && { options: field.options })
        };
      }
    }
  });
  
  if (Object.keys(categoryAttributes).length > 0) {
    submitData.append('categoryAttributes', JSON.stringify(categoryAttributes));
    console.log('📦 Adding category attributes with complete field data:', categoryAttributes);
  }
}
      // Add description placeholder for variant products
      if (activeTab === 'variant' && !formData.description) {
        submitData.append('description', 'Product with multiple variants');
      }

      // ============= PRICE & OFFER LOGIC =============
      if (activeTab === 'variant') {
        // Variant product
        const defaultVariant = variants.find(v => v.isDefault) || variants[0];
        
        if (defaultVariant.price) {
          submitData.set('basePrice', defaultVariant.price);
          submitData.append('price', defaultVariant.price);
        }
        
        const anyVariantHasOffer = variants.some(v => 
          v.originalPrice && parseFloat(v.originalPrice) > parseFloat(v.price)
        );
        
        submitData.append('hasOffer', anyVariantHasOffer ? 'true' : 'false');
        
      } else {
        // Simple or Offer product
        if (activeTab === 'offer' && productHasOffer) {
          submitData.append('originalPrice', productOriginalPrice);
          submitData.append('discountPercentage', productDiscountPercentage);
          submitData.append('hasOffer', 'true');
        } else {
          submitData.append('hasOffer', 'false');
        }
        
        submitData.append('stock', formData.stock);
      }

      // ============= ADD VARIANTS DATA =============
      if (activeTab === 'variant') {
        const variantsForJson = variants.map(variant => ({
          variantName: variant.variantName.trim(),
          price: parseFloat(variant.price),
          originalPrice: variant.originalPrice ? parseFloat(variant.originalPrice) : undefined,
          description: variant.description?.trim() || '',
          weight: variant.weight ? parseFloat(variant.weight) : 0,
          weightUnit: variant.weightUnit || 'gram',
          stock: parseInt(variant.stock),
          sku: variant.sku?.trim() || '',
          isDefault: variant.isDefault || false,
          discountPercentage: variant.discountPercentage || 0,
          features: variant.features || []
        }));
        
        submitData.append('variants', JSON.stringify(variantsForJson));
      }

      // ============= ADD OTHER DATA =============
      // Specifications
      if (specifications.length > 0) {
        const validSpecifications = specifications.filter(spec => 
          spec.key.trim() !== '' && spec.value.trim() !== ''
        );
        if (validSpecifications.length > 0) {
          submitData.append('specifications', JSON.stringify(validSpecifications));
        }
      }

      // Key Features
      if (keyFeatures.length > 0) {
        submitData.append('keyFeatures', JSON.stringify(keyFeatures));
      }

      // ============= ADD SEO DATA =============
// ============= ADD SEO DATA =============
const addSeoData = () => {
  const seoTextFields = ['metaTitle', 'metaDescription', 'canonicalUrl', 'ogTitle', 'ogDescription'];
  
  seoTextFields.forEach(field => {
    let value = formData[field];
    
    // Auto-fill if empty
    if (!value || value.trim() === '') {
      switch(field) {
        case 'metaTitle':
          value = formData.name;
          break;
        case 'metaDescription':
          value = formData.description;
          break;
        case 'ogTitle':
          value = formData.metaTitle || formData.name;
          break;
        case 'ogDescription':
          value = formData.metaDescription || formData.description;
          break;
      }
    }
    
    if (value && typeof value === 'string' && value.trim() !== '') {
      submitData.append(field, value.trim());
    }
  });
  
  // Handle OG Image
  if (formData.ogImageFile) {
    // User uploaded a file - append the file
    submitData.append('ogImage', formData.ogImageFile);
  } else if (activeTab !== 'variant' && mainImageFiles.length > 0) {
    // Fallback to first main image (only when no variants)
    submitData.append('ogImage', mainImageFiles[0]);
  } else if (activeTab === 'variant') {
    // When variants exist, try to use first variant's first image
    if (variantImageFiles[0] && variantImageFiles[0].length > 0) {
      submitData.append('ogImage', variantImageFiles[0][0]);
    }
  }
  
  // Handle metaKeywords
  let keywords = formData.metaKeywords;
  if (!keywords || keywords.trim() === '') {
    // Auto-generate keywords from key features and product data
    const keywordArray = [];
    if (keyFeatures.length > 0) {
      keywordArray.push(...keyFeatures);
    }
    if (formData.name) {
      keywordArray.push(formData.name);
    }
    if (formData.category) {
      const category = categories.find(c => c._id === formData.category);
      if (category) {
        keywordArray.push(category.name);
      }
    }
    keywords = keywordArray.join(', ');
  }
  
  if (keywords) {
    let keywordList = keywords;
    if (typeof keywords === 'string' && keywords.trim() !== '') {
      keywordList = keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k !== '');
    }
    if (keywordList.length > 0) {
      submitData.append('metaKeywords', JSON.stringify(keywordList));
    }
  }
};

      addSeoData();

      // Main product images - ONLY for non-variant products
      if (activeTab !== 'variant') {
        mainImageFiles.forEach(file => {
          submitData.append('images', file);
        });
      }

      // Variant images
      Object.entries(variantImageFiles).forEach(([variantIndex, files]) => {
        files.forEach(file => {
          submitData.append(`variants[${variantIndex}].images`, file);
        });
      });

      // Calculate total stock for variants
      if (activeTab === 'variant') {
        const totalStock = variants.reduce((sum, variant) => sum + (parseInt(variant.stock) || 0), 0);
        submitData.set('stock', totalStock.toString());
      }

      console.log('📤 Submitting:', {
        activeTab,
        name: formData.name,
        basePrice: formData.basePrice,
        category: formData.category,
        hasOffer: activeTab === 'offer' || (activeTab === 'variant' && variants.some(v => v.originalPrice)),
        variantsCount: variants.length,
        mainImagesCount: activeTab !== 'variant' ? mainImageFiles.length : 0,
      });

      await onAddProduct(submitData);
      handleClose();
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create product');
      // Scroll to top to show error
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up main image previews
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    
    // Clean up variant image previews
    Object.values(variantImagePreviews).forEach(previews => {
      previews?.forEach(preview => URL.revokeObjectURL(preview));
    });
    
    // Clean up OG image preview
    if (formData.ogImagePreview) {
      URL.revokeObjectURL(formData.ogImagePreview);
    }
    
    resetForm();
    onClose();
  };

  if (!isOpen) return null;
const renderCategorySelector = () => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Category *
    </label>
    <select
      id="product-category"
      name="category"
      value={formData.category}
      onChange={handleInputChange}
      required
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
    >
      <option value="">Select Category</option>
      {categoriesLoading ? (
        <option disabled>Loading categories...</option>
      ) : (
        categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ))
      )}
    </select>
  </div>
);
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

      {categoryFields.map((field, index) => (
        <div key={index} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.label || field.name || `Field ${index + 1}`}
            {field.unit && <span className="ml-1 text-xs text-gray-500">({field.unit})</span>}
          </label>

          {field.type === "text" && (
            <input
              type="text"
              placeholder={`Enter ${field.label || 'value'}`}
              value={fieldValues[field.label] || ""}
              onChange={(e) =>
                handleFieldValueChange(field.label, e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {field.type === "number" && (
            <input
              type="number"
              placeholder={`Enter ${field.label || 'value'}`}
              value={fieldValues[field.label] || ""}
              onChange={(e) =>
                handleFieldValueChange(field.label, e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {field.type === "select" && (
            <div className="space-y-2">
              {/* DISPLAY-ONLY select - no value binding, no onChange */}
              <select
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
              >
                <option value="">{fieldValues[field.label] ? `Selected: ${fieldValues[field.label]}` : `Options: ${field.options?.join(', ') || 'None'}`}</option>
              </select>
              
              {/* Show the available options as a read-only list */}
              <div className="mt-1 text-xs text-gray-500">
                <span className="font-medium">Available options:</span> {field.options?.join(', ') || 'None'}
              </div>
              
              {/* If a value was previously selected, show it */}
              {fieldValues[field.label] && (
                <div className="mt-1 text-sm text-blue-600">
                  ✓ Selected: <span className="font-medium">{fieldValues[field.label]}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
  // ============= RENDER SIMPLE PRODUCT =============
  const renderSimpleProduct = () => (
    <>
      {/* Basic Information */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input
            id="product-name"
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
              id="product-slug"
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
        
    {renderCategorySelector()}
{renderCategoryAttributes()}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-0">Base Price *</label>
          <p className="text-xs text-red-500 mt-1">* Required field</p>
          <input
            id="product-base-price"
            type="number"
            name="basePrice"
            value={formData.basePrice}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Main Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Main Product Images *</label>
        <input
          id="product-images"
          type="file"
          multiple
          onChange={handleImageChange}
          accept="image/*"
          required={mainImageFiles.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <p className="text-xs text-amber-600 mt-1">⚠️ Required - At least one image needed</p>
        
        {imagePreviews.length > 0 && (
          <div className="mt-3">
            <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="w-full aspect-square sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center bg-gray-50">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full rounded-lg object-cover border border-gray-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImagePreview(index)}
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
          id="product-description"
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
          id="product-stock"
          type="number"
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
          id="product-seller"
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
            id="product-name"
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
              id="product-slug"
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

   {renderCategorySelector()}
{renderCategoryAttributes()}

        {/* Offer Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={productHasOffer}
              onChange={(e) => {
                setProductHasOffer(e.target.checked);
                if (!e.target.checked) {
                  setProductOriginalPrice('');
                  setProductDiscountPercentage('');
                  setFormData(prev => ({ ...prev, basePrice: '' }));
                }
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label className="text-sm font-medium text-gray-700">Add Product-Level Offer</label>
          </div>

          {productHasOffer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Original Price (MRP) *</label>
                <input
                  id="offer-original-price"
                  type="number"
                  value={productOriginalPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    setProductOriginalPrice(value);
                    if (value && productDiscountPercentage) {
                      const discountAmount = (parseFloat(value) * parseFloat(productDiscountPercentage)) / 100;
                      const finalPrice = parseFloat(value) - discountAmount;
                      setFormData(prev => ({ ...prev, basePrice: finalPrice.toFixed(2) }));
                    }
                  }}
                  min="0"
                  step="0.01"
                  required={productHasOffer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="e.g., 1000"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Discount Percentage *</label>
                <input
                  id="offer-discount-percentage"
                  type="number"
                  value={productDiscountPercentage}
                  onChange={(e) => {
                    const value = e.target.value;
                    setProductDiscountPercentage(value);
                    if (productOriginalPrice && value) {
                      const discountAmount = (parseFloat(productOriginalPrice) * parseFloat(value)) / 100;
                      const finalPrice = parseFloat(productOriginalPrice) - discountAmount;
                      setFormData(prev => ({ ...prev, basePrice: finalPrice.toFixed(2) }));
                    }
                  }}
                  min="0"
                  max="100"
                  step="0.01"
                  required={productHasOffer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="e.g., 20"
                />
              </div>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-0">Selling Price *</label>
          <p className="text-xs text-red-500 mt-1">* Will be auto-calculated from offer</p>
          <input
            id="product-base-price"
            type="number"
            name="basePrice"
            value={formData.basePrice}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="0.00"
            disabled
            required
          />
        </div>
      </div>

      {/* Main Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Main Product Images *</label>
        <input
          id="product-images"
          type="file"
          multiple
          onChange={handleImageChange}
          accept="image/*"
          required={mainImageFiles.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <p className="text-xs text-amber-600 mt-1">⚠️ Required - At least one image needed</p>
        
        {imagePreviews.length > 0 && (
          <div className="mt-3">
            <div className="grid grid-cols-3 sm:grid-cols-8 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="w-full aspect-square sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center bg-gray-50">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full rounded-lg object-cover border border-gray-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImagePreview(index)}
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
          id="product-description"
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
          id="product-stock"
          type="number"
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
          id="product-seller"
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
            id="product-name"
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
              id="product-slug"
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

{renderCategorySelector()}
{renderCategoryAttributes()}

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
      </div>

      {/* ============= VARIANTS SECTION ============= */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
            Product Variants
          </h3>
          <button
            id="add-variant-button"
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
                      id={`variant-name-${index}`}
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
                      id={`variant-price-${index}`}
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
                      id={`variant-stock-${index}`}
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
                    
                    {/* New Images Upload */}
                    <input
                      id={`variant-images-${index}`}
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
                                onClick={() => removeVariantImage(index, imgIdx)}
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
                    id={`variant-description-${index}`}
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
          id="product-seller"
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
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add New Product</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Product Type Tabs */}
        <div className="flex border-b px-4 sm:px-6 pt-2 justify-center items-center bg-white">
          <button
            type="button"
            onClick={() => handleTabChange('simple')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'simple'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Product
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('offer')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'offer'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Product with Offer
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('variant')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'variant'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Product with Pack
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Error Message - Always at the top with clear styling */}
          {error && !error.includes('fieldId:') && (
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
            {/* Render based on active tab */}
            {activeTab === 'simple' && renderSimpleProduct()}
            {activeTab === 'offer' && renderOfferProduct()}
            {activeTab === 'variant' && renderVariantProduct()}

            {/* SEO Settings - Always show at the bottom */}
     {/* SEO Settings - Always show at the bottom */}
<div className="space-y-3 sm:space-y-4">
  <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
    SEO Settings (Optional)
    <span className="ml-2 text-xs text-green-600 font-normal">
      {!formData.metaTitle && formData.name ? '✓ Will auto-fill from product data' : ''}
    </span>
  </h3>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Meta Title
        <span className="ml-2 text-xs text-gray-500">
          {formData.metaTitle ? `${formData.metaTitle.length}/60` : '0/60'}
          {!formData.metaTitle && formData.name && (
            <span className="ml-2 text-green-600">(Will use: {formData.name.substring(0, 30)}...)</span>
          )}
        </span>
      </label>
      <input
        type="text"
        name="metaTitle"
        value={formData.metaTitle || ''}
        onChange={handleInputChange}
        maxLength="60"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        placeholder={formData.name ? `Will use: ${formData.name}` : "Title for search engines (max 60 chars)"}
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Meta Description
        <span className="ml-2 text-xs text-gray-500">
          {formData.metaDescription ? `${formData.metaDescription.length}/160` : '0/160'}
          {!formData.metaDescription && formData.description && (
            <span className="ml-2 text-green-600">(Will use product description)</span>
          )}
        </span>
      </label>
      <textarea
        name="metaDescription"
        value={formData.metaDescription || ''}
        onChange={handleInputChange}
        maxLength="160"
        rows="2"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        placeholder={formData.description ? 
          `Will use: ${formData.description.substring(0, 50)}...` : 
          "Description for search engines (max 160 chars)"
        }
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Meta Keywords
        <span className="ml-2 text-xs text-gray-500">
          {!formData.metaKeywords && keyFeatures.length > 0 && (
            <span className="text-green-600">(Will use key features)</span>
          )}
        </span>
      </label>
      <input
        type="text"
        name="metaKeywords"
        value={formData.metaKeywords || ''}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        placeholder={keyFeatures.length > 0 ? 
          `Will use: ${keyFeatures.join(', ').substring(0, 40)}...` : 
          "keyword1, keyword2, keyword3"
        }
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
        <span className="ml-2 text-xs text-gray-500">
          {!formData.ogTitle && (formData.metaTitle || formData.name) && (
            <span className="text-green-600">(Will use meta title or product name)</span>
          )}
        </span>
      </label>
      <input
        type="text"
        name="ogTitle"
        value={formData.ogTitle || ''}
        onChange={handleInputChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        placeholder={formData.metaTitle || formData.name ? 
          `Will use: ${(formData.metaTitle || formData.name).substring(0, 40)}...` : 
          "Title for social media sharing"
        }
      />
    </div>
    
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        OG:Description (Facebook/Twitter)
        <span className="ml-2 text-xs text-gray-500">
          {!formData.ogDescription && (formData.metaDescription || formData.description) && (
            <span className="text-green-600">(Will use meta description or product description)</span>
          )}
        </span>
      </label>
      <textarea
        name="ogDescription"
        value={formData.ogDescription || ''}
        onChange={handleInputChange}
        rows="2"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        placeholder={formData.metaDescription || formData.description ? 
          `Will use product description` : 
          "Description for social media sharing"
        }
      />
    </div>
    
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        OG:Image (Social Media Image)
        <span className="ml-2 text-xs text-gray-500">
          {!formData.ogImageFile && (
            activeTab !== 'variant' && mainImageFiles.length > 0 ? '✓ Will use first product image' :
            activeTab === 'variant' && variantImageFiles[0]?.length > 0 ? '✓ Will use first variant image' : ''
          )}
        </span>
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            // Clean up previous preview
            if (formData.ogImagePreview) {
              URL.revokeObjectURL(formData.ogImagePreview);
            }
            setFormData(prev => ({
              ...prev,
              ogImageFile: file,
              ogImagePreview: URL.createObjectURL(file)
            }));
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <p className="text-xs text-gray-500 mt-1">
        Image for social media sharing (1200×630px recommended). 
        {!formData.ogImageFile && (
          activeTab !== 'variant' && mainImageFiles.length > 0 ? ' First product image will be used as default.' :
          activeTab === 'variant' && variantImageFiles[0]?.length > 0 ? ' First variant image will be used as default.' :
          ' Upload custom image or leave empty to use product image.'
        )}
      </p>
      
      {/* OG Image Preview */}
      {formData.ogImagePreview && (
        <div className="mt-2">
          <p className="text-xs text-gray-600 mb-1">Preview:</p>
          <img 
            src={formData.ogImagePreview} 
            alt="OG Image Preview" 
            className="w-32 h-32 object-cover rounded border border-gray-300"
          />
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
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;