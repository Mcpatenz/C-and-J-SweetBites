import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Star,
  Bell,
  MapPin,
  CreditCard,
  RotateCcw,
  ShoppingBag,
} from 'lucide-react';
import { Order, OrderNotification, OrderStatus } from '../types/bakery';
import { ResilientImage } from './ResilientImage';

interface OrderTrackerViewProps {
  orders: Order[];
  notifications: OrderNotification[];
  onMarkNotificationsRead: () => void;
  onSubmitReview: (orderId: string, rating: number, comment: string) => void;
  onReorderOrder?: (order: Order) => void;
}

const STATUS_STEPS: OrderStatus[] = [
  'New',
  'Confirmed',
  'Preparing',
  'Ready',
  'Out for Delivery',
  'Completed',
];

export const OrderTrackerView: React.FC<OrderTrackerViewProps> = ({
  orders,
  notifications,
  onMarkNotificationsRead,
  onSubmitReview,
  onReorderOrder,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [reviewInput, setReviewInput] = useState<string>(
    'Freshly baked, moist sponge, and delivered right on schedule!'
  );
  const [reorderedOrderId, setReorderedOrderId] = useState<string | null>(null);

  const activeOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'Cancelled') return -1;
    return STATUS_STEPS.indexOf(status);
  };

  const handleReorderClick = (order: Order, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!onReorderOrder) return;
    onReorderOrder(order);
    setReorderedOrderId(order.id);
    setTimeout(() => {
      setReorderedOrderId((prev) => (prev === order.id ? null : prev));
    }, 2500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 border-b border-stone-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-amber-900 mb-2">
            Private User Account Order Tracker · Real-Time Kitchen &amp; Courier Status
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-stone-900 tracking-tight">
            Track Your Bakery Orders
          </h1>
        </div>
        <p className="text-sm text-stone-600 max-w-md">
          Protected account view: only orders placed under your user account are displayed here so no other customer can view your order history.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-12 text-center space-y-2">
          <Package className="w-8 h-8 text-amber-900 mx-auto mb-2" />
          <p className="text-base font-semibold text-stone-900">
            No orders found under your account yet
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Once you place a cake, brownie, cassava, or party package order from your account, live kitchen and delivery tracking will appear privately here.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 cols: Order List + Notification Feed */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-stone-200/90 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">
              Your Account Orders ({orders.length})
            </h2>
            <div className="space-y-2.5">
              {orders.map((ord) => {
                const isSelected = activeOrder?.id === ord.id;
                const isCompleted = ord.status === 'Completed';
                const isJustReordered = reorderedOrderId === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedOrderId(ord.id);
                      }
                    }}
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-amber-900 bg-amber-950/[0.03]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-stone-900">
                        #{ord.orderNumber}
                      </span>
                      <span className="font-mono text-xs font-semibold text-amber-900 tabular-nums">
                        ₱{ord.total.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 truncate">
                      {ord.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-stone-100">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                        <span
                          className={`font-semibold ${
                            isCompleted ? 'text-emerald-800' : 'text-stone-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{ord.scheduledDate}</span>
                      </div>

                      {isCompleted && onReorderOrder && (
                        <button
                          type="button"
                          onClick={(e) => handleReorderClick(ord, e)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                            isJustReordered
                              ? 'bg-emerald-700 text-white'
                              : 'bg-amber-900 hover:bg-amber-950 text-white'
                          }`}
                        >
                          {isJustReordered ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Added to Cart</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>Reorder</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Notification Log */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-900" />
                <h2 className="text-sm font-semibold text-stone-900">
                  Order Notifications
                </h2>
              </div>
              <button
                type="button"
                onClick={onMarkNotificationsRead}
                className="text-xs text-stone-500 hover:text-stone-900 underline cursor-pointer"
              >
                Mark all read
              </button>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-stone-500">
                  No notifications for your orders yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border text-xs ${
                      n.read
                        ? 'border-stone-200/70 bg-stone-50/50 text-stone-600'
                        : 'border-amber-900/30 bg-amber-50/40 text-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-stone-900">{n.title}</span>
                      <span className="text-[11px] font-mono text-stone-500">{n.timestamp}</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 8 cols: Active Order Progress & Details */}
        {activeOrder && (
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-stone-200/90 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                    <span className="font-mono font-semibold text-stone-900">
                      #{activeOrder.orderNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Placed {activeOrder.createdAt}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeOrder.fulfillmentType}</span>
                  </div>
                  <h2 className="text-2xl font-display font-semibold text-stone-900">
                    Current Status: {activeOrder.status}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-stone-500">Scheduled Window</p>
                    <p className="text-sm font-mono font-semibold text-stone-900">
                      {activeOrder.scheduledDate} · {activeOrder.scheduledTime}
                    </p>
                  </div>

                  {activeOrder.status === 'Completed' && onReorderOrder && (
                    <button
                      type="button"
                      onClick={() => handleReorderClick(activeOrder)}
                      className={`px-4 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                        reorderedOrderId === activeOrder.id
                          ? 'bg-emerald-700 text-white'
                          : 'bg-amber-900 hover:bg-amber-950 text-white'
                      }`}
                    >
                      {reorderedOrderId === activeOrder.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Added to Active Cart</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 6-Stage Progress Stepper */}
              <div className="py-6 border-b border-stone-200">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {STATUS_STEPS.map((stepName, idx) => {
                    const currentIdx = getStepIndex(activeOrder.status);
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div
                        key={stepName}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          isCurrent
                            ? 'border-amber-900 bg-amber-950/[0.04]'
                            : isCompleted
                            ? 'border-emerald-700/30 bg-emerald-50/30'
                            : 'border-stone-200 bg-stone-50/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] text-stone-500">
                            0{idx + 1}
                          </span>
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                          )}
                        </div>
                        <p className="text-xs font-semibold text-stone-900 leading-tight">
                          {stepName}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery, Rider & Payment Verification Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-stone-200 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-semibold">
                    <MapPin className="w-4 h-4 text-amber-900" />
                    <span>Fulfillment & Courier Assignment</span>
                  </div>
                  <p className="text-stone-700">{activeOrder.deliveryAddress}</p>
                  {activeOrder.assignedRider && (
                    <p className="text-stone-600">
                      Assigned Courier:{' '}
                      <span className="font-semibold text-stone-900">
                        {activeOrder.assignedRider}
                      </span>
                    </p>
                  )}
                  {activeOrder.specialInstructions && (
                    <p className="text-stone-500 italic">
                      Note: “{activeOrder.specialInstructions}”
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-semibold">
                    <CreditCard className="w-4 h-4 text-amber-900" />
                    <span>Payment & Receipt Summary</span>
                  </div>
                  <p className="text-stone-700">
                    Method: <span className="font-semibold">{activeOrder.paymentMethod}</span> ·{' '}
                    <span className="font-medium text-amber-900">
                      {activeOrder.paymentStatus}
                    </span>
                  </p>
                  {activeOrder.paymentReference && (
                    <p className="font-mono text-stone-600">
                      Ref No: {activeOrder.paymentReference}
                    </p>
                  )}
                  <p className="font-mono text-sm font-semibold text-stone-900 pt-1 tabular-nums">
                    Total Amount: ₱{activeOrder.total.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Ordered Items Breakdown */}
              <div className="pt-6 space-y-4">
                <h3 className="text-xs font-semibold text-stone-900">
                  Ordered Items ({activeOrder.items.length})
                </h3>
                {activeOrder.items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-start gap-4 pb-4 border-b border-stone-100 last:border-b-0 last:pb-0"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 shrink-0">
                      <ResilientImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-semibold text-stone-900">
                          {item.quantity}× {item.name}
                        </h4>
                        <span className="font-mono text-sm font-semibold text-stone-900 tabular-nums">
                          ₱{(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                      {item.customCake && (
                        <p className="text-xs text-stone-600 mt-1">
                          Custom Spec: {item.customCake.size} · {item.customCake.flavor} ·{' '}
                          {item.customCake.filling} · “{item.customCake.message}”
                        </p>
                      )}
                      {item.partyPackage && (
                        <p className="text-xs text-stone-600 mt-1">
                          Party Bundle: {item.partyPackage.cakeFlavor} ·{' '}
                          {item.partyPackage.savoryMenuChoice}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Rating & Review Card */}
            <div className="bg-white border border-stone-200/90 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-stone-900 mb-2">
                Rate & Review Order #{activeOrder.orderNumber}
              </h3>
              {activeOrder.rating ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-amber-600">
                    {Array.from({ length: activeOrder.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                    <span className="text-xs font-mono text-stone-700 ml-2">
                      {activeOrder.rating}.0 / 5.0 Verified Customer Rating
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 italic">
                    “{activeOrder.reviewComment}”
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingInput(star)}
                        className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
                          star <= ratingInput
                            ? 'border-amber-600 bg-amber-50 text-amber-700'
                            : 'border-stone-200 text-stone-400'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <span className="text-xs font-mono text-stone-600 ml-1">
                      {ratingInput} / 5 Stars
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={reviewInput}
                    onChange={(e) => setReviewInput(e.target.value)}
                    placeholder="Share how your cake, brownies, or food packs tasted..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onSubmitReview(activeOrder.id, ratingInput, reviewInput)
                    }
                    className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Submit Order Review
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}
    </section>
  );
};
