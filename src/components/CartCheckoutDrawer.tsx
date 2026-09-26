import React, { useEffect, useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Upload,
  CheckCircle2,
  CreditCard,
  Truck,
  Store,
  QrCode,
  Image as ImageIcon,
} from 'lucide-react';
import {
  BusinessSettings,
  CartItem,
  FulfillmentType,
  Order,
  PaymentMethod,
  PaymentStatus,
  UserAccount,
} from '../types/bakery';
import { ResilientImage } from './ResilientImage';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currentUser?: UserAccount | null;
  businessSettings: BusinessSettings;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onPlaceOrder: (order: Order) => void;
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  currentUser,
  businessSettings,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('Delivery');
  const [customerName, setCustomerName] = useState(
    currentUser?.name || 'Clarisse Villanueva'
  );
  const [customerPhone, setCustomerPhone] = useState(
    currentUser?.phone || '0917 842 9910'
  );
  const [customerEmail, setCustomerEmail] = useState(
    currentUser?.email || 'customer@dulcekusina.ph'
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    currentUser?.address ||
      'Unit 14B One Shangri-La Place, Ortigas Center, Mandaluyong'
  );
  const [scheduledDate, setScheduledDate] = useState('2026-09-26');
  const [scheduledTime, setScheduledTime] = useState('2:00 PM');
  const [specialInstructions, setSpecialInstructions] = useState(
    'Please include birthday candle and pack utensils separately.'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('GCash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProofImage, setPaymentProofImage] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; amount: number } | null>(
    null
  );
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name);
      setCustomerPhone(currentUser.phone);
      setCustomerEmail(currentUser.email);
      if (currentUser.address) {
        setDeliveryAddress(currentUser.address);
      }
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = appliedPromo ? appliedPromo.amount : 0;
  const deliveryFee =
    fulfillmentType === 'Pickup' ? 0 : subtotal >= 2500 ? 0 : 85;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  const paymentMethodsList: {
    id: PaymentMethod;
    displayLabel: string;
    detail: string;
  }[] = [
    {
      id: 'GCash',
      displayLabel: 'GCash (QR Code & Mobile Number)',
      detail: `Scan GCash QR or send to ${businessSettings.gcashNumber}`,
    },
    {
      id: 'Maya',
      displayLabel: 'PayMaya / Maya (QR Code & Number)',
      detail: `Scan PayMaya QR or send to ${businessSettings.mayaNumber}`,
    },
    {
      id: 'Bank Transfer',
      displayLabel: 'Bank Transfer (BPI / BDO)',
      detail: businessSettings.bankAccountInfo,
    },
    {
      id: 'Cash on Delivery',
      displayLabel: 'Cash on Delivery (COD)',
      detail: 'Pay cash to our chilled van or motorcycle courier upon arrival',
    },
    {
      id: 'Cash on Pickup',
      displayLabel: 'Cash on Pickup',
      detail: `Pay at ${businessSettings.businessName} counter (${businessSettings.address})`,
    },
  ];

  const handleApplyPromo = () => {
    const clean = promoCode.trim().toUpperCase();
    if (clean === 'SWEET10') {
      setAppliedPromo({ code: 'SWEET10', amount: Math.round(subtotal * 0.1) });
    } else if (clean === 'PARTY100') {
      setAppliedPromo({ code: 'PARTY100', amount: 100 });
    } else {
      setAppliedPromo(null);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPaymentProofImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const needsDigitalVerification =
      paymentMethod === 'GCash' ||
      paymentMethod === 'Maya' ||
      paymentMethod === 'Bank Transfer';

    const paymentStatus: PaymentStatus = needsDigitalVerification
      ? 'Pending Verification'
      : 'Collect on Fulfillment';

    const randomSuffix = Math.floor(100 + Math.random() * 899);
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-20260926-${randomSuffix}`,
      customerName: customerName.trim() || 'Valued Customer',
      customerPhone: customerPhone.trim() || '0917 000 0000',
      customerEmail: customerEmail.trim() || 'customer@example.com',
      items: [...cart],
      subtotal,
      discount,
      deliveryFee,
      total,
      fulfillmentType,
      scheduledDate,
      scheduledTime,
      deliveryAddress:
        fulfillmentType === 'Pickup'
          ? `Store Pickup — ${businessSettings.businessName} (${businessSettings.address})`
          : deliveryAddress,
      specialInstructions,
      paymentMethod,
      paymentStatus,
      paymentReference: needsDigitalVerification
        ? paymentReference.trim() || 'REF-SUBMITTED'
        : undefined,
      paymentProofImage: paymentProofImage || undefined,
      status: 'New',
      createdAt: 'Just now',
    };

    onPlaceOrder(newOrder);
    setLastPlacedOrder(newOrder);
    setPaymentReference('');
    setPaymentProofImage('');
    setStep('confirmed');
  };

  const isGcashOrMaya = paymentMethod === 'GCash' || paymentMethod === 'Maya';
  const activeQrImage =
    paymentMethod === 'GCash'
      ? businessSettings.gcashQrImage
      : businessSettings.mayaQrImage;
  const activeAccountNumber =
    paymentMethod === 'GCash'
      ? businessSettings.gcashNumber
      : businessSettings.mayaNumber;
  const activeAccountName =
    paymentMethod === 'GCash'
      ? businessSettings.gcashAccountName
      : businessSettings.mayaAccountName;
  const activeWalletLabel =
    paymentMethod === 'GCash' ? 'GCash' : 'PayMaya (Maya)';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#FAF9F6] h-full flex flex-col shadow-2xl border-l border-stone-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-semibold text-stone-900">
              {step === 'cart' && `Your ${businessSettings.businessName} Bag`}
              {step === 'checkout' && 'Schedule & Mode of Payment'}
              {step === 'confirmed' && 'Order Confirmed'}
            </h2>
            <p className="text-xs text-stone-500">
              {step === 'cart' &&
                (subtotal >= 2500
                  ? 'Qualified for complimentary chilled van delivery'
                  : 'Free delivery on orders ₱2,500+ · Standard metro courier ₱85')}
              {step === 'checkout' &&
                'Scan GCash/PayMaya QR code, enter reference number, and upload receipt'}
              {step === 'confirmed' && 'Sent directly to our kitchen, cashier & admin console'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep('cart');
              onClose();
            }}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close bag drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="text-center py-16 bg-white border border-stone-200/80 rounded-xl p-8">
                  <p className="text-base font-semibold text-stone-900 mb-1">
                    Your bakery bag is empty
                  </p>
                  <p className="text-xs text-stone-500 mb-6 max-w-xs mx-auto">
                    Explore our freshly baked ube cakes, Belgian fudge brownies, golden cassava cakes, or customize a cake.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Browse Bakery Catalog
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="bg-white border border-stone-200/90 rounded-xl p-4 flex gap-4"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <ResilientImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-stone-900 leading-snug">
                              {item.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.cartItemId)}
                              className="text-stone-400 hover:text-red-700 p-1 cursor-pointer"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {item.selectedVariation && (
                            <p className="text-xs text-stone-500 mt-0.5">
                              Size/Option: {item.selectedVariation}
                            </p>
                          )}

                          {item.customCake && (
                            <div className="mt-1.5 text-xs text-stone-600 space-y-0.5 border-l-2 border-amber-800 pl-2.5">
                              <p>
                                {item.customCake.flavor} Sponge · {item.customCake.filling} ·{' '}
                                {item.customCake.frosting}
                              </p>
                              <p className="italic text-amber-950 font-medium">
                                “{item.customCake.message}”
                              </p>
                              <p className="text-[11px] text-stone-500">
                                Target: {item.customCake.preferredDate} at{' '}
                                {item.customCake.preferredTime}
                              </p>
                            </div>
                          )}

                          {item.partyPackage && (
                            <div className="mt-1.5 text-xs text-stone-600 space-y-0.5 border-l-2 border-amber-800 pl-2.5">
                              <p>
                                {item.partyPackage.eventType} · {item.partyPackage.cakeFlavor}
                              </p>
                              <p className="truncate">{item.partyPackage.savoryMenuChoice}</p>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center border border-stone-200 rounded-lg bg-stone-50">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                                className="p-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 text-xs font-mono font-semibold tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                                className="p-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="font-mono text-sm font-semibold text-stone-900 tabular-nums">
                              ₱{(item.unitPrice * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code Box */}
                  <div className="bg-white border border-stone-200/90 rounded-xl p-4">
                    <label
                      htmlFor="promo-input"
                      className="block text-xs font-medium text-stone-700 mb-2"
                    >
                      Promo or Voucher Code (Try <span className="font-mono">SWEET10</span> or{' '}
                      <span className="font-mono">PARTY100</span>)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="promo-input"
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter voucher code"
                        className="flex-1 px-3 py-2 rounded-lg border border-stone-300 text-xs font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {appliedPromo && (
                      <p className="text-xs text-emerald-700 mt-2 font-medium">
                        Applied {appliedPromo.code}: -₱{appliedPromo.amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Fulfillment Toggle */}
              <div className="bg-white border border-stone-200/90 rounded-xl p-4">
                <span className="block text-xs font-semibold text-stone-900 mb-3">
                  Fulfillment Method
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFulfillmentType('Delivery');
                      if (paymentMethod === 'Cash on Pickup') {
                        setPaymentMethod('Cash on Delivery');
                      }
                    }}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      fulfillmentType === 'Delivery'
                        ? 'border-amber-900 bg-amber-950/[0.04] text-stone-900'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-amber-900 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Chilled Delivery</p>
                      <p className="text-[11px] text-stone-500">Metro Manila ₱85</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFulfillmentType('Pickup');
                      if (paymentMethod === 'Cash on Delivery') {
                        setPaymentMethod('Cash on Pickup');
                      }
                    }}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      fulfillmentType === 'Pickup'
                        ? 'border-amber-900 bg-amber-950/[0.04] text-stone-900'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    <Store className="w-4 h-4 text-amber-900 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Store Pickup</p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {businessSettings.businessName} · Free
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Customer & Address Details */}
              <div className="bg-white border border-stone-200/90 rounded-xl p-4 space-y-3.5">
                <h3 className="text-xs font-semibold text-stone-900">
                  Customer &amp; Schedule Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Mobile Number (SMS/Viber)
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-mono"
                    />
                  </div>
                </div>

                {fulfillmentType === 'Delivery' ? (
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Complete Delivery Address &amp; Landmark
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-300 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-600">
                    <span className="font-semibold text-stone-900">Pickup Location:</span>{' '}
                    {businessSettings.address} ({businessSettings.contactNumber})
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="date"
                        required
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-stone-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Preferred Time
                    </label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                      <select
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-stone-300 text-xs font-mono bg-white"
                      >
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="2:00 PM">2:00 PM</option>
                        <option value="4:00 PM">4:00 PM</option>
                        <option value="6:00 PM">6:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Special Instructions (Candles, Gate Pass, Slicing Notes)
                  </label>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs"
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white border border-stone-200/90 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-stone-900">
                    Choose Mode of Payment
                  </h3>
                  <CreditCard className="w-4 h-4 text-stone-400" />
                </div>

                <div className="space-y-2">
                  {paymentMethodsList.map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-amber-900 bg-amber-950/[0.04]'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-stone-900">
                            {method.displayLabel}
                          </span>
                          <span className="text-[11px] font-medium text-amber-900">
                            {isSelected ? 'Selected' : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">{method.detail}</p>
                      </button>
                    );
                  })}
                </div>

                {/* GCash or PayMaya QR Code + Account Number + Reference Number + Receipt Upload */}
                {isGcashOrMaya && (
                  <div className="mt-4 pt-4 border-t border-stone-200 space-y-4">
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/90 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-36 h-36 rounded-xl bg-white border border-stone-200 p-2 shrink-0 flex items-center justify-center shadow-xs">
                        <ResilientImage
                          src={activeQrImage}
                          alt={`${activeWalletLabel} Official QR Code`}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Scan {activeWalletLabel} QR Code</span>
                        </div>
                        <p className="text-xs text-stone-600">
                          Account Name:{' '}
                          <span className="font-semibold text-stone-900">
                            {activeAccountName}
                          </span>
                        </p>
                        <p className="text-xs text-stone-600">
                          {activeWalletLabel} Number:{' '}
                          <span className="font-mono text-sm font-semibold text-stone-900">
                            {activeAccountNumber}
                          </span>
                        </p>
                        <p className="text-xs font-semibold text-amber-950 pt-1">
                          Amount to Send:{' '}
                          <span className="font-mono text-sm tabular-nums">
                            ₱{total.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Step 1: Enter Reference Number */}
                    <div>
                      <label
                        htmlFor="payment-ref-input"
                        className="block text-xs font-semibold text-stone-900 mb-1"
                      >
                        Enter {activeWalletLabel} Reference Number *
                      </label>
                      <input
                        id="payment-ref-input"
                        type="text"
                        required
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder={
                          paymentMethod === 'GCash'
                            ? 'e.g. 9018442910324 (13-digit GCash Ref No.)'
                            : 'e.g. MY-7748291042 (PayMaya Ref No.)'
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs font-mono text-stone-900 focus:outline-none focus:border-amber-900"
                      />
                    </div>

                    {/* Step 2: Upload Screenshot or Receipt of Payment */}
                    <div className="space-y-2.5">
                      <span className="block text-xs font-semibold text-stone-900">
                        Upload Screenshot or Receipt of Payment
                      </span>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {paymentProofImage
                              ? 'Change Screenshot / Receipt'
                              : `Upload ${activeWalletLabel} Screenshot / Receipt`}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProofUpload}
                            className="hidden"
                          />
                        </label>
                        {paymentProofImage && (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Receipt attached</span>
                          </span>
                        )}
                      </div>

                      {paymentProofImage && (
                        <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 flex items-center gap-3">
                          <div className="w-14 h-14 rounded-md overflow-hidden border border-stone-300 bg-white shrink-0">
                            <img
                              src={paymentProofImage}
                              alt="Uploaded payment receipt preview"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-semibold text-stone-900">
                              Payment Screenshot Ready
                            </p>
                            <p className="text-[11px] text-stone-500">
                              Will be sent to Cashier &amp; Admin for verification
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPaymentProofImage('')}
                            className="text-xs text-red-700 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank Transfer Reference & Receipt Box */}
                {paymentMethod === 'Bank Transfer' && (
                  <div className="mt-3 pt-3 border-t border-stone-200 space-y-3">
                    <div className="p-3 rounded-lg bg-stone-100/80 text-xs">
                      <p className="font-semibold text-stone-900">
                        Transfer Exact Total: ₱{total.toLocaleString()}
                      </p>
                      <p className="font-mono text-[11px] text-stone-700 mt-0.5">
                        {businessSettings.bankAccountInfo}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Bank Transfer Reference No. *
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Enter InstaPay / bank reference number"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-medium text-stone-700 hover:border-stone-400 cursor-pointer">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-900" />
                        <span>
                          {paymentProofImage
                            ? 'Bank Receipt Attached'
                            : 'Upload Transfer Screenshot / Receipt'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProofUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}

          {step === 'confirmed' && lastPlacedOrder && (
            <div className="bg-white border border-stone-200/90 rounded-xl p-6 text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs font-mono text-amber-900 font-semibold">
                  Order #{lastPlacedOrder.orderNumber}
                </p>
                <h3 className="text-xl font-display font-semibold text-stone-900 mt-1">
                  Thank you, {lastPlacedOrder.customerName}!
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Your order has been logged in {businessSettings.businessName}’s kitchen queue and Cashier/Admin Console.
                </p>
              </div>

              <div className="text-left border-t border-b border-stone-200 py-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Schedule:</span>
                  <span className="font-mono text-stone-900">
                    {lastPlacedOrder.scheduledDate} · {lastPlacedOrder.scheduledTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Fulfillment:</span>
                  <span className="font-medium text-stone-900">
                    {lastPlacedOrder.fulfillmentType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payment Method:</span>
                  <span className="font-medium text-stone-900">
                    {lastPlacedOrder.paymentMethod === 'Maya'
                      ? 'PayMaya / Maya'
                      : lastPlacedOrder.paymentMethod}{' '}
                    ({lastPlacedOrder.paymentStatus})
                  </span>
                </div>
                {lastPlacedOrder.paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Reference Number:</span>
                    <span className="font-mono font-semibold text-stone-900">
                      {lastPlacedOrder.paymentReference}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-sm pt-2 border-t border-stone-100">
                  <span>Total Amount:</span>
                  <span className="font-mono text-amber-900 tabular-nums">
                    ₱{lastPlacedOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('cart');
                  onClose();
                }}
                className="w-full py-3 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Track Live Order Status
              </button>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {step !== 'confirmed' && cart.length > 0 && (
          <div className="p-6 bg-white border-t border-stone-200 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-mono tabular-nums">₱{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Voucher Discount ({appliedPromo?.code})</span>
                  <span className="font-mono tabular-nums">-₱{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Delivery / Courier Fee</span>
                <span className="font-mono tabular-nums">
                  {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Due</span>
                <span className="font-mono text-amber-900 tabular-nums">
                  ₱{total.toLocaleString()}
                </span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3.5 px-4 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Proceed to Schedule &amp; Payment · ₱{total.toLocaleString()}
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="py-3 px-3 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Back to Bag
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  className="col-span-2 py-3 px-4 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Place Order · ₱{total.toLocaleString()}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
