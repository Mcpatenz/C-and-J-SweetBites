/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  Check,
  SlidersHorizontal,
  ArrowRight,
  Smartphone,
  Monitor,
  LogIn,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  AttendanceScanMethod,
  BusinessSettings,
  CartItem,
  CategoryId,
  CustomerProfile,
  Order,
  OrderNotification,
  OrderStatus,
  Product,
  StaffAttendanceLog,
  UserAccount,
} from './types/bakery';
import {
  CATEGORIES,
  IMAGES,
  INITIAL_ATTENDANCE_LOGS,
  INITIAL_BUSINESS_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_USERS,
} from './data/initialData';
import { extractCheckInCodeFromPayload } from './utils/staffHelpers';
import { ResilientImage } from './components/ResilientImage';
import { VoiceDictationButton } from './components/VoiceDictationButton';
import { CustomCakeBuilder } from './components/CustomCakeBuilder';
import { PartyPackagesSection } from './components/PartyPackagesSection';
import { OrderTrackerView } from './components/OrderTrackerView';
import { AdminConsoleView } from './components/AdminConsoleView';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { LoginView } from './components/LoginView';
import { CustomerDashboardView } from './components/CustomerDashboardView';
import { CashierDashboardView } from './components/CashierDashboardView';
import { DeliveryDashboardView } from './components/DeliveryDashboardView';
import { ProfileSecurityModal } from './components/ProfileSecurityModal';

type ActiveSection =
  | 'catalog'
  | 'custom_cake'
  | 'packages'
  | 'track_order'
  | 'login'
  | 'customer_dashboard'
  | 'cashier_dashboard'
  | 'delivery_dashboard'
  | 'admin_dashboard';

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('catalog');
  const [mobilePreviewMode, setMobilePreviewMode] = useState<boolean>(false);

  // Auth & Users State (Customer, Cashier, Admin)
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [pendingCartItem, setPendingCartItem] = useState<CartItem | null>(null);

  // Shared Unified State (Business Settings + Customer Storefront + Cashier POS + Admin Console)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(
    INITIAL_BUSINESS_SETTINGS
  );
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [customers, setCustomers] = useState<CustomerProfile[]>(INITIAL_CUSTOMERS);
  const [notifications, setNotifications] =
    useState<OrderNotification[]>(INITIAL_NOTIFICATIONS);
  const [attendanceLogs, setAttendanceLogs] = useState<StaffAttendanceLog[]>(
    INITIAL_ATTENDANCE_LOGS
  );

  // Customer Filtering & Favorites State
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([
    'prod-cake-ube',
    'prod-brownie-fudge',
    'prod-cassava-special',
  ]);

  // Cart & Modals State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isProfileSecurityOpen, setIsProfileSecurityOpen] =
    useState<boolean>(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Helper to commit an item to cart once authenticated
  const commitItemToCart = (newItem: CartItem) => {
    setCart((prev) => {
      if (!newItem.customCake && !newItem.partyPackage) {
        const existingIndex = prev.findIndex(
          (i) =>
            i.productId === newItem.productId &&
            i.selectedVariation === newItem.selectedVariation &&
            !i.customCake &&
            !i.partyPackage
        );
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + newItem.quantity,
          };
          return updated;
        }
      }
      return [newItem, ...prev];
    });

    setRecentlyAddedId(newItem.productId);
    setTimeout(() => setRecentlyAddedId(null), 1600);
  };

  // Add to Bag Handler — Requires User to Log In First!
  const handleAddToCart = (newItem: CartItem, openDrawerAfter = false) => {
    if (!currentUser) {
      setPendingCartItem(newItem);
      setDetailProduct(null);
      setActiveSection('login');
      return;
    }

    commitItemToCart(newItem);
    if (openDrawerAfter) {
      setIsCartOpen(true);
    }
  };

  // Reorder Completed Order Handler — Automatically adds all items from a completed order into the active cart
  const handleReorderOrder = (order: Order) => {
    if (!order.items || order.items.length === 0) return;

    setCart((prev) => {
      let updated = [...prev];
      order.items.forEach((item, idx) => {
        if (!item.customCake && !item.partyPackage) {
          const existingIndex = updated.findIndex(
            (i) =>
              i.productId === item.productId &&
              i.selectedVariation === item.selectedVariation &&
              !i.customCake &&
              !i.partyPackage
          );
          if (existingIndex > -1) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + item.quantity,
            };
            return;
          }
        }
        updated = [
          {
            ...item,
            cartItemId: `${item.productId}-reorder-${Date.now()}-${idx}`,
          },
          ...updated,
        ];
      });
      return updated;
    });

    if (order.items[0]) {
      setRecentlyAddedId(order.items[0].productId);
      setTimeout(() => setRecentlyAddedId(null), 1600);
    }
    setIsCartOpen(true);
  };

  // Login & Role-Based Redirection Handler
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);

    if (pendingCartItem) {
      commitItemToCart(pendingCartItem);
      setPendingCartItem(null);
    }

    if (user.role === 'customer') {
      setActiveSection('customer_dashboard');
    } else if (user.role === 'cashier') {
      setActiveSection('cashier_dashboard');
    } else if (user.role === 'delivery') {
      setActiveSection('delivery_dashboard');
    } else if (user.role === 'admin') {
      setActiveSection('admin_dashboard');
    }
  };

  // Register New Customer Account & Redirect to Customer Dashboard
  const handleRegisterCustomer = (newCustomer: UserAccount) => {
    setUsers((prev) => [newCustomer, ...prev]);
    setCustomers((prev) => [
      {
        id: `cust-${Date.now()}`,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address || 'Metro Manila',
        ordersCount: 0,
        totalSpent: 0,
        favoriteProductIds: [...favoriteIds],
        lastOrderDate: 'New Member',
      },
      ...prev,
    ]);
    handleLoginSuccess(newCustomer);
  };

  // Log Out Handler -> Always Redirects to Landing Page
  const handleLogout = () => {
    setCurrentUser(null);
    setPendingCartItem(null);
    setIsCartOpen(false);
    setActiveSection('catalog');
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleToggleFavorite = (productId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Order Placement (Syncs Customer/Cashier -> Admin + Notifications)
  const handlePlaceOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);

    setProducts((prev) =>
      prev.map((prod) => {
        const orderedQty = newOrder.items
          .filter((i) => i.productId === prod.id)
          .reduce((s, i) => s + i.quantity, 0);
        if (orderedQty === 0) return prod;
        return {
          ...prod,
          stock: Math.max(0, prod.stock - orderedQty),
          soldCount: prod.soldCount + orderedQty,
        };
      })
    );

    setCustomers((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.name.toLowerCase() === newOrder.customerName.toLowerCase() ||
          c.phone === newOrder.customerPhone
      );
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          ordersCount: updated[idx].ordersCount + 1,
          totalSpent: updated[idx].totalSpent + newOrder.total,
          lastOrderDate: newOrder.scheduledDate,
        };
        return updated;
      }
      return [
        {
          id: `cust-${Date.now()}`,
          name: newOrder.customerName,
          phone: newOrder.customerPhone,
          email: newOrder.customerEmail,
          address: newOrder.deliveryAddress,
          ordersCount: 1,
          totalSpent: newOrder.total,
          favoriteProductIds: [...favoriteIds],
          lastOrderDate: newOrder.scheduledDate,
        },
        ...prev,
      ];
    });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        orderNumber: newOrder.orderNumber,
        title: 'Order Received by Kitchen',
        message: `Your order #${newOrder.orderNumber} (₱${newOrder.total.toLocaleString()} via ${newOrder.paymentMethod}) has been queued for ${newOrder.scheduledDate}.`,
        timestamp: 'Just now',
        read: false,
        status: newOrder.status,
      },
      ...prev,
    ]);
  };

  // Admin & Cashier Status Handlers (with Real-Time 'Preparing' -> 'Ready' | 'Out for Delivery' Transition Alerting)
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const previousStatus = targetOrder?.status;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    if (targetOrder) {
      const isPreparingTransition =
        previousStatus === 'Preparing' &&
        (status === 'Ready' || status === 'Out for Delivery');

      const statusMessages: Record<OrderStatus, { title: string; body: string }> = {
        New: {
          title: 'Order Logged',
          body: `Order #${targetOrder.orderNumber} is in our kitchen queue.`,
        },
        Confirmed: {
          title: 'Order Confirmed',
          body: `Your order #${targetOrder.orderNumber} has been confirmed for ${targetOrder.scheduledDate} (${targetOrder.scheduledTime}).`,
        },
        Preparing: {
          title: 'Preparing Order',
          body: `Our pastry chefs are now baking and decorating order #${targetOrder.orderNumber}.`,
        },
        Ready: {
          title: isPreparingTransition
            ? 'Order Status Alert: Preparing → Ready'
            : targetOrder.fulfillmentType === 'Pickup'
            ? 'Ready for Store Pickup'
            : 'Packed & Ready for Courier',
          body: isPreparingTransition
            ? `Order #${targetOrder.orderNumber} transitioned from Preparing to Ready! ${
                targetOrder.fulfillmentType === 'Pickup'
                  ? 'Ready for pickup at our Kapitolyo counter.'
                  : 'Freshly boxed and quality-checked for courier dispatch.'
              }`
            : `Order #${targetOrder.orderNumber} is freshly boxed and quality-checked!`,
        },
        'Out for Delivery': {
          title: isPreparingTransition
            ? 'Order Status Alert: Preparing → Out for Delivery'
            : 'Out for Delivery',
          body: isPreparingTransition
            ? `Order #${targetOrder.orderNumber} transitioned from Preparing to Out for Delivery with ${
                targetOrder.assignedRider || 'our chilled van courier'
              }.`
            : `Order #${targetOrder.orderNumber} is on the way with ${
                targetOrder.assignedRider || 'our chilled van courier'
              }.`,
        },
        Completed: {
          title: 'Order Completed',
          body: `Order #${targetOrder.orderNumber} has been fulfilled. Enjoy your cakes and treats!`,
        },
        Cancelled: {
          title: 'Order Cancelled',
          body: `Order #${targetOrder.orderNumber} was marked as cancelled.`,
        },
      };

      const msg = statusMessages[status];
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          orderNumber: targetOrder.orderNumber,
          title: msg.title,
          message: msg.body,
          timestamp: 'Just now',
          read: false,
          status,
          previousStatus,
          isTransitionAlert: isPreparingTransition,
        },
        ...prev,
      ]);
    }
  };

  const handleAssignRider = (orderId: string, rider: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, assignedRider: rider } : o))
    );
  };

  const handleVerifyPayment = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: 'Verified',
              status: o.status === 'New' ? 'Confirmed' : o.status,
            }
          : o
      )
    );
    if (targetOrder) {
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          orderNumber: targetOrder.orderNumber,
          title: `${targetOrder.paymentMethod} Payment Verified`,
          message: `Reference ${targetOrder.paymentReference || ''} for order #${
            targetOrder.orderNumber
          } (₱${targetOrder.total.toLocaleString()}) has been verified.`,
          timestamp: 'Just now',
          read: false,
          status: 'Confirmed',
        },
        ...prev,
      ]);
    }
  };

  const handleSubmitReview = (orderId: string, rating: number, comment: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, rating, reviewComment: comment } : o
      )
    );
  };

  // Staff Management & QR Shift Attendance Handlers (Cashier & Admin)
  const handleAddCashier = (newStaff: UserAccount) => {
    setUsers((prev) => [newStaff, ...prev]);
  };

  const handleRecordStaffAttendance = (params: {
    staffId: string;
    action: 'Check-In' | 'Check-Out';
    method: AttendanceScanMethod;
    verifiedByCashier: string;
  }) => {
    const targetStaff = users.find((u) => u.id === params.staffId);
    if (!targetStaff) return;

    const statusAfter: 'Active' | 'Off Duty' =
      params.action === 'Check-In' ? 'Active' : 'Off Duty';
    const nowFormatted = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const timestamp = `2026-09-25 · ${nowFormatted}`;
    const checkInCode = extractCheckInCodeFromPayload(
      targetStaff.qrCodePayload,
      targetStaff.employeeId
    );

    const updatedStaff: UserAccount = {
      ...targetStaff,
      status: statusAfter,
      lastAttendanceAction: params.action,
      lastAttendanceTime: timestamp,
    };

    setUsers((prev) =>
      prev.map((u) => (u.id === params.staffId ? updatedStaff : u))
    );

    if (currentUser && currentUser.id === params.staffId) {
      setCurrentUser(updatedStaff);
    }

    const newLog: StaffAttendanceLog = {
      id: `att-log-${Date.now()}`,
      staffId: targetStaff.id,
      employeeId: targetStaff.employeeId || 'EMP-STAFF',
      staffName: targetStaff.name,
      role: targetStaff.role,
      action: params.action,
      statusAfter,
      checkInCode,
      qrPayload: targetStaff.qrCodePayload || '',
      shift: targetStaff.shift || 'Regular Shift',
      terminal: targetStaff.terminal || 'Kapitolyo Flagship Counter',
      timestamp,
      verifiedByCashier: params.verifiedByCashier,
      method: params.method,
    };

    setAttendanceLogs((prev) => [newLog, ...prev]);
  };

  const handleToggleCashierStatus = (staffId: string) => {
    const target = users.find((u) => u.id === staffId);
    if (!target) return;
    const nextAction = target.status === 'Off Duty' ? 'Check-In' : 'Check-Out';
    handleRecordStaffAttendance({
      staffId,
      action: nextAction,
      method: 'Quick QR Tap',
      verifiedByCashier: currentUser?.name || 'Admin Console',
    });
  };

  const handleDeleteCashier = (staffId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== staffId));
  };

  // Update User Profile & Password Security (Confirm Password verified)
  const handleUpdateUserProfile = (updatedUser: UserAccount) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    setCurrentUser(updatedUser);

    if (updatedUser.role === 'customer') {
      setCustomers((prev) =>
        prev.map((c) =>
          c.email.toLowerCase() === updatedUser.email.toLowerCase() ||
          c.name.toLowerCase() === updatedUser.name.toLowerCase()
            ? {
                ...c,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address || c.address,
              }
            : c
        )
      );
    }
  };

  const getRoleDashboardSection = (user: UserAccount): ActiveSection => {
    if (user.role === 'admin') return 'admin_dashboard';
    if (user.role === 'cashier') return 'cashier_dashboard';
    if (user.role === 'delivery') return 'delivery_dashboard';
    return 'customer_dashboard';
  };

  const getRoleDashboardLabel = (user: UserAccount): string => {
    if (user.role === 'admin') return 'Admin Dashboard';
    if (user.role === 'cashier') return 'Cashier Dashboard';
    if (user.role === 'delivery') return 'Delivery Dashboard';
    return 'Customer Dashboard';
  };

  // Filtered Products for Storefront Catalog
  const activeCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory);
  const filteredProducts = products.filter((product) => {
    if (showFavoritesOnly && !favoriteIds.includes(product.id)) return false;
    if (selectedCategory !== 'all' && product.category !== selectedCategory)
      return false;
    if (
      selectedCategory !== 'all' &&
      selectedSubcategory !== 'All' &&
      product.subcategory !== selectedSubcategory
    )
      return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = product.name.toLowerCase().includes(q);
      const matchSub = product.subcategory.toLowerCase().includes(q);
      const matchDesc = product.description.toLowerCase().includes(q);
      return matchName || matchSub || matchDesc;
    }
    return true;
  });

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  // Strict per-customer order & notification isolation so no other customer can view another customer's orders
  const customerOrders = currentUser
    ? orders.filter(
        (o) =>
          o.customerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
          o.customerName.toLowerCase() === currentUser.name.toLowerCase() ||
          (Boolean(currentUser.phone) &&
            o.customerPhone.replace(/\s+/g, '') ===
              currentUser.phone.replace(/\s+/g, ''))
      )
    : [];
  const customerOrderNumbers = new Set(
    customerOrders.map((o) => o.orderNumber)
  );
  const customerNotifications = currentUser
    ? notifications.filter((n) => customerOrderNumbers.has(n.orderNumber))
    : [];

  const staffList = users.filter(
    (u) => u.role === 'cashier' || u.role === 'delivery'
  );
  const deliveryStaffList = users.filter((u) => u.role === 'delivery');
  const favoriteProductsList = products.filter((p) =>
    favoriteIds.includes(p.id)
  );

  const isStaffView =
    activeSection === 'admin_dashboard' ||
    activeSection === 'cashier_dashboard' ||
    activeSection === 'delivery_dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark in display face */}
          <a
            href="#catalog"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('catalog');
            }}
            className="text-xl font-display font-semibold tracking-tight text-stone-900 whitespace-nowrap shrink-0"
          >
            {businessSettings.businessName}
          </a>

          {/* Zone 2: Clean navigation links (Track Order & redundant Log In removed from public landing nav) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            {[
              { id: 'catalog', label: 'Catalog' },
              { id: 'custom_cake', label: 'Custom Cakes' },
              { id: 'packages', label: 'Party Packages' },
              ...(currentUser
                ? [
                    {
                      id: getRoleDashboardSection(currentUser),
                      label: getRoleDashboardLabel(currentUser),
                    },
                  ]
                : []),
            ].map((nav) => {
              const isActive = activeSection === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setActiveSection(nav.id as ActiveSection)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'border-amber-900 text-stone-900 font-semibold'
                      : 'border-transparent hover:text-stone-900 hover:border-stone-300'
                  }`}
                >
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary & User Account Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {!isStaffView && (
              <button
                type="button"
                onClick={() => setMobilePreviewMode(!mobilePreviewMode)}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:border-stone-400 transition-colors whitespace-nowrap cursor-pointer"
                title="Toggle Mobile App Preview Frame vs Full Web Storefront"
              >
                {mobilePreviewMode ? (
                  <>
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop View</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile App View</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setActiveSection('login');
                  return;
                }
                setIsCartOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">
                Bag ({cartCount}) · ₱{cartTotal.toLocaleString()}
              </span>
            </button>

            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsProfileSecurityOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                  title="Update Profile & Password Security"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-900" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 hover:bg-red-50 hover:border-red-300 hover:text-red-800 text-stone-700 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                  title={`Signed in as ${currentUser.name} (${currentUser.role})`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setActiveSection('login')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Responsive Sub-Navigation Bar */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-stone-200/70 bg-white">
          {[
            { id: 'catalog', label: 'Catalog' },
            { id: 'custom_cake', label: 'Custom Cakes' },
            { id: 'packages', label: 'Packages' },
            ...(currentUser
              ? [
                  {
                    id: getRoleDashboardSection(currentUser),
                    label: getRoleDashboardLabel(currentUser),
                  },
                ]
              : []),
          ].map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => setActiveSection(nav.id as ActiveSection)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                activeSection === nav.id
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600'
              }`}
            >
              {nav.label}
            </button>
          ))}
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <div
        className={
          mobilePreviewMode && !isStaffView
            ? 'max-w-[430px] w-full mx-auto my-6 bg-[#FAF9F6] border-[8px] border-stone-900 rounded-[36px] shadow-2xl overflow-hidden'
            : 'flex-1'
        }
      >
        {mobilePreviewMode && !isStaffView && (
          <div className="bg-stone-900 text-white px-5 py-2 flex items-center justify-between text-[11px] font-mono">
            <span>9:41 AM · React Native Expo Preview</span>
            <button
              type="button"
              onClick={() => setMobilePreviewMode(false)}
              className="text-amber-300 underline cursor-pointer"
            >
              Exit Mobile Frame
            </button>
          </div>
        )}

        {/* VIEW 1: LANDING PAGE / CUSTOMER STOREFRONT CATALOG */}
        {activeSection === 'catalog' && (
          <main>
            {/* SECTION 1: STOREFRONT HERO */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-10">
                <div className="lg:col-span-6 space-y-5">
                  <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                    <span>Kapitolyo Artisanal Bakeshop</span>
                    <span aria-hidden="true">·</span>
                    <span>Same-Day Chilled Delivery</span>
                    <span aria-hidden="true">·</span>
                    <span>GCash &amp; Maya Accepted</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-display font-semibold text-stone-900 tracking-tight leading-[1.12]">
                    Hand-Piped Cakes, Fudge Brownies &amp; Golden Cassava.
                  </h1>

                  <p className="text-base text-stone-600 leading-relaxed max-w-xl">
                    Baked from scratch every morning using real Bohol purple yam, 70% Belgian dark chocolate, and freshly grated native cassava—plus all-in party food packs starting at ₱999.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSection('custom_cake')}
                      className="px-5 py-3 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <span>Customize a Cake</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSection('packages')}
                      className="px-5 py-3 rounded-lg border border-stone-300 hover:border-stone-400 text-stone-800 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      View Birthday Package · ₱999
                    </button>
                  </div>

                  {/* Quantitative Proof Adjacency */}
                  <div className="pt-4 border-t border-stone-200/80 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="font-mono text-base font-semibold text-stone-900 tabular-nums">
                        4.9 ★ (1,420+)
                      </p>
                      <p className="text-stone-500">Verified Metro Manila orders</p>
                    </div>
                    <div>
                      <p className="font-mono text-base font-semibold text-stone-900 tabular-nums">
                        2h Express
                      </p>
                      <p className="text-stone-500">Bento cakes &amp; brownie boxes</p>
                    </div>
                    <div>
                      <p className="font-mono text-base font-semibold text-stone-900 tabular-nums">
                        ₱999 All-In
                      </p>
                      <p className="text-stone-500">Cake + Brownies + 12 Meals</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="aspect-[16/10] w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                    <ResilientImage
                      src={IMAGES.heroSpread}
                      alt="Artisanal spread of ube layer cake, fudge brownies, baked golden cassava cake, and leche flan"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: CURATED CATALOG & INTERACTIVE FILTERS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-medium text-amber-900 mb-1">
                    Fresh From Our Ovens · Daily Small-Batch Menu
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-stone-900">
                    Explore Bakery &amp; Catering Offerings
                  </h2>
                </div>

                {/* Search Input & Favorites Toggle */}
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cakes, brownies, cassava..."
                      className="w-full pl-9 pr-16 py-2 rounded-lg border border-stone-300 bg-white text-xs text-stone-900 focus:outline-none focus:border-amber-900"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          aria-label="Clear search query"
                          title="Clear search"
                          className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <VoiceDictationButton
                        onTranscript={(spoken) => {
                          setSelectedCategory('all');
                          setSelectedSubcategory('All');
                          setSearchQuery(spoken);
                        }}
                        fallbackPhrases={[
                          'Ube Macapuno',
                          'Cassava Cake',
                          'Fudge Brownies',
                          'Birthday Fiesta Package',
                          'Lambeth Cake',
                        ]}
                        ariaLabel="Voice search catalog"
                        title="Search catalog by voice (Voice-to-Text)"
                        className="p-1.5"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      showFavoritesOnly
                        ? 'border-red-300 bg-red-50 text-red-800'
                        : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        showFavoritesOnly ? 'fill-current text-red-600' : ''
                      }`}
                    />
                    <span>Favorites ({favoriteIds.length})</span>
                  </button>
                </div>
              </div>

              {/* Primary Category Segmented Control Bar */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-stone-200/70 rounded-xl mb-4">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedSubcategory('All');
                      }}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-white text-stone-900 shadow-xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Subcategory Filter Row */}
              {activeCategoryObj && activeCategoryObj.subcategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-xs text-stone-500 mr-1">Subcategory:</span>
                  {['All', ...activeCategoryObj.subcategories].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubcategory(sub)}
                      className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                        selectedSubcategory === sub
                          ? 'border-amber-900 bg-amber-950/[0.05] text-amber-950'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {/* 3-Column Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
                  <p className="text-base font-semibold text-stone-900 mb-1">
                    No matching bakery items found
                  </p>
                  <p className="text-xs text-stone-500 mb-4">
                    Try clearing your search filter or switching product categories.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedSubcategory('All');
                      setSearchQuery('');
                      setShowFavoritesOnly(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium cursor-pointer"
                  >
                    Reset Catalog Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {filteredProducts.map((product) => {
                    const isFav = favoriteIds.includes(product.id);
                    const isAdded = recentlyAddedId === product.id;

                    return (
                      <article
                        key={product.id}
                        className="bg-white border border-stone-200/90 rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
                      >
                        <div
                          onClick={() => setDetailProduct(product)}
                          className="aspect-[4/3] w-full bg-[#F9F9F8] overflow-hidden cursor-pointer relative group"
                        >
                          <ResilientImage
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-1.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <span>{product.subcategory}</span>
                              <span aria-hidden="true">·</span>
                              <span>{product.prepTime}</span>
                              <span aria-hidden="true">·</span>
                              <span>{product.rating.toFixed(1)} ★</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleFavorite(product.id)}
                              className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                              aria-label={`Favorite ${product.name}`}
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  isFav ? 'fill-red-600 text-red-600' : ''
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-baseline justify-between gap-3 mb-2">
                            <h3
                              onClick={() => setDetailProduct(product)}
                              className="text-base font-semibold text-stone-900 hover:text-amber-900 cursor-pointer leading-snug"
                            >
                              {product.name}
                            </h3>
                            <span className="font-mono text-[15px] font-semibold text-amber-900 tabular-nums shrink-0">
                              ₱{product.price.toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-stone-500 mb-2">
                            {product.unitLabel} · {product.stock} left today
                          </p>

                          <p className="text-xs text-stone-600 leading-relaxed line-clamp-2 mb-5">
                            {product.description}
                          </p>

                          <div className="mt-auto grid grid-cols-2 gap-2.5 pt-3 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={() => setDetailProduct(product)}
                              className="py-2 px-3 rounded-lg border border-stone-300 hover:border-stone-400 text-xs font-medium text-stone-700 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span>Sizes / Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleAddToCart({
                                  cartItemId: `${product.id}-${Date.now()}`,
                                  productId: product.id,
                                  name: product.name,
                                  category: product.category,
                                  unitPrice: product.price,
                                  quantity: 1,
                                  image: product.image,
                                  selectedVariation: product.unitLabel,
                                })
                              }
                              className="py-2 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>+ Add to Bag</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SECTION 3: CUSTOM CAKE STUDIO & PARTY PACKAGE CALLOUT + ATTRIBUTABLE PROOF */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-10">
                <div className="lg:col-span-7 space-y-4">
                  <p className="text-xs font-medium text-amber-900">
                    Celebration Packages &amp; Bespoke Cakes
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-stone-900">
                    Planning a Birthday, Baptism, or Corporate Fiesta?
                  </h2>
                  <p className="text-sm text-stone-600 leading-relaxed max-w-2xl">
                    Design a custom 1-tier or 2-tier cake in 10 guided steps—including your reference photo and dedication inscription—or bundle an 8&quot; cake, 12 fudge brownies, 12 cupcakes, and 12 savory food packs for ₱999.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSection('custom_cake')}
                      className="px-4 py-2.5 rounded-lg bg-amber-900 text-white text-xs font-semibold hover:bg-amber-950 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Launch 10-Step Cake Builder
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('packages')}
                      className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-800 text-xs font-semibold hover:border-stone-400 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Configure Party Packages
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-stone-200 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between">
                  <blockquote className="text-xs text-stone-700 leading-relaxed italic">
                    “Before switching to Dulce &amp; Kusina, we ordered cakes and savory food packs from three separate suppliers. Ordering the ₱1,650 Executive Corporate Package cut our event prep time by 3 hours and arrived warm in a single chilled van.”
                  </blockquote>
                  <div className="mt-4 pt-3 border-t border-stone-100 text-xs">
                    <p className="font-semibold text-stone-900">
                      Camille R. Hernandez
                    </p>
                    <p className="text-stone-500">
                      HR &amp; Events Lead, Ortigas Financial Tower · 14 Corporate Orders
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </main>
        )}

        {/* VIEW 2: 10-STEP CUSTOM CAKE BUILDER */}
        {activeSection === 'custom_cake' && (
          <CustomCakeBuilder
            onAddCustomCake={(item) => handleAddToCart(item, true)}
          />
        )}

        {/* VIEW 3: PARTY & EVENT PACKAGES */}
        {activeSection === 'packages' && (
          <PartyPackagesSection
            onAddPackageToCart={(item) => handleAddToCart(item, true)}
          />
        )}

        {/* VIEW 4: PRIVATE CUSTOMER ACCOUNT ORDER TRACKER & NOTIFICATIONS */}
        {activeSection === 'track_order' && currentUser && (
          <OrderTrackerView
            orders={customerOrders}
            notifications={customerNotifications}
            onMarkNotificationsRead={() =>
              setNotifications((prev) =>
                prev.map((n) =>
                  customerOrderNumbers.has(n.orderNumber)
                    ? { ...n, read: true }
                    : n
                )
              )
            }
            onSubmitReview={handleSubmitReview}
            onReorderOrder={handleReorderOrder}
          />
        )}

        {/* VIEW 5: UNIFIED ROLE-BASED LOG IN PORTAL */}
        {activeSection === 'login' && (
          <LoginView
            users={users}
            pendingCartItem={pendingCartItem}
            onLoginSuccess={handleLoginSuccess}
            onRegisterCustomer={handleRegisterCustomer}
            onUpdateUserAvatar={(userId, newAvatar) =>
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === userId ? { ...u, avatar: newAvatar } : u
                )
              )
            }
            onCancel={() => {
              setPendingCartItem(null);
              setActiveSection('catalog');
            }}
          />
        )}

        {/* VIEW 6: CUSTOMER DASHBOARD (Redirected when role === 'customer') */}
        {activeSection === 'customer_dashboard' && currentUser && (
          <CustomerDashboardView
            currentUser={currentUser}
            orders={customerOrders}
            notifications={customerNotifications}
            favoriteProducts={favoriteProductsList}
            cartCount={cartCount}
            cartTotal={cartTotal}
            onNavigateToCatalog={() => setActiveSection('catalog')}
            onNavigateToCustomCake={() => setActiveSection('custom_cake')}
            onNavigateToPackages={() => setActiveSection('packages')}
            onOpenBag={() => setIsCartOpen(true)}
            onAddToCart={(item) => handleAddToCart(item, true)}
            onReorderOrder={handleReorderOrder}
            onMarkNotificationsRead={() =>
              setNotifications((prev) =>
                prev.map((n) =>
                  customerOrderNumbers.has(n.orderNumber)
                    ? { ...n, read: true }
                    : n
                )
              )
            }
            onMarkSingleNotificationRead={(notifId) =>
              setNotifications((prev) =>
                prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
              )
            }
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onSubmitReview={handleSubmitReview}
            onOpenProfileSecurity={() => setIsProfileSecurityOpen(true)}
            onLogout={handleLogout}
          />
        )}

        {/* VIEW 7: CASHIER DASHBOARD (Redirected when role === 'cashier') */}
        {activeSection === 'cashier_dashboard' && currentUser && (
          <CashierDashboardView
            currentUser={currentUser}
            businessSettings={businessSettings}
            products={products}
            orders={orders}
            staffList={staffList}
            deliveryStaff={deliveryStaffList}
            attendanceLogs={attendanceLogs}
            onRecordStaffAttendance={handleRecordStaffAttendance}
            onSwitchStaffUser={handleLoginSuccess}
            onUpdateUserAvatar={(userId, newAvatar) =>
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === userId ? { ...u, avatar: newAvatar } : u
                )
              )
            }
            onVerifyPayment={handleVerifyPayment}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAssignRider={handleAssignRider}
            onCreatePosOrder={handlePlaceOrder}
            onOpenProfileSecurity={() => setIsProfileSecurityOpen(true)}
            onLogout={handleLogout}
          />
        )}

        {/* VIEW 8: DELIVERY DASHBOARD (Redirected when role === 'delivery') */}
        {activeSection === 'delivery_dashboard' && currentUser && (
          <DeliveryDashboardView
            currentUser={currentUser}
            businessSettings={businessSettings}
            orders={orders}
            onRecordStaffAttendance={handleRecordStaffAttendance}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAssignRider={handleAssignRider}
            onVerifyPayment={handleVerifyPayment}
            onOpenProfileSecurity={() => setIsProfileSecurityOpen(true)}
            onLogout={handleLogout}
          />
        )}

        {/* VIEW 9: ADMIN DASHBOARD (Redirected when role === 'admin') */}
        {activeSection === 'admin_dashboard' && (
          <AdminConsoleView
            currentUser={currentUser}
            businessSettings={businessSettings}
            onUpdateBusinessSettings={setBusinessSettings}
            products={products}
            orders={orders}
            customers={customers}
            cashiers={staffList}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAssignRider={handleAssignRider}
            onVerifyPayment={handleVerifyPayment}
            onAddProduct={(newProd) => setProducts((prev) => [newProd, ...prev])}
            onUpdateProductStock={(productId, newStock) =>
              setProducts((prev) =>
                prev.map((p) =>
                  p.id === productId ? { ...p, stock: newStock } : p
                )
              )
            }
            onUpdateProductThreshold={(productId, newThreshold) =>
              setProducts((prev) =>
                prev.map((p) =>
                  p.id === productId
                    ? { ...p, lowStockThreshold: Math.max(1, newThreshold) }
                    : p
                )
              )
            }
            onToggleProductFeatured={(productId) =>
              setProducts((prev) =>
                prev.map((p) =>
                  p.id === productId ? { ...p, featured: !p.featured } : p
                )
              )
            }
            onDeleteProduct={(productId) =>
              setProducts((prev) => prev.filter((p) => p.id !== productId))
            }
            onAddCashier={handleAddCashier}
            onToggleCashierStatus={handleToggleCashierStatus}
            onDeleteCashier={handleDeleteCashier}
            onOpenProfileSecurity={() => setIsProfileSecurityOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </div>

      {/* CLEAN FOOTER */}
      <footer className="bg-white border-t border-stone-200/90 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            <p className="font-display font-semibold text-stone-900 text-sm">
              {businessSettings.businessName} — {businessSettings.tagline}
            </p>
            <p className="mt-0.5">
              {businessSettings.address} · Tel: {businessSettings.contactNumber} ·{' '}
              {businessSettings.operatingHours}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span>
              GCash ({businessSettings.gcashNumber}) · PayMaya (
              {businessSettings.mayaNumber}) · Bank Transfer · Cash
            </span>
            <span aria-hidden="true">·</span>
            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="text-red-800 hover:text-red-950 underline cursor-pointer"
              >
                Signed in as {currentUser.name} ({currentUser.role}) · Log Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveSection('login')}
                className="text-stone-700 hover:text-stone-900 underline cursor-pointer"
              >
                Staff &amp; Customer Log In Portal
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* SLIDE-OVER CART & PHILIPPINE CHECKOUT DRAWER */}
      <CartCheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        currentUser={currentUser}
        businessSettings={businessSettings}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* CONTIGUOUS PURCHASE PRODUCT DETAIL MODAL */}
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={(item) => handleAddToCart(item, false)}
        isFavorite={detailProduct ? favoriteIds.includes(detailProduct.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* PROFILE & PASSWORD SECURITY MODAL (WITH CONFIRM PASSWORD & SECURITY VALIDATION) */}
      {currentUser && (
        <ProfileSecurityModal
          isOpen={isProfileSecurityOpen}
          user={currentUser}
          onClose={() => setIsProfileSecurityOpen(false)}
          onSaveProfile={handleUpdateUserProfile}
        />
      )}
    </div>
  );
}
