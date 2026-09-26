import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  LogOut,
  Search,
  Package,
  Clock,
  Navigation,
  X,
  UserCheck,
} from 'lucide-react';
import {
  AttendanceScanMethod,
  BusinessSettings,
  Order,
  OrderStatus,
  UserAccount,
} from '../types/bakery';
import { createStaffAvatarPlaceholder } from '../utils/staffHelpers';
import { StaffDashboardIdBadge } from './StaffDashboardIdBadge';

interface DeliveryDashboardViewProps {
  currentUser: UserAccount;
  businessSettings?: BusinessSettings;
  orders: Order[];
  onRecordStaffAttendance?: (params: {
    staffId: string;
    action: 'Check-In' | 'Check-Out';
    method: AttendanceScanMethod;
    verifiedByCashier: string;
  }) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAssignRider: (orderId: string, rider: string) => void;
  onVerifyPayment: (orderId: string) => void;
  onOpenProfileSecurity: () => void;
  onLogout: () => void;
}

type DeliveryTab = 'dispatch' | 'reports';

export const DeliveryDashboardView: React.FC<DeliveryDashboardViewProps> = ({
  currentUser,
  businessSettings,
  orders,
  onRecordStaffAttendance,
  onUpdateOrderStatus,
  onAssignRider,
  onVerifyPayment,
  onOpenProfileSecurity,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<DeliveryTab>('dispatch');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showStaffQrModal, setShowStaffQrModal] = useState<boolean>(false);

  const deliveryOrders = orders.filter((o) => o.fulfillmentType === 'Delivery');

  const filteredDeliveryOrders = deliveryOrders.filter((ord) => {
    if (statusFilter !== 'All' && ord.status !== statusFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.deliveryAddress.toLowerCase().includes(q) ||
        ord.customerPhone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const outForDeliveryCount = deliveryOrders.filter(
    (o) => o.status === 'Out for Delivery'
  ).length;
  const readyForDispatchCount = deliveryOrders.filter(
    (o) => o.status === 'Ready' || o.status === 'Preparing'
  ).length;
  const completedDeliveriesCount = deliveryOrders.filter(
    (o) => o.status === 'Completed'
  ).length;
  const totalDeliveryValue = deliveryOrders.reduce((s, o) => s + o.total, 0);

  const riderLabel = currentUser.terminal
    ? `${currentUser.name} (${currentUser.terminal})`
    : currentUser.name;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Delivery Staff Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src={
              currentUser.avatar ||
              createStaffAvatarPlaceholder(currentUser.name, 'delivery')
            }
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-900/30 shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-900 font-semibold">
              <span>DELIVERY DASHBOARD &amp; RIDER DISPATCH</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser.employeeId || 'EMP-DELIVERY'}</span>
              {currentUser.age && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {currentUser.age} yrs ({currentUser.gender || 'Staff'})
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-display font-semibold text-stone-900 mt-0.5">
              Delivery Specialist: {currentUser.name}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {currentUser.terminal || 'Chilled Delivery Fleet'} ·{' '}
              {currentUser.phone} · {currentUser.address || 'Metro Manila Route'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('dispatch')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'dispatch'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Active Route &amp; Dispatch ({deliveryOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Delivery Reports &amp; Logs
            </button>
          </div>

          {currentUser.qrCodeImage && (
            <button
              type="button"
              onClick={() => setShowStaffQrModal(true)}
              className="px-3.5 py-2 rounded-lg border border-amber-900/30 bg-amber-50/70 text-amber-950 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-amber-100/70 cursor-pointer whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-900" />
              <span>My Staff QR ID</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenProfileSecurity}
            className="px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-900" />
            <span>Update Profile &amp; Password</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-red-50 hover:border-red-300 hover:text-red-800 text-stone-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* OFFICIAL DELIVERY STAFF ID BADGE DISPLAYED ON DASHBOARD */}
      <StaffDashboardIdBadge
        staff={currentUser}
        businessSettings={businessSettings}
        onQuickAttendanceAction={
          onRecordStaffAttendance
            ? (action) =>
                onRecordStaffAttendance({
                  staffId: currentUser.id,
                  action,
                  method: 'Quick QR Tap',
                  verifiedByCashier: `${currentUser.name} (Delivery Dashboard)`,
                })
            : undefined
        }
        defaultExpanded={true}
      />

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500">Ready / Preparing for Pickup</p>
          <p className="text-2xl font-mono font-semibold text-amber-900 tabular-nums mt-1">
            {readyForDispatchCount}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500">Out for Delivery Now</p>
          <p className="text-2xl font-mono font-semibold text-stone-900 tabular-nums mt-1">
            {outForDeliveryCount}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500">Completed Deliveries</p>
          <p className="text-2xl font-mono font-semibold text-emerald-800 tabular-nums mt-1">
            {completedDeliveriesCount}
          </p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500">Total Route Value</p>
          <p className="text-2xl font-mono font-semibold text-stone-900 tabular-nums mt-1">
            ₱{totalDeliveryValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            'All',
            'Preparing',
            'Ready',
            'Out for Delivery',
            'Completed',
          ].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, address..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs"
          />
        </div>
      </div>

      {activeTab === 'dispatch' ? (
        <div className="space-y-4">
          {filteredDeliveryOrders.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-xs text-stone-500">
              No delivery orders match the current filter.
            </div>
          ) : (
            filteredDeliveryOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white border border-stone-200 rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-stone-900">
                        #{ord.orderNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-amber-900">
                        {ord.status}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-stone-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {ord.scheduledDate} at {ord.scheduledTime}
                        </span>
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-stone-900">
                      {ord.customerName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {ord.customerPhone}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-900" />
                        {ord.deliveryAddress}
                      </span>
                    </div>
                  </div>

                  <div className="text-left md:text-right space-y-1">
                    <p className="font-mono text-lg font-semibold text-stone-900 tabular-nums">
                      ₱{ord.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-stone-600">
                      {ord.paymentMethod} ·{' '}
                      <span
                        className={`font-semibold ${
                          ord.paymentStatus === 'Paid' ||
                          ord.paymentStatus === 'Verified'
                            ? 'text-emerald-700'
                            : 'text-amber-800'
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </p>
                    <p className="text-[11px] font-mono text-stone-500">
                      Assigned Rider: {ord.assignedRider || 'Unassigned'}
                    </p>
                  </div>
                </div>

                {/* Order Items & Special Instructions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                  <div className="lg:col-span-7 space-y-1.5">
                    <p className="font-semibold text-stone-700 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-900" />
                      <span>Chilled Cargo Items:</span>
                    </p>
                    {ord.items.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="flex items-center justify-between bg-stone-50 px-3 py-2 rounded-lg border border-stone-200/70"
                      >
                        <span className="font-medium text-stone-900">
                          {item.quantity}× {item.name}
                        </span>
                        <span className="font-mono text-stone-600">
                          ₱{(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-5 bg-amber-50/50 border border-amber-900/20 rounded-xl p-3.5 flex flex-col justify-between gap-2">
                    <div>
                      <p className="font-semibold text-amber-950">
                        Delivery Note &amp; Handling Instructions
                      </p>
                      <p className="text-stone-700 mt-1">
                        {ord.specialInstructions ||
                          'Keep upright in insulated chilled compartment.'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-amber-900/10 flex items-center justify-between text-[11px] text-stone-600">
                      <span>Delivery Fee Included:</span>
                      <span className="font-mono font-semibold text-stone-900">
                        ₱{ord.deliveryFee.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Action Controls */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAssignRider(ord.id, riderLabel)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-xs font-medium text-stone-800 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-900" />
                      <span>Assign to Me ({currentUser.firstName || currentUser.name})</span>
                    </button>

                    {(ord.paymentStatus === 'Collect on Fulfillment' ||
                      ord.paymentStatus === 'Pending Verification') && (
                      <button
                        type="button"
                        onClick={() => onVerifyPayment(ord.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark COD / Payment Collected</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(ord.id, 'Ready')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                        ord.status === 'Ready'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'border-stone-300 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      Ready at Kitchen
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateOrderStatus(ord.id, 'Out for Delivery')
                      }
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        ord.status === 'Out for Delivery'
                          ? 'bg-amber-900 text-white'
                          : 'bg-amber-100 text-amber-950 hover:bg-amber-200'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Start Delivery (Out for Delivery)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(ord.id, 'Completed')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        ord.status === 'Completed'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Delivery</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-stone-900">
              Delivery Dispatch Reports &amp; Trip Manifest
            </h2>
            <p className="text-xs text-stone-500">
              Complete log of all customer delivery dispatches, assigned riders, and payment collections.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2.5 pr-4 font-medium">Order #</th>
                  <th className="py-2.5 px-3 font-medium">Customer &amp; Phone</th>
                  <th className="py-2.5 px-3 font-medium">Destination Address</th>
                  <th className="py-2.5 px-3 font-medium">Schedule</th>
                  <th className="py-2.5 px-3 font-medium">Assigned Rider</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 pl-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70">
                {filteredDeliveryOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/80">
                    <td className="py-3 pr-4 font-mono font-semibold text-stone-900">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-stone-900">
                        {ord.customerName}
                      </p>
                      <p className="font-mono text-[11px] text-stone-500">
                        {ord.customerPhone}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-stone-600 max-w-xs truncate">
                      {ord.deliveryAddress}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-600">
                      {ord.scheduledDate} · {ord.scheduledTime}
                    </td>
                    <td className="py-3 px-3 text-stone-700">
                      {ord.assignedRider || 'Unassigned'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-amber-900">
                      {ord.status}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono font-semibold text-stone-900 tabular-nums">
                      ₱{ord.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal to Display Delivery Staff's Unique QR Code Badge */}
      {showStaffQrModal && currentUser.qrCodeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 text-left">
              <div>
                <p className="text-[11px] font-mono font-semibold text-amber-900">
                  OFFICIAL STAFF QR CREDENTIAL
                </p>
                <h3 className="text-base font-semibold text-stone-900">
                  {currentUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffQrModal(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center space-y-3">
              <img
                src={currentUser.qrCodeImage}
                alt="Unique Staff QR Code"
                className="w-48 h-48 object-contain rounded-xl bg-white p-2 border border-stone-200"
              />
              <div className="space-y-0.5">
                <p className="font-mono text-xs font-semibold text-stone-900">
                  Employee ID: {currentUser.employeeId || 'EMP-2026-003'}
                </p>
                <p className="text-xs text-stone-500">
                  Role: Delivery Fleet Specialist · {currentUser.phone}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowStaffQrModal(false)}
              className="w-full py-2.5 rounded-lg bg-stone-900 text-white text-xs font-semibold cursor-pointer"
            >
              Close Badge
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
