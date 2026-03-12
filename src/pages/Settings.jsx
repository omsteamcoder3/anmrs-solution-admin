// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  Save, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingCart, 
  CreditCard, 
  Link as LinkIcon, 
  Search,
  Key,
  X,
  Check,
  Truck,
  Package,
  Clock,
  Globe as GlobeIcon,
  DollarSign,
  RefreshCw,
  Shield,
  AlertCircle,
  FileText,
  CheckCircle,
  ArrowRight,
  Plus,
  Minus,
  Lock,
  Eye,
  ShieldCheck,
  Database,
  Users,
  FileSignature,
  ScrollText,
  ShieldAlert,
  MessageCircle,
  PhoneCall,
  Youtube,
  Lock as LockIcon,
  Building,
  UserCircle,
  Hash,
  Code,
  QrCode,
  Smartphone,       // ADDED for phone number
  Trash2,          // ADDED for delete
  Upload           // ADDED for upload
} from 'lucide-react';
import { settingsAPI } from '../api/settings';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);

  // Razorpay modal form state
  const [razorpayKeyIdInput, setRazorpayKeyIdInput] = useState('');
  const [razorpayKeySecretInput, setRazorpayKeySecretInput] = useState('');

  const [settings, setSettings] = useState({
    razorpayEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    cashOnDeliveryEnabled: true,
    contactNumber: '',
    whatsappNumber: '',
    callNumber: '',
    contactEmail: '',
    companyAddress: '',
    siteName: '',
    siteTitle: '',
    siteDescription: '',
    footerText: '',
    footerLinks: [],
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    linkedinUrl: '',
    maintenanceMode: false,
    metaKeywords: [],
    googleAnalyticsId: '',
    
    // BANK ACCOUNT DETAILS - ADDED
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    accountType: 'Savings',
    bankBranch: '',
    ifscCode: '',
    swiftCode: '',
    bankAddress: '',
    micrCode: '',
    upiId: '',
    
    // NEW DIGITAL PAYMENT FIELDS - ADDED
    phonePeNumber: '',
    googlePayNumber: '',
    phonePeQrImage: '',
    googlePayQrImage: '',
    
    // SHIPPING SETTINGS
    shippingInfo: '',
    orderProcessingTime: '',
    standardShippingDelivery: '',
    standardShippingCost: '',
    standardFreeShippingThreshold: '',
    expressShippingDelivery: '',
    expressShippingCost: '',
    expressFreeShippingThreshold: '',
    overnightShippingDelivery: '',
    overnightShippingCost: '',
    internationalShippingDelivery: '',
    internationalShippingNote: '',
    
    // RETURNS & REFUNDS POLICY SETTINGS
    returnsPolicyTitle: '',
    returnsPolicyDescription: '',
    returnProcessSteps: [],
    returnTimeframe: '',
    returnConditions: [],
    customerShippingResponsibility: '',
    nonReturnableItems: [],
    defectiveItemsNote: '',
    refundProcessingTime: '',
    refundNote: '',
    refundAmountFormula: '',
    refundAmountDescription: '',
    exchangePolicy: '',
    
    // PRIVACY POLICY SETTINGS
    privacyPolicyTitle: '',
    privacyPolicyLastUpdated: '',
    privacyPolicyEffectiveImmediately: true,
    privacyPolicyIntroduction: '',
    dataWeCollect: [],
    howWeUseInformation: [],
    privacyIntroductionSection: '',
    informationWeCollectSection: '',
    howWeUseInformationSection: '',
    dataSecuritySection: '',
    dataProtectionRightsSection: '',
    contactUsSection: '',
    dataProtectionRightsList: [],
    securityMeasuresSection: '',
    
    // TERMS OF SERVICE SETTINGS
    termsOfServiceTitle: '',
    termsOfServiceLastUpdated: '',
    termsImportantNotice: '',
    termsUserRequirements: [],
    termsSections: [],
    termsIntellectualProperty: '',
    termsLimitationLiability: '',
    termsChangesNotice: '',
    termsContactInfo: '',
    
    // SCRIPT TAGS SETTINGS
    headerScripts: '',
    bodyScripts: '',
    footerScripts: '',
  });

  const [footerLinks, setFooterLinks] = useState([]);
  const [newFooterLink, setNewFooterLink] = useState({ name: '', url: '' });
  const [metaKeywordInput, setMetaKeywordInput] = useState('');
  
  // Returns & Refunds state
  const [newReturnStep, setNewReturnStep] = useState({ title: '', description: '' });
  const [newReturnCondition, setNewReturnCondition] = useState('');
  const [newNonReturnableItem, setNewNonReturnableItem] = useState('');
  
  // Privacy Policy state
  const [newDataWeCollect, setNewDataWeCollect] = useState('');
  const [newHowWeUseInfo, setNewHowWeUseInfo] = useState('');
  const [newDataProtectionRight, setNewDataProtectionRight] = useState('');
  
  // Terms of Service state
  const [newTermsUserRequirement, setNewTermsUserRequirement] = useState('');
  const [newTermsSection, setNewTermsSection] = useState({ 
    number: 1, 
    title: '', 
    content: '' 
  });

  // QR Code upload states
  const [phonePeQrFile, setPhonePeQrFile] = useState(null);
  const [googlePayQrFile, setGooglePayQrFile] = useState(null);
  const [uploadingQr, setUploadingQr] = useState(false);

  // Show notification helper
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update footerLinks when settings.footerLinks changes
  useEffect(() => {
    if (settings.footerLinks && settings.footerLinks.length > 0) {
      setFooterLinks(settings.footerLinks);
    }
  }, [settings.footerLinks]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAllSettings();
      
      if (response.data.success) {
        const data = response.data.data;
        setSettings(data);
        
        if (data.razorpayKeyId) {
          setRazorpayKeyIdInput(data.razorpayKeyId);
        }
        
        if (data.footerLinks) {
          setFooterLinks(data.footerLinks);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to load settings');
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

  // Handle QR code file selection
  const handleQrFileChange = (type, file) => {
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('error', 'Only image files are allowed (JPEG, PNG, JPG, WEBP, GIF)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'File size must be less than 5MB');
        return;
      }
      
      if (type === 'phonePeQrImage') {
        setPhonePeQrFile(file);
      } else if (type === 'googlePayQrImage') {
        setGooglePayQrFile(file);
      }
    }
  };

  // Handle QR code upload
  const handleUploadQrCode = async (type) => {
    let file;
    if (type === 'phonePeQrImage') {
      file = phonePeQrFile;
    } else if (type === 'googlePayQrImage') {
      file = googlePayQrFile;
    }
    
    if (!file) {
      showNotification('error', 'Please select a file first');
      return;
    }
    
    try {
      setUploadingQr(true);
      const response = await settingsAPI.uploadQrCode(type, file);
      
      if (response.data.success) {
        showNotification('success', response.data.message);
        
        // Update settings with new QR image
        setSettings(prev => ({
          ...prev,
          [type]: response.data.data[type]
        }));
        
        // Clear file input
        if (type === 'phonePeQrImage') {
          setPhonePeQrFile(null);
          document.getElementById('phonePeQrInput').value = '';
        } else if (type === 'googlePayQrImage') {
          setGooglePayQrFile(null);
          document.getElementById('googlePayQrInput').value = '';
        }
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to upload QR code');
    } finally {
      setUploadingQr(false);
    }
  };

  // Handle QR code delete
  const handleDeleteQrCode = async (type) => {
    if (!window.confirm(`Are you sure you want to delete the ${type.replace('QrImage', '')} QR code?`)) {
      return;
    }
    
    try {
      const response = await settingsAPI.deleteQrCode(type);
      
      if (response.data.success) {
        showNotification('success', response.data.message);
        
        // Update settings to remove QR image
        setSettings(prev => ({
          ...prev,
          [type]: ''
        }));
      }
    } catch (error) {
      console.error('Error deleting QR code:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to delete QR code');
    }
  };

  // Handle Razorpay toggle
  const handleRazorpayToggle = (enabled) => {
    if (enabled) {
      if (!settings.razorpayKeyId) {
        setShowRazorpayModal(true);
        setRazorpayKeyIdInput('');
      } else {
        setSettings(prev => ({
          ...prev,
          razorpayEnabled: true
        }));
      }
    } else {
      setSettings(prev => ({
        ...prev,
        razorpayEnabled: false
      }));
    }
  };

  // Save Razorpay Key ID from modal
  const saveRazorpayKeyId = () => {
    if (!razorpayKeyIdInput.trim()) {
      showNotification('error', 'Please enter Razorpay Key ID');
      return;
    }
    
    if (!razorpayKeyIdInput.startsWith('rzp_test_') && !razorpayKeyIdInput.startsWith('rzp_live_')) {
      showNotification('error', 'Razorpay Key ID should start with "rzp_test_" or "rzp_live_"');
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      razorpayEnabled: true,
      razorpayKeyId: razorpayKeyIdInput.trim()
    }));
    
    setShowRazorpayModal(false);
    showNotification('success', 'Razorpay Key ID saved successfully!');
    
    // Ask if they want to set the secret key
    setTimeout(() => {
      const shouldSetSecret = window.confirm('Do you also want to set the Razorpay Secret Key?');
      if (shouldSetSecret) {
        setShowSecretModal(true);
      }
    }, 500);
  };

  // Save Razorpay Secret Key from modal
  const saveRazorpayKeySecret = () => {
    if (!razorpayKeySecretInput.trim()) {
      showNotification('error', 'Please enter Razorpay Secret Key');
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      razorpayKeySecret: razorpayKeySecretInput.trim()
    }));
    
    setShowSecretModal(false);
    setRazorpayKeySecretInput('');
    showNotification('success', 'Razorpay Secret Key saved successfully!');
  };

  // Handle modal closes
  const handleCloseModal = () => {
    setShowRazorpayModal(false);
  };

  const handleCloseSecretModal = () => {
    setShowSecretModal(false);
    setRazorpayKeySecretInput('');
  };

  // Other handlers (footer links, meta keywords, etc.)
  const handleAddFooterLink = () => {
    if (newFooterLink.name.trim() && newFooterLink.url.trim()) {
      const updatedLinks = [...footerLinks, { ...newFooterLink }];
      setFooterLinks(updatedLinks);
      setNewFooterLink({ name: '', url: '' });
    }
  };

  const handleRemoveFooterLink = (index) => {
    const updatedLinks = footerLinks.filter((_, i) => i !== index);
    setFooterLinks(updatedLinks);
  };

  const handleAddMetaKeyword = () => {
    if (metaKeywordInput.trim()) {
      setSettings(prev => ({
        ...prev,
        metaKeywords: [...prev.metaKeywords, metaKeywordInput.trim()]
      }));
      setMetaKeywordInput('');
    }
  };

  const handleRemoveMetaKeyword = (index) => {
    setSettings(prev => ({
      ...prev,
      metaKeywords: prev.metaKeywords.filter((_, i) => i !== index)
    }));
  };

  // Returns & Refunds handlers
  const handleAddReturnStep = () => {
    if (newReturnStep.title.trim() && newReturnStep.description.trim()) {
      setSettings(prev => ({
        ...prev,
        returnProcessSteps: [...prev.returnProcessSteps, { ...newReturnStep }]
      }));
      setNewReturnStep({ title: '', description: '' });
    }
  };

  const handleRemoveReturnStep = (index) => {
    setSettings(prev => ({
      ...prev,
      returnProcessSteps: prev.returnProcessSteps.filter((_, i) => i !== index)
    }));
  };

  const handleAddReturnCondition = () => {
    if (newReturnCondition.trim()) {
      setSettings(prev => ({
        ...prev,
        returnConditions: [...prev.returnConditions, newReturnCondition.trim()]
      }));
      setNewReturnCondition('');
    }
  };

  const handleRemoveReturnCondition = (index) => {
    setSettings(prev => ({
      ...prev,
      returnConditions: prev.returnConditions.filter((_, i) => i !== index)
    }));
  };

  const handleAddNonReturnableItem = () => {
    if (newNonReturnableItem.trim()) {
      setSettings(prev => ({
        ...prev,
        nonReturnableItems: [...prev.nonReturnableItems, newNonReturnableItem.trim()]
      }));
      setNewNonReturnableItem('');
    }
  };

  const handleRemoveNonReturnableItem = (index) => {
    setSettings(prev => ({
      ...prev,
      nonReturnableItems: prev.nonReturnableItems.filter((_, i) => i !== index)
    }));
  };

  // Privacy Policy handlers
  const handleAddDataWeCollect = () => {
    if (newDataWeCollect.trim()) {
      setSettings(prev => ({
        ...prev,
        dataWeCollect: [...prev.dataWeCollect, newDataWeCollect.trim()]
      }));
      setNewDataWeCollect('');
    }
  };

  const handleRemoveDataWeCollect = (index) => {
    setSettings(prev => ({
      ...prev,
      dataWeCollect: prev.dataWeCollect.filter((_, i) => i !== index)
    }));
  };

  const handleAddHowWeUseInfo = () => {
    if (newHowWeUseInfo.trim()) {
      setSettings(prev => ({
        ...prev,
        howWeUseInformation: [...prev.howWeUseInformation, newHowWeUseInfo.trim()]
      }));
      setNewHowWeUseInfo('');
    }
  };

  const handleRemoveHowWeUseInfo = (index) => {
    setSettings(prev => ({
      ...prev,
      howWeUseInformation: prev.howWeUseInformation.filter((_, i) => i !== index)
    }));
  };

  const handleAddDataProtectionRight = () => {
    if (newDataProtectionRight.trim()) {
      setSettings(prev => ({
        ...prev,
        dataProtectionRightsList: [...prev.dataProtectionRightsList, newDataProtectionRight.trim()]
      }));
      setNewDataProtectionRight('');
    }
  };

  const handleRemoveDataProtectionRight = (index) => {
    setSettings(prev => ({
      ...prev,
      dataProtectionRightsList: prev.dataProtectionRightsList.filter((_, i) => i !== index)
    }));
  };

  // Terms of Service handlers
  const handleAddTermsUserRequirement = () => {
    if (newTermsUserRequirement.trim()) {
      setSettings(prev => ({
        ...prev,
        termsUserRequirements: [...prev.termsUserRequirements, newTermsUserRequirement.trim()]
      }));
      setNewTermsUserRequirement('');
    }
  };

  const handleRemoveTermsUserRequirement = (index) => {
    setSettings(prev => ({
      ...prev,
      termsUserRequirements: prev.termsUserRequirements.filter((_, i) => i !== index)
    }));
  };

  const handleAddTermsSection = () => {
    if (newTermsSection.title.trim() && newTermsSection.content.trim()) {
      const newSection = {
        ...newTermsSection,
        number: settings.termsSections.length + 1
      };
      
      setSettings(prev => ({
        ...prev,
        termsSections: [...prev.termsSections, newSection]
      }));
      setNewTermsSection({ number: newSection.number + 1, title: '', content: '' });
    }
  };

  const handleRemoveTermsSection = (index) => {
    setSettings(prev => ({
      ...prev,
      termsSections: prev.termsSections.filter((_, i) => i !== index).map((section, idx) => ({
        ...section,
        number: idx + 1
      }))
    }));
    
    // Reset new section number
    if (newTermsSection.number > 1) {
      setNewTermsSection(prev => ({ ...prev, number: prev.number - 1 }));
    }
  };

  const handleUpdateTermsSection = (index, field, value) => {
    const newSections = [...settings.termsSections];
    newSections[index][field] = value;
    setSettings(prev => ({ ...prev, termsSections: newSections }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const dataToSend = {
        ...settings,
        footerLinks: footerLinks,
        razorpayEnabled: settings.razorpayEnabled,
        razorpayKeyId: settings.razorpayKeyId,
        razorpayKeySecret: settings.razorpayKeySecret,
        cashOnDeliveryEnabled: settings.cashOnDeliveryEnabled,
        maintenanceMode: settings.maintenanceMode,
        privacyPolicyEffectiveImmediately: settings.privacyPolicyEffectiveImmediately
      };

      const response = await settingsAPI.updateSettings(dataToSend);
      
      if (response.data.success) {
        showNotification('success', 'Settings saved successfully!');
        setSettings(response.data.data);
        if (response.data.data.footerLinks) {
          setFooterLinks(response.data.data.footerLinks);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'scripts', label: 'Script Tags', icon: Code },

    { id: 'contact', label: 'Contact', icon: Phone },

    { id: 'social', label: 'Social Media', icon: LinkIcon },
    { id: 'footer', label: 'Footer', icon: MapPin },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'returns', label: 'Returns & Refunds', icon: RefreshCw },
    { id: 'privacy', label: 'Privacy Policy', icon: Lock },
    { id: 'terms', label: 'Terms of Service', icon: FileSignature },
    
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header - Mobile Optimized */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 px-4 py-3 sm:px-6">
          <div className="flex flex-col space-y-2">
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600">Configure your store settings and preferences</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-3 sm:p-4 md:p-6">
          {/* Notification Banner */}
          {notification.message && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              notification.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : notification.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              {notification.message}
            </div>
          )}
          
          {/* Razorpay Configuration Modal */}
          {showRazorpayModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-sm sm:max-w-md overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                        <CreditCard size={16} className="sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {settings.razorpayKeyId ? 'Edit Key ID' : 'Set Key ID'}
                      </h3>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Key size={14} className="inline mr-1" />
                        Razorpay Key ID
                      </label>
                      <input
                        type="text"
                        value={razorpayKeyIdInput}
                        onChange={(e) => setRazorpayKeyIdInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="rzp_test_XXXXXXXXXXXXX"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Starts with "rzp_test_" or "rzp_live_"
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveRazorpayKeyId}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1"
                    >
                      <Check size={16} />
                      {settings.razorpayKeyId ? 'Update' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Razorpay Secret Key Modal */}
          {showSecretModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-sm sm:max-w-md overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                        <LockIcon size={16} className="sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {settings.razorpayKeySecret ? 'Edit Secret Key' : 'Set Secret Key'}
                      </h3>
                    </div>
                    <button
                      onClick={handleCloseSecretModal}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <LockIcon size={14} className="inline mr-1" />
                        Razorpay Secret Key
                      </label>
                      <input
                        type="password"
                        value={razorpayKeySecretInput}
                        onChange={(e) => setRazorpayKeySecretInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your Razorpay Secret Key"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is a sensitive key. Keep it secure and never share it publicly.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseSecretModal}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveRazorpayKeySecret}
                      className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-1"
                    >
                      <Check size={16} />
                      {settings.razorpayKeySecret ? 'Update' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Settings Content */}
          <div className="max-w-6xl mx-auto">
            {/* Tabs - Mobile Responsive */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden mb-4 sm:mb-6">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto scrollbar-hide px-2 sm:px-0">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Icon size={16} className="mr-2" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-4 sm:p-6">
                  {/* General Settings */}
                  {activeTab === 'general' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Site Information</h3>
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Site Name
                            </label>
                            <input
                              type="text"
                              name="siteName"
                              value={settings.siteName}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="My E-commerce Store"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Site Title
                            </label>
                            <input
                              type="text"
                              name="siteTitle"
                              value={settings.siteTitle}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Best Online Shopping Store"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Site Description
                            </label>
                            <textarea
                              name="siteDescription"
                              value={settings.siteDescription}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Your one-stop shop for everything"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900">Maintenance Mode</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Only admins can access when enabled
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="maintenanceMode"
                              checked={settings.maintenanceMode}
                              onChange={handleInputChange}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Settings */}
                  {activeTab === 'payment' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Payment Methods</h3>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                              <CreditCard size={20} className="text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Razorpay</h4>
                              <p className="text-xs text-gray-500">Online payment gateway</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="razorpayEnabled"
                              checked={settings.razorpayEnabled}
                              onChange={(e) => handleRazorpayToggle(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        {settings.razorpayEnabled && settings.razorpayKeyId && (
                          <div className="space-y-3">
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center mb-1">
                                    <Key size={14} className="text-gray-700 mr-1" />
                                    <span className="text-xs font-medium text-gray-700">Razorpay Key ID</span>
                                  </div>
                                  <p className="text-xs text-gray-900 font-mono truncate">
                                    {settings.razorpayKeyId}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRazorpayKeyIdInput(settings.razorpayKeyId);
                                    setShowRazorpayModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center mb-1">
                                    <LockIcon size={14} className="text-gray-700 mr-1" />
                                    <span className="text-xs font-medium text-gray-700">Razorpay Secret Key</span>
                                  </div>
                                  <p className="text-xs text-gray-900 font-mono truncate">
                                    {settings.razorpayKeySecret 
                                      ? '••••••••••••••••••••••' 
                                      : 'Not set'}
                                  </p>
                                  {!settings.razorpayKeySecret && (
                                    <p className="text-xs text-red-500 mt-1">
                                      Warning: Secret key is required for payment processing
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRazorpayKeySecretInput(settings.razorpayKeySecret || '');
                                    setShowSecretModal(true);
                                  }}
                                  className={`text-xs ml-2 ${
                                    settings.razorpayKeySecret 
                                      ? 'text-blue-600 hover:text-blue-800' 
                                      : 'text-red-600 hover:text-red-800'
                                  }`}
                                >
                                  {settings.razorpayKeySecret ? 'Edit' : 'Set'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                              <ShoppingCart size={20} className="text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Cash on Delivery</h4>
                              <p className="text-xs text-gray-500">Pay when you receive</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="cashOnDeliveryEnabled"
                              checked={settings.cashOnDeliveryEnabled}
                              onChange={handleInputChange}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

               

                  {/* Contact Settings */}
                  {activeTab === 'contact' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Contact Information</h3>
                      
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Phone size={14} className="inline mr-1" />
                            General Contact Number
                          </label>
                          <input
                            type="tel"
                            name="contactNumber"
                            value={settings.contactNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+91 1234567890"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <MessageCircle size={14} className="inline mr-1" />
                            WhatsApp Number
                          </label>
                          <input
                            type="tel"
                            name="whatsappNumber"
                            value={settings.whatsappNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+91 1234567890"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Users will be able to click a WhatsApp icon to message this number
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <PhoneCall size={14} className="inline mr-1" />
                            Call Number
                          </label>
                          <input
                            type="tel"
                            name="callNumber"
                            value={settings.callNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+91 1234567890"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Users will be able to click a phone icon to call this number
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Mail size={14} className="inline mr-1" />
                            Contact Email
                          </label>
                          <input
                            type="email"
                            name="contactEmail"
                            value={settings.contactEmail}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="contact@example.com"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <MapPin size={14} className="inline mr-1" />
                            Company Address
                          </label>
                          <textarea
                            name="companyAddress"
                            value={settings.companyAddress}
                            onChange={handleInputChange}
                            rows="2"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="123 Street, City, Country"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                {/* SCRIPT TAGS SETTINGS */}
{activeTab === 'scripts' && (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Script Tags Management</h3>
    
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <strong>Important:</strong> These scripts will be injected directly into your website. 
            Only add scripts from trusted sources. Incorrect scripts can break your site.
          </p>
        </div>
      </div>
    </div>

    {/* Header Scripts */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center mb-3">
        <Code className="text-blue-600 mr-2" size={20} />
        <h4 className="font-medium text-gray-900">Header Scripts</h4>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Scripts to add in &lt;head&gt; section
        </label>
        <div className="text-xs text-gray-500 mb-2">
          (e.g., Google Analytics, Facebook Pixel, meta tags, etc.)
        </div>
        <textarea
          name="headerScripts"
          value={settings.headerScripts}
          onChange={handleInputChange}
          rows="6"
          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder='<!-- Add header scripts here -->'
        />
        <div className="text-xs text-gray-500 mt-1">
          These scripts will be added just before the closing &lt;/head&gt; tag
        </div>
      </div>
    </div>

    {/* Body Scripts */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center mb-3">
        <Code className="text-green-600 mr-2" size={20} />
        <h4 className="font-medium text-gray-900">Body Scripts</h4>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Scripts to add after opening &lt;body&gt; tag
        </label>
        <div className="text-xs text-gray-500 mb-2">
          (e.g., Chat widgets, tracking scripts, etc.)
        </div>
        <textarea
          name="bodyScripts"
          value={settings.bodyScripts}
          onChange={handleInputChange}
          rows="6"
          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder='<!-- Add body scripts here -->'
        />
        <div className="text-xs text-gray-500 mt-1">
          These scripts will be added immediately after the opening &lt;body&gt; tag
        </div>
      </div>
    </div>

    {/* Footer Scripts */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center mb-3">
        <Code className="text-purple-600 mr-2" size={20} />
        <h4 className="font-medium text-gray-900">Footer Scripts</h4>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Scripts to add before closing &lt;/body&gt; tag
        </label>
        <div className="text-xs text-gray-500 mb-2">
          (e.g., Analytics, chat widgets, performance tracking, etc.)
        </div>
        <textarea
          name="footerScripts"
          value={settings.footerScripts}
          onChange={handleInputChange}
          rows="6"
          className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder='<!-- Add footer scripts here -->'
        />
        <div className="text-xs text-gray-500 mt-1">
          These scripts will be added just before the closing &lt;/body&gt; tag
        </div>
      </div>
    </div>
  </div>
)}

                  {/* Social Media Settings */}
                  {activeTab === 'social' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Social Media Links</h3>
                      
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        {['facebookUrl', 'twitterUrl', 'instagramUrl', 'youtubeUrl', 'linkedinUrl'].map((field) => (
                          <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                              {field.replace('Url', '')} URL
                            </label>
                            <input
                              type="url"
                              name={field}
                              value={settings[field]}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={`https://${field.replace('Url', '')}.com/yourpage`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Settings */}
                  {activeTab === 'footer' && (
                    <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Footer Settings</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Footer Text
                        </label>
                        <textarea
                          name="footerText"
                          value={settings.footerText}
                          onChange={handleInputChange}
                          rows="2"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="© 2024 My Store. All rights reserved."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Footer Links
                        </label>
                        <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                          {footerLinks.map((link, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-gray-50 rounded">
                              <input
                                type="text"
                                value={link.name}
                                onChange={(e) => {
                                  const newLinks = [...footerLinks];
                                  newLinks[index].name = e.target.value;
                                  setFooterLinks(newLinks);
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="Link Name"
                              />
                              <input
                                type="url"
                                value={link.url}
                                onChange={(e) => {
                                  const newLinks = [...footerLinks];
                                  newLinks[index].url = e.target.value;
                                  setFooterLinks(newLinks);
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="https://example.com"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveFooterLink(index)}
                                className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newFooterLink.name}
                            onChange={(e) => setNewFooterLink(prev => ({ ...prev, name: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Link Name"
                          />
                          <input
                            type="url"
                            value={newFooterLink.url}
                            onChange={(e) => setNewFooterLink(prev => ({ ...prev, url: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="https://example.com"
                          />
                          <button
                            type="button"
                            onClick={handleAddFooterLink}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Add Link
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SHIPPING SETTINGS */}
                  {activeTab === 'shipping' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
                      
                      {/* General Shipping Info */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Truck className="text-blue-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">General Shipping Information</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Shipping Info Description
                            </label>
                            <textarea
                              name="shippingInfo"
                              value={settings.shippingInfo}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Learn about our shipping policies, delivery times, and tracking information"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              <Clock className="inline mr-1" size={14} />
                              Order Processing Time
                            </label>
                            <textarea
                              name="orderProcessingTime"
                              value={settings.orderProcessingTime}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="All orders are processed within 1-2 business days after payment confirmation. Orders placed on weekends or holidays will be processed on the next business day."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Standard Shipping */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Package className="text-green-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Standard Shipping</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Delivery Time
                            </label>
                            <input
                              type="text"
                              name="standardShippingDelivery"
                              value={settings.standardShippingDelivery}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="5-7 business days"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              <DollarSign className="inline mr-1" size={14} />
                              Cost
                            </label>
                            <input
                              type="text"
                              name="standardShippingCost"
                              value={settings.standardShippingCost}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="$4.99"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Free Shipping Above
                            </label>
                            <input
                              type="text"
                              name="standardFreeShippingThreshold"
                              value={settings.standardFreeShippingThreshold}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="$50"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Express Shipping */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Package className="text-orange-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Express Shipping</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Delivery Time
                            </label>
                            <input
                              type="text"
                              name="expressShippingDelivery"
                              value={settings.expressShippingDelivery}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="2-3 business days"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              <DollarSign className="inline mr-1" size={14} />
                              Cost
                            </label>
                            <input
                              type="text"
                              name="expressShippingCost"
                              value={settings.expressShippingCost}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="$9.99"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Free Shipping Above
                            </label>
                            <input
                              type="text"
                              name="expressFreeShippingThreshold"
                              value={settings.expressFreeShippingThreshold}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="$100"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Overnight Shipping */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Package className="text-red-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Overnight Shipping</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Delivery Time
                            </label>
                            <input
                              type="text"
                              name="overnightShippingDelivery"
                              value={settings.overnightShippingDelivery}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="1 business day"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              <DollarSign className="inline mr-1" size={14} />
                              Cost
                            </label>
                            <input
                              type="text"
                              name="overnightShippingCost"
                              value={settings.overnightShippingCost}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="$19.99"
                            />
                          </div>
                        </div>
                      </div>

                      {/* International Shipping */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <GlobeIcon className="text-purple-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">International Shipping</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Delivery Time
                            </label>
                            <input
                              type="text"
                              name="internationalShippingDelivery"
                              value={settings.internationalShippingDelivery}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="10-15 business days"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Additional Note
                            </label>
                            <textarea
                              name="internationalShippingNote"
                              value={settings.internationalShippingNote}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="International shipping costs vary by destination. You'll see the exact shipping cost at checkout."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RETURNS & REFUNDS POLICY SETTINGS */}
                  {activeTab === 'returns' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Returns & Refunds Policy</h3>
                      
                      {/* Policy Title & Description */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <FileText className="text-blue-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Policy Overview</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Policy Title
                            </label>
                            <input
                              type="text"
                              name="returnsPolicyTitle"
                              value={settings.returnsPolicyTitle}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Returns & Refunds Policy"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Policy Description
                            </label>
                            <textarea
                              name="returnsPolicyDescription"
                              value={settings.returnsPolicyDescription}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="We want you to be completely satisfied with your purchase. Here's everything you need to know about returns and refunds."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Return Process Steps */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <RefreshCw className="text-green-600 mr-2" size={20} />
                            <h4 className="font-medium text-gray-900">Return Process Steps</h4>
                          </div>
                        </div>
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                          {settings.returnProcessSteps.map((step, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 bg-white rounded border">
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => {
                                    const newSteps = [...settings.returnProcessSteps];
                                    newSteps[index].title = e.target.value;
                                    setSettings(prev => ({ ...prev, returnProcessSteps: newSteps }));
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  placeholder="Step Title"
                                />
                                <textarea
                                  value={step.description}
                                  onChange={(e) => {
                                    const newSteps = [...settings.returnProcessSteps];
                                    newSteps[index].description = e.target.value;
                                    setSettings(prev => ({ ...prev, returnProcessSteps: newSteps }));
                                  }}
                                  rows="2"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  placeholder="Step Description"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveReturnStep(index)}
                                className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                              >
                                <Minus size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newReturnStep.title}
                            onChange={(e) => setNewReturnStep(prev => ({ ...prev, title: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Step Title"
                          />
                          <input
                            type="text"
                            value={newReturnStep.description}
                            onChange={(e) => setNewReturnStep(prev => ({ ...prev, description: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Step Description"
                          />
                          <button
                            type="button"
                            onClick={handleAddReturnStep}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Return Conditions */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <CheckCircle className="text-orange-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Return Conditions</h4>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Return Timeframe
                            </label>
                            <input
                              type="text"
                              name="returnTimeframe"
                              value={settings.returnTimeframe}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="30 days from the delivery date"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Condition Requirements
                            </label>
                            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                              {settings.returnConditions.map((condition, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <span className="text-sm text-gray-700">{condition}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveReturnCondition(index)}
                                    className="text-red-600 hover:text-red-800 text-xs ml-2"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newReturnCondition}
                                onChange={(e) => setNewReturnCondition(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                placeholder="Add condition (e.g., Items must be unworn, unused, and unwashed)"
                              />
                              <button
                                type="button"
                                onClick={handleAddReturnCondition}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Shipping Responsibility
                            </label>
                            <textarea
                              name="customerShippingResponsibility"
                              value={settings.customerShippingResponsibility}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Return shipping costs are the responsibility of the customer, unless the return is due to our error..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Non-Returnable Items */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <AlertCircle className="text-red-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Non-Returnable Items</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {settings.nonReturnableItems.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm text-gray-700">{item}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveNonReturnableItem(index)}
                                  className="text-red-600 hover:text-red-800 text-xs ml-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newNonReturnableItem}
                              onChange={(e) => setNewNonReturnableItem(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              placeholder="Add non-returnable item (e.g., Personalized or customized items)"
                            />
                            <button
                              type="button"
                              onClick={handleAddNonReturnableItem}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Defective Items */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Shield className="text-purple-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Defective or Damaged Items</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Important Note
                          </label>
                          <textarea
                            name="defectiveItemsNote"
                            value={settings.defectiveItemsNote}
                            onChange={handleInputChange}
                            rows="2"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="If you receive a defective or damaged item, please contact us immediately..."
                          />
                        </div>
                      </div>

                      {/* Refund Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <DollarSign className="text-green-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Refund Information</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Processing Time
                            </label>
                            <input
                              type="text"
                              name="refundProcessingTime"
                              value={settings.refundProcessingTime}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="5-10 business days"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Additional Note
                            </label>
                            <textarea
                              name="refundNote"
                              value={settings.refundNote}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="It may take additional time for the refund to appear on your credit card statement..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Refund Amount Formula
                            </label>
                            <input
                              type="text"
                              name="refundAmountFormula"
                              value={settings.refundAmountFormula}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Refund Amount = Item Price - Shipping Costs"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Refund Amount Description
                            </label>
                            <textarea
                              name="refundAmountDescription"
                              value={settings.refundAmountDescription}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="You will receive a full refund for the item price, minus any shipping costs..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Exchange Policy */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <ArrowRight className="text-blue-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Exchange Policy</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Exchange Policy Description
                          </label>
                          <textarea
                            name="exchangePolicy"
                            value={settings.exchangePolicy}
                            onChange={handleInputChange}
                            rows="2"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="We currently do not offer direct exchanges. To exchange an item..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PRIVACY POLICY SETTINGS */}
                  {activeTab === 'privacy' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Policy</h3>
                      
                      {/* Policy Header */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Lock className="text-blue-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Policy Header</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Policy Title
                            </label>
                            <input
                              type="text"
                              name="privacyPolicyTitle"
                              value={settings.privacyPolicyTitle}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Privacy Policy"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Updated
                              </label>
                              <input
                                type="text"
                                name="privacyPolicyLastUpdated"
                                value={settings.privacyPolicyLastUpdated}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="2026"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Effective Immediately
                              </label>
                              <div className="flex items-center mt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    name="privacyPolicyEffectiveImmediately"
                                    checked={settings.privacyPolicyEffectiveImmediately}
                                    onChange={handleInputChange}
                                    className="sr-only peer"
                                  />
                                  <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <span className="ml-3 text-sm text-gray-600">
                                  {settings.privacyPolicyEffectiveImmediately ? 'Effective immediately' : 'Not effective immediately'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Introduction
                            </label>
                            <textarea
                              name="privacyPolicyIntroduction"
                              value={settings.privacyPolicyIntroduction}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="We value your privacy and are committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Data We Collect */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Database className="text-green-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Data We Collect</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {settings.dataWeCollect.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm text-gray-700">{item}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDataWeCollect(index)}
                                  className="text-red-600 hover:text-red-800 text-xs ml-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newDataWeCollect}
                              onChange={(e) => setNewDataWeCollect(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              placeholder="Add data type (e.g., Name and contact details)"
                            />
                            <button
                              type="button"
                              onClick={handleAddDataWeCollect}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* How We Use Your Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Eye className="text-orange-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">How We Use Your Information</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {settings.howWeUseInformation.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm text-gray-700">{item}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveHowWeUseInfo(index)}
                                  className="text-red-600 hover:text-red-800 text-xs ml-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newHowWeUseInfo}
                              onChange={(e) => setNewHowWeUseInfo(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              placeholder="Add usage purpose (e.g., Order processing and fulfillment)"
                            />
                            <button
                              type="button"
                              onClick={handleAddHowWeUseInfo}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Introduction Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Users className="text-purple-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Introduction</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Welcome Message
                          </label>
                          <textarea
                            name="privacyIntroductionSection"
                            value={settings.privacyIntroductionSection}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Welcome to our website. We are committed to protecting your personal information and your right to privacy..."
                          />
                        </div>
                      </div>

                      {/* Information We Collect Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Database className="text-blue-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Information We Collect</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Collection Details
                          </label>
                          <textarea
                            name="informationWeCollectSection"
                            value={settings.informationWeCollectSection}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="We collect personal information that you voluntarily provide to us when you register on our website..."
                          />
                        </div>
                      </div>

                      {/* How We Use Information Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Eye className="text-green-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">How We Use Information</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Usage Details
                          </label>
                          <textarea
                            name="howWeUseInformationSection"
                            value={settings.howWeUseInformationSection}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="We use the information we collect for various purposes, including to process and fulfill your orders..."
                          />
                        </div>
                      </div>

                      {/* Data Security Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <ShieldCheck className="text-red-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Data Security</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Security Details
                          </label>
                          <textarea
                            name="dataSecuritySection"
                            value={settings.dataSecuritySection}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="We have implemented appropriate technical and organizational security measures..."
                          />
                        </div>
                      </div>

                      {/* Data Protection Rights */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <CheckCircle className="text-purple-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Your Data Protection Rights</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rights Overview
                            </label>
                            <textarea
                              name="dataProtectionRightsSection"
                              value={settings.dataProtectionRightsSection}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Depending on your location, you may have rights regarding your personal data including..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Specific Rights List
                            </label>
                            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                              {settings.dataProtectionRightsList.map((right, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <span className="text-sm text-gray-700">{right}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDataProtectionRight(index)}
                                    className="text-red-600 hover:text-red-800 text-xs ml-2"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newDataProtectionRight}
                                onChange={(e) => setNewDataProtectionRight(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                placeholder="Add right (e.g., Right to access)"
                              />
                              <button
                                type="button"
                                onClick={handleAddDataProtectionRight}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Us Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Mail className="text-blue-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Contact Us</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Information
                          </label>
                          <textarea
                            name="contactUsSection"
                            value={settings.contactUsSection}
                            onChange={handleInputChange}
                            rows="2"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="If you have questions or comments about this policy, you may contact us..."
                          />
                        </div>
                      </div>

                      {/* Security Measures Section */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Shield className="text-green-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Security Measures</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Security Details
                          </label>
                          <textarea
                            name="securityMeasuresSection"
                            value={settings.securityMeasuresSection}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="We implement industry-standard security measures to protect your personal information..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TERMS OF SERVICE SETTINGS */}
                  {activeTab === 'terms' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms of Service</h3>
                      
                      {/* Policy Header */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <FileSignature className="text-blue-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Policy Header</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Policy Title
                            </label>
                            <input
                              type="text"
                              name="termsOfServiceTitle"
                              value={settings.termsOfServiceTitle}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Terms of Service"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Last Updated
                            </label>
                            <input
                              type="text"
                              name="termsOfServiceLastUpdated"
                              value={settings.termsOfServiceLastUpdated}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="2026"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Important Notice
                            </label>
                            <textarea
                              name="termsImportantNotice"
                              value={settings.termsImportantNotice}
                              onChange={handleInputChange}
                              rows="2"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="These Terms of Service govern your use of our website and services. By using our website, you acknowledge that you have read, understood, and agree to be bound by these terms."
                            />
                          </div>
                        </div>
                      </div>

                      {/* User Requirements */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <AlertCircle className="text-orange-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">User Requirements</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {settings.termsUserRequirements.map((requirement, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm text-gray-700">{requirement}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTermsUserRequirement(index)}
                                  className="text-red-600 hover:text-red-800 text-xs ml-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newTermsUserRequirement}
                              onChange={(e) => setNewTermsUserRequirement(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              placeholder="Add user requirement (e.g., You must be at least 18 years old to place an order)"
                            />
                            <button
                              type="button"
                              onClick={handleAddTermsUserRequirement}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Terms Sections */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <ScrollText className="text-green-600 mr-2" size={20} />
                            <h4 className="font-medium text-gray-900">Terms Sections</h4>
                          </div>
                        </div>
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                          {settings.termsSections.map((section, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 bg-white rounded border">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">#{section.number}</span>
                                  <input
                                    type="text"
                                    value={section.title}
                                    onChange={(e) => handleUpdateTermsSection(index, 'title', e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Section Title"
                                  />
                                </div>
                                <textarea
                                  value={section.content}
                                  onChange={(e) => handleUpdateTermsSection(index, 'content', e.target.value)}
                                  rows="3"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  placeholder="Section Content"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveTermsSection(index)}
                                className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                              >
                                <Minus size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={newTermsSection.title}
                            onChange={(e) => setNewTermsSection(prev => ({ ...prev, title: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Section Title"
                          />
                          <input
                            type="text"
                            value={newTermsSection.content}
                            onChange={(e) => setNewTermsSection(prev => ({ ...prev, content: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Section Content"
                          />
                          <button
                            type="button"
                            onClick={handleAddTermsSection}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <Mail className="text-green-600 mr-2" size={20} />
                          <h4 className="font-medium text-gray-900">Contact Information</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Details
                          </label>
                          <textarea
                            name="termsContactInfo"
                            value={settings.termsContactInfo}
                            onChange={handleInputChange}
                            rows="2"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Questions about the Terms of Service should be sent to us at the contact information provided in our website footer."
                          />
                        </div>
                      </div>
                    </div>
                  )}


                </div>

                {/* Save Button */}
                <div className="border-t border-gray-200 p-4 sm:p-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="sm:w-5 sm:h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;