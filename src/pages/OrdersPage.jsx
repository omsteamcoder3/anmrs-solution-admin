import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../api/orders';
import { paymentsAPI } from '../api/payments';
import Sidebar from '../components/Sidebar';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundStatus, setRefundStatus] = useState({});
  const [activeRefundOrderId, setActiveRefundOrderId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState({});
  const [userRole, setUserRole] = useState('admin');
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ordersAPI.getOrders();
      
      let ordersData = [];
      
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (response.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      } else if (Array.isArray(response)) {
        ordersData = response;
      } else if (response.data && response.data.success && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      }
      
      setOrders(ordersData || []);
      
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (newStatus === 'cancelled') {
      const confirmCancel = window.confirm(
        '⚠️ Are you sure you want to cancel this order?\n' +
        'This will:\n' +
        '• Restore product stock\n' +
        '• Cancel ShipRocket shipment (if exists)\n' +
        '• Send cancellation notification'
      );
      if (!confirmCancel) return;
    }

    if (newStatus === 'delivered') {
      const confirmDeliver = window.confirm(
        '✅ Mark this order as delivered?\n' +
        'This will:\n' +
        '• Auto-complete COD payments (if applicable)\n' +
        '• Send delivery confirmation email'
      );
      if (!confirmDeliver) return;
    }

    try {
      setStatusUpdating(prev => ({ ...prev, [orderId]: true }));

      const order = orders.find(o => o._id === orderId);
      if (!order) {
        alert('Order not found');
        return;
      }

      const paymentOrderId = order.orderId || order.razorpayOrderId || order.paymentId;
      
      if (!paymentOrderId) {
        alert('Cannot update status: Order identifier not found');
        return;
      }

      const response = await paymentsAPI.updatePaymentStatus(paymentOrderId, {
        orderStatus: newStatus,
        ...(newStatus === 'cancelled' && {
          cancellationReason: 'Cancelled by admin via dashboard',
          notes: `Order status changed to ${newStatus} by admin`
        }),
        ...(newStatus === 'delivered' && {
          notes: `Order marked as delivered by admin`
        })
      });
      
      if (response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  orderStatus: newStatus, 
                  paymentStatus: response.data.order?.paymentStatus || order.paymentStatus,
                  ...(response.data.order || {})
                }
              : order
          )
        );
        
        alert(`✅ Order status updated to ${newStatus}`);
        setTimeout(() => fetchOrders(), 1000);
      } else {
        alert(`❌ Failed to update status: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert(`❌ Error updating status: ${error.response?.data?.message || error.message}`);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDeleteOrder = async (orderId, orderIdentifier) => {
    try {
      setStatusUpdating(prev => ({ ...prev, [orderId]: true }));
      
      const response = await ordersAPI.deleteOrder(orderId);
      
      if (response.data.success) {
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
        alert(`✅ Order ${orderIdentifier} deleted successfully`);
      } else {
        alert(`❌ Failed to delete order: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Delete order error:', error);
      alert(`❌ Error deleting order: ${error.response?.data?.message || error.message}`);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handlePaymentStatusUpdate = async (orderId, newPaymentStatus) => {
    try {
      setStatusUpdating(prev => ({ ...prev, [orderId]: true }));

      const order = orders.find(o => o._id === orderId);
      if (!order) {
        alert('Order not found');
        return;
      }

      const paymentOrderId = order.orderId || order.razorpayOrderId || order.paymentId;
      
      if (!paymentOrderId) {
        alert('Cannot update payment status: Order identifier not found');
        return;
      }

      const response = await paymentsAPI.updatePaymentStatus(paymentOrderId, {
        paymentStatus: newPaymentStatus,
        notes: `Payment status updated to ${newPaymentStatus} by admin`
      });
      
      if (response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  paymentStatus: newPaymentStatus,
                  orderStatus: response.data.order?.orderStatus || order.orderStatus
                }
              : order
          )
        );
        
        alert(`✅ Payment status updated to ${newPaymentStatus}`);
        setTimeout(() => fetchOrders(), 1000);
      } else {
        alert(`❌ Failed to update payment status: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Payment status update error:', error);
      alert(`❌ Error updating payment status: ${error.response?.data?.message || error.message}`);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = [
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'confirmed', label: 'Confirmed', color: 'blue' },
      { value: 'processing', label: 'Processing', color: 'indigo' },
      { value: 'shipped', label: 'Shipped', color: 'purple' },
      { value: 'delivered', label: 'Delivered', color: 'green' },
      { value: 'cancelled', label: 'Cancelled', color: 'red' },
    ];

    const statusFlow = {
      pending: ['pending', 'confirmed', 'processing', 'cancelled'],
      confirmed: ['confirmed', 'processing', 'shipped', 'cancelled'],
      processing: ['processing', 'shipped', 'cancelled'],
      shipped: ['shipped', 'delivered', 'cancelled'],
      delivered: ['delivered'],
      cancelled: ['cancelled'],
    };

    const allowedStatuses = statusFlow[currentStatus] || [currentStatus];
    
    return allStatuses.filter(status => allowedStatuses.includes(status.value));
  };

  const getPaymentStatusOptions = (currentPaymentStatus) => {
    const allPaymentStatuses = [
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'completed', label: 'Completed', color: 'green' },
      { value: 'failed', label: 'Failed', color: 'red' },
      { value: 'refunded', label: 'Refunded', color: 'purple' },
      { value: 'partially_refunded', label: 'Partially Refunded', color: 'indigo' },
    ];

    const paymentStatusFlow = {
      pending: ['pending', 'completed', 'failed'],
      completed: ['completed', 'refunded', 'partially_refunded'],
      failed: ['failed'],
      refunded: ['refunded'],
      partially_refunded: ['partially_refunded'],
    };

    const allowedStatuses = paymentStatusFlow[currentPaymentStatus] || [currentPaymentStatus];
    
    return allPaymentStatuses.filter(status => allowedStatuses.includes(status.value));
  };

  const isRefundable = (order) => {
    if (!order) return false;
    
    const isCancelled = order.orderStatus === 'cancelled';
    const hasPaid = order.paymentStatus === 'completed' || 
                   order.paymentStatus === 'partially_refunded';
    const hasPaymentId = order.paymentId && order.paymentId.trim() !== '';
    const notFullyRefunded = order.paymentStatus !== 'refunded';
    
    return isCancelled && hasPaid && hasPaymentId && notFullyRefunded;
  };

  const processRefund = async (order) => {
    console.log('🔍 Starting refund process for order:', {
      orderId: order.orderId,
      _id: order._id,
      paymentId: order.paymentId,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus
    });

    if (!order) {
      alert('Cannot process refund: Order data is missing');
      return;
    }

    if (!order.paymentId) {
      console.error('Missing paymentId in order:', {
        orderId: order.orderId,
        availableFields: Object.keys(order)
      });
      alert('Cannot process refund: Payment ID not found');
      return;
    }

    if (!isRefundable(order)) {
      alert(`This order cannot be refunded because:
      • Order Status: ${order.orderStatus} ${order.orderStatus !== 'cancelled' ? ' (Must be cancelled)' : ''}
      • Payment Status: ${order.paymentStatus} ${order.paymentStatus !== 'completed' && order.paymentStatus !== 'partially_refunded' ? '❌ (Must be completed or partially refunded)' : '✅'}
      • Payment ID: ${order.paymentId ? 'Exists' : 'Missing'}
      • Already Fully Refunded: ${order.paymentStatus === 'refunded' ? 'Yes' : 'No'}`);
      return;
    }

    const refundAmount = order.finalAmount || order.totalAmount || 0;
    
    if (!confirm(`Are you sure you want to refund ₹${refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} for order ${order.orderId}?`)) {
      return;
    }

    try {
      setRefundLoading(true);
      setActiveRefundOrderId(order._id);
      setRefundStatus(prev => ({
        ...prev,
        [order._id]: { status: 'processing', message: 'Processing refund...' }
      }));
      
      const refundData = {
        refund_amount: refundAmount,
        notes: {
          reason: 'Order cancelled',
          processedBy: 'admin',
          orderId: order.orderId
        }
      };

      console.log('Making refund API call with data:', {
        paymentId: order.paymentId,
        amount: refundAmount,
        orderId: order.orderId,
        url: `/payments/${order.paymentId}/refund`,
        method: 'POST'
      });

      const response = await paymentsAPI.refundPayment(order.paymentId, refundData);
      
      console.log('✅ Refund API Response:', response.data);
      
      if (response.data.success) {
        setRefundStatus(prev => ({
          ...prev,
          [order._id]: { 
            status: 'success', 
            message: `Refunded ₹${(response.data.refund.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            refundId: response.data.refund.id
          }
        }));
        
        alert(`✅ Refund processed successfully!\nRefund ID: ${response.data.refund.id}\nAmount: ₹${(response.data.refund.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
        setTimeout(() => fetchOrders(), 1500);
      } else {
        setRefundStatus(prev => ({
          ...prev,
          [order._id]: { 
            status: 'error', 
            message: response.data.message || 'Refund failed'
          }
        }));
        alert(`⚠️ Refund failed: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('FULL Refund error:', error);
      
      if (!error.response) {
        console.error('Network error - No response from server');
        alert('Network error: Could not connect to server');
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Refund failed due to server error';
      
      setRefundStatus(prev => ({
        ...prev,
        [order._id]: { 
          status: 'error', 
          message: errorMessage
        }
      }));
      
      alert(`Refund failed: ${errorMessage}`);
      
      if (errorMessage.includes('already been fully refunded')) {
        alert('This payment has already been refunded. Check the payment status.');
      } else if (errorMessage.includes('Payment not found')) {
        alert('Payment ID not found in Razorpay. Verify the payment was successful.');
      } else if (errorMessage.includes('Internal server error')) {
        alert('Server error. Check backend logs for details.');
      }
    } finally {
      setRefundLoading(false);
      setTimeout(() => {
        setActiveRefundOrderId(null);
      }, 3000);
    }
  };

  const fetchOrderReceipt = async (orderId) => {
    try {
      console.log('🔍 Fetching receipt for order ID:', orderId);
      
      if (!orderId) {
        alert('Order ID is missing. Please check the order data.');
        return;
      }
      
      setReceiptLoading(true);
    
      console.log('Making API call to printOrderReceipt...');
      
      const response = await ordersAPI.printOrderReceipt(orderId);
      console.log('Order receipt API response:', response);
      
      if (!response) {
        throw new Error('No response received from API');
      }
      
      const orderData = response.data || response;
      console.log('Extracted order data:', orderData);
      
      if (!orderData) {
        throw new Error('No order data received from API');
      }
      
      setSelectedOrder(orderData);
      setShowReceiptModal(true);
      console.log('Receipt modal opened successfully');
      
    } catch (err) {
      console.error('Error fetching order receipt:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to load receipt details';
      
      alert(`Error: ${errorMessage}\n\nCheck console for more details.`);
    } finally {
      setReceiptLoading(false);
    }
  };

  const downloadPDFReceipt = async (orderId) => {
    try {
      console.log('Downloading PDF for order ID:', orderId);
      
      if (!orderId) {
        console.error('Order ID is missing in downloadPDFReceipt');
        setDownloadStatus('Order ID missing');
        alert('Order ID is missing. Please try viewing the receipt first.');
        return;
      }

      setReceiptLoading(true);
      setDownloadStatus('Starting download...');
      
      console.log('Making PDF API call for order:', orderId);
      const response = await ordersAPI.printOrderReceiptPDF(orderId, {
        responseType: 'blob'
      });
      
      console.log('PDF API response received');
      setDownloadStatus('Creating PDF file...');
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF download completed');
      setDownloadStatus('PDF downloaded successfully!');
      alert('PDF downloaded successfully!');
      
    } catch (err) {
      console.error('Error downloading PDF receipt:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to download PDF receipt';
      setDownloadStatus(`Download failed: ${errorMessage}`);
      alert(`Download failed: ${errorMessage}`);
    } finally {
      setReceiptLoading(false);
      setTimeout(() => setDownloadStatus(''), 3000);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border border-purple-200',
      delivered: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      processing: 'bg-blue-100 text-blue-800 border border-blue-200',
      refunded: 'bg-purple-100 text-purple-800 border border-purple-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    if (!paymentStatus) return null;
    
    const paymentStatusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      failed: 'bg-red-100 text-red-800 border border-red-200',
      refunded: 'bg-purple-100 text-purple-800 border border-purple-200',
      partially_refunded: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      processing: 'bg-blue-100 text-blue-800 border border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[paymentStatus] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const getCustomerInfo = (order) => {
    const name = order.customer?.name || order.user?.name || order.customerName || order.guestUser?.name;
    const email = order.customer?.email || order.user?.email || order.customerEmail || order.guestUser?.email || order.email;
    const phone = order.customer?.phone || order.user?.phone || order.phoneNumber || order.guestUser?.phone;
    const isGuest = !order.customer?.name && !order.user?.name;
    
    return { name, email, phone, isGuest };
  };

  const getOrderId = (order) => {
    if (!order) {
      console.error('getOrderId: order is null or undefined');
      return null;
    }
    
    if (order.receipt) {
      return order.receipt.receiptNumber || order.receipt._id || order.receipt.orderId || order.receipt.id;
    }
    
    return order._id || order.id || order.orderId;
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.orderStatus === 'pending').length;
  const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered' || order.orderStatus === 'completed').length;
  const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled').length;
  const refundedOrders = orders.filter(order => order.paymentStatus === 'refunded' || order.paymentStatus === 'partially_refunded').length;

  const ReceiptModal = ({ order, onClose, onPrint, onDownloadPDF }) => {
    if (!order) return null;

    const receiptData = order.receipt || order;
    const orderId = receiptData.receiptNumber || receiptData.orderNumber || receiptData.orderId || receiptData._id;
    const customerName = receiptData.customer?.name || receiptData.user?.name || receiptData.guestUser?.name || receiptData.shippingAddress?.fullName || 'N/A';
    const customerEmail = receiptData.customer?.email || receiptData.user?.email || receiptData.guestUser?.email || receiptData.email || 'N/A';
    const customerPhone = receiptData.customer?.phone || receiptData.user?.phone || receiptData.guestUser?.phone || receiptData.shippingAddress?.phone || 'N/A';
    const items = receiptData.products || receiptData.items || [];
    const subtotal = receiptData.pricing?.subtotal || receiptData.totalAmount || receiptData.subtotal || 0;
    const shipping = receiptData.pricing?.shipping || receiptData.shippingFee || receiptData.shippingCharges || 0;
    const tax = receiptData.pricing?.tax || receiptData.taxAmount || receiptData.tax || 0;
    const total = receiptData.pricing?.total || receiptData.finalAmount || receiptData.total || subtotal + shipping + tax;
    const orderDate = receiptData.createdAt || receiptData.orderDate || receiptData.date;
    const paymentStatus = receiptData.payment?.status || receiptData.paymentStatus;
    const paymentMethod = receiptData.payment?.method || receiptData.paymentMethod;
    const paymentId = receiptData.paymentId;
    const razorpayOrderId = receiptData.razorpayOrderId;
    const orderStatus = receiptData.orderStatus;
    const isGuestOrder = receiptData.isGuestOrder;
    const shippingAddress = receiptData.shippingAddress;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl">
          <div className="bg-blue-700 text-white p-3 sm:p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🛒</div>
              <div>
                <h1 className="font-bold text-sm sm:text-base">ORDER RECEIPT</h1>
                <p className="text-blue-200 text-xs sm:text-sm">#{orderId?.substring(0, 12)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-0.5 rounded text-xs ${isGuestOrder ? 'bg-orange-500' : 'bg-green-500'}`}>
                {isGuestOrder ? 'Guest' : 'Reg'}
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-500 min-w-[60px]">Date:</span>
                <span className="text-xs sm:text-sm font-medium flex-1 text-right">{formatDate(orderDate)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-500 min-w-[60px]">Payment:</span>
                <div className="flex-1 text-right">
                  {getPaymentStatusBadge(paymentStatus)}
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-500 min-w-[60px]">Status:</span>
                <div className="flex-1 text-right">
                  {getStatusBadge(orderStatus)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-500 min-w-[60px]">Method:</span>
                <span className="text-xs sm:text-sm font-medium capitalize flex-1 text-right">{paymentMethod}</span>
              </div>
            </div>

            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded border">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-sm sm:text-base truncate">{customerName}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">📧</span>
                  <span className="truncate">{customerEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">📞</span>
                  <span>{customerPhone}</span>
                </div>
              </div>
              {shippingAddress && (
                <div className="mt-2 pt-2 border-t text-xs sm:text-sm">
                  <div className="font-medium text-gray-600">Shipping:</div>
                  <div className="text-gray-500 truncate">
                    {shippingAddress.address}, {shippingAddress.city}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-3 sm:mb-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-sm sm:text-base">Items ({items.length})</h3>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={item._id || index} className="flex justify-between items-center p-1.5 hover:bg-gray-50 rounded border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">{item.product?.name || item.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs sm:text-sm">{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded border border-blue-200">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-700">Shipping:</span>
                  <span className="font-semibold">{formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-700">Tax:</span>
                  <span className="font-semibold">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-300 font-bold text-base sm:text-lg">
                  <span>TOTAL:</span>
                  <span className="text-green-700">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {(paymentId || razorpayOrderId) && (
              <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded border text-xs sm:text-sm">
                {paymentId && <div className="mb-1"><span className="text-gray-500">Payment ID:</span> <span className="font-medium">{paymentId.substring(0, 16)}...</span></div>}
                {razorpayOrderId && <div><span className="text-gray-500">Razorpay ID:</span> <span className="font-medium">{razorpayOrderId.substring(0, 16)}...</span></div>}
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 border-t bg-gray-50 flex justify-between items-center">
            {downloadStatus ? (
              <div className={`px-2 py-1 rounded text-xs ${
                downloadStatus.includes('✅') ? 'bg-green-100 text-green-800' :
                downloadStatus.includes('❌') ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {downloadStatus.length > 20 ? downloadStatus.substring(0, 20) + '...' : downloadStatus}
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-gray-500">
                {formatDate(orderDate)}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={onDownloadPDF}
                disabled={receiptLoading}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700 disabled:bg-red-300 flex items-center gap-1 min-w-[60px] sm:min-w-[80px] justify-center"
                title="Download PDF"
              >
                <span>📥</span>
                {receiptLoading ? '...' : 'PDF'}
              </button>
              <button
                onClick={onPrint}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 flex items-center gap-1 min-w-[60px] sm:min-w-[80px] justify-center"
                title="Print"
              >
                <span>🖨️</span>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6 bg-gray-50">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6 bg-gray-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden mt-20 sm:mt-0">
        {/* Header - Clean and compact */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Orders Management
              </h1>
              <button
                onClick={fetchOrders}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium gap-2 w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Orders</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 73px)' }}>
          {/* Stats Grid - 2x2 on mobile, 4 columns on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{totalOrders}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pending</p>
                  <p className="text-xl font-bold text-yellow-600 mt-1">{pendingOrders}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">⏳</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Delivered</p>
                  <p className="text-xl font-bold text-green-600 mt-1">{deliveredOrders}</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Refunded</p>
                  <p className="text-xl font-bold text-purple-600 mt-1">{refundedOrders}</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold">↩️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Grid - 2 columns on mobile, 3 columns on desktop */}
          {!Array.isArray(orders) ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <p className="text-red-500 text-lg">Data format error</p>
              <p className="text-gray-400 mt-2">Orders data is not in expected format</p>
              <button 
                onClick={fetchOrders}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
              <p className="text-sm text-gray-500">
                Orders will appear here when customers place them.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order, index) => {
                const customer = getCustomerInfo(order);
                const orderId = getOrderId(order);
                const isRefundableOrder = isRefundable(order);
                const currentRefundStatus = refundStatus[order._id];
                const statusOptions = getStatusOptions(order.orderStatus);
                const paymentStatusOptions = getPaymentStatusOptions(order.paymentStatus);
                
                return (
                  <div key={order._id || order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Order Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                          {order.orderId || order.orderNumber || `ORD-${order._id?.slice(-6)}`}
                        </span>
                      </div>
                      {customer.isGuest && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">Guest</span>
                      )}
                    </div>

                    {/* Order Content */}
                    <div className="p-4">
                      {/* Customer Info */}
                      <div className="mb-3">
                        <div className="font-medium text-gray-900 text-sm truncate">{customer.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500 truncate">{customer.email || 'No email'}</div>
                        <div className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt || order.orderDate || order.date)}</div>
                      </div>

                      {/* Status & Payment */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Order Status</div>
                          {userRole === 'admin' ? (
                            <select
                              value={order.orderStatus}
                              onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                              disabled={statusUpdating[order._id]}
                              className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-blue-500"
                            >
                              {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            getStatusBadge(order.orderStatus)
                          )}
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 mb-1">Payment</div>
                          {userRole === 'admin' ? (
                            <select
                              value={order.paymentStatus}
                              onChange={(e) => handlePaymentStatusUpdate(order._id, e.target.value)}
                              disabled={statusUpdating[order._id]}
                              className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-blue-500"
                            >
                              {paymentStatusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            getPaymentStatusBadge(order.paymentStatus)
                          )}
                        </div>
                      </div>

                      {/* Items & Total */}
                      <div className="flex items-center justify-between mb-3 text-sm">
                        <div className="text-gray-600">
                          {order.items?.length || order.products?.length || 0} items
                        </div>
                        <div className="font-bold text-gray-900">
                          {formatCurrency(order.finalAmount || order.totalAmount || 0)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchOrderReceipt(orderId)}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Receipt
                        </button>
                        
                        <button
                          onClick={() => handleDeleteOrder(order._id, order.orderId || order._id)}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Delete
                        </button>

                        {isRefundableOrder ? (
                          <button
                            onClick={() => processRefund(order)}
                            disabled={refundLoading && activeRefundOrderId === order._id}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                              refundLoading && activeRefundOrderId === order._id
                                ? 'bg-red-300 text-white cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {refundLoading && activeRefundOrderId === order._id ? '...' : 'Refund'}
                          </button>
                        ) : (
                          <div className="flex-1">
                            {order.paymentStatus === 'refunded' ? (
                              <span className="block px-3 py-2 bg-green-100 text-green-800 text-xs rounded-lg border border-green-200 text-center">
                                Refunded
                              </span>
                            ) : order.paymentStatus === 'partially_refunded' ? (
                              <span className="block px-3 py-2 bg-blue-100 text-blue-800 text-xs rounded-lg border border-blue-200 text-center">
                                Partial
                              </span>
                            ) : (
                              <span className="block px-3 py-2 bg-gray-100 text-gray-600 text-xs rounded-lg border border-gray-200 text-center">
                                {order.orderStatus}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status Update Loading Indicator */}
                      {statusUpdating[order._id] && (
                        <div className="mt-2 text-xs text-blue-600 text-center">
                          Updating...
                        </div>
                      )}

                      {/* Refund Status Message */}
                      {currentRefundStatus && (
                        <div className={`mt-2 px-3 py-2 text-xs rounded-lg text-center ${
                          currentRefundStatus.status === 'success' ? 'bg-green-100 text-green-800' :
                          currentRefundStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {currentRefundStatus.message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <ReceiptModal
          order={selectedOrder}
          onClose={() => setShowReceiptModal(false)}
          onPrint={printReceipt}
          onDownloadPDF={() => {
            const orderId = selectedOrder?.receipt?.receiptNumber || 
                           selectedOrder?.receipt?._id || 
                           selectedOrder?.receipt?.orderId || 
                           selectedOrder?.receipt?.id ||
                           selectedOrder?._id || 
                           selectedOrder?.id || 
                           selectedOrder?.orderId;
            
            if (!orderId) {
              alert('❌ Cannot download PDF: Order ID not found.');
              return;
            }
            
            downloadPDFReceipt(orderId);
          }}
        />
      )}
    </div>
  );
};

export default OrdersPage;