'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Package, User, Mail, Phone, MapPin, 
  Truck, CreditCard, DollarSign, Calendar, FileText, Image as ImageIcon,
  Loader2, RefreshCw, X, ChevronLeft, ChevronRight, TrendingUp,
  Clock, CheckCircle, AlertCircle, Download, ArrowRight, Wallet,
  ShoppingBag, Settings, CheckSquare, Send, Home, Building2, CreditCard as CreditCardIcon,
  DollarSign as DollarSignIcon, PackageCheck, Truck as TruckIcon, ShoppingCart
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

// --- Interfaces ---
interface DesignFile {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileType: string;
}

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface DesignOrder {
  _id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  quantity: number;
  productPrice?: number;
  totalPrice?: string | number;
  deliveryCharge?: number;
  size: string;
  customSize?: { width: number; height: number; unit: string; };
  material: string;
  designFiles: DesignFile[];
  additionalText: {
    cardHolderName: string;
    designation: string;
    companyName: string;
    specialInstructions: string;
  };
  deliveryMethod: 'pickup' | 'door_delivery';
  paymentMethod: 'cod' | 'razorpay';
  deliveryAddress?: DeliveryAddress;
  paymentStatus: string;
  status: string;
  statusHistory: any[];
  createdAt: string;
  orderNumber: string;
}

// --- Workflow Step Props Interface ---
interface WorkflowStepProps {
  label: string;
  status?: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
  color: 'orange' | 'green' | 'blue' | 'purple' | 'emerald' | 'indigo';
}

// --- Workflow Step Component ---
const WorkflowStep: React.FC<WorkflowStepProps> = ({ 
  label, isActive, isCompleted, onClick, icon, color
}) => {
  const colorVariants: Record<string, string> = {
    orange: isCompleted ? 'bg-orange-500 border-orange-500' : isActive ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-400',
    green: isCompleted ? 'bg-green-500 border-green-500' : isActive ? 'bg-green-50 border-green-500 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400',
    blue: isCompleted ? 'bg-blue-500 border-blue-500' : isActive ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400',
    purple: isCompleted ? 'bg-purple-500 border-purple-500' : isActive ? 'bg-purple-50 border-purple-500 text-purple-600' : 'bg-gray-50 border-gray-200 text-gray-400',
    emerald: isCompleted ? 'bg-emerald-500 border-emerald-500' : isActive ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400',
    indigo: isCompleted ? 'bg-indigo-500 border-indigo-500' : isActive ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-gray-50 border-gray-200 text-gray-400',
  };

  return (
    <div className="flex flex-col items-center relative z-10 group">
      <button
        onClick={onClick}
        disabled={!isActive && !isCompleted}
        className={`
          relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-2xl border-2 transition-all duration-500 
          ${colorVariants[color]}
          ${isActive ? 'scale-110 shadow-lg shadow-orange-200 ring-4 ring-orange-50' : 'hover:scale-105'}
          ${isCompleted ? 'text-white' : ''}
          cursor-pointer
        `}
      >
        {isCompleted ? <CheckCircle size={24} className="animate-in zoom-in duration-300" /> : icon}
        {isActive && !isCompleted && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500"></span>
          </span>
        )}
      </button>
      <div className="mt-3 flex flex-col items-center">
        <span className={`text-[10px] font-black uppercase tracking-tighter text-center transition-colors duration-300 ${isActive || isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
          {label}
        </span>
        {isActive && !isCompleted && (
          <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded mt-1 font-bold animate-pulse">CURRENT</span>
        )}
      </div>
    </div>
  );
};

// --- Workflow Connector Component ---
interface WorkflowConnectorProps {
  isCompleted: boolean;
  isActive: boolean;
}

const WorkflowConnector: React.FC<WorkflowConnectorProps> = ({ isCompleted, isActive }) => (
  <div className="flex-1 h-1 mx-[-4px] mb-8 relative bg-gray-100 rounded-full overflow-hidden min-w-[20px]">
    <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-in-out ${isCompleted ? 'w-full bg-orange-500' : isActive ? 'w-1/2 bg-orange-400' : 'w-0'}`} />
  </div>
);

export default function AdminDesignOrdersPage() {
  const [orders, setOrders] = useState<DesignOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<DesignOrder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editDeliveryCharge, setEditDeliveryCharge] = useState('');
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const ordersPerPage = 9;

  // ==================== FETCH ORDERS ====================
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UPDATE ORDER STATUS ====================
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsProcessingAction(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, comment: `Updated to ${newStatus}` })
      });
      if (response.ok) {
        await fetchOrders();
        if (selectedOrder?._id === orderId) {
          const updatedOrder = orders.find(o => o._id === orderId);
          if (updatedOrder) {
            setSelectedOrder({ ...updatedOrder, status: newStatus });
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating status:', error);
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ==================== UPDATE PRICES ====================
  const updateOrderPrices = async (orderId: string) => {
    try {
      setIsProcessingAction(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/update-prices`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          productPrice: parseFloat(editProductPrice) || 0,
          deliveryCharge: parseFloat(editDeliveryCharge) || 0
        })
      });
      if (response.ok) {
        alert('✅ Prices updated successfully!');
        await fetchOrders();
        if (selectedOrder) {
          const updatedOrder = orders.find(o => o._id === orderId);
          if (updatedOrder) {
            setSelectedOrder({ ...updatedOrder,
              productPrice: parseFloat(editProductPrice) || 0,
              deliveryCharge: parseFloat(editDeliveryCharge) || 0,
              totalPrice: (parseFloat(editProductPrice) || 0) + (parseFloat(editDeliveryCharge) || 0)
            });
          }
        }
        setIsEditingPrice(false);
        return true;
      } else {
        alert('❌ Failed to update prices');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update prices');
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ==================== EMAIL FUNCTIONS ====================
  const sendProcessingEmail = async (orderId: string) => {
    const expectedDate = prompt('📅 Enter expected completion date:\nFormat: YYYY-MM-DD\nExample: 2026-06-25');
    if (!expectedDate) return false;
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expectedDate)) {
      alert('❌ Invalid date format. Please use YYYY-MM-DD');
      return false;
    }
    
    try {
      setIsProcessingAction(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/start-processing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, expectedDate })
      });
      if (response.ok) {
        alert('✅ Email sent! Order status updated to "In Process"');
        await fetchOrders();
        if (selectedOrder) {
          const updatedOrder = orders.find(o => o._id === orderId);
          if (updatedOrder) {
            setSelectedOrder({ ...updatedOrder, status: 'in_process' });
          }
        }
        return true;
      } else {
        alert('❌ Failed to send email');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send email');
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };

  const sendPickupEmail = async (orderId: string) => {
    try {
      setIsProcessingAction(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/ready-for-pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });
      if (response.ok) {
        alert('✅ Pickup notification sent!');
        await fetchOrders();
        if (selectedOrder) {
          const updatedOrder = orders.find(o => o._id === orderId);
          if (updatedOrder) {
            setSelectedOrder({ ...updatedOrder, status: 'ready_for_pickup' });
          }
        }
        return true;
      } else {
        alert('❌ Failed to send email');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send email');
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };

  const sendDeliveryEmail = async (orderId: string) => {
    const deliveryDateTime = prompt('🚚 Enter delivery date and time:\nFormat: YYYY-MM-DD HH:MM AM/PM\nExample: 2026-06-17 02:00 PM');
    if (!deliveryDateTime) return false;
    
    try {
      setIsProcessingAction(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/out-for-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, deliveryDateTime })
      });
      if (response.ok) {
        alert('✅ Delivery notification sent!');
        await fetchOrders();
        if (selectedOrder) {
          const updatedOrder = orders.find(o => o._id === orderId);
          if (updatedOrder) {
            setSelectedOrder({ ...updatedOrder, status: 'out_for_delivery' });
          }
        }
        return true;
      } else {
        alert('❌ Failed to send email');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send email');
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ==================== PAYMENT FUNCTIONS ====================
  const markPaymentPaid = async (orderId: string) => {
    try {
      setIsProcessingAction(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/mark-payment-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });
      if (response.ok) {
        alert('✅ Payment marked as PAID!');
        await fetchOrders();
        if (selectedOrder) {
          const updatedOrder = orders.find(o => o._id === orderId);
          if (updatedOrder) {
            setSelectedOrder({ ...updatedOrder, paymentStatus: 'paid' });
          }
        }
        return true;
      } else {
        alert('❌ Failed to mark payment');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to mark payment');
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };

  const markCODPaid = async (orderId: string) => {
    try {
      setIsProcessingAction(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/mark-cod-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });
      if (response.ok) {
        alert('✅ COD Payment marked as PAID!');
        await fetchOrders();
        if (selectedOrder) {
          const updatedOrder = orders.find(o => o._id === orderId);
          if (updatedOrder) {
            setSelectedOrder({ ...updatedOrder, paymentStatus: 'paid' });
          }
        }
        return true;
      } else {
        alert('❌ Failed to mark payment');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to mark payment');
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };

  const sendPaymentReminder = async (orderId: string) => {
    try {
      setIsProcessingAction(true);
      const token = localStorage.getItem('token');
      const linkResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/create-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId })
      });
      const linkData = await linkResponse.json();
      if (!linkData.success) {
        alert('❌ Failed to create payment link: ' + linkData.error);
        return false;
      }
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/send-payment-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId, paymentLink: linkData.paymentLink })
      });
      if (response.ok) {
        alert(`✅ Payment link created and email sent!\n\n🔗 Link: ${linkData.paymentLink}\n💰 Amount: ₹${linkData.amount}`);
        await fetchOrders();
        return true;
      } else {
        alert('❌ Payment link created but failed to send email');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create payment link');
      return false;
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ==================== HELPERS ====================
  const getStatusStyles = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      design_review: 'bg-blue-50 text-blue-700 border-blue-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      in_process: 'bg-purple-50 text-purple-700 border-purple-200',
      ready_for_pickup: 'bg-green-50 text-green-700 border-green-200',
      out_for_delivery: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      printing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      completed: 'bg-slate-900 text-white border-slate-900',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
      rejected: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return styles[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const statusOptions = ['all', 'pending', 'design_review', 'approved', 'printing', 'completed', 'cancelled', 'in_process', 'ready_for_pickup', 'out_for_delivery'];

  const getPaymentBadge = (status: string) => {
    const isPaid = status?.toLowerCase() === 'paid';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
        {status === 'paid' ? 'PAID' : 'PENDING PAYMENT'}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // ==================== FILTERS & PAGINATION ====================
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentOrders = filteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // ==================== STATS ====================
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    printing: orders.filter(o => o.status === 'printing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    pendingPayment: orders.filter(o => o.paymentStatus === 'pending').length,
  };

  // ==================== WORKFLOW RENDERER ====================
  const renderWorkflow = (order: DesignOrder) => {
    const isPickup = order.deliveryMethod === 'pickup';
    const isRazorpay = order.paymentMethod === 'razorpay';
    const isPaid = order.paymentStatus === 'paid';
    
    let steps: { 
      id: string; 
      label: string; 
      icon: React.ReactNode; 
      color: 'orange' | 'green' | 'blue' | 'purple' | 'emerald' | 'indigo';
      status: string;
    }[] = [];
    
    if (isPickup && !isRazorpay) {
      steps = [
        { id: 'placed', label: 'Placed', icon: <ShoppingBag size={22} />, color: 'orange', status: 'pending' },
        { id: 'process', label: 'Process', icon: <Settings size={22} />, color: 'blue', status: 'in_process' },
        { id: 'pickup', label: 'Pickup', icon: <PackageCheck size={22} />, color: 'green', status: 'ready_for_pickup' },
        { id: 'paid', label: 'Paid', icon: <DollarSignIcon size={22} />, color: 'emerald', status: 'completed' },
      ];
    } else if (isPickup && isRazorpay) {
      steps = [
        { id: 'placed', label: 'Placed', icon: <ShoppingBag size={22} />, color: 'orange', status: 'pending' },
        { id: 'payment', label: 'Payment', icon: <CreditCardIcon size={22} />, color: 'purple', status: 'pending' },
        { id: 'process', label: 'Process', icon: <Settings size={22} />, color: 'blue', status: 'in_process' },
        { id: 'pickup', label: 'Pickup', icon: <PackageCheck size={22} />, color: 'green', status: 'ready_for_pickup' },
        { id: 'done', label: 'Done', icon: <CheckSquare size={22} />, color: 'emerald', status: 'completed' },
      ];
    } else if (!isPickup && !isRazorpay) {
      steps = [
        { id: 'placed', label: 'Placed', icon: <ShoppingBag size={22} />, color: 'orange', status: 'pending' },
        { id: 'process', label: 'Process', icon: <Settings size={22} />, color: 'blue', status: 'in_process' },
        { id: 'transit', label: 'Transit', icon: <TruckIcon size={22} />, color: 'indigo', status: 'out_for_delivery' },
        { id: 'paid', label: 'Paid', icon: <DollarSignIcon size={22} />, color: 'emerald', status: 'completed' },
      ];
    } else {
      steps = [
        { id: 'placed', label: 'Placed', icon: <ShoppingBag size={22} />, color: 'orange', status: 'pending' },
        { id: 'payment', label: 'Payment', icon: <CreditCardIcon size={22} />, color: 'purple', status: 'pending' },
        { id: 'process', label: 'Process', icon: <Settings size={22} />, color: 'blue', status: 'in_process' },
        { id: 'transit', label: 'Transit', icon: <TruckIcon size={22} />, color: 'indigo', status: 'out_for_delivery' },
        { id: 'done', label: 'Done', icon: <CheckSquare size={22} />, color: 'emerald', status: 'completed' },
      ];
    }

    const orderStatus = order.status;
    let currentStepIndex = 0;
    let foundActive = false;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.status === orderStatus) {
        currentStepIndex = i;
        foundActive = true;
        break;
      }
      if (orderStatus === 'completed') {
        currentStepIndex = steps.length - 1;
        foundActive = true;
        break;
      }
    }
    
    if (!foundActive) {
      if (orderStatus === 'pending') currentStepIndex = 0;
      else if (orderStatus === 'in_process') {
        const processIdx = steps.findIndex(s => s.status === 'in_process');
        currentStepIndex = processIdx !== -1 ? processIdx : 1;
      } else if (orderStatus === 'ready_for_pickup') {
        const pickupIdx = steps.findIndex(s => s.status === 'ready_for_pickup');
        currentStepIndex = pickupIdx !== -1 ? pickupIdx : 2;
      } else if (orderStatus === 'out_for_delivery') {
        const transitIdx = steps.findIndex(s => s.status === 'out_for_delivery');
        currentStepIndex = transitIdx !== -1 ? transitIdx : 2;
      }
    }
// Add this function to your component

    const isStepCompleted = (stepIndex: number) => {
      if (orderStatus === 'completed') return true;
      if (stepIndex < currentStepIndex) return true;
      if (steps[stepIndex]?.status === 'payment_pending' && isPaid) return true;
      return false;
    };

    const isStepActive = (stepIndex: number) => {
      if (orderStatus === 'completed') return false;
      return stepIndex === currentStepIndex;
    };

    return (
      <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <TrendingUp size={120} />
        </div>
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Live Tracking</h4>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-sm font-bold text-slate-800">Order Progress</span>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              {isPickup ? <Home size={12} className="text-blue-500" /> : <Truck size={12} className="text-indigo-500" />}
              {order.deliveryMethod.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              {isRazorpay ? <CreditCardIcon size={12} className="text-purple-500" /> : <DollarSignIcon size={12} className="text-emerald-500" />}
              {order.paymentMethod.toUpperCase()}
            </span>
            {!isPaid && isRazorpay && (
              <span className="text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 px-3 py-1 rounded-full shadow-sm">
                ⚠️ Payment Pending
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between relative px-2">
          {steps.map((step, index) => {
            const isActive = isStepActive(index);
            const isCompleted = isStepCompleted(index);
            
            return (
              <React.Fragment key={step.id}>
                <WorkflowStep
                  label={step.label}
                  icon={step.icon}
                  color={step.color}
                  isActive={isActive}
                  isCompleted={isCompleted}
                />
                {index < steps.length - 1 && (
                  <WorkflowConnector isCompleted={isCompleted} isActive={isActive} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-slate-400">
              <div className="w-2 h-2 rounded-full bg-gray-200"></div> Upcoming
            </div>
            <div className="flex items-center gap-1.5 text-orange-500">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div> Active
            </div>
            <div className="flex items-center gap-1.5 text-orange-500">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div> Completed
            </div>
          </div>
          <p className="text-slate-400 italic font-medium">Workflow progress</p>
        </div>
      </div>
    );
  };

  // ==================== ACTION BUTTONS SECTION ====================
const renderActionButtons = (order: DesignOrder) => {
  const isPickup = order.deliveryMethod === 'pickup';
  const isRazorpay = order.paymentMethod === 'razorpay';
  const isPaid = order.paymentStatus === 'paid';
  const status = order.status;
  
  // Check if prices are set (greater than 0)
  const hasPricesSet = (order.productPrice || 0) > 0 && (order.deliveryCharge || 0) >= 0;
const hasTotalPrice = Number(order.totalPrice || 0) > 0;
  const pricesConfigured = hasPricesSet || hasTotalPrice;
    const checkRazorpayPaymentStatus = async (orderId: string) => {
  try {
    setIsProcessingAction(true);
    const token = localStorage.getItem('token');
    
    // First, get the payment status from your backend
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/payment-status/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.paymentStatus === 'paid') {
        alert('✅ Payment is already marked as PAID!');
        await fetchOrders();
        if (selectedOrder) {
          const updatedOrder = orders.find(o => o._id === orderId);
          if (updatedOrder) {
            setSelectedOrder({ ...updatedOrder, paymentStatus: 'paid' });
          }
        }
      } else {
        // If still pending, check with Razorpay API
        const checkResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/design-orders/check-razorpay-payment/${orderId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const checkData = await checkResponse.json();
        
        if (checkData.success && checkData.paymentStatus === 'captured') {
          alert('✅ Payment found on Razorpay! Marking as PAID...');
          // Mark as paid
          await markPaymentPaid(orderId);
        } else {
          alert('⏳ Payment not found on Razorpay. Please wait or contact customer.');
        }
      }
    }
  } catch (error) {
    console.error('Error checking payment:', error);
    alert('Failed to check payment status');
  } finally {
    setIsProcessingAction(false);
  }
};
    // Determine what actions are available based on current status
const getAvailableActions = () => {
  const actions = [];
  
  // ✅ ONLY ONE PLACE for all actions
  if (pricesConfigured) {
    if (isRazorpay && !isPaid && status === 'pending') {
      actions.push({
        id: 'send_payment',
        label: '📧 Send Payment Link',
        description: 'Send Razorpay payment link to customer',
        action: () => sendPaymentReminder(order._id),
        priority: 1
      });
      actions.push({
        id: 'check_payment',
        label: '🔄 Check Payment Status',
        description: 'Check if customer has paid via Razorpay',
        action: () => checkRazorpayPaymentStatus(order._id),
        priority: 2
      });
      actions.push({
        id: 'mark_paid',
        label: '✅ Mark Payment as Paid',
        description: 'Manually mark payment as received',
        action: () => { if (confirm('Mark payment as paid?')) markPaymentPaid(order._id); },
        priority: 3
      });
    }
    
    if (!isRazorpay && !isPaid && status === 'pending') {
      actions.push({
        id: 'mark_cod_paid',
        label: '✅ Mark COD as Paid',
        description: 'Mark Cash on Delivery as paid',
        action: () => { if (confirm('Mark COD payment as paid?')) markCODPaid(order._id); },
        priority: 1
      });
    }
    
    if ((isPaid || !isRazorpay) && status === 'pending') {
      actions.push({
        id: 'start_processing',
        label: '🚀 Start Processing',
        description: 'Send "Processing Started" email to customer',
        action: () => sendProcessingEmail(order._id),
        priority: 4
      });
    }
  }
  
  if (status === 'in_process' && isPickup) {
    actions.push({
      id: 'send_pickup',
      label: '📦 Ready for Pickup',
      description: 'Send pickup notification to customer',
      action: () => sendPickupEmail(order._id),
      priority: 5
    });
  }
  
  if (status === 'in_process' && !isPickup) {
    actions.push({
      id: 'send_delivery',
      label: '🚚 Out for Delivery',
      description: 'Send delivery notification with date/time',
      action: () => sendDeliveryEmail(order._id),
      priority: 5
    });
  }
  
  return actions.sort((a, b) => a.priority - b.priority);
};
  
    const availableActions = getAvailableActions();
    
    // Get current step guideline
   // Get current step guideline
  const getGuideline = () => {
    // PRIORITY 1: Price not set - show price setup guideline FIRST

if (!pricesConfigured && status === 'pending') {
  return {
    title: '💰 Set Product Price First',
    description: 'Please set the product price and delivery charge in the "Payment & Price" section on the right side before sending payment links.',
    icon: <DollarSign size={20} className="text-orange-500" />,
    isPriceRequired: true,
    // Add this line to show total amount if available
    totalAmount: order.totalPrice || 0
  };
}
    // PRIORITY 2: Price set, check payment status
    if (isRazorpay && !isPaid && status === 'pending') {
      return {
        title: '💳 Payment Pending',
        description: `Total amount: ₹${order.totalPrice || 0}. Send payment link to customer or mark as paid to proceed.`,
        icon: <CreditCardIcon size={20} className="text-purple-500" />,
        isPriceRequired: false
      };
    }
    
    if (!isRazorpay && !isPaid && status === 'pending') {
      return {
        title: '💰 COD Payment Pending',
        description: `Total amount: ₹${order.totalPrice || 0}. Mark COD as paid when cash is collected.`,
        icon: <DollarSignIcon size={20} className="text-emerald-500" />,
        isPriceRequired: false
      };
    }
    
    if ((isPaid || !isRazorpay) && status === 'pending') {
      return {
        title: '🎨 Ready to Process',
        description: 'Review the design files and click "Start Processing" to begin production.',
        icon: <Settings size={20} className="text-blue-500" />,
        isPriceRequired: false
      };
    }
    
    if (status === 'in_process' && isPickup) {
      return {
        title: '📦 Ready for Pickup',
        description: 'Order is processed. Click "Ready for Pickup" to notify customer.',
        icon: <PackageCheck size={20} className="text-green-500" />,
        isPriceRequired: false
      };
    }
    
    if (status === 'in_process' && !isPickup) {
      return {
        title: '🚚 Ready for Delivery',
        description: 'Order is processed. Click "Out for Delivery" to notify customer with date/time.',
        icon: <TruckIcon size={20} className="text-indigo-500" />,
        isPriceRequired: false
      };
    }
    
    if (status === 'ready_for_pickup' || status === 'out_for_delivery') {
      return {
        title: '✅ Almost Done',
        description: 'Order is in transit. Mark as completed when delivered.',
        icon: <CheckCircle size={20} className="text-emerald-500" />,
        isPriceRequired: false
      };
    }
    
    if (status === 'completed') {
      return {
        title: '🎉 Order Completed',
        description: 'This order has been successfully completed.',
        icon: <CheckSquare size={20} className="text-emerald-500" />,
        isPriceRequired: false
      };
    }
    
    return {
      title: '⏳ Waiting',
      description: 'No actions available at this stage.',
      icon: <Clock size={20} className="text-slate-400" />,
      isPriceRequired: false
    };
  };
  
  const guideline = getGuideline();

    return (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-7 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Send size={16} className="text-orange-500" /> 
          Action Center
        </h3>
        
        {/* Guideline */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{guideline.icon}</div>
            <div>
              <p className="text-sm font-bold text-slate-800">{guideline.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{guideline.description}</p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        {availableActions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Available Actions</p>
            {availableActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                disabled={isProcessingAction}
                className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">{action.label}</span>
                </div>
                <ArrowRight size={16} className="text-orange-500 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-sm font-bold text-slate-600">No actions available</p>
            <p className="text-xs text-slate-400">All steps are completed</p>
          </div>
        )}
        
        {/* Quick Status Update */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Status Update</p>
          <div className="grid grid-cols-3 gap-2">
            {['pending', 'approved', 'completed'].map((s) => (
              <button
                key={s}
                onClick={() => updateOrderStatus(order._id, s)}
                disabled={isProcessingAction}
                className={`px-2 py-2 rounded-xl text-[9px] font-black transition-all border ${
                  order.status === s 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-orange-500 hover:bg-orange-50'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <div className="w-64 fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Design Orders</h1>
            <p className="text-slate-500 font-medium">Manage and track all custom design orders</p>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium">Total Orders</p>
              <Package size={20} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium">Pending</p>
              <Clock size={20} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2">{stats.pending}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium">Printing</p>
              <RefreshCw size={20} className="text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-indigo-600 mt-2">{stats.printing}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium">Completed</p>
              <CheckCircle size={20} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.completed}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium">Pending Payment</p>
              <DollarSign size={20} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">{stats.pendingPayment}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input
              type="text"
              placeholder="Search by name, order ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-slate-700"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="text-slate-400 hidden md:block" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">All Statuses</option>
              {statusOptions.filter(s => s !== 'all').map(s => (
                <option key={s} value={s}>
                  {s === 'in_process' ? 'IN PROCESS' : 
                   s === 'ready_for_pickup' ? 'READY FOR PICKUP' : 
                   s === 'out_for_delivery' ? 'OUT FOR DELIVERY' : 
                   s.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Fetching orders...</p>
          </div>
        ) : currentOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-500">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentOrders.map((order) => (
                <div 
                  key={order._id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300"
                >
                  <div className="p-5 border-b border-slate-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Order ID</span>
                        <h3 className="font-mono font-bold text-slate-900 text-sm">#{order.orderNumber}</h3>
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase ${getStatusStyles(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <User size={16} className="text-slate-400" />
                        <span className="text-sm font-semibold truncate">{order.userName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="text-xs">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-4 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase">Specifications</span>
                      {getPaymentBadge(order.paymentStatus)}
                    </div>
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="text-xs flex items-center gap-1.5 text-slate-600">
                        <Package size={14} className="text-orange-500" /> {order.quantity} Units
                      </div>
                      <div className="text-xs flex items-center gap-1.5 text-slate-600">
                        <FileText size={14} className="text-orange-500" /> {order.size}
                      </div>
                      <div className="text-xs flex items-center gap-1.5 text-slate-600">
                        <Truck size={14} className="text-orange-500" /> {order.deliveryMethod === 'door_delivery' ? 'Door' : 'Pickup'}
                      </div>
                      <div className="text-xs flex items-center gap-1.5 text-slate-600">
                        <CreditCard size={14} className="text-orange-500" /> {order.paymentMethod === 'razorpay' ? 'Online' : 'COD'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white">
                    <button 
                      onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-orange-500 hover:text-white rounded-xl text-slate-700 text-sm font-bold transition-all"
                    >
                      View Details <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                      currentPage === i + 1 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ==================== ORDER DETAILS MODAL ==================== */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-6xl max-h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-4 rounded-2xl text-white shadow-lg shadow-orange-200">
                  <Package size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Order #{selectedOrder.orderNumber}</h2>
                  <p className="text-sm font-medium text-slate-500">Created on {formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-400 transition-all border border-slate-100">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN - 2/3 */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Workflow */}
                  {renderWorkflow(selectedOrder)}

                  {/* Action Center - BELOW WORKFLOW */}
                  {renderActionButtons(selectedOrder)}

                  {/* Assets Section */}
                  <div className="bg-slate-50/50 border border-slate-200 rounded-[2.5rem] p-8">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Design Assets</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedOrder.designFiles.map((file, idx) => (
                        <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm group">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                              {file.fileType === 'WEBP' || file.mimeType.includes('image') ? (
                                <img src={`${import.meta.env.VITE_API_IMG_URL}/designs/${file.fileName}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Preview" />
                              ) : (
                                <FileText className="text-slate-300" size={32} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-800 truncate mb-1">{file.fileName}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md uppercase">{file.fileType}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{(file.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                              </div>
                            </div>
                            <a href={`${import.meta.env.VITE_API_BASE_URL}/uploads/designs/${file.fileName}`} download className="p-3 bg-slate-900 text-white rounded-xl hover:bg-orange-500 transition-all shadow-lg shadow-slate-200">
                              <Download size={18} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - 1/3 */}
                <div className="space-y-6">
                  {/* Price Management */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-7 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Wallet size={16} className="text-emerald-500" /> Payment & Price
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                          <span className={`text-xs font-black px-2 py-1 rounded-lg ${selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {selectedOrder.paymentStatus === 'paid' ? '✅ PAID' : '⏳ PENDING'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Order Status</p>
                          <span className="text-xs font-black text-slate-800 uppercase">{selectedOrder.status}</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Product Price</p>
                          {isEditingPrice ? (
                            <input type="number" value={editProductPrice ?? ''} onChange={(e) => setEditProductPrice(e.target.value)} className="w-32 bg-white border border-slate-300 rounded-lg px-3 py-1 text-sm font-bold text-slate-800" />
                          ) : (
                            <p className="font-black text-sm text-slate-800">₹{selectedOrder?.productPrice || 0}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Delivery Charge</p>
                          {isEditingPrice ? (
                            <input type="number" value={editDeliveryCharge ?? ''} onChange={(e) => setEditDeliveryCharge(e.target.value)} className="w-32 bg-white border border-slate-300 rounded-lg px-3 py-1 text-sm font-bold text-slate-800" />
                          ) : (
                            <p className="font-black text-sm text-slate-800">₹{selectedOrder?.deliveryCharge || 0}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <span className="text-xs font-bold text-emerald-600">Total Amount</span>
                        <span className="text-sm font-black text-emerald-700">
                          ₹{(parseFloat(editProductPrice) || selectedOrder?.productPrice || 0) + (parseFloat(editDeliveryCharge) || selectedOrder?.deliveryCharge || 0)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {isEditingPrice ? (
                          <>
                            <button onClick={() => updateOrderPrices(selectedOrder._id)} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all">✅ Save</button>
                            <button onClick={() => { setIsEditingPrice(false); setEditProductPrice(''); setEditDeliveryCharge(''); }} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-xs font-black transition-all">Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => { setIsEditingPrice(true); setEditProductPrice(selectedOrder?.productPrice?.toString() || '0'); setEditDeliveryCharge(selectedOrder?.deliveryCharge?.toString() || '0'); }} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all">
                            ✏️ Set Prices
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Specifications Summary */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-7 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Order Specs</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Material', value: selectedOrder.material, icon: <Building2 size={14}/> },
                        { label: 'Quantity', value: `${selectedOrder.quantity} Units`, icon: <Package size={14}/> },
                        { label: 'Size', value: selectedOrder.size, icon: <FileText size={14}/> },
                        { label: 'Delivery', value: selectedOrder.deliveryMethod.replace('_', ' '), icon: <Truck size={14}/> },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-500 transition-colors">{item.icon}</span>
                            <span className="text-xs font-bold">{item.label}</span>
                          </div>
                          <span className="text-sm font-black text-slate-800 capitalize">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Profile */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-200">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative z-10">Client Information</h3>
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10"><User size={20} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase mb-0.5 tracking-wider">Full Name</p>
                          <p className="font-black text-base">{selectedOrder.userName}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10"><Mail size={20} /></div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-white/40 uppercase mb-0.5 tracking-wider">Email</p>
                          <p className="font-bold truncate text-sm">{selectedOrder.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/10"><Phone size={20} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase mb-0.5 tracking-wider">Phone</p>
                          <p className="font-black">{selectedOrder.userPhone}</p>
                        </div>
                      </div>
                      {selectedOrder.deliveryAddress && (
                        <div className="pt-6 mt-6 border-t border-white/10">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-900/20"><MapPin size={20} /></div>
                            <div>
                              <p className="text-[10px] font-bold text-white/40 uppercase mb-1.5 tracking-wider">Shipping Address</p>
                              <p className="text-xs font-bold leading-relaxed text-slate-200">
                                {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}<br />
                                {selectedOrder.deliveryAddress.state} - {selectedOrder.deliveryAddress.pincode}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

               
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}