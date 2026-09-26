import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Package,
  Heart,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Bell,
  BellRing,
  ArrowRight,
  CheckCircle2,
  Truck,
  ChefHat,
  X,
  Check,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  CartItem,
  Order,
  OrderNotification,
  OrderStatus,
  Product,
  UserAccount,
} from '../types/bakery';
import { OrderTrackerView } from './OrderTrackerView';
import { ResilientImage } from './ResilientImage';

interface CustomerDashboardViewProps {
  currentUser: UserAccount;
  orders: Order[];
  notifications: OrderNotification[];
  favoriteProducts: Product[];
  cartCount: number;
  cartTotal: number;
  onNavigateToCatalog: () => void;
  onNavigateToCustomCake: () => void;
  onNavigateToPackages: () => void;
  onOpenBag: () => void;
  onAddToCart: (item: CartItem) => void;
  onReorderOrder: (order: Order) => void;
  onMarkNotificationsRead: () => void;
  onMarkSingleNotificationRead?: (notificationId: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus) => void;
  onSubmitReview: (orderId: string, rating: number, comment: string) => void;
  onOpenProfileSecurity?: () => void;
  onLogout: () => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  currentUser,
  orders,
  notifications,
  favoriteProducts,
  cartCount,
  cartTotal,
  onNavigateToCatalog,
  onNavigateToCustomCake,
  onNavigateToPackages,
  onOpenBag,
  onAddToCart,
  onReorderOrder,
  onMarkNotificationsRead,
  onMarkSingleNotificationRead,
  onUpdateOrderStatus,
  onSubmitReview,
  onOpenProfileSecurity,
  onLogout,
}) => {
  const [isAlertFeedOpen, setIsAlertFeedOpen] = useState<boolean>(false);
  const [liveToastAlert, setLiveToastAlert] = useState<OrderNotification | null>(
    null
  );
  const [reorderedOrderId, setReorderedOrderId] = useState<string | null>(null);
  const prevNotifCountRef = useRef<number>(notifications.length);
  const trackerSectionRef = useRef<HTMLDivElement | null>(null);

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  // Filter notifications specifically for 'Preparing' -> 'Ready' or 'Out for Delivery' transitions
  const transitionAlerts = notifications.filter(
    (n) =>
      n.isTransitionAlert ||
      (n.previousStatus === 'Preparing' &&
        (n.status === 'Ready' || n.status === 'Out for Delivery'))
  );

  const unreadTransitionAlerts = transitionAlerts.filter((n) => !n.read);
  const latestUnreadAlert = unreadTransitionAlerts[0] || null;

  // Orders currently in 'Preparing' state (eligible to transition to 'Ready' or 'Out for Delivery')
  const preparingOrders = orders.filter((o) => o.status === 'Preparing');

  // Completed orders eligible for 1-click Reorder into active cart
  const completedOrders = orders.filter((o) => o.status === 'Completed');

  const handleReorder = (order: Order) => {
    onReorderOrder(order);
    setReorderedOrderId(order.id);
    setTimeout(() => {
      setReorderedOrderId((prev) => (prev === order.id ? null : prev));
    }, 2500);
  };

  // Detect newly arrived transition notifications in real time
  useEffect(() => {
    if (notifications.length > prevNotifCountRef.current) {
      const newest = notifications[0];
      if (
        newest &&
        (newest.isTransitionAlert ||
          (newest.previousStatus === 'Preparing' &&
            (newest.status === 'Ready' ||
              newest.status === 'Out for Delivery')))
      ) {
        setLiveToastAlert(newest);
        setIsAlertFeedOpen(true);
      }
    }
    prevNotifCountRef.current = notifications.length;
  }, [notifications]);

  const handleScrollToTracker = () => {
    setIsAlertFeedOpen(false);
    trackerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Customer Profile & Real-Time Status Notification Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 space-y-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-amber-900 font-mono font-semibold">
                <span>CUSTOMER DASHBOARD</span>
                <span aria-hidden="true">·</span>
                <span>VERIFIED MEMBER</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>LIVE KITCHEN STATUS FEED</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-display font-semibold text-stone-900">
                  Welcome back, {currentUser.name}
                </h1>

                {/* Real-Time Status Notification Badge in Header */}
                <button
                  type="button"
                  onClick={() => setIsAlertFeedOpen((prev) => !prev)}
                  aria-label="Real-Time Order Status Notification Badge"
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                    unreadTransitionAlerts.length > 0
                      ? 'bg-amber-50 border-amber-700/50 text-amber-950 shadow-xs hover:bg-amber-100/80'
                      : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200/70'
                  }`}
                >
                  <span className="relative flex items-center justify-center">
                    {unreadTransitionAlerts.length > 0 ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-amber-500 opacity-40" />
                        <BellRing className="w-3.5 h-3.5 text-amber-900 relative" />
                      </>
                    ) : (
                      <Bell className="w-3.5 h-3.5 text-stone-500" />
                    )}
                  </span>

                  {unreadTransitionAlerts.length > 0 && latestUnreadAlert ? (
                    <span className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-900 text-white font-mono text-[10px] tabular-nums">
                        {unreadTransitionAlerts.length} NEW
                      </span>
                      <span className="font-mono text-[11px] text-amber-950 hidden sm:inline">
                        #{latestUnreadAlert.orderNumber}:
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900">
                        <span>Preparing</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{latestUnreadAlert.status}</span>
                      </span>
                    </span>
                  ) : (
                    <span>
                      Status Alerts ({transitionAlerts.length})
                    </span>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-1">
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  {currentUser.email}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  {currentUser.phone}
                </span>
                {currentUser.address && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {currentUser.address}
                  </span>
                )}
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleScrollToTracker}
                className="px-4 py-2.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Orders · Track Order ({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="px-4 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Browse Bakery Catalog
              </button>
              <button
                type="button"
                onClick={onNavigateToCustomCake}
                className="px-4 py-2.5 rounded-lg border border-stone-300 hover:border-stone-400 text-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                <span>Customize a Cake</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToPackages}
                className="px-4 py-2.5 rounded-lg border border-stone-300 hover:border-stone-400 text-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Party Packages</span>
              </button>
              <button
                type="button"
                onClick={onOpenBag}
                className="px-4 py-2.5 rounded-lg border border-amber-900/40 bg-amber-50/50 text-amber-950 text-xs font-mono font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap tabular-nums"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  My Bag ({cartCount}) · ₱{cartTotal.toLocaleString()}
                </span>
              </button>
              {onOpenProfileSecurity && (
                <button
                  type="button"
                  onClick={onOpenProfileSecurity}
                  className="px-3.5 py-2.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-900" />
                  <span>Update Profile &amp; Password</span>
                </button>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2.5 rounded-lg border border-stone-300 hover:bg-red-50 hover:border-red-300 hover:text-red-800 text-stone-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Real-Time Status Transition Banner (Active when an order transitions from 'Preparing' to 'Ready' or 'Out for Delivery') */}
          {(latestUnreadAlert || liveToastAlert) && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                (liveToastAlert || latestUnreadAlert)?.status === 'Ready'
                  ? 'bg-emerald-50/90 border-emerald-700/40 text-emerald-950'
                  : 'bg-amber-50/95 border-amber-700/40 text-amber-950'
              }`}
            >
              {(() => {
                const activeAlert = liveToastAlert || latestUnreadAlert!;
                const isReady = activeAlert.status === 'Ready';
                return (
                  <>
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isReady
                            ? 'bg-emerald-700 text-white'
                            : 'bg-amber-900 text-white'
                        }`}
                      >
                        {isReady ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Truck className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-white/90 border border-current/20 font-mono text-[11px] font-semibold uppercase tracking-wide">
                            Real-Time Order Transition Alert
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold bg-white px-2.5 py-0.5 rounded-md border border-stone-200 text-stone-900">
                            <span className="text-stone-500">Preparing</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-900" />
                            <span
                              className={
                                isReady ? 'text-emerald-800' : 'text-amber-900'
                              }
                            >
                              {activeAlert.status}
                            </span>
                          </span>
                          <span className="text-[11px] font-mono opacity-75">
                            {activeAlert.timestamp}
                          </span>
                        </div>

                        <p className="text-sm font-semibold">
                          {activeAlert.title} — Order #{activeAlert.orderNumber}
                        </p>
                        <p className="text-xs opacity-90 leading-relaxed">
                          {activeAlert.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleScrollToTracker}
                        className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Track Order #{activeAlert.orderNumber}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLiveToastAlert(null);
                          if (onMarkSingleNotificationRead) {
                            onMarkSingleNotificationRead(activeAlert.id);
                          } else {
                            onMarkNotificationsRead();
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-white/90 hover:bg-white border border-stone-300 text-stone-800 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Dismiss Alert</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Expandable Real-Time Status Notification Drawer / Feed in Header */}
          {isAlertFeedOpen && (
            <div className="border-t border-stone-200 pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-900" />
                  <h2 className="text-sm font-semibold text-stone-900">
                    Real-Time Order Status Transition Alerts (Preparing → Ready / Out for Delivery)
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {unreadTransitionAlerts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLiveToastAlert(null);
                        onMarkNotificationsRead();
                      }}
                      className="text-xs font-medium text-amber-900 hover:underline cursor-pointer"
                    >
                      Mark all {unreadTransitionAlerts.length} alerts as read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAlertFeedOpen(false)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                    aria-label="Close notification feed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Kitchen Dispatch Simulator so Customer can test real-time transitions directly */}
              {onUpdateOrderStatus && (
                <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-stone-700">
                    <ChefHat className="w-4 h-4 text-amber-900 shrink-0" />
                    <span>
                      <strong className="text-stone-900">
                        Live Kitchen Dispatch Test:
                      </strong>{' '}
                      {preparingOrders.length > 0
                        ? `Order #${preparingOrders[0].orderNumber} is currently 'Preparing'. Trigger a real-time transition to see the header badge alert:`
                        : 'All orders have already advanced past Preparing. Reset an order to Preparing to test another live transition:'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {preparingOrders.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrderStatus(preparingOrders[0].id, 'Ready')
                          }
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Transition #{preparingOrders[0].orderNumber} → Ready
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrderStatus(
                              preparingOrders[0].id,
                              'Out for Delivery'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>
                            Transition #{preparingOrders[0].orderNumber} → Out
                            for Delivery
                          </span>
                        </button>
                      </>
                    ) : (
                      orders[0] && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrderStatus(orders[0].id, 'Preparing')
                          }
                          className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>
                            Reset #{orders[0].orderNumber} to &apos;Preparing&apos;
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Transition Alert Cards List */}
              {transitionAlerts.length === 0 ? (
                <p className="text-xs text-stone-500 py-3">
                  No status transitions from &apos;Preparing&apos; to &apos;Ready&apos; or &apos;Out for Delivery&apos; recorded yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {transitionAlerts.map((alert) => {
                    const isReady = alert.status === 'Ready';
                    return (
                      <div
                        key={alert.id}
                        className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2.5 ${
                          !alert.read
                            ? isReady
                              ? 'border-emerald-600/40 bg-emerald-50/50'
                              : 'border-amber-700/40 bg-amber-50/50'
                            : 'border-stone-200 bg-stone-50/60 opacity-80'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-stone-900">
                                #{alert.orderNumber}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-stone-200 font-mono text-[11px] font-semibold">
                                <span className="text-stone-500">
                                  {alert.previousStatus || 'Preparing'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-amber-900" />
                                <span
                                  className={
                                    isReady
                                      ? 'text-emerald-800'
                                      : 'text-amber-900'
                                  }
                                >
                                  {alert.status}
                                </span>
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-stone-500">
                              {alert.timestamp}
                            </span>
                          </div>
                          <p className="font-semibold text-stone-900">
                            {alert.title}
                          </p>
                          <p className="text-stone-600 leading-relaxed">
                            {alert.message}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                          <span
                            className={`text-[11px] font-mono font-semibold ${
                              alert.read
                                ? 'text-stone-400'
                                : 'text-amber-900'
                            }`}
                          >
                            {alert.read ? 'Read' : '● Unread Alert'}
                          </span>
                          {!alert.read && onMarkSingleNotificationRead && (
                            <button
                              type="button"
                              onClick={() =>
                                onMarkSingleNotificationRead(alert.id)
                              }
                              className="text-[11px] font-semibold text-stone-700 hover:text-stone-900 underline cursor-pointer"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer KPI Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-white border border-stone-200/90 rounded-xl p-4">
            <p className="text-xs text-stone-500">Active &amp; Past Orders</p>
            <p className="text-xl font-mono font-semibold text-stone-900 tabular-nums mt-1">
              {orders.length} Orders
            </p>
          </div>
          <div className="bg-white border border-stone-200/90 rounded-xl p-4">
            <p className="text-xs text-stone-500">Total Bakery Spend</p>
            <p className="text-xl font-mono font-semibold text-amber-900 tabular-nums mt-1">
              ₱{totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="bg-white border border-stone-200/90 rounded-xl p-4">
            <p className="text-xs text-stone-500">Saved Favorites</p>
            <p className="text-xl font-mono font-semibold text-stone-900 tabular-nums mt-1">
              {favoriteProducts.length} Items
            </p>
          </div>
          <div className="bg-white border border-stone-200/90 rounded-xl p-4">
            <p className="text-xs text-stone-500">Sweet Rewards Points</p>
            <p className="text-xl font-mono font-semibold text-emerald-800 tabular-nums mt-1">
              {Math.floor(totalSpent / 20)} pts
            </p>
          </div>
        </div>
      </section>

      {/* Completed Orders Quick Reorder */}
      {completedOrders.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <h2 className="text-base font-semibold text-stone-900">
                  Completed Orders ({completedOrders.length})
                </h2>
              </div>
              <p className="text-xs text-stone-500">
                Click Reorder next to any completed order to automatically add its items to your active cart.
              </p>
            </div>

            <div className="space-y-3">
              {completedOrders.map((ord) => {
                const isJustReordered = reorderedOrderId === ord.id;
                const totalItemQty = ord.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );
                return (
                  <div
                    key={ord.id}
                    className="border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-stone-300 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-stone-900">
                          #{ord.orderNumber}
                        </span>
                        <span aria-hidden="true" className="text-stone-300">
                          ·
                        </span>
                        <span className="font-semibold text-emerald-800">
                          {ord.status}
                        </span>
                        <span aria-hidden="true" className="text-stone-300">
                          ·
                        </span>
                        <span className="text-stone-500 font-mono">
                          {ord.scheduledDate}
                        </span>
                        <span aria-hidden="true" className="text-stone-300">
                          ·
                        </span>
                        <span className="font-mono font-semibold text-amber-900 tabular-nums">
                          ₱{ord.total.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 truncate">
                        {ord.items
                          .map(
                            (i) =>
                              `${i.quantity}× ${i.name}${
                                i.selectedVariation ? ` (${i.selectedVariation})` : ''
                              }`
                          )
                          .join(' + ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReorder(ord)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                          isJustReordered
                            ? 'bg-emerald-700 text-white'
                            : 'bg-amber-900 hover:bg-amber-950 text-white'
                        }`}
                      >
                        {isJustReordered ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added {totalItemQty} Items to Cart</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reorder</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Saved Favorites Quick Re-Order */}
      {favoriteProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                <h2 className="text-base font-semibold text-stone-900">
                  Your Saved Bakery Favorites
                </h2>
              </div>
              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="text-xs text-amber-900 font-medium hover:underline cursor-pointer"
              >
                Explore full menu
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {favoriteProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="border border-stone-200 rounded-xl p-3.5 flex items-center gap-3.5"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 shrink-0">
                    <ResilientImage
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-stone-900 truncate">
                      {prod.name}
                    </h3>
                    <p className="font-mono text-xs font-semibold text-amber-900 tabular-nums mt-0.5">
                      ₱{prod.price.toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onAddToCart({
                          cartItemId: `${prod.id}-${Date.now()}`,
                          productId: prod.id,
                          name: prod.name,
                          category: prod.category,
                          unitPrice: prod.price,
                          quantity: 1,
                          image: prod.image,
                          selectedVariation: prod.unitLabel,
                        })
                      }
                      className="mt-2 px-3 py-1 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-medium cursor-pointer"
                    >
                      + Add to Bag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Embedded Live Order Tracking & Notifications */}
      <div ref={trackerSectionRef}>
        <OrderTrackerView
          orders={orders}
          notifications={notifications}
          onMarkNotificationsRead={onMarkNotificationsRead}
          onSubmitReview={onSubmitReview}
          onReorderOrder={onReorderOrder}
        />
      </div>
    </div>
  );
};
