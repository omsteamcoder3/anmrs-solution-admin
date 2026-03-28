import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import { productsAPI } from '../api/products';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Products = () => {
  const { isAdmin } = useAuth();
const [isModalOpen, setIsModalOpen] = useState(
  localStorage.getItem("addProductModalOpen") === "true"
);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  localStorage.setItem("addProductModalOpen", isModalOpen);
}, [isModalOpen]);
  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📡 Fetching products from API...');
      
      const response = await productsAPI.getAllProducts();
      
      console.log('✅ API Response:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: Object.keys(response.data || {}),
        success: response.data?.success,
        count: response.data?.count
      });
      
      // ✅ FIXED: Always check response.data.data first
      let productsArray = [];
      
      if (response.data && response.data.success) {
        // Check for data field (your controller format)
        if (Array.isArray(response.data.data)) {
          productsArray = response.data.data;
          console.log(`✅ Found ${productsArray.length} products in response.data.data`);
        } 
        // Check for direct products field (alternative format)
        else if (Array.isArray(response.data.products)) {
          productsArray = response.data.products;
          console.log(`✅ Found ${productsArray.length} products in response.data.products`);
        }
        // Check if data itself is an array
        else if (Array.isArray(response.data)) {
          productsArray = response.data;
          console.log(`✅ Found ${productsArray.length} products in response.data (direct array)`);
        }
      }
      
      console.log(`📊 Total products to render: ${productsArray.length}`);
      
      if (productsArray.length > 0) {
        // Debug first product structure
        const firstProduct = productsArray[0];
        console.log('🔍 First product structure:', {
          id: firstProduct._id,
          name: firstProduct.name,
          stock: firstProduct.stock,
          seller: firstProduct.seller,
          hasImages: !!firstProduct.images,
          imageCount: firstProduct.images?.length || 0,
          imagePath: firstProduct.images?.[0]?.image,
          hasStockField: 'stock' in firstProduct,
          hasSellerField: 'seller' in firstProduct,
          category: firstProduct.category
        });
      }
      
      setProducts(productsArray);
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setError(error.response?.data?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

const handleAddProduct = async (productData) => {
  try {
    console.log('🔄 handleAddProduct called');
    
    // ✅ ENHANCED DEBUG: Log ALL FormData contents
    console.log('=== FORM DATA CONTENTS ===');
    const formDataEntries = [];
    for (let [key, value] of productData.entries()) {
      console.log(`${key}:`, value);
      formDataEntries.push({ key, value });
    }
    console.log('=== END FORM DATA ===');
    
    // ✅ IMPROVED: Check if required fields are present
    const requiredFields = ['name', 'basePrice', 'description', 'seller', 'category'];
    const missingFields = [];
    
    // Check each required field
    requiredFields.forEach(field => {
      const value = productData.get(field);
      if (!value || value.trim() === '') {
        missingFields.push(field);
      }
    });
    
    // Check stock
    const mainStock = productData.get('stock');
    
    if (!mainStock || parseInt(mainStock) <= 0) {
      missingFields.push('stock');
    }
    
    if (missingFields.length > 0) {
      const errorMsg = `❌ Missing required fields: ${missingFields.join(', ')}`;
      setError(errorMsg);
      console.error('Missing fields:', missingFields);
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found');
      return;
    }

    if (!isAdmin) {
      setError('Admin privileges required');
      return;
    }

    console.log('📤 Sending to API...');
    
    // ✅ ADDED: Debug the final FormData before sending
    console.log('=== FINAL FORM DATA TO SEND ===');
    for (let [key, value] of productData.entries()) {
      console.log(`${key}:`, value);
    }
    console.log('=== END FINAL FORM DATA ===');
    
    const response = await productsAPI.createProduct(productData);
    
    // ✅ ADD DEBUG LOGGING HERE:
    console.log('🔍 FULL API RESPONSE:', response);
    console.log('🔍 response.data:', response.data);
    console.log('🔍 response.data.data:', response.data?.data);
    console.log('🔍 response.data.product:', response.data?.product);
    
    // Try to extract the product data more carefully
    let newProduct;
    
    if (response.data && response.data.product) {
      newProduct = response.data.product;
    } else if (response.data && response.data.data) {
      newProduct = response.data.data;
    } else if (response.data) {
      newProduct = response.data;
    }
    
    console.log('🔍 Extracted newProduct:', newProduct);
    
    if (newProduct && newProduct._id) {
      // 🔥 FIX: If the category is just an ID, fetch the full category data
      if (newProduct.category && typeof newProduct.category === 'string') {
        try {
          // Import categories API at the top
          const { categoriesAPI } = await import('../api/categories');
          
          // Fetch all categories
          const categoriesResponse = await categoriesAPI.getAllCategories();
          
          let categoriesArray = [];
          if (Array.isArray(categoriesResponse.data)) {
            categoriesArray = categoriesResponse.data;
          } else if (categoriesResponse.data.categories && Array.isArray(categoriesResponse.data.categories)) {
            categoriesArray = categoriesResponse.data.categories;
          } else if (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data)) {
            categoriesArray = categoriesResponse.data.data;
          }
          
          // Find the category object
          const fullCategory = categoriesArray.find(cat => cat._id === newProduct.category);
          
          if (fullCategory) {
            // Replace the string ID with the full category object
            newProduct.category = fullCategory;
          }
        } catch (catError) {
          console.warn('⚠️ Could not fetch full category data:', catError);
          // If we can't fetch categories, at least store the ID for now
        }
      }
      
      // ✅ IMMEDIATE UPDATE - Add to beginning of list
      setProducts(prevProducts => [newProduct, ...prevProducts]);
      setIsModalOpen(false);
      
      // Show success message
      setError('✅ Product added successfully!');
      setTimeout(() => setError(''), 3000);
    } else {
      console.error('❌ Invalid product data in response:', newProduct);
      setError('❌ Product was created but could not display it immediately');
    }
    
  } catch (error) {
    console.error('❌ Error in handleAddProduct:', error);
    
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      console.error('Error message:', error.response.data?.message);
      console.error('Missing fields:', error.response.data?.missingFields);
      
      if (error.response.status === 400) {
        // Show specific validation errors
        const errorMsg = error.response.data?.message || 'Bad Request - Check required fields';
        const missingFields = error.response.data?.missingFields || [];
        
        if (missingFields.length > 0) {
          setError(`❌ Missing: ${missingFields.join(', ')}`);
        } else {
          setError(`❌ ${errorMsg}`);
        }
      } else if (error.response.status === 404) {
        setError('❌ API endpoint not found. Check backend routes.');
      } else if (error.response.status === 401) {
        setError('❌ Unauthorized. Please login again.');
      } else if (error.response.status === 403) {
        setError('❌ Access forbidden. Admin privileges required.');
      } else {
        setError(`❌ ${error.response.data?.message || 'Failed to add product'}`);
      }
    } else if (error.request) {
      setError('❌ Cannot connect to server. Make sure backend is running.');
    } else {
      setError(`❌ ${error.message || 'Failed to add product'}`);
    }
  }
};

const handleEditProduct = async (productId, productData) => {
  try {
    console.log('🔄 handleEditProduct called for product:', productId);
    
    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (let [key, value] of productData.entries()) {
      console.log(`${key}:`, value);
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('No authentication token found');
      return;
    }

    if (!isAdmin) {
      setError('Admin privileges required');
      return;
    }

    console.log('📤 Sending update to API...');
    
    const response = await productsAPI.updateProduct(productId, productData);
    
    // ✅ ADD DEBUG LOGGING HERE:
    console.log('🔍 FULL EDIT API RESPONSE:', response);
    console.log('🔍 response.data:', response.data);
    console.log('🔍 response.data.data:', response.data?.data);
    console.log('🔍 response.data.product:', response.data?.product);
    
    // Try to extract the updated product data more carefully
    let updatedProduct;
    
    if (response.data && response.data.product) {
      updatedProduct = response.data.product;
    } else if (response.data && response.data.data) {
      updatedProduct = response.data.data;
    } else if (response.data) {
      updatedProduct = response.data;
    }
    
    console.log('🔍 Extracted updatedProduct:', updatedProduct);
    
    if (updatedProduct && updatedProduct._id) {
      // 🔥 FIX: If the category is just an ID, fetch the full category data
      if (updatedProduct.category && typeof updatedProduct.category === 'string') {
        try {
          // Import categories API at the top
          const { categoriesAPI } = await import('../api/categories');
          
          // Fetch all categories
          const categoriesResponse = await categoriesAPI.getAllCategories();
          
          let categoriesArray = [];
          if (Array.isArray(categoriesResponse.data)) {
            categoriesArray = categoriesResponse.data;
          } else if (categoriesResponse.data.categories && Array.isArray(categoriesResponse.data.categories)) {
            categoriesArray = categoriesResponse.data.categories;
          } else if (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data)) {
            categoriesArray = categoriesResponse.data.data;
          }
          
          // Find the category object
          const fullCategory = categoriesArray.find(cat => cat._id === updatedProduct.category);
          
          if (fullCategory) {
            // Replace the string ID with the full category object
            updatedProduct.category = fullCategory;
          }
        } catch (catError) {
          console.warn('⚠️ Could not fetch full category data:', catError);
          // If we can't fetch categories, at least store the ID for now
        }
      }
      
      // ✅ FIXED: Properly merge the updated product data
      setProducts(prevProducts => 
        prevProducts.map(product => {
          if (product._id === productId) {
            // Merge the existing product with the updated data
            return {
              ...product,
              ...updatedProduct,
              // Ensure stock is properly updated
              stock: updatedProduct.stock !== undefined ? updatedProduct.stock : product.stock,
              // Ensure seller is properly updated
              seller: updatedProduct.seller !== undefined ? updatedProduct.seller : product.seller
            };
          }
          return product;
        })
      );
      
      setIsEditModalOpen(false);
      setEditingProduct(null);
      
      // Show success message
      setError('✅ Product updated successfully!');
      setTimeout(() => setError(''), 3000);
    } else {
      console.error('❌ Invalid updated product data:', updatedProduct);
      setError('❌ Product was updated but could not display changes immediately');
    }
    
  } catch (error) {
    console.error('❌ Error in handleEditProduct:', error);
    
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      
      if (error.response.status === 404) {
        setError('❌ Product not found or API endpoint not found.');
      } else if (error.response.status === 401) {
        setError('❌ Unauthorized. Please login again.');
      } else if (error.response.status === 403) {
        setError('❌ Access forbidden. Admin privileges required.');
      } else {
        setError(`❌ ${error.response.data.message || 'Failed to update product'}`);
      }
    } else if (error.request) {
      setError('❌ Cannot connect to server. Make sure backend is running.');
    } else {
      setError(`❌ ${error.message || 'Failed to update product'}`);
    }
  }
};

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      console.log('Deleting product:', id);
      
      const response = await productsAPI.deleteProduct(id);
      
      console.log('Product deleted successfully:', response.data);

      setProducts(prevProducts => prevProducts.filter(product => product._id !== id));
      
      // Show success message
      setError('✅ Product deleted successfully!');
      setTimeout(() => setError(''), 3000);
      
    } catch (error) {
      console.error('Error deleting product:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to delete product';
      
      setError(`❌ ${errorMessage}`);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setIsEditModalOpen(false);
  };

  // Helper functions
  const getTotalStock = (product) => {
    return product.stock || 0;
  };

  const getSellerName = (product) => {
    return product.seller || 'N/A';
  };

  const getPriceDisplay = (product) => {
    return product.basePrice || product.price || '0';
  };

  const hasVariants = (product) => {
    return product.variants && Array.isArray(product.variants) && product.variants.length > 0;
  };

  const getCategoryName = (product) => {
    if (!product.category) return 'N/A';
    
    if (typeof product.category === 'string') {
      return product.category;
    }
    
    if (typeof product.category === 'object' && product.category !== null) {
      return product.category.name || product.category._id || 'N/A';
    }
    
    return 'N/A';
  };

  // ✅ NEW: Helper function to get product image (prioritize variant images)
  const getProductImage = (product) => {
    // Check if product has variants with images
    if (product.variants && product.variants.length > 0) {
      // Find default variant first, then first variant, then any variant with images
      const defaultVariant = product.variants.find(v => v.isDefault);
      const variantWithImages = defaultVariant || product.variants[0];
      
      if (variantWithImages?.images?.[0]?.image) {
        return `${import.meta.env.VITE_API_FILE_URL}${variantWithImages.images[0].image}`;
      }
    }
    
    // Fallback to main product images
    if (product.images && product.images.length > 0 && product.images[0]?.image) {
      return `${import.meta.env.VITE_API_FILE_URL}${product.images[0].image}`;
    }
    
    // No image
    return null;
  };

  // Safe rendering - always ensure products is an array
  const productsToRender = Array.isArray(products) ? products : [];

  // Mobile Card View Component
  const ProductCard = ({ product, index }) => {
    const totalStock = getTotalStock(product);
    const categoryName = getCategoryName(product);
    const sellerName = getSellerName(product);
    const priceDisplay = getPriceDisplay(product);
    const variantsExist = hasVariants(product);
    const productImage = getProductImage(product);
    
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                {product.description}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ 
            product.status === 'active' 
              ? 'bg-green-100 text-green-800'
              : product.status === 'inactive'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {product.status || 'active'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <div className="flex items-center">
              <p className="text-sm font-semibold text-gray-900">₹{priceDisplay}</p>
              {variantsExist && (
                <span className="text-xs text-green-600 ml-1">
                  (+{product.variants.length})
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Stock</p>
            <div className="space-y-1">
              {!variantsExist ? (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                  totalStock > 10 
                    ? 'bg-green-100 text-green-800' 
                    : totalStock > 0 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {totalStock} in stock
                </span>
              ) : (
                // Show packs in single line
                <div className="flex flex-wrap gap-1">
                  {product.variants.map((variant, vIndex) => {
                    const variantStock = variant.stock || 0;
                    const variantName = variant.variantName || `P${vIndex + 1}`;
                    
                    return (
                      <div key={vIndex} className="flex items-center">
                        <span className="text-xs text-gray-600">{variantName}:</span>
                        <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                          variantStock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : variantStock > 0 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {variantStock}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Seller</p>
            <p className="text-sm text-gray-900 truncate">{sellerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="text-sm text-gray-900 truncate">{categoryName}</p>
          </div>
        </div>
        
        {/* Variants Info */}
        {variantsExist && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Variants</p>
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {product.variants.length} packs
              </span>
              {product.variants.find(v => v.isDefault) && (
                <span className="ml-2 text-xs text-green-600">✓ Default</span>
              )}
            </div>
          </div>
        )}
        
        {/* ✅ UPDATED: Image - PRIORITIZE VARIANT IMAGES */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Image</p>
          <div className="flex items-center space-x-3">
            {productImage ? (
              <img 
                src={productImage}
                alt={product.name}
                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div class="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"><span class="text-xs text-gray-300">No Image</span></div>';
                }}
              />
            ) : (
              <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-xs text-gray-300">No Image</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {isAdmin && (
          <div className="flex space-x-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => openEditModal(product)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteProduct(product._id)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen">
        <Sidebar />
        
        <div className="flex-1" style={{ backgroundColor: 'white' }}>
          {/* Header */}
          <header className="bg-white shadow sticky top-0 z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 py-4 space-y-2 sm:space-y-0">
              <h1 className="text-xl sm:text-2xl  text-gray-800">Products Management</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
                All Products ({productsToRender.length})
              </h2>
              <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                <button
                  onClick={fetchProducts}
                  className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px]"
                >
                  <span className="hidden sm:inline">Refresh</span>
                  <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px]"
                  >
                    <span className="hidden sm:inline mr-2">+</span>
                    <span>Add Product</span>
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className={`px-4 py-3 rounded mb-4 text-sm ${ 
                error.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {error}
              </div>
            )}

            {/* Products Display */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading products...</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  {!isMobile ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              S.No
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Image
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Base Price
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Variants
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stock
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Seller
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            {isAdmin && (
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {productsToRender.length > 0 ? (
                            productsToRender.map((product, index) => {
                              const totalStock = getTotalStock(product);
                              const categoryName = getCategoryName(product);
                              const sellerName = getSellerName(product);
                              const priceDisplay = getPriceDisplay(product);
                              const variantsExist = hasVariants(product);
                              const productImage = getProductImage(product);
                              
                              return (
                                <tr key={product._id} className="hover:bg-gray-50">
                                <td className="px-3 py-4 whitespace-nowrap">
  <div className="text-sm font-medium text-gray-900 text-center">
    {index + 1}
  </div>
</td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="flex items-center justify-center">
                                      {productImage ? (
                                        <img 
                                          src={productImage}
                                          alt={product.name}
                                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover border border-gray-200"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                            e.target.parentNode.innerHTML = '<div class="h-10 w-10 sm:h-12 sm:w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"><span class="text-xs text-gray-400">No Image</span></div>';
                                          }}
                                        />
                                      ) : (
                                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                          <span className="text-xs text-gray-400">No Image</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4">
                                    <div className="text-sm font-medium text-gray-900 line-clamp-2 break-words">
                                      {product.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                      {product.description}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="text-sm font-medium text-gray-900">₹{priceDisplay}</div>
                                      {variantsExist && (
                                        <span className="text-xs text-green-600 ml-1">
                                          (+{product.variants.length})
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {variantsExist ? (
                                        <div className="flex items-center">
                                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                            {product.variants.length} packs
                                          </span>
                                          {product.variants.find(v => v.isDefault) && (
                                            <span className="ml-2 text-xs text-green-600">✓ Default</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 text-xs">No variants</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{categoryName}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    {/* Stock Display - Shows packs in single line */}
                                    <div>
                                      {!variantsExist ? (
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                                          totalStock > 10 
                                            ? 'bg-green-100 text-green-800' 
                                            : totalStock > 0 
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-red-100 text-red-800'
                                        }`}>
                                          {totalStock} in stock
                                        </span>
                                      ) : (
                                        // Show packs in single line
                                        <div className="flex flex-wrap gap-2">
                                          {product.variants.map((variant, vIndex) => {
                                            const variantStock = variant.stock || 0;
                                            const variantName = variant.variantName || `P${vIndex + 1}`;
                                            
                                            return (
                                              <div key={vIndex} className="flex items-center">
                                                <span className="text-xs text-gray-600">{variantName}:</span>
                                                <span className={`ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                                                  variantStock > 10 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : variantStock > 0 
                                                      ? 'bg-yellow-100 text-yellow-800'
                                                      : 'bg-red-100 text-red-800'
                                                }`}>
                                                  {variantStock}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500 truncate max-w-[100px]">{sellerName}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
                                      product.status === 'active' 
                                        ? 'bg-green-100 text-green-800'
                                        : product.status === 'inactive'
                                          ? 'bg-gray-100 text-gray-800'
                                          : 'bg-red-100 text-red-800'
                                    }`}>
                                      {product.status || 'active'}
                                    </span>
                                  </td>
                                  {isAdmin && (
                                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => openEditModal(product)}
                                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs font-medium transition duration-200"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteProduct(product._id)}
                                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-xs font-medium transition duration-200"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={isAdmin ? "10" : "9"} className="px-6 py-8 text-center">
                                <div className="text-gray-500">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                  </svg>
                                  <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                                  <p className="mt-1 text-sm text-gray-500">
                                    Get started by creating a new product.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Mobile Card View */
                    <div className="p-4">
                      {productsToRender.length > 0 ? (
                        productsToRender.map((product, index) => (
                          <ProductCard 
                            key={product._id} 
                            product={product} 
                            index={index} 
                          />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Get started by creating a new product.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          {/* Add Product Modal */}
          <AddProductModal 
            isOpen={isModalOpen}
            onClose={() => {
  setIsModalOpen(false);
  localStorage.removeItem("addProductModalOpen");
}}
            onAddProduct={handleAddProduct}
          />

          {/* Edit Product Modal */}
          <EditProductModal 
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            onEditProduct={handleEditProduct}
            product={editingProduct}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Products;