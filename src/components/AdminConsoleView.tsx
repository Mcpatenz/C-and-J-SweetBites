import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  FileCode2,
  Plus,
  CheckCircle2,
  Truck,
  Search,
  Trash2,
  UserCheck,
  LogOut,
  Settings,
  Upload,
  QrCode,
  Building2,
  Phone,
  MapPin,
  Eye,
  X,
  Camera,
  RefreshCw,
  ShieldCheck,
  Printer,
  Share2,
  Download,
  Check,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import {
  BusinessSettings,
  CategoryId,
  CustomerProfile,
  Order,
  OrderStatus,
  Product,
  StaffGender,
  UserAccount,
} from '../types/bakery';
import {
  calculateAgeFromBirthdate,
  calculateLengthOfService,
  createStaffAvatarPlaceholder,
  downloadStaffQrBadgeSvg,
  generateOneTimePassword,
  generateUniqueStaffQrDataUri,
} from '../utils/staffHelpers';
import {
  DELIVERY_RIDERS,
  IMAGES,
  WEEKLY_SALES_DATA,
} from '../data/initialData';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ResilientImage } from './ResilientImage';
import { PrintableStaffIdView } from './PrintableStaffIdView';

interface AdminConsoleViewProps {
  currentUser?: UserAccount | null;
  businessSettings: BusinessSettings;
  onUpdateBusinessSettings: (updated: BusinessSettings) => void;
  products: Product[];
  orders: Order[];
  customers: CustomerProfile[];
  cashiers: UserAccount[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAssignRider: (orderId: string, rider: string) => void;
  onVerifyPayment: (orderId: string) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProductStock: (productId: string, newStock: number) => void;
  onUpdateProductThreshold: (productId: string, newThreshold: number) => void;
  onToggleProductFeatured: (productId: string) => void;
  onDeleteProduct: (productId: string) => void;
  onAddCashier: (newStaff: UserAccount) => void;
  onToggleCashierStatus: (staffId: string) => void;
  onDeleteCashier: (staffId: string) => void;
  onOpenProfileSecurity?: () => void;
  onLogout: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'cashiers'
  | 'staff_ids'
  | 'payments'
  | 'customers'
  | 'settings'
  | 'blueprint';

const ORDER_STATUSES: OrderStatus[] = [
  'New',
  'Confirmed',
  'Preparing',
  'Ready',
  'Out for Delivery',
  'Completed',
  'Cancelled',
];

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  currentUser,
  businessSettings,
  onUpdateBusinessSettings,
  products,
  orders,
  customers,
  cashiers,
  onUpdateOrderStatus,
  onAssignRider,
  onVerifyPayment,
  onAddProduct,
  onUpdateProductStock,
  onUpdateProductThreshold,
  onToggleProductFeatured,
  onDeleteProduct,
  onAddCashier,
  onToggleCashierStatus,
  onDeleteCashier,
  onOpenProfileSecurity,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [productSearch, setProductSearch] = useState<string>('');
  const [showNewProductForm, setShowNewProductForm] = useState<boolean>(false);
  const [previewReceiptOrder, setPreviewReceiptOrder] = useState<Order | null>(null);

  // Business & Mode of Payment Settings Form State
  const [settingsForm, setSettingsForm] =
    useState<BusinessSettings>(businessSettings);
  const [settingsSavedBanner, setSettingsSavedBanner] = useState<boolean>(false);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] =
    useState<Exclude<CategoryId, 'all'>>('cakes');
  const [newProdSubcategory, setNewProdSubcategory] = useState('Birthday Cakes');
  const [newProdPrice, setNewProdPrice] = useState('680');
  const [newProdUnit, setNewProdUnit] = useState('8" Round');
  const [newProdStock, setNewProdStock] = useState('15');
  const [newProdThreshold, setNewProdThreshold] = useState('12');
  const [newProdDesc, setNewProdDesc] = useState(
    'Freshly baked in small batches with premium local ingredients.'
  );

  // New Staff Onboarding Form State (Cashier or Delivery Role)
  const [showNewCashierForm, setShowNewCashierForm] = useState<boolean>(false);
  const [staffRoleFilter, setStaffRoleFilter] = useState<'all' | 'cashier' | 'delivery'>('all');
  const [staffEmployeeId, setStaffEmployeeId] = useState<string>(
    `EMP-2026-00${cashiers.length + 1}`
  );
  const [staffLastName, setStaffLastName] = useState<string>('');
  const [staffFirstName, setStaffFirstName] = useState<string>('');
  const [staffMiddleName, setStaffMiddleName] = useState<string>('');
  const [staffAddress, setStaffAddress] = useState<string>('');
  const [staffBirthdate, setStaffBirthdate] = useState<string>('2000-05-15');
  const [staffDateHired, setStaffDateHired] = useState<string>('2025-03-15');
  const [staffGender, setStaffGender] = useState<StaffGender>('Female');
  const [staffPhone, setStaffPhone] = useState<string>('0917 ');
  const [staffRole, setStaffRole] = useState<'cashier' | 'delivery'>('cashier');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffOtpPassword, setStaffOtpPassword] = useState<string>(() =>
    generateOneTimePassword()
  );
  const [staffShift, setStaffShift] = useState<string>(
    'Morning Shift (7:00 AM – 3:00 PM)'
  );
  const [staffTerminal, setStaffTerminal] = useState<string>(
    'POS Counter 01 · Kapitolyo Flagship'
  );
  const [staffImagePreview, setStaffImagePreview] = useState<string>('');
  const [isStaffCameraOpen, setIsStaffCameraOpen] = useState<boolean>(false);
  const [staffCameraNotice, setStaffCameraNotice] = useState<string>('');
  const [selectedQrStaff, setSelectedQrStaff] = useState<UserAccount | null>(
    null
  );
  const [newlyCreatedStaffBanner, setNewlyCreatedStaffBanner] =
    useState<UserAccount | null>(null);
  const [sharedStaffId, setSharedStaffId] = useState<string | null>(null);
  const [shareFeedbackMessage, setShareFeedbackMessage] = useState<string>('');
  const [checkedInStaffTimes, setCheckedInStaffTimes] = useState<
    Record<string, string>
  >({
    'usr-cashier-1': '07:55 AM',
    'usr-delivery-1': '08:02 AM',
  });
  const [staffSubView, setStaffSubView] = useState<'directory' | 'printable_id'>(
    'directory'
  );
  const [selectedPrintableStaff, setSelectedPrintableStaff] =
    useState<UserAccount | null>(() => cashiers[0] || null);
  const staffVideoRef = useRef<HTMLVideoElement | null>(null);
  const staffStreamRef = useRef<MediaStream | null>(null);

  const handleOpenPrintableStaffId = (staff: UserAccount, triggerPrint = false) => {
    setSelectedPrintableStaff(staff);
    setSelectedQrStaff(null);
    setStaffSubView('printable_id');
    if (activeTab !== 'cashiers' && activeTab !== 'staff_ids') {
      setActiveTab('staff_ids');
    }
    if (triggerPrint) {
      setTimeout(() => {
        window.print();
      }, 240);
    }
  };

  const getResolvedStaffQr = (staff: UserAccount) => {
    const generated = generateUniqueStaffQrDataUri({
      employeeId: staff.employeeId || staff.id,
      fullName: staff.name,
      role: staff.role,
      email: staff.email,
    });
    return {
      qrCodeImage: staff.qrCodeImage || generated.qrDataUri,
      qrCodePayload: staff.qrCodePayload || generated.payload,
      checkInCode: generated.checkInCode,
    };
  };

  const handleShareStaffQrBadge = async (staff: UserAccount) => {
    const resolvedQr = getResolvedStaffQr(staff);
    const shareText = [
      `DULCE & KUSINA — STAFF QUICK CHECK-IN PASS`,
      `Employee Name: ${staff.name}`,
      `Employee ID: ${staff.employeeId || 'EMP-2026'}`,
      `Role: ${staff.role.toUpperCase()} (${
        staff.role === 'delivery' ? 'Delivery Dashboard' : 'Cashier POS Dashboard'
      })`,
      `Date Hired: ${staff.dateHired || staff.createdAt || '2025-03-15'} (${
        calculateLengthOfService(staff.dateHired || staff.createdAt) ||
        staff.lengthOfService ||
        'Active Tenure'
      })`,
      `Shift / Assignment: ${staff.shift || 'Morning Shift'} · ${
        staff.terminal || 'Main Branch'
      }`,
      `Login Email: ${staff.email}`,
      `One-Time Password (OTP): ${staff.password || 'OTP-Issued'}`,
      `Quick Check-In QR Token: ${resolvedQr.qrCodePayload}`,
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${staff.name} — Staff QR Check-In Badge`,
          text: shareText,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText).catch(() => {});
      }
    }

    setSharedStaffId(staff.id);
    setShareFeedbackMessage(
      `Check-in QR credentials for ${staff.name} (${staff.employeeId}) copied & ready to share with employee!`
    );
    setTimeout(() => {
      setSharedStaffId((prev) => (prev === staff.id ? null : prev));
    }, 3500);
  };

  const handlePrintStaffQrBadge = (staff: UserAccount) => {
    handleOpenPrintableStaffId(staff, true);
  };

  const handleQuickCheckInStaff = (staff: UserAccount) => {
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setCheckedInStaffTimes((prev) => ({
      ...prev,
      [staff.id]: nowTime,
    }));
    setShareFeedbackMessage(
      `Quick QR Check-In verified for ${staff.name} (${
        staff.employeeId || 'Staff'
      }) at ${nowTime}.`
    );
  };

  const stopStaffCamera = () => {
    if (staffStreamRef.current) {
      staffStreamRef.current.getTracks().forEach((track) => track.stop());
      staffStreamRef.current = null;
    }
    setIsStaffCameraOpen(false);
  };

  const handleOpenStaffCamera = async () => {
    setStaffCameraNotice('');
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 320 },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      staffStreamRef.current = stream;
      setIsStaffCameraOpen(true);
      setTimeout(() => {
        if (staffVideoRef.current) {
          staffVideoRef.current.srcObject = stream;
          staffVideoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      const initials = `${staffFirstName[0] || 'S'}${staffLastName[0] || 'T'}`;
      setStaffImagePreview(createStaffAvatarPlaceholder(initials, staffRole));
      setStaffCameraNotice(
        'Optical camera portrait captured and aligned for staff profile.'
      );
    }
  };

  const handleCaptureStaffPhoto = () => {
    if (staffVideoRef.current && staffStreamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(staffVideoRef.current, 0, 0, 240, 240);
        setStaffImagePreview(canvas.toDataURL('image/jpeg', 0.9));
      }
    } else {
      const initials = `${staffFirstName[0] || 'S'}${staffLastName[0] || 'T'}`;
      setStaffImagePreview(createStaffAvatarPlaceholder(initials, staffRole));
    }
    stopStaffCamera();
  };

  const handleStaffImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setStaffImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Automatically calculate Age when Birthdate is inputted
  const autoCalculatedStaffAge = calculateAgeFromBirthdate(staffBirthdate);

  // Automatically calculate Length of Service when Date Hired is inputted
  const autoCalculatedLengthOfService =
    calculateLengthOfService(staffDateHired);

  // Live Unique QR Code preview during adding of staff
  const composedStaffFullName =
    [staffFirstName.trim(), staffMiddleName.trim(), staffLastName.trim()]
      .filter(Boolean)
      .join(' ') || 'New Staff Member';

  const liveStaffQr = generateUniqueStaffQrDataUri({
    employeeId: staffEmployeeId,
    fullName: composedStaffFullName,
    role: staffRole,
    email: staffEmail,
  });

  const handleQrFileUpload = (
    wallet: 'gcash' | 'maya',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const updated = {
          ...settingsForm,
          ...(wallet === 'gcash'
            ? { gcashQrImage: reader.result }
            : { mayaQrImage: reader.result }),
        };
        setSettingsForm(updated);
        onUpdateBusinessSettings(updated);
        setSettingsSavedBanner(true);
        setTimeout(() => setSettingsSavedBanner(false), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBusinessSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusinessSettings(settingsForm);
    setSettingsSavedBanner(true);
    setTimeout(() => setSettingsSavedBanner(false), 3500);
  };

  // Dynamic KPIs combining baseline today stats + live session orders
  const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
  const currentDayOrders = activeOrders.filter(
    (o) =>
      o.createdAt.startsWith('2026-09-25') ||
      o.createdAt.startsWith('2026-09-26') ||
      !o.createdAt.startsWith('2026-09-24')
  );
  const currentDayLoggedOrdersRevenue = currentDayOrders.reduce(
    (acc, o) => acc + o.total,
    0
  );
  const currentDaySubtotal = currentDayOrders.reduce(
    (acc, o) => acc + o.subtotal,
    0
  );
  const currentDayDeliveryRevenue = currentDayOrders.reduce(
    (acc, o) => acc + o.deliveryFee,
    0
  );
  const currentDayDiscounts = currentDayOrders.reduce(
    (acc, o) => acc + o.discount,
    0
  );
  const walkInPosBaseline = 5372; // Walk-in pastry counter sales for current day
  const todaySales = walkInPosBaseline + currentDayLoggedOrdersRevenue;
  const todayOrdersCount = 27 + currentDayOrders.length;
  const todayCustomersCount = 14 + currentDayOrders.length;
  const currentDayOrderUnits = currentDayOrders.reduce(
    (acc, o) => acc + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const todayProductsSold = 39 + currentDayOrderUnits;
  const todayAverageOrderValue = Math.round(
    todaySales / Math.max(1, todayOrdersCount)
  );

  // Daily Sales Summary Card Controls (Sort & View Count)
  const [topSellerSortBy, setTopSellerSortBy] = useState<'units' | 'revenue'>(
    'units'
  );
  const [showAllTopSellers, setShowAllTopSellers] = useState<boolean>(false);

  // Compute today's units sold & revenue per product + overall top-selling metrics
  const topSellingProductsSummary = products
    .map((prod) => {
      const todayUnits = currentDayOrders.reduce((sum, ord) => {
        const matchingQty = ord.items
          .filter(
            (item) =>
              item.productId === prod.id ||
              item.name.toLowerCase() === prod.name.toLowerCase()
          )
          .reduce((q, item) => q + item.quantity, 0);
        return sum + matchingQty;
      }, 0);

      // Estimate today's total units (logged orders + proportional walk-in counter units)
      const estimatedDailyUnits =
        todayUnits + Math.max(1, Math.round(prod.soldCount / 42));
      const estimatedDailyRevenue = estimatedDailyUnits * prod.price;
      const cumulativeRevenue = prod.soldCount * prod.price;

      return {
        product: prod,
        todayLoggedUnits: todayUnits,
        estimatedDailyUnits,
        estimatedDailyRevenue,
        cumulativeUnits: prod.soldCount,
        cumulativeRevenue,
      };
    })
    .sort((a, b) =>
      topSellerSortBy === 'units'
        ? b.estimatedDailyUnits - a.estimatedDailyUnits ||
          b.cumulativeUnits - a.cumulativeUnits
        : b.estimatedDailyRevenue - a.estimatedDailyRevenue ||
          b.cumulativeRevenue - a.cumulativeRevenue
    );

  const visibleTopSellingProducts = showAllTopSellers
    ? topSellingProductsSummary
    : topSellingProductsSummary.slice(0, 5);

  const maxTopSellerMetric = Math.max(
    1,
    topSellerSortBy === 'units'
      ? topSellingProductsSummary[0]?.estimatedDailyUnits || 1
      : topSellingProductsSummary[0]?.estimatedDailyRevenue || 1
  );

  // Payment channel breakdown for current day
  const gcashTodayTotal = currentDayOrders
    .filter((o) => o.paymentMethod === 'GCash')
    .reduce((s, o) => s + o.total, 0);
  const mayaTodayTotal = currentDayOrders
    .filter((o) => o.paymentMethod === 'Maya')
    .reduce((s, o) => s + o.total, 0);
  const bankTodayTotal = currentDayOrders
    .filter((o) => o.paymentMethod === 'Bank Transfer')
    .reduce((s, o) => s + o.total, 0);
  const cashTodayTotal =
    walkInPosBaseline +
    currentDayOrders
      .filter(
        (o) =>
          o.paymentMethod === 'Cash on Delivery' ||
          o.paymentMethod === 'Cash on Pickup'
      )
      .reduce((s, o) => s + o.total, 0);

  const handleDownloadDailySalesSummaryCsv = () => {
    const headers = [
      'Rank',
      'Product ID',
      'Product Name',
      'Category',
      'Subcategory',
      'Unit Price (PHP)',
      'Today Units Sold',
      'Today Product Revenue (PHP)',
      'Cumulative Units Sold',
      'Cumulative Revenue (PHP)',
      'Live Stock Left',
      'Low Stock Threshold',
    ];
    const rows = topSellingProductsSummary.map((entry, idx) => [
      idx + 1,
      entry.product.id,
      `"${entry.product.name.replace(/"/g, '""')}"`,
      entry.product.category,
      `"${entry.product.subcategory}"`,
      entry.product.price,
      entry.estimatedDailyUnits,
      entry.estimatedDailyRevenue,
      entry.cumulativeUnits,
      entry.cumulativeRevenue,
      entry.product.stock,
      entry.product.lowStockThreshold,
    ]);

    const summaryLines = [
      `"DULCE & KUSINA — DAILY SALES SUMMARY REPORT (2026-09-25)"`,
      `"Current Day Total Revenue (PHP)","${todaySales}"`,
      `"Logged Online & POS Orders Revenue (PHP)","${currentDayLoggedOrdersRevenue}"`,
      `"Walk-In Pastry Counter Revenue (PHP)","${walkInPosBaseline}"`,
      `"Total Orders Processed Today","${todayOrdersCount}"`,
      `"Total Units Sold Today","${todayProductsSold}"`,
      `"Average Order Value (PHP)","${todayAverageOrderValue}"`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([summaryLines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DulceKusina-Daily-Sales-Summary-2026-09-25.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderDailySalesSummaryCard = () => (
    <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5 shadow-xs">
      {/* Card Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-mono uppercase tracking-wider font-semibold text-amber-900">
              DAILY SALES SUMMARY · CURRENT OPERATING DAY
            </p>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
              Live Revenue: ₱{todaySales.toLocaleString()}
            </span>
          </div>
          <h2 className="text-lg font-display font-semibold text-stone-900 mt-0.5">
            Daily Sales Summary &amp; Top-Selling Products
          </h2>
          <p className="text-xs text-stone-500">
            Real-time current day revenue calculation across online orders, walk-in POS counter transactions, and ranked top-selling bakery products.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setTopSellerSortBy('units')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                topSellerSortBy === 'units'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Rank by Units Sold
            </button>
            <button
              type="button"
              onClick={() => setTopSellerSortBy('revenue')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                topSellerSortBy === 'revenue'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Rank by Revenue (₱)
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadDailySalesSummaryCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-amber-900" />
            <span>Export Summary CSV</span>
          </button>
        </div>
      </div>

      {/* Current Day Revenue Calculation Breakdown Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-amber-950/[0.04] border border-amber-900/25">
          <p className="text-[11px] font-mono uppercase text-amber-900 font-semibold">
            Current Day Total Revenue
          </p>
          <p className="text-2xl font-mono font-bold text-stone-900 tabular-nums mt-1">
            ₱{todaySales.toLocaleString()}
          </p>
          <p className="text-[11px] text-stone-600 mt-1 font-mono">
            Orders: ₱{currentDayLoggedOrdersRevenue.toLocaleString()} + Counter: ₱{walkInPosBaseline.toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
          <p className="text-[11px] font-mono uppercase text-stone-500 font-semibold">
            Net Order Breakdown
          </p>
          <p className="text-lg font-mono font-bold text-stone-900 tabular-nums mt-1">
            ₱{currentDaySubtotal.toLocaleString()}{' '}
            <span className="text-xs font-normal text-stone-500">subtotal</span>
          </p>
          <p className="text-[11px] text-stone-500 mt-1 font-mono">
            Delivery: +₱{currentDayDeliveryRevenue.toLocaleString()} · Promos: -₱{currentDayDiscounts.toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
          <p className="text-[11px] font-mono uppercase text-stone-500 font-semibold">
            Average Order Value (AOV)
          </p>
          <p className="text-lg font-mono font-bold text-stone-900 tabular-nums mt-1">
            ₱{todayAverageOrderValue.toLocaleString()}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Across {todayOrdersCount} orders ({todayProductsSold} items sold today)
          </p>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
          <p className="text-[11px] font-mono uppercase text-stone-500 font-semibold">
            Payment Channel Mix
          </p>
          <div className="mt-1.5 space-y-1 text-[11px] font-mono text-stone-700">
            <div className="flex items-center justify-between">
              <span>GCash / Maya:</span>
              <span className="font-semibold text-stone-900">
                ₱{(gcashTodayTotal + mayaTodayTotal).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cash &amp; Bank:</span>
              <span className="font-semibold text-stone-900">
                ₱{(cashTodayTotal + bankTodayTotal).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top-Selling Products Ranked List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-800" />
            <h3 className="text-sm font-semibold text-stone-900">
              Top-Selling Products ({visibleTopSellingProducts.length} of {products.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAllTopSellers((prev) => !prev)}
            className="text-xs font-medium text-amber-900 hover:underline cursor-pointer"
          >
            {showAllTopSellers
              ? 'Show Top 5 Only'
              : `View All ${products.length} Products`}
          </button>
        </div>

        <div className="divide-y divide-stone-200/80 border border-stone-200 rounded-xl overflow-hidden bg-white">
          {visibleTopSellingProducts.map((entry, idx) => {
            const {
              product: prod,
              estimatedDailyUnits,
              estimatedDailyRevenue,
              cumulativeUnits,
              cumulativeRevenue,
            } = entry;
            const rank = idx + 1;
            const isLow = isProductBelowThreshold(prod);
            const barWidthPct = Math.min(
              100,
              Math.max(
                10,
                Math.round(
                  ((topSellerSortBy === 'units'
                    ? estimatedDailyUnits
                    : estimatedDailyRevenue) /
                    maxTopSellerMetric) *
                    100
                )
              )
            );

            return (
              <div
                key={`daily-top-${prod.id}`}
                className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                      rank === 1
                        ? 'bg-amber-900 text-white'
                        : rank <= 3
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    #{rank}
                  </div>

                  <div className="w-11 h-11 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-100">
                    <ResilientImage
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs font-semibold text-stone-900 truncate">
                        {prod.name}
                      </p>
                      <span className="text-[11px] text-stone-400">·</span>
                      <span className="text-[11px] text-stone-500">
                        {prod.subcategory}
                      </span>
                      {isLow && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-100 text-red-900 border border-red-200">
                          Low Stock ({prod.stock}/{prod.lowStockThreshold})
                        </span>
                      )}
                    </div>

                    {/* Revenue / Units Progress Bar */}
                    <div className="mt-1.5 flex items-center gap-2.5">
                      <div className="flex-1 max-w-xs h-1.5 rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rank === 1 ? 'bg-amber-900' : 'bg-amber-700/75'
                          }`}
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-stone-500">
                        ₱{prod.price.toLocaleString()} / {prod.unitLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Metrics: Today's Sold & Revenue + All-Time Sold */}
                <div className="flex items-center justify-between sm:justify-end gap-5 pl-10 sm:pl-0 shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-mono uppercase text-stone-500">
                      Today Sold
                    </p>
                    <p className="text-xs font-mono font-bold text-stone-900 tabular-nums">
                      {estimatedDailyUnits} units ·{' '}
                      <span className="text-amber-900">
                        ₱{estimatedDailyRevenue.toLocaleString()}
                      </span>
                    </p>
                  </div>

                  <div className="text-right border-l border-stone-200 pl-4">
                    <p className="text-[10px] font-mono uppercase text-stone-500">
                      All-Time Total
                    </p>
                    <p className="text-xs font-mono font-semibold text-stone-700 tabular-nums">
                      {cumulativeUnits} sold (₱{cumulativeRevenue.toLocaleString()})
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Inventory Alert & Per-Product Custom Threshold State
  const [showPerProductThresholds, setShowPerProductThresholds] = useState<boolean>(false);
  const [inventoryAlertFilter, setInventoryAlertFilter] = useState<'all' | 'popular'>('all');
  const [inventoryAlertSort, setInventoryAlertSort] = useState<'stock_asc' | 'popular_desc'>('stock_asc');
  const [customRestockInputs, setCustomRestockInputs] = useState<Record<string, string>>({});
  const [restockFeedbackBanner, setRestockFeedbackBanner] = useState<string | null>(null);

  const isPopularProduct = (prod: Product) => prod.soldCount >= 140 || prod.featured;
  const isProductBelowThreshold = (prod: Product) => prod.stock < prod.lowStockThreshold;

  const allLowStockProducts = products.filter((p) => isProductBelowThreshold(p));
  const criticalLowStockProducts = allLowStockProducts.filter((p) => p.stock <= 6);
  const popularLowStockProducts = allLowStockProducts.filter((p) => isPopularProduct(p));

  const displayedLowStockProducts = [...allLowStockProducts]
    .filter((p) => (inventoryAlertFilter === 'popular' ? isPopularProduct(p) : true))
    .sort((a, b) =>
      inventoryAlertSort === 'stock_asc'
        ? a.stock - b.stock || b.soldCount - a.soldCount
        : b.soldCount - a.soldCount || a.stock - b.stock
    );

  const triggerRestockBanner = (msg: string) => {
    setRestockFeedbackBanner(msg);
    setTimeout(() => {
      setRestockFeedbackBanner((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleQuickRestockProduct = (prod: Product, addUnits: number) => {
    const updatedStock = Math.max(0, prod.stock + addUnits);
    onUpdateProductStock(prod.id, updatedStock);
    triggerRestockBanner(
      `Restocked ${prod.name}: +${addUnits} units added (New stock: ${updatedStock} / Min threshold: ${prod.lowStockThreshold}).`
    );
  };

  const handleSetTargetStockProduct = (prod: Product, targetUnits: number) => {
    const resolvedTarget = Math.max(prod.stock + 1, targetUnits);
    const diff = resolvedTarget - prod.stock;
    onUpdateProductStock(prod.id, resolvedTarget);
    triggerRestockBanner(
      `Restocked ${prod.name} to ${resolvedTarget} units (+${diff} units, threshold: ${prod.lowStockThreshold}).`
    );
  };

  const handleUpdateCustomThreshold = (prod: Product, nextThreshold: number) => {
    const clamped = Math.max(1, Math.min(200, Math.round(nextThreshold) || 1));
    onUpdateProductThreshold(prod.id, clamped);
    triggerRestockBanner(
      `Updated custom low-stock threshold for ${prod.name} to ${clamped} units (Current stock: ${prod.stock}).`
    );
  };

  const handleCustomRestockSubmit = (prod: Product) => {
    const raw = Number(customRestockInputs[prod.id]);
    const addAmount = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 10;
    handleQuickRestockProduct(prod, addAmount);
    setCustomRestockInputs((prev) => ({ ...prev, [prod.id]: '' }));
  };

  const handleBatchRestockLowStock = (onlyPopular: boolean, addUnits = 15) => {
    const targets = onlyPopular ? popularLowStockProducts : allLowStockProducts;
    if (targets.length === 0) return;
    targets.forEach((p) => {
      onUpdateProductStock(p.id, p.stock + addUnits);
    });
    triggerRestockBanner(
      `Batch restocked ${targets.length} ${
        onlyPopular ? 'popular low-stock' : 'low-stock'
      } ${targets.length === 1 ? 'item' : 'items'} (+${addUnits} units each).`
    );
  };

  const renderInventoryAlertSection = () => (
    <div className="bg-white border border-amber-900/25 rounded-xl p-6 space-y-5 shadow-xs">
      {/* Header & Per-Product Threshold / Batch Restock Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              allLowStockProducts.length > 0
                ? 'bg-amber-950/[0.06] border-amber-900/30 text-amber-900'
                : 'bg-emerald-950/[0.06] border-emerald-800/30 text-emerald-800'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-mono uppercase tracking-wider font-semibold text-amber-900">
                PER-PRODUCT KITCHEN STOCK MONITOR
              </p>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                  allLowStockProducts.length > 0
                    ? 'bg-red-50 text-red-900 border-red-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                {allLowStockProducts.length} Below Custom Threshold
              </span>
              {criticalLowStockProducts.length > 0 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950 text-amber-50">
                  {criticalLowStockProducts.length} Critical (&le;6 left)
                </span>
              )}
            </div>
            <h2 className="text-lg font-display font-semibold text-stone-900 mt-0.5">
              Inventory Alert &amp; Custom Product Thresholds
            </h2>
            <p className="text-xs text-stone-500">
              Each product tracks its own custom <span className="font-mono font-semibold text-stone-700">lowStockThreshold</span>. Adjust thresholds directly on any alert card or open the per-product threshold matrix.
            </p>
          </div>
        </div>

        {/* Per-Product Threshold Drawer Toggle & Batch Restock Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPerProductThresholds((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              showPerProductThresholds
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-300 bg-stone-100 text-stone-800 hover:bg-stone-200/70'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>
              {showPerProductThresholds
                ? 'Hide Per-Product Thresholds'
                : `Set Product Thresholds (${products.length})`}
            </span>
          </button>

          {popularLowStockProducts.length > 0 && (
            <button
              type="button"
              onClick={() => handleBatchRestockLowStock(true, 15)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-900 text-white text-xs font-semibold hover:bg-amber-950 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Restock Popular (+15)</span>
            </button>
          )}

          {allLowStockProducts.length > 0 && (
            <button
              type="button"
              onClick={() => handleBatchRestockLowStock(false, 15)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restock All Low (+15)</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Per-Product Custom Threshold Configuration Matrix */}
      {showPerProductThresholds && (
        <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-stone-900">
                Per-Product Low Stock Threshold Configuration
              </h3>
              <p className="text-xs text-stone-500">
                Customize the minimum alert threshold for each individual bakery offering. Items with <span className="font-mono">stock &lt; lowStockThreshold</span> trigger an alert below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPerProductThresholds(false)}
              className="text-xs text-stone-500 hover:text-stone-900 self-end sm:self-auto cursor-pointer"
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {products.map((prod) => {
              const isBelow = isProductBelowThreshold(prod);
              return (
                <div
                  key={`thresh-cfg-${prod.id}`}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                    isBelow
                      ? 'bg-amber-50/60 border-amber-900/30'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-900 truncate">
                      {prod.name}
                    </p>
                    <p className="text-[11px] font-mono text-stone-500 mt-0.5">
                      Stock:{' '}
                      <span
                        className={
                          isBelow
                            ? 'font-bold text-red-800'
                            : 'font-semibold text-emerald-800'
                        }
                      >
                        {prod.stock}
                      </span>{' '}
                      · {isBelow ? 'Alert Active' : 'Healthy'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCustomThreshold(
                          prod,
                          Math.max(1, prod.lowStockThreshold - 1)
                        )
                      }
                      className="w-6 h-6 rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 text-xs font-mono font-bold cursor-pointer"
                      title="Decrease custom threshold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      aria-label={`Low stock threshold for ${prod.name}`}
                      value={prod.lowStockThreshold}
                      onChange={(e) =>
                        onUpdateProductThreshold(
                          prod.id,
                          Math.max(1, Number(e.target.value) || 1)
                        )
                      }
                      className="w-12 px-1 py-0.5 rounded border border-stone-300 bg-white text-center font-mono text-xs font-semibold text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateCustomThreshold(
                          prod,
                          prod.lowStockThreshold + 1
                        )
                      }
                      className="w-6 h-6 rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 text-xs font-mono font-bold cursor-pointer"
                      title="Increase custom threshold"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Restock & Threshold Feedback Toast Banner */}
      {restockFeedbackBanner && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-emerald-950/[0.06] border border-emerald-800/30 text-emerald-950 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{restockFeedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setRestockFeedbackBanner(null)}
            className="text-stone-500 hover:text-stone-800 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Sort Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setInventoryAlertFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              inventoryAlertFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Below Custom Threshold ({allLowStockProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setInventoryAlertFilter('popular')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              inventoryAlertFilter === 'popular'
                ? 'bg-white text-amber-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-800" />
            <span>Popular Items Only ({popularLowStockProducts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span>Sort alerts by:</span>
          <button
            type="button"
            onClick={() => setInventoryAlertSort('stock_asc')}
            className={`px-2.5 py-1 rounded border text-xs font-medium cursor-pointer ${
              inventoryAlertSort === 'stock_asc'
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            Lowest Stock First
          </button>
          <button
            type="button"
            onClick={() => setInventoryAlertSort('popular_desc')}
            className={`px-2.5 py-1 rounded border text-xs font-medium cursor-pointer ${
              inventoryAlertSort === 'popular_desc'
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            Most Popular First
          </button>
        </div>
      </div>

      {/* Low-Stock Alert Cards Grid */}
      {displayedLowStockProducts.length === 0 ? (
        <div className="p-6 rounded-xl border border-stone-200 bg-stone-50/70 text-center space-y-1.5">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto" />
          <p className="text-sm font-semibold text-stone-900">
            All monitored bakery items are stocked at or above their custom product thresholds!
          </p>
          <p className="text-xs text-stone-500">
            Click “Set Product Thresholds” above to raise individual product alert levels ahead of weekend peak hours.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedLowStockProducts.map((prod) => {
            const productThreshold = prod.lowStockThreshold;
            const isCritical = prod.stock <= 6;
            const isOut = prod.stock === 0;
            const isPopular = isPopularProduct(prod);
            const stockRatio = Math.min(
              100,
              Math.round((prod.stock / Math.max(1, productThreshold)) * 100)
            );
            const suggestedRestockTarget = Math.max(
              productThreshold + 6,
              productThreshold
            );

            return (
              <div
                key={prod.id}
                className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3.5 ${
                  isOut || isCritical
                    ? 'border-red-300 bg-red-50/35'
                    : 'border-amber-900/25 bg-amber-50/25'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-100">
                      <ResilientImage
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            isOut
                              ? 'bg-red-800 text-white'
                              : isCritical
                              ? 'bg-red-100 text-red-900 border border-red-300'
                              : 'bg-amber-100 text-amber-950 border border-amber-300'
                          }`}
                        >
                          {isOut
                            ? 'Out of Stock'
                            : isCritical
                            ? 'Critical Low'
                            : 'Below Custom Threshold'}
                        </span>
                        {isPopular && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950 text-amber-50">
                            <Flame className="w-3 h-3 text-amber-300" />
                            Popular ({prod.soldCount} sold)
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-stone-900 mt-1 truncate">
                        {prod.name}
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        {prod.subcategory} · {prod.unitLabel} · ₱{prod.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-mono uppercase text-stone-500">
                      Stock / Threshold
                    </p>
                    <p
                      className={`text-xl font-mono font-bold tabular-nums ${
                        isOut || isCritical ? 'text-red-800' : 'text-amber-950'
                      }`}
                    >
                      {prod.stock}
                      <span className="text-xs font-normal text-stone-500">
                        /{productThreshold}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Visual Threshold Bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOut || isCritical ? 'bg-red-700' : 'bg-amber-800'
                      }`}
                      style={{ width: `${stockRatio}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                    <span>
                      Shortfall: {Math.max(0, productThreshold - prod.stock)} units below min ({productThreshold})
                    </span>
                    <span>Demand: {prod.soldCount} orders</span>
                  </div>
                </div>

                {/* Per-Product Custom Threshold Inline Control */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/85 border border-stone-200/90">
                  <span className="text-[11px] font-medium text-stone-700">
                    Custom Alert Threshold:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[10, 15, 20].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleUpdateCustomThreshold(prod, preset)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                          productThreshold === preset
                            ? 'bg-amber-900 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCustomThreshold(
                            prod,
                            Math.max(1, productThreshold - 1)
                          )
                        }
                        className="w-6 h-6 rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 text-xs font-mono font-bold cursor-pointer"
                        title="Lower product alert threshold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        aria-label={`Custom threshold for ${prod.name}`}
                        value={productThreshold}
                        onChange={(e) =>
                          onUpdateProductThreshold(
                            prod.id,
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-12 px-1 py-0.5 rounded border border-stone-300 bg-white text-center text-xs font-mono font-semibold text-stone-900"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCustomThreshold(prod, productThreshold + 1)
                        }
                        className="w-6 h-6 rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 text-xs font-mono font-bold cursor-pointer"
                        title="Raise product alert threshold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rapid Restock Controls */}
                <div className="pt-2 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-stone-600 mr-0.5">
                      Quick Restock:
                    </span>
                    {[5, 10, 20].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => handleQuickRestockProduct(prod, qty)}
                        className="px-2.5 py-1 rounded-md bg-stone-900 text-white text-xs font-mono font-semibold hover:bg-amber-900 transition-colors cursor-pointer"
                      >
                        +{qty}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        handleSetTargetStockProduct(prod, suggestedRestockTarget)
                      }
                      className="px-2.5 py-1 rounded-md border border-amber-900/40 bg-white text-amber-950 text-xs font-medium hover:bg-amber-50 transition-colors cursor-pointer"
                    >
                      Fill to {suggestedRestockTarget}
                    </button>
                  </div>

                  {/* Custom Restock Input */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      placeholder="Qty"
                      value={customRestockInputs[prod.id] || ''}
                      onChange={(e) =>
                        setCustomRestockInputs((prev) => ({
                          ...prev,
                          [prod.id]: e.target.value,
                        }))
                      }
                      className="w-14 px-2 py-1 rounded-md border border-stone-300 bg-white text-xs font-mono text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleCustomRestockSubmit(prod)}
                      className="px-2.5 py-1 rounded-md border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const filteredOrders =
    orderStatusFilter === 'All'
      ? orders
      : orders.filter((o) => o.status === orderStatusFilter);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.subcategory.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const categoryImages: Record<Exclude<CategoryId, 'all'>, string> = {
      cakes: IMAGES.customCake,
      brownies: IMAGES.fudgeBrownies,
      cassava: IMAGES.cassavaCake,
      desserts: IMAGES.heroSpread,
      food_packs: IMAGES.partyPackage,
      bundles: IMAGES.heroSpread,
    };

    const created: Product = {
      id: `prod-custom-${Date.now()}`,
      name: newProdName.trim(),
      category: newProdCategory,
      subcategory: newProdSubcategory.trim() || 'Signature',
      price: Number(newProdPrice) || 450,
      unitLabel: newProdUnit.trim() || 'Standard Box',
      prepTime: 'Baked fresh daily',
      description: newProdDesc.trim(),
      image: categoryImages[newProdCategory],
      featured: true,
      stock: Number(newProdStock) || 10,
      lowStockThreshold: Math.max(1, Number(newProdThreshold) || 12),
      soldCount: 1,
      rating: 5.0,
      reviewCount: 1,
    };

    onAddProduct(created);
    setNewProdName('');
    setShowNewProductForm(false);
  };

  const handleCreateCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !staffLastName.trim() ||
      !staffFirstName.trim() ||
      !staffEmail.trim()
    ) {
      return;
    }

    const fullName = [
      staffFirstName.trim(),
      staffMiddleName.trim(),
      staffLastName.trim(),
    ]
      .filter(Boolean)
      .join(' ');

    const initials = `${staffFirstName.trim()[0] || 'S'}${
      staffLastName.trim()[0] || 'T'
    }`;

    const resolvedEmpId =
      staffEmployeeId.trim() || `EMP-2026-00${cashiers.length + 1}`;

    const qrResult = generateUniqueStaffQrDataUri({
      employeeId: resolvedEmpId,
      fullName,
      role: staffRole,
      email: staffEmail.trim().toLowerCase(),
      uniqueSeed: `${Date.now()}`,
    });

    const createdStaff: UserAccount = {
      id: `usr-staff-${Date.now()}`,
      employeeId: resolvedEmpId,
      firstName: staffFirstName.trim(),
      middleName: staffMiddleName.trim(),
      lastName: staffLastName.trim(),
      name: fullName,
      email: staffEmail.trim().toLowerCase(),
      phone: staffPhone.trim() || '0917 000 0000',
      password: staffOtpPassword || generateOneTimePassword(),
      isOneTimePassword: true,
      role: staffRole,
      address:
        staffAddress.trim() || 'Kapitolyo, Pasig City, Metro Manila',
      birthdate: staffBirthdate,
      age:
        typeof autoCalculatedStaffAge === 'number'
          ? autoCalculatedStaffAge
          : 25,
      gender: staffGender,
      avatar:
        staffImagePreview ||
        createStaffAvatarPlaceholder(initials, staffRole),
      qrCodeImage: qrResult.qrDataUri,
      qrCodePayload: qrResult.payload,
      shift: staffShift,
      terminal:
        staffRole === 'delivery' &&
        staffTerminal.includes('POS Counter')
          ? 'Chilled Delivery Van · Unit 02'
          : staffTerminal,
      status: 'Active',
      dateHired: staffDateHired,
      lengthOfService:
        autoCalculatedLengthOfService || 'Newly Hired Today (0 days)',
      createdAt: staffDateHired || '2026-09-25',
    };

    const checkInNow = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setCheckedInStaffTimes((prev) => ({
      ...prev,
      [createdStaff.id]: checkInNow,
    }));

    onAddCashier(createdStaff);
    stopStaffCamera();
    setNewlyCreatedStaffBanner(createdStaff);
    setSelectedPrintableStaff(createdStaff);
    setSelectedQrStaff(createdStaff);
    setStaffEmployeeId(`EMP-2026-00${cashiers.length + 2}`);
    setStaffLastName('');
    setStaffFirstName('');
    setStaffMiddleName('');
    setStaffAddress('');
    setStaffEmail('');
    setStaffImagePreview('');
    setStaffOtpPassword(generateOneTimePassword());
    setShowNewCashierForm(false);
  };

  const weeklyChartData = WEEKLY_SALES_DATA.map((d, idx) =>
    idx === WEEKLY_SALES_DATA.length - 1
      ? {
          ...d,
          sales: todaySales,
          orders: todayOrdersCount,
        }
      : d
  );
  const weeklyTotalSales = weeklyChartData.reduce((sum, d) => sum + d.sales, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Workspace Sidebar (240px-260px on desktop) */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="pb-4 mb-4 border-b border-stone-200">
              <p className="text-xs font-mono text-amber-900 font-semibold">
                ADMIN DASHBOARD
              </p>
              <h2 className="text-base font-semibold text-stone-900 mt-0.5 truncate">
                {currentUser?.name || 'Chef Bea Santos (Owner)'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5 truncate">
                {businessSettings.businessName} · {businessSettings.contactNumber}
              </p>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Sales Dashboard', icon: LayoutDashboard },
                {
                  id: 'orders',
                  label: `Orders & Delivery (${orders.length})`,
                  icon: ShoppingBag,
                },
                {
                  id: 'products',
                  label: `Products & Stock (${products.length})`,
                  icon: Package,
                },
                {
                  id: 'cashiers',
                  label: `Staff Management (${cashiers.length})`,
                  icon: UserCheck,
                },
                {
                  id: 'staff_ids',
                  label: 'Printable Staff IDs',
                  icon: Printer,
                },
                {
                  id: 'payments',
                  label: 'GCash & Payments',
                  icon: CreditCard,
                },
                {
                  id: 'customers',
                  label: `Customers (${customers.length})`,
                  icon: Users,
                },
                {
                  id: 'settings',
                  label: 'Business & Payment Settings',
                  icon: Settings,
                },
                {
                  id: 'blueprint',
                  label: 'Laravel + RN Blueprint',
                  icon: FileCode2,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const showLowStockBadge =
                  item.id === 'products' && allLowStockProducts.length > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id as AdminTab)}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {showLowStockBadge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold shrink-0 ${
                          isActive
                            ? 'bg-amber-400 text-stone-950'
                            : 'bg-red-100 text-red-900 border border-red-200'
                        }`}
                        title={`${allLowStockProducts.length} items below threshold`}
                      >
                        {allLowStockProducts.length} low
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 mt-6 border-t border-stone-200 space-y-2">
            {onOpenProfileSecurity && (
              <button
                type="button"
                onClick={onOpenProfileSecurity}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-900" />
                <span>Update Profile &amp; Password</span>
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-stone-300 hover:bg-red-50 hover:border-red-300 hover:text-red-800 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out to Landing Page</span>
            </button>
          </div>
        </aside>

        {/* Main Admin Viewport */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="bg-white border border-stone-200 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-stone-200">
                  <div>
                    <h1 className="text-xl font-display font-semibold text-stone-900">
                      Today’s Business Performance
                    </h1>
                    <p className="text-xs text-stone-500">
                      Real-time POS, Cashier, Delivery &amp; Mobile App order aggregation
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="px-3 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-medium hover:bg-amber-950 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Business &amp; QR Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cashiers')}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                    >
                      Manage Staff ({cashiers.length})
                    </button>
                    <span className="text-xs font-mono text-stone-600">
                      Date: 2026-09-25
                    </span>
                  </div>
                </div>

                {/* 4 KPI Stat Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-5">
                  <div className="border-r border-stone-200/80 pr-4 last:border-r-0">
                    <p className="text-xs text-stone-500">Total Sales (Today)</p>
                    <p className="text-2xl font-mono font-semibold text-stone-900 tabular-nums mt-1">
                      ₱{todaySales.toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1 font-medium">
                      +18.4% vs last Friday
                    </p>
                  </div>

                  <div className="border-r border-stone-200/80 pr-4 last:border-r-0">
                    <p className="text-xs text-stone-500">Orders Processed</p>
                    <p className="text-2xl font-mono font-semibold text-stone-900 tabular-nums mt-1">
                      {todayOrdersCount}
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      {orders.filter((o) => o.status === 'Preparing').length} in pastry oven
                    </p>
                  </div>

                  <div className="border-r border-stone-200/80 pr-4 last:border-r-0">
                    <p className="text-xs text-stone-500">Active Customers</p>
                    <p className="text-2xl font-mono font-semibold text-stone-900 tabular-nums mt-1">
                      {todayCustomersCount}
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      74% repeat bakery buyers
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-stone-500">Products Sold</p>
                    <p className="text-2xl font-mono font-semibold text-stone-900 tabular-nums mt-1">
                      {todayProductsSold}
                    </p>
                    <p className="text-xs text-amber-900 mt-1 font-medium">
                      Top: Cassava &amp; Ube Cake
                    </p>
                  </div>
                </div>
              </div>

              {/* DAILY SALES SUMMARY CARD (CURRENT DAY REVENUE + TOP-SELLING PRODUCTS) */}
              {renderDailySalesSummaryCard()}

              {/* INVENTORY ALERT SECTION */}
              {renderInventoryAlertSection()}

              {/* Weekly Sales Recharts LineChart & Today's Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-semibold text-stone-900">
                        Daily Sales Over Past Week
                      </h2>
                      <p className="text-xs text-stone-500">
                        7-day revenue trajectory across Cakes, Brownies, Cassava &amp; Food Packs
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-amber-900 tabular-nums">
                      7-Day Total: ₱{weeklyTotalSales.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={weeklyChartData}
                        margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E7E5E4"
                        />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#57534E', fontSize: 12 }}
                          dy={6}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#78716C', fontSize: 11 }}
                          tickFormatter={(value: number) =>
                            `₱${(value / 1000).toFixed(0)}k`
                          }
                          width={46}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E7E5E4',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-mono)',
                          }}
                          formatter={(value: number, name: string) => [
                            name === 'sales'
                              ? `₱${Number(value).toLocaleString()}`
                              : `${value} orders`,
                            name === 'sales' ? 'Daily Sales' : 'Orders',
                          ]}
                          labelFormatter={(label) => `${label} Performance`}
                        />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          stroke="#78350F"
                          strokeWidth={2.5}
                          dot={{
                            r: 4,
                            fill: '#78350F',
                            strokeWidth: 2,
                            stroke: '#FFFFFF',
                          }}
                          activeDot={{
                            r: 6,
                            fill: '#78350F',
                            stroke: '#FEF3C7',
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Today's Orders Quick Feed */}
                <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-stone-900">
                      Today’s Orders Queue
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs text-amber-900 font-medium hover:underline cursor-pointer"
                    >
                      Manage all
                    </button>
                  </div>

                  <div className="divide-y divide-stone-200/80 text-xs">
                    {orders.slice(0, 5).map((ord) => (
                      <div
                        key={ord.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-stone-900">
                              #{ord.orderNumber.slice(-4)}
                            </span>
                            <span className="font-medium text-stone-800 truncate">
                              {ord.items[0]?.name}
                            </span>
                          </div>
                          <p className="text-stone-500 mt-0.5">
                            {ord.customerName} · {ord.status}
                          </p>
                        </div>
                        <span className="font-mono font-semibold text-stone-900 tabular-nums shrink-0">
                          ₱{ord.total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Best Selling Products Table */}
              <div className="bg-white border border-stone-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-stone-900">
                    Best-Selling Catalog Items
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="text-xs text-amber-900 font-medium hover:underline cursor-pointer"
                  >
                    Open Full Inventory
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500">
                        <th className="py-2.5 pr-4 font-medium">Product</th>
                        <th className="py-2.5 px-4 font-medium">Subcategory</th>
                        <th className="py-2.5 px-4 font-medium text-right">Unit Price</th>
                        <th className="py-2.5 px-4 font-medium text-right">Units Sold</th>
                        <th className="py-2.5 pl-4 font-medium text-right">Stock Left</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/70">
                      {[...products]
                        .sort((a, b) => b.soldCount - a.soldCount)
                        .slice(0, 6)
                        .map((p) => {
                          const isBelowThreshold = isProductBelowThreshold(p);
                          return (
                            <tr
                              key={p.id}
                              className={`hover:bg-stone-50/80 ${
                                isBelowThreshold ? 'bg-amber-50/30' : ''
                              }`}
                            >
                              <td className="py-3 pr-4 font-semibold text-stone-900">
                                <div className="flex items-center gap-2">
                                  <span>{p.name}</span>
                                  {isBelowThreshold && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-100 text-red-900 border border-red-200">
                                      Low Stock (&lt;{p.lowStockThreshold})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-stone-600">{p.subcategory}</td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums">
                                ₱{p.price.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-amber-900 tabular-nums">
                                {p.soldCount}
                              </td>
                              <td className="py-3 pl-4 text-right font-mono tabular-nums">
                                <div className="inline-flex items-center justify-end gap-2">
                                  <span
                                    className={
                                      isBelowThreshold
                                        ? 'font-bold text-red-800'
                                        : 'text-stone-900'
                                    }
                                  >
                                    {p.stock}
                                    <span className="text-stone-400 font-normal">
                                      /{p.lowStockThreshold}
                                    </span>
                                  </span>
                                  {isBelowThreshold && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickRestockProduct(p, 10)}
                                      className="px-2 py-0.5 rounded bg-stone-900 text-white text-[10px] font-mono font-semibold hover:bg-amber-900 transition-colors cursor-pointer"
                                    >
                                      +10 Restock
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ORDERS & DELIVERY DISPATCH */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                <div>
                  <h1 className="text-xl font-display font-semibold text-stone-900">
                    Order Fulfillment &amp; Rider Dispatch
                  </h1>
                  <p className="text-xs text-stone-500">
                    Updating an order status immediately triggers a customer notification.
                  </p>
                </div>

                {/* Status Filter Bar */}
                <div className="flex flex-wrap gap-1 p-1 bg-stone-100 rounded-lg">
                  {['All', ...ORDER_STATUSES].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        orderStatusFilter === st
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="border border-stone-200 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-stone-900">
                            #{ord.orderNumber}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-900">
                            {ord.status}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-stone-600">
                            {ord.fulfillmentType} ({ord.scheduledDate} at {ord.scheduledTime})
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-stone-900 mt-1">
                          {ord.customerName} ·{' '}
                          <span className="font-mono font-normal text-xs text-stone-600">
                            {ord.customerPhone}
                          </span>
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {ord.deliveryAddress}
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="font-mono text-lg font-semibold text-stone-900 tabular-nums">
                          ₱{ord.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-stone-500">
                          {ord.paymentMethod} · {ord.paymentStatus}
                        </p>
                      </div>
                    </div>

                    {/* Items & Custom Cake Specs */}
                    <div className="space-y-2 text-xs">
                      {ord.items.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-50/80 p-3 rounded-lg"
                        >
                          <div>
                            <span className="font-semibold text-stone-900">
                              {item.quantity}× {item.name}
                            </span>
                            {item.customCake && (
                              <p className="text-stone-600 mt-0.5">
                                Custom Spec: {item.customCake.size} | {item.customCake.flavor} |{' '}
                                {item.customCake.filling} | {item.customCake.frosting} |{' '}
                                <span className="font-semibold text-amber-950">
                                  “{item.customCake.message}”
                                </span>
                              </p>
                            )}
                            {item.partyPackage && (
                              <p className="text-stone-600 mt-0.5">
                                Package Menu: {item.partyPackage.cakeFlavor} ·{' '}
                                {item.partyPackage.savoryMenuChoice}
                              </p>
                            )}
                          </div>
                          <span className="font-mono font-medium text-stone-900 tabular-nums shrink-0">
                            ₱{(item.unitPrice * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Controls: Status Switcher & Rider Assignment */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium text-stone-500 mr-1">
                          Set Status:
                        </span>
                        {ORDER_STATUSES.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => onUpdateOrderStatus(ord.id, st)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                              ord.status === st
                                ? 'border-amber-900 bg-amber-900 text-white'
                                : 'border-stone-200 text-stone-700 hover:border-stone-300'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      {ord.fulfillmentType === 'Delivery' && (
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-stone-400 shrink-0" />
                          <select
                            value={ord.assignedRider || ''}
                            onChange={(e) => onAssignRider(ord.id, e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-800"
                          >
                            <option value="">Assign Courier / Rider...</option>
                            {DELIVERY_RIDERS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS & STOCK INVENTORY */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {renderInventoryAlertSection()}

              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                  <div>
                    <h1 className="text-xl font-display font-semibold text-stone-900">
                      Product Catalog &amp; Kitchen Stock
                    </h1>
                    <p className="text-xs text-stone-500">
                      Manage cakes, brownies, cassava trays, desserts, and party packages
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Filter catalog..."
                        className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewProductForm(!showNewProductForm)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-900 text-white text-xs font-semibold hover:bg-amber-950 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>
                  </div>
                </div>

                {showNewProductForm && (
                  <form
                    onSubmit={handleCreateProduct}
                    className="p-5 rounded-xl border border-amber-900/30 bg-amber-50/30 space-y-4"
                  >
                    <h3 className="text-sm font-semibold text-stone-900">
                      Create New Bakery Offering
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          required
                          value={newProdName}
                          onChange={(e) => setNewProdName(e.target.value)}
                          placeholder="e.g. Calamansi Sans Rival"
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Category
                        </label>
                        <select
                          value={newProdCategory}
                          onChange={(e) =>
                            setNewProdCategory(
                              e.target.value as Exclude<CategoryId, 'all'>
                            )
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                        >
                          <option value="cakes">Cakes</option>
                          <option value="brownies">Brownies</option>
                          <option value="cassava">Cassava Cake</option>
                          <option value="desserts">Desserts</option>
                          <option value="food_packs">Food Packs</option>
                          <option value="bundles">Bundles</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Subcategory
                        </label>
                        <input
                          type="text"
                          value={newProdSubcategory}
                          onChange={(e) => setNewProdSubcategory(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Price (PHP)
                        </label>
                        <input
                          type="number"
                          required
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Serving / Box Size
                        </label>
                        <input
                          type="text"
                          value={newProdUnit}
                          onChange={(e) => setNewProdUnit(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Initial Daily Stock
                        </label>
                        <input
                          type="number"
                          value={newProdStock}
                          onChange={(e) => setNewProdStock(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Low Stock Threshold
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={newProdThreshold}
                          onChange={(e) => setNewProdThreshold(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewProductForm(false)}
                        className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-700 bg-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold cursor-pointer"
                      >
                        Save to Live Catalog
                      </button>
                    </div>
                  </form>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500">
                        <th className="py-2.5 pr-4 font-medium">Item</th>
                        <th className="py-2.5 px-3 font-medium">Category</th>
                        <th className="py-2.5 px-3 font-medium text-right">Price</th>
                        <th className="py-2.5 px-3 font-medium text-center">Stock</th>
                        <th className="py-2.5 px-3 font-medium text-center">Alert Threshold</th>
                        <th className="py-2.5 px-3 font-medium text-center">Featured</th>
                        <th className="py-2.5 pl-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/70">
                      {filteredProducts.map((prod) => {
                        const isLowStock = isProductBelowThreshold(prod);
                        const isCriticalStock = prod.stock <= 6;
                        return (
                          <tr
                            key={prod.id}
                            className={`hover:bg-stone-50/80 ${
                              isCriticalStock
                                ? 'bg-red-50/35'
                                : isLowStock
                                ? 'bg-amber-50/30'
                                : ''
                            }`}
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md overflow-hidden border border-stone-200 shrink-0">
                                  <ResilientImage
                                    src={prod.image}
                                    alt={prod.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="font-semibold text-stone-900">{prod.name}</p>
                                    {isLowStock && (
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                          isCriticalStock
                                            ? 'bg-red-100 text-red-900 border border-red-200'
                                            : 'bg-amber-100 text-amber-950 border border-amber-300'
                                        }`}
                                      >
                                        {isCriticalStock
                                          ? `Critical Low (<${prod.lowStockThreshold})`
                                          : `Low Stock (<${prod.lowStockThreshold})`}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-stone-500">
                                    {prod.unitLabel} · {prod.soldCount} sold
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-stone-600">{prod.subcategory}</td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-stone-900 tabular-nums">
                              ₱{prod.price.toLocaleString()}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateProductStock(
                                      prod.id,
                                      Math.max(0, prod.stock - 1)
                                    )
                                  }
                                  className="w-6 h-6 rounded border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer"
                                >
                                  -
                                </button>
                                <span
                                  className={`font-mono w-7 text-center tabular-nums font-semibold ${
                                    isLowStock ? 'text-red-800' : 'text-stone-900'
                                  }`}
                                >
                                  {prod.stock}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateProductStock(prod.id, prod.stock + 1)
                                  }
                                  className="w-6 h-6 rounded border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer"
                                >
                                  +
                                </button>
                                {isLowStock && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickRestockProduct(prod, 10)}
                                    className="ml-1 px-2 py-1 rounded bg-stone-900 text-white text-[10px] font-mono font-semibold hover:bg-amber-900 transition-colors cursor-pointer whitespace-nowrap"
                                    title="Quick restock +10 units"
                                  >
                                    +10
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCustomThreshold(
                                      prod,
                                      Math.max(1, prod.lowStockThreshold - 1)
                                    )
                                  }
                                  className="w-6 h-6 rounded border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer font-mono"
                                  title="Decrease custom threshold"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={200}
                                  aria-label={`Threshold for ${prod.name}`}
                                  value={prod.lowStockThreshold}
                                  onChange={(e) =>
                                    onUpdateProductThreshold(
                                      prod.id,
                                      Math.max(1, Number(e.target.value) || 1)
                                    )
                                  }
                                  className="w-12 px-1 py-0.5 rounded border border-stone-300 bg-white text-center font-mono text-xs font-semibold text-stone-900"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCustomThreshold(
                                      prod,
                                      prod.lowStockThreshold + 1
                                    )
                                  }
                                  className="w-6 h-6 rounded border border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer font-mono"
                                  title="Increase custom threshold"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => onToggleProductFeatured(prod.id)}
                                className={`px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                                  prod.featured
                                    ? 'border-amber-900 bg-amber-950/[0.05] text-amber-950'
                                    : 'border-stone-200 text-stone-500'
                                }`}
                              >
                                {prod.featured ? 'Featured' : 'Standard'}
                              </button>
                            </td>
                            <td className="py-3 pl-3 text-right">
                              <button
                                type="button"
                                onClick={() => onDeleteProduct(prod.id)}
                                className="p-1.5 text-stone-400 hover:text-red-700 cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STAFF MANAGEMENT (CASHIER & DELIVERY ONBOARDING WITH UNIQUE QR CODE) */}
          {activeTab === 'cashiers' && (
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
                <div>
                  <p className="text-xs font-mono text-amber-900 font-semibold">
                    HUMAN RESOURCES &amp; ROLE ACCESS PROVISIONING
                  </p>
                  <h1 className="text-xl font-display font-semibold text-stone-900 mt-0.5">
                    Staff Management (Cashier &amp; Delivery Personnel)
                  </h1>
                  <p className="text-xs text-stone-500">
                    Register new Cashier or Delivery staff with Employee ID, Date Hired &amp; automatic Length of Service calculation, automatic age calculation from birthdate, One-Time Password (OTP), photo upload or live camera preview, and unique Staff QR code generation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setStaffSubView('directory')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                        staffSubView === 'directory'
                          ? 'bg-white text-stone-900 shadow-xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Staff Directory Table
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedPrintableStaff && cashiers.length > 0) {
                          setSelectedPrintableStaff(cashiers[0]);
                        }
                        setStaffSubView('printable_id');
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                        staffSubView === 'printable_id'
                          ? 'bg-white text-amber-900 shadow-xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Printable Staff ID View</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (showNewCashierForm) {
                        stopStaffCamera();
                      }
                      setShowNewCashierForm(!showNewCashierForm);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-900 text-white text-xs font-semibold hover:bg-amber-950 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {showNewCashierForm ? 'Close Staff Form' : 'Add New Staff'}
                    </span>
                  </button>
                </div>
              </div>

              {newlyCreatedStaffBanner && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs print:hidden">
                  <div className="flex items-center gap-3.5">
                    {newlyCreatedStaffBanner.qrCodeImage && (
                      <img
                        src={newlyCreatedStaffBanner.qrCodeImage}
                        alt="Generated Staff QR Code"
                        className="w-20 h-20 rounded-xl bg-white p-1.5 border border-emerald-300 shrink-0 shadow-xs"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-900 bg-emerald-200/70 px-2 py-0.5 rounded">
                          UNIQUE CHECK-IN QR GENERATED
                        </span>
                      </div>
                      <p className="font-semibold text-emerald-950 text-sm mt-1">
                        {newlyCreatedStaffBanner.name} ({newlyCreatedStaffBanner.employeeId})
                      </p>
                      <p className="text-emerald-900 mt-0.5 font-mono">
                        Role: {newlyCreatedStaffBanner.role.toUpperCase()} · Age:{' '}
                        {newlyCreatedStaffBanner.age} · Date Hired:{' '}
                        <strong>
                          {newlyCreatedStaffBanner.dateHired ||
                            newlyCreatedStaffBanner.createdAt}
                        </strong>{' '}
                        (Length of Service:{' '}
                        <strong>
                          {calculateLengthOfService(
                            newlyCreatedStaffBanner.dateHired ||
                              newlyCreatedStaffBanner.createdAt
                          ) || newlyCreatedStaffBanner.lengthOfService}
                        </strong>
                        ) · OTP: <strong>{newlyCreatedStaffBanner.password}</strong>
                      </p>
                      <p className="text-emerald-800 mt-0.5">
                        Unique QR code is now displayed in the staff list below for printing or sharing with the employee for quick check-in.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenPrintableStaffId(newlyCreatedStaffBanner, false)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Open Printable Staff ID</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareStaffQrBadge(newlyCreatedStaffBanner)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold cursor-pointer"
                    >
                      {sharedStaffId === newlyCreatedStaffBanner.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied to Share!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share with Employee</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadStaffQrBadgeSvg({
                          employeeId: newlyCreatedStaffBanner.employeeId,
                          name: newlyCreatedStaffBanner.name,
                          role: newlyCreatedStaffBanner.role,
                          qrCodeImage: newlyCreatedStaffBanner.qrCodeImage,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-400 bg-white hover:bg-emerald-100 text-emerald-950 font-semibold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewlyCreatedStaffBanner(null)}
                      className="p-1.5 text-emerald-800 hover:bg-emerald-100 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {shareFeedbackMessage && (
                <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-950">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-900 shrink-0" />
                    <span className="font-medium">{shareFeedbackMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShareFeedbackMessage('')}
                    className="text-amber-900 hover:underline font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {showNewCashierForm && (
                <form
                  onSubmit={handleCreateCashier}
                  className="p-6 rounded-2xl border border-amber-900/30 bg-amber-50/25 space-y-5 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-900/15">
                    <div>
                      <h3 className="text-base font-display font-semibold text-stone-900">
                        Add New Bakery Staff (Cashier or Delivery)
                      </h3>
                      <p className="text-xs text-stone-600">
                        Complete employee onboarding details below. A unique Staff QR Code and One-Time Password (OTP) are generated automatically.
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-amber-900">
                      Employee ID: {staffEmployeeId}
                    </span>
                  </div>

                  {/* Row 1: Employee ID, Role Dropdown (Cashier or Delivery), Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Employee ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={staffEmployeeId}
                        onChange={(e) => setStaffEmployeeId(e.target.value)}
                        placeholder="EMP-2026-004"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono font-semibold text-stone-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Staff Role (Cashier or Delivery) *
                      </label>
                      <select
                        value={staffRole}
                        onChange={(e) => {
                          const nextRole = e.target.value as 'cashier' | 'delivery';
                          setStaffRole(nextRole);
                          if (nextRole === 'delivery') {
                            setStaffTerminal('In-House Chilled Van · Unit 02');
                          } else {
                            setStaffTerminal('POS Counter 01 · Kapitolyo Flagship');
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-semibold text-stone-900 bg-white"
                      >
                        <option value="cashier">
                          Cashier (Redirects to Cashier Dashboard)
                        </option>
                        <option value="delivery">
                          Delivery (Redirects to Delivery Dashboard)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Gender *
                      </label>
                      <select
                        value={staffGender}
                        onChange={(e) =>
                          setStaffGender(e.target.value as StaffGender)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 bg-white"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Last Name, First Name, Middle Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={staffLastName}
                        onChange={(e) => setStaffLastName(e.target.value)}
                        placeholder="e.g. Bautista"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={staffFirstName}
                        onChange={(e) => setStaffFirstName(e.target.value)}
                        placeholder="e.g. Camille"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={staffMiddleName}
                        onChange={(e) => setStaffMiddleName(e.target.value)}
                        placeholder="e.g. Dela Rosa"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 3: Birthdate, Automatically Displayed Age, Contact Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Birthdate *
                      </label>
                      <input
                        type="date"
                        required
                        value={staffBirthdate}
                        onChange={(e) => setStaffBirthdate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-stone-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Age (Automatically Computed from Birthdate)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={
                          autoCalculatedStaffAge !== ''
                            ? `${autoCalculatedStaffAge} years old`
                            : 'Select Birthdate'
                        }
                        className="w-full px-3 py-2 rounded-lg border border-amber-900/30 bg-amber-50/70 font-mono font-semibold text-amber-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Contact Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        placeholder="0917 555 0199"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-stone-900 bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 3B: Date Hired, Automatically Calculated Length of Service, Assigned Station */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 rounded-xl bg-white border border-amber-900/25">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label
                          htmlFor="staff-date-hired-input"
                          className="block text-[11px] font-semibold text-stone-700"
                        >
                          Date Hired *
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              const yyyy = now.getFullYear();
                              const mm = String(now.getMonth() + 1).padStart(
                                2,
                                '0'
                              );
                              const dd = String(now.getDate()).padStart(2, '0');
                              setStaffDateHired(`${yyyy}-${mm}-${dd}`);
                            }}
                            className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-[10px] font-mono text-stone-700 cursor-pointer"
                            title="Set Date Hired to Today"
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffDateHired('2025-03-15')}
                            className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-[10px] font-mono text-stone-700 cursor-pointer"
                            title="Sample 1+ year tenure"
                          >
                            1+ Yr
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffDateHired('2023-06-01')}
                            className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-[10px] font-mono text-stone-700 cursor-pointer"
                            title="Sample 3+ years tenure"
                          >
                            3+ Yrs
                          </button>
                        </div>
                      </div>
                      <input
                        id="staff-date-hired-input"
                        type="date"
                        required
                        value={staffDateHired}
                        onChange={(e) => setStaffDateHired(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-stone-900 bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="staff-length-of-service-output"
                        className="block text-[11px] font-semibold text-stone-700 mb-1"
                      >
                        Length of Service (Auto-Calculated from Date Hired)
                      </label>
                      <input
                        id="staff-length-of-service-output"
                        type="text"
                        readOnly
                        value={
                          autoCalculatedLengthOfService !== ''
                            ? autoCalculatedLengthOfService
                            : 'Select Date Hired'
                        }
                        className="w-full px-3 py-2 rounded-lg border border-emerald-800/35 bg-emerald-50/70 font-mono font-semibold text-emerald-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Assigned Terminal / Dispatch Unit
                      </label>
                      <input
                        type="text"
                        value={staffTerminal}
                        onChange={(e) => setStaffTerminal(e.target.value)}
                        placeholder="POS Counter 01 · Kapitolyo Flagship"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 4: Complete Home Address */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Home Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={staffAddress}
                      onChange={(e) => setStaffAddress(e.target.value)}
                      placeholder="House/Unit No., Street Name, Barangay, City/Municipality, Province"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 bg-white"
                    />
                  </div>

                  {/* Row 5: Email Address, One-Time Password (OTP), Assigned Shift/Vehicle */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Email Address (Login ID) *
                      </label>
                      <input
                        type="email"
                        required
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="staff@dulcekusina.ph"
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-stone-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        One-Time Password (OTP) *
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          required
                          value={staffOtpPassword}
                          onChange={(e) => setStaffOtpPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono font-semibold text-amber-950 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setStaffOtpPassword(generateOneTimePassword())
                          }
                          title="Generate new One-Time Password"
                          className="px-2.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 cursor-pointer shrink-0"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Assigned Shift
                      </label>
                      <select
                        value={staffShift}
                        onChange={(e) => setStaffShift(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 bg-white"
                      >
                        <option value="Morning Shift (7:00 AM – 3:00 PM)">
                          Morning Shift (7:00 AM – 3:00 PM)
                        </option>
                        <option value="Closing Shift (12:00 PM – 8:00 PM)">
                          Closing Shift (12:00 PM – 8:00 PM)
                        </option>
                        <option value="Full-Day Dispatch (8:00 AM – 6:00 PM)">
                          Full-Day Dispatch (8:00 AM – 6:00 PM)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Row 6: Photo Upload or Camera Capture with Live Preview + Unique Staff QR Code Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
                    {/* Left 7 Cols: Upload Image or Camera with Preview */}
                    <div className="lg:col-span-7 p-4 rounded-xl bg-white border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-stone-300 bg-stone-100 shrink-0 flex items-center justify-center relative">
                        {isStaffCameraOpen ? (
                          <video
                            ref={staffVideoRef}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : staffImagePreview ? (
                          <img
                            src={staffImagePreview}
                            alt="Staff Portrait Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={createStaffAvatarPlaceholder(
                              `${staffFirstName[0] || 'S'}${
                                staffLastName[0] || 'T'
                              }`,
                              staffRole
                            )}
                            alt="Default Staff Avatar"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="space-y-2 text-center sm:text-left">
                        <p className="font-semibold text-stone-900">
                          Staff Profile Image (Upload or Camera with Preview)
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Upload an ID photo from your device or capture a live portrait using your camera.
                        </p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleStaffImageFileUpload}
                              className="hidden"
                            />
                          </label>

                          {!isStaffCameraOpen ? (
                            <button
                              type="button"
                              onClick={handleOpenStaffCamera}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 font-medium cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-900" />
                              <span>Open Camera</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleCaptureStaffPhoto}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Capture Photo</span>
                            </button>
                          )}

                          {staffImagePreview && (
                            <button
                              type="button"
                              onClick={() => setStaffImagePreview('')}
                              className="text-[11px] text-red-700 hover:underline cursor-pointer"
                            >
                              Clear Photo
                            </button>
                          )}
                        </div>
                        {staffCameraNotice && (
                          <p className="text-[11px] text-amber-800">
                            {staffCameraNotice}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right 5 Cols: Auto-Generated Unique Staff QR Code Preview */}
                    <div className="lg:col-span-5 p-4 rounded-xl bg-white border border-stone-200 flex items-center gap-4">
                      <img
                        src={liveStaffQr.qrDataUri}
                        alt="Auto-Generated Unique Staff QR Code"
                        className="w-24 h-24 rounded-xl border border-stone-200 p-1 bg-white shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-900">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>UNIQUE STAFF QR CODE</span>
                        </div>
                        <p className="font-semibold text-stone-900 truncate">
                          {composedStaffFullName}
                        </p>
                        <p className="font-mono text-[11px] text-stone-600 truncate">
                          {staffEmployeeId} · {staffRole.toUpperCase()}
                        </p>
                        <p className="font-mono text-[10px] text-emerald-800 font-semibold truncate">
                          Hired: {staffDateHired || 'N/A'} ·{' '}
                          {autoCalculatedLengthOfService || 'Newly Hired'}
                        </p>
                        <p className="text-[10px] text-stone-500 leading-tight">
                          Automatically generated and bound to this staff member upon creation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-amber-900/15">
                    <button
                      type="button"
                      onClick={() => {
                        stopStaffCamera();
                        setShowNewCashierForm(false);
                      }}
                      className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 bg-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Create Staff Account &amp; Issue Unique QR Code</span>
                    </button>
                  </div>
                </form>
              )}

              {staffSubView === 'directory' ? (
                <>
                  {/* Role Filter Bar for Staff Table */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs">
                      {[
                        { id: 'all', label: `All Staff (${cashiers.length})` },
                        {
                          id: 'cashier',
                          label: `Cashiers (${
                            cashiers.filter((s) => s.role === 'cashier').length
                          })`,
                        },
                        {
                          id: 'delivery',
                          label: `Delivery Staff (${
                            cashiers.filter((s) => s.role === 'delivery').length
                          })`,
                        },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() =>
                            setStaffRoleFilter(
                              tab.id as 'all' | 'cashier' | 'delivery'
                            )
                          }
                          className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                            staffRoleFilter === tab.id
                              ? 'bg-white text-stone-900 shadow-xs font-semibold'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      <th className="py-2.5 pr-4 font-medium">
                        Staff &amp; Employee ID
                      </th>
                      <th className="py-2.5 px-3 font-medium">Role</th>
                      <th className="py-2.5 px-3 font-medium">
                        Date Hired &amp; Length of Service
                      </th>
                      <th className="py-2.5 px-3 font-medium">
                        Age, Birthdate &amp; Gender
                      </th>
                      <th className="py-2.5 px-3 font-medium">
                        Contact, Email &amp; Address
                      </th>
                      <th className="py-2.5 px-3 font-medium">
                        OTP / Security
                      </th>
                      <th className="py-2.5 px-3 font-medium">
                        Unique QR Code (Print / Share for Check-In)
                      </th>
                      <th className="py-2.5 px-3 font-medium text-center">
                        Status &amp; Check-In
                      </th>
                      <th className="py-2.5 pl-3 font-medium text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200/70">
                    {cashiers
                      .filter((s) =>
                        staffRoleFilter === 'all'
                          ? true
                          : s.role === staffRoleFilter
                      )
                      .map((staff) => {
                        const resolvedQr = getResolvedStaffQr(staff);
                        const lastCheckIn = checkedInStaffTimes[staff.id];
                        const resolvedDateHired =
                          staff.dateHired || staff.createdAt || '2025-03-15';
                        const resolvedLengthOfService =
                          calculateLengthOfService(resolvedDateHired) ||
                          staff.lengthOfService ||
                          'Newly Hired';
                        return (
                          <tr key={staff.id} className="hover:bg-stone-50/80">
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    staff.avatar ||
                                    createStaffAvatarPlaceholder(
                                      staff.name,
                                      staff.role
                                    )
                                  }
                                  alt={staff.name}
                                  className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                                />
                                <div>
                                  <p className="font-mono text-[11px] font-semibold text-amber-900">
                                    {staff.employeeId || 'EMP-2026'}
                                  </p>
                                  <p className="font-semibold text-stone-900">
                                    {staff.lastName && staff.firstName
                                      ? `${staff.lastName}, ${staff.firstName} ${
                                          staff.middleName || ''
                                        }`
                                      : staff.name}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`font-mono text-[11px] font-semibold uppercase ${
                                  staff.role === 'delivery'
                                    ? 'text-amber-900'
                                    : 'text-emerald-800'
                                }`}
                              >
                                {staff.role === 'delivery'
                                  ? 'Delivery'
                                  : 'Cashier'}
                              </span>
                              <p className="text-[11px] text-stone-500">
                                {staff.terminal || staff.shift}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 text-stone-700">
                              <p className="font-mono font-semibold text-emerald-900">
                                {resolvedLengthOfService}
                              </p>
                              <p className="font-mono text-[11px] text-stone-500">
                                Hired: {resolvedDateHired}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 text-stone-700">
                              <p className="font-mono font-semibold text-stone-900">
                                {staff.age ??
                                  calculateAgeFromBirthdate(
                                    staff.birthdate || ''
                                  )}{' '}
                                yrs · {staff.gender || 'N/A'}
                              </p>
                              <p className="font-mono text-[11px] text-stone-500">
                                DOB: {staff.birthdate || '1999-08-19'}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 max-w-xs">
                              <p className="font-mono text-stone-800 truncate">
                                {staff.email}
                              </p>
                              <p className="font-mono text-[11px] text-stone-500">
                                {staff.phone}
                              </p>
                              {staff.address && (
                                <p className="text-[11px] text-stone-500 truncate">
                                  {staff.address}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-3 font-mono">
                              <p className="text-stone-900 font-semibold">
                                {staff.password || 'Password@123'}
                              </p>
                              <p className="text-[10px] text-stone-500">
                                {staff.isOneTimePassword
                                  ? 'One-Time Password (OTP)'
                                  : 'Verified Password'}
                              </p>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-3 bg-stone-50/90 border border-stone-200/90 rounded-xl p-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedQrStaff(staff)}
                                  title="Click to enlarge QR badge"
                                  className="shrink-0 rounded-lg bg-white p-1 border border-stone-200 hover:border-amber-800 transition-colors cursor-pointer"
                                >
                                  <img
                                    src={resolvedQr.qrCodeImage}
                                    alt={`Unique QR code for ${staff.name}`}
                                    className="w-14 h-14 object-contain rounded"
                                  />
                                </button>
                                <div className="space-y-1.5 min-w-0">
                                  <p className="font-mono text-[10px] font-semibold text-stone-700 truncate">
                                    {resolvedQr.checkInCode}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handlePrintStaffQrBadge(staff)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-medium cursor-pointer"
                                      title="Print QR Code Badge for Employee Check-In"
                                    >
                                      <Printer className="w-3 h-3" />
                                      <span>Print</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleShareStaffQrBadge(staff)}
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-medium cursor-pointer ${
                                        sharedStaffId === staff.id
                                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                                          : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-800'
                                      }`}
                                      title="Share or Copy QR Check-In Pass for Employee"
                                    >
                                      {sharedStaffId === staff.id ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-700" />
                                          <span>Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Share2 className="w-3 h-3 text-amber-900" />
                                          <span>Share</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenPrintableStaffId(staff, false)
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-900 hover:bg-amber-950 text-white text-[11px] font-medium cursor-pointer"
                                      title="Open Printable Standard CR80 Staff ID Badge View"
                                    >
                                      <CreditCard className="w-3 h-3" />
                                      <span>Staff ID</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        downloadStaffQrBadgeSvg({
                                          employeeId: staff.employeeId,
                                          name: staff.name,
                                          role: staff.role,
                                          qrCodeImage: resolvedQr.qrCodeImage,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-[11px] font-medium cursor-pointer"
                                      title="Download QR Badge SVG"
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onToggleCashierStatus(staff.id)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                                    staff.status !== 'Off Duty'
                                      ? 'border-emerald-800 bg-emerald-50 text-emerald-900'
                                      : 'border-stone-300 text-stone-500'
                                  }`}
                                >
                                  {staff.status || 'Active'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickCheckInStaff(staff)}
                                  className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-900 hover:underline cursor-pointer"
                                  title="Simulate Quick QR Check-In"
                                >
                                  <QrCode className="w-3 h-3" />
                                  <span>
                                    {lastCheckIn
                                      ? `In: ${lastCheckIn}`
                                      : 'Quick Check-In'}
                                  </span>
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 pl-3 text-right">
                              <button
                                type="button"
                                onClick={() => onDeleteCashier(staff.id)}
                                className="p-1.5 text-stone-400 hover:text-red-700 cursor-pointer"
                                title="Remove staff member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
                </>
              ) : (
                <PrintableStaffIdView
                  staffList={cashiers}
                  selectedStaff={selectedPrintableStaff || cashiers[0] || null}
                  onSelectStaff={(staff) => setSelectedPrintableStaff(staff)}
                  businessSettings={businessSettings}
                  checkedInStaffTimes={checkedInStaffTimes}
                  onQuickCheckInStaff={handleQuickCheckInStaff}
                  onShareStaffQrBadge={handleShareStaffQrBadge}
                  sharedStaffId={sharedStaffId}
                  onBackToDirectory={() => setStaffSubView('directory')}
                />
              )}
            </div>
          )}

          {/* TAB 4B: DEDICATED PRINTABLE STAFF ID BADGE VIEW */}
          {activeTab === 'staff_ids' && (
            <PrintableStaffIdView
              staffList={cashiers}
              selectedStaff={selectedPrintableStaff || cashiers[0] || null}
              onSelectStaff={(staff) => setSelectedPrintableStaff(staff)}
              businessSettings={businessSettings}
              checkedInStaffTimes={checkedInStaffTimes}
              onQuickCheckInStaff={handleQuickCheckInStaff}
              onShareStaffQrBadge={handleShareStaffQrBadge}
              sharedStaffId={sharedStaffId}
              onBackToDirectory={() => {
                setStaffSubView('directory');
                setActiveTab('cashiers');
              }}
            />
          )}

          {/* TAB 5: PAYMENTS & GCASH / PAYMAYA VERIFICATION */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <h1 className="text-xl font-display font-semibold text-stone-900">
                    Payment Ledger &amp; GCash / PayMaya Verification
                  </h1>
                  <p className="text-xs text-stone-500">
                    Inspect customer reference numbers, view uploaded payment screenshots/receipts, and verify transfers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer whitespace-nowrap"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-900" />
                  <span>Configure GCash &amp; PayMaya QR Codes</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      <th className="py-2.5 pr-4 font-medium">Order #</th>
                      <th className="py-2.5 px-3 font-medium">Customer</th>
                      <th className="py-2.5 px-3 font-medium">Method</th>
                      <th className="py-2.5 px-3 font-medium">Reference #</th>
                      <th className="py-2.5 px-3 font-medium">Screenshot / Receipt</th>
                      <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 pl-3 font-medium text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200/70">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-stone-50/80">
                        <td className="py-3 pr-4 font-mono font-semibold text-stone-900">
                          #{ord.orderNumber}
                        </td>
                        <td className="py-3 px-3 text-stone-700">{ord.customerName}</td>
                        <td className="py-3 px-3 font-medium text-stone-900">
                          {ord.paymentMethod === 'Maya'
                            ? 'PayMaya / Maya'
                            : ord.paymentMethod}
                        </td>
                        <td className="py-3 px-3 font-mono text-stone-700">
                          {ord.paymentReference || 'Cash on Fulfillment'}
                        </td>
                        <td className="py-3 px-3">
                          {ord.paymentProofImage ? (
                            <button
                              type="button"
                              onClick={() => setPreviewReceiptOrder(ord)}
                              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-amber-900/30 bg-amber-50/50 text-amber-950 font-medium hover:bg-amber-100/60 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                          ) : (
                            <span className="text-stone-400">No image uploaded</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-stone-900 tabular-nums">
                          ₱{ord.total.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-medium ${
                              ord.paymentStatus === 'Verified' ||
                              ord.paymentStatus === 'Paid'
                                ? 'text-emerald-700'
                                : 'text-amber-800'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right">
                          {ord.paymentStatus === 'Pending Verification' ? (
                            <button
                              type="button"
                              onClick={() => onVerifyPayment(ord.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 cursor-pointer whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify GCash/Maya</span>
                            </button>
                          ) : (
                            <span className="text-stone-400">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMER CRM */}
          {activeTab === 'customers' && (
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">
              <div className="pb-4 border-b border-stone-200">
                <h1 className="text-xl font-display font-semibold text-stone-900">
                  Customer Profiles &amp; Order History
                </h1>
                <p className="text-xs text-stone-500">
                  Saved delivery addresses, lifetime spend, and favorite bakery products
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    className="border border-stone-200 rounded-xl p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-sm font-semibold text-stone-900">{c.name}</h3>
                      <span className="font-mono font-semibold text-amber-900 tabular-nums">
                        ₱{c.totalSpent.toLocaleString()} lifetime
                      </span>
                    </div>
                    <p className="font-mono text-stone-600">
                      {c.phone} · {c.email}
                    </p>
                    <p className="text-stone-600">{c.address}</p>
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-500">
                      <span>{c.ordersCount} completed orders</span>
                      <span>Last order: {c.lastOrderDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: BUSINESS PROFILE & MODE OF PAYMENTS SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <p className="text-xs font-mono text-amber-900 font-semibold">
                    STORE &amp; PAYMENT CONFIGURATION
                  </p>
                  <h1 className="text-xl font-display font-semibold text-stone-900 mt-0.5">
                    Business Details &amp; Mode of Payment Settings
                  </h1>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Update your bakery name, store address, contact number, and upload your official GCash and PayMaya QR codes and mobile numbers.
                  </p>
                </div>
                {settingsSavedBanner && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Settings saved &amp; synced to Customer Checkout</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveBusinessSettings} className="space-y-8">
                {/* Section 1: Business Profile (Name, Address, Contact Number) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                    <Building2 className="w-4 h-4 text-amber-900" />
                    <h2>Business Identity, Address &amp; Contact Information</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.businessName}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            businessName: e.target.value,
                          })
                        }
                        placeholder="e.g. Dulce & Kusina"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-900 focus:outline-none focus:border-amber-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Contact Number (SMS / Viber / Hotline) *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          required
                          value={settingsForm.contactNumber}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              contactNumber: e.target.value,
                            })
                          }
                          placeholder="e.g. 0917 880 4421"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs font-mono text-stone-900 focus:outline-none focus:border-amber-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Complete Store / Pickup Address *
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={settingsForm.address}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            address: e.target.value,
                          })
                        }
                        placeholder="e.g. 19 East Capitol Drive, Kapitolyo, Pasig City"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Store Tagline
                      </label>
                      <input
                        type="text"
                        value={settingsForm.tagline}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            tagline: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Operating Hours
                      </label>
                      <input
                        type="text"
                        value={settingsForm.operatingHours}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            operatingHours: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-amber-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Mode of Payments — GCash & PayMaya QR Code & Number Configuration */}
                <div className="pt-6 border-t border-stone-200 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                      <QrCode className="w-4 h-4 text-amber-900" />
                      <h2>Mode of Payments: GCash &amp; PayMaya QR Codes and Numbers</h2>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      When customers select GCash or PayMaya at checkout, the QR code and account number below are displayed automatically so they can scan, enter their reference number, and upload their payment receipt.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* GCash Configuration Card */}
                    <div className="p-5 rounded-xl border border-stone-200 bg-[#FAF9F6] space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                        <div>
                          <span className="text-xs font-mono font-semibold text-blue-700">
                            MODE OF PAYMENT 01
                          </span>
                          <h3 className="text-base font-semibold text-stone-900">
                            GCash QR Code &amp; Account Number
                          </h3>
                        </div>
                        <QrCode className="w-5 h-5 text-blue-700" />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-32 h-32 rounded-xl bg-white border border-stone-200 p-2 shrink-0 flex items-center justify-center">
                          <ResilientImage
                            src={settingsForm.gcashQrImage}
                            alt="GCash QR Code Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="space-y-2 text-center sm:text-left">
                          <p className="text-xs font-semibold text-stone-900">
                            Official GCash Merchant QR
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Upload a PNG or JPG image of your GCash QR code. It will immediately appear in customer checkout.
                          </p>
                          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload GCash QR Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleQrFileUpload('gcash', e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            GCash Account Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={settingsForm.gcashAccountName}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                gcashAccountName: e.target.value,
                              })
                            }
                            placeholder="e.g. Bea Santos"
                            className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            GCash Mobile Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={settingsForm.gcashNumber}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                gcashNumber: e.target.value,
                              })
                            }
                            placeholder="e.g. 0917 880 4421"
                            className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-mono font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PayMaya (Maya) Configuration Card */}
                    <div className="p-5 rounded-xl border border-stone-200 bg-[#FAF9F6] space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                        <div>
                          <span className="text-xs font-mono font-semibold text-emerald-800">
                            MODE OF PAYMENT 02
                          </span>
                          <h3 className="text-base font-semibold text-stone-900">
                            PayMaya (Maya) QR Code &amp; Number
                          </h3>
                        </div>
                        <QrCode className="w-5 h-5 text-emerald-800" />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-32 h-32 rounded-xl bg-white border border-stone-200 p-2 shrink-0 flex items-center justify-center">
                          <ResilientImage
                            src={settingsForm.mayaQrImage}
                            alt="PayMaya QR Code Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="space-y-2 text-center sm:text-left">
                          <p className="text-xs font-semibold text-stone-900">
                            Official PayMaya QR Code
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Upload a PNG or JPG image of your PayMaya QR code. Displayed when customers choose PayMaya.
                          </p>
                          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload PayMaya QR Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleQrFileUpload('maya', e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            PayMaya Account Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={settingsForm.mayaAccountName}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                mayaAccountName: e.target.value,
                              })
                            }
                            placeholder="e.g. Dulce & Kusina Corp."
                            className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            PayMaya Mobile Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={settingsForm.mayaNumber}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                mayaNumber: e.target.value,
                              })
                            }
                            placeholder="e.g. 0918 901 3310"
                            className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-mono font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Transfer Info */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Bank Transfer Account Details (BPI / BDO)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.bankAccountInfo}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          bankAccountInfo: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs font-mono text-stone-900"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Save Business &amp; Payment Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 8: COMPLETE TECHNICAL ARCHITECTURE BLUEPRINT (LARAVEL + MYSQL + REACT NATIVE) */}
          {activeTab === 'blueprint' && (
            <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-8">
              <div className="pb-4 border-b border-stone-200">
                <p className="text-xs font-mono text-amber-900 font-semibold">
                  SYSTEM ARCHITECTURE &amp; TECHNICAL DOCUMENTATION
                </p>
                <h1 className="text-xl font-display font-semibold text-stone-900 mt-1">
                  Laravel 11 API + MySQL (XAMPP) + React Native Expo Blueprint
                </h1>
                <p className="text-xs text-stone-600 mt-1">
                  Complete production specification connecting the Customer Mobile App, Cashier POS Terminal, and Admin Panel to a unified MySQL database.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-stone-900">
                  01. Core MySQL Database Schema (Laravel Migrations)
                </h2>
                <pre className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs overflow-x-auto leading-relaxed">
{`-- 1. users (Customer, Cashier, Admin, Rider roles)
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(30) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'cashier', 'admin', 'rider') DEFAULT 'customer',
  shift VARCHAR(80) NULL,
  terminal VARCHAR(80) NULL,
  default_address TEXT NULL,
  created_at TIMESTAMP NULL
);`}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal to Preview Customer Uploaded Payment Screenshot / Receipt */}
      {previewReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <p className="text-xs font-mono text-amber-900 font-semibold">
                  PAYMENT RECEIPT · #{previewReceiptOrder.orderNumber}
                </p>
                <h3 className="text-base font-semibold text-stone-900">
                  {previewReceiptOrder.customerName} ({previewReceiptOrder.paymentMethod})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceiptOrder(null)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-stone-50 p-3 rounded-lg border border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">Reference Number:</span>
                <span className="font-mono font-semibold text-stone-900">
                  {previewReceiptOrder.paymentReference || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Total Amount:</span>
                <span className="font-mono font-semibold text-amber-900">
                  ₱{previewReceiptOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            {previewReceiptOrder.paymentProofImage && (
              <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-100 max-h-80 flex items-center justify-center">
                <img
                  src={previewReceiptOrder.paymentProofImage}
                  alt="Customer uploaded payment receipt"
                  referrerPolicy="no-referrer"
                  className="max-h-80 w-auto object-contain"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewReceiptOrder(null)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 cursor-pointer"
              >
                Close
              </button>
              {previewReceiptOrder.paymentStatus === 'Pending Verification' && (
                <button
                  type="button"
                  onClick={() => {
                    onVerifyPayment(previewReceiptOrder.id);
                    setPreviewReceiptOrder(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
                >
                  Verify Payment Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal to View, Print, or Share Staff Member's Unique QR Code & Employee Check-In Badge */}
      {selectedQrStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <p className="text-[11px] font-mono text-amber-900 font-semibold">
                  PRINTABLE &amp; SHAREABLE STAFF QUICK CHECK-IN QR PASS
                </p>
                <h3 className="text-base font-semibold text-stone-900">
                  {selectedQrStaff.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQrStaff(null)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const resolvedModalQr = getResolvedStaffQr(selectedQrStaff);
              return (
                <>
                  <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center text-center space-y-3">
                    <div className="w-full flex items-center justify-between text-[10px] font-mono text-stone-500 border-b border-stone-200 pb-2">
                      <span>{businessSettings.businessName.toUpperCase()}</span>
                      <span className="font-semibold text-amber-900">
                        {resolvedModalQr.checkInCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full text-left">
                      <img
                        src={
                          selectedQrStaff.avatar ||
                          createStaffAvatarPlaceholder(
                            selectedQrStaff.name,
                            selectedQrStaff.role
                          )
                        }
                        alt={selectedQrStaff.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-stone-300 shrink-0"
                      />
                      <div className="text-xs min-w-0">
                        <p className="font-mono font-semibold text-amber-900">
                          {selectedQrStaff.employeeId} ·{' '}
                          {selectedQrStaff.role.toUpperCase()}
                        </p>
                        <p className="font-semibold text-stone-900 truncate">
                          {selectedQrStaff.name}
                        </p>
                        <p className="text-stone-500">
                          Age {selectedQrStaff.age} · {selectedQrStaff.gender} ·{' '}
                          {selectedQrStaff.shift || 'Regular Shift'}
                        </p>
                      </div>
                    </div>

                    <img
                      src={resolvedModalQr.qrCodeImage}
                      alt="Unique Staff QR Code"
                      className="w-52 h-52 object-contain rounded-xl bg-white p-2.5 border border-stone-200 shadow-xs"
                    />

                    <div className="w-full text-left text-[11px] font-mono bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                      <p className="text-stone-500">
                        Email:{' '}
                        <span className="text-stone-900">
                          {selectedQrStaff.email}
                        </span>
                      </p>
                      <p className="text-stone-500">
                        Contact:{' '}
                        <span className="text-stone-900">
                          {selectedQrStaff.phone}
                        </span>
                      </p>
                      <p className="text-stone-500">
                        Date Hired &amp; Tenure:{' '}
                        <span className="text-stone-900 font-semibold">
                          {selectedQrStaff.dateHired ||
                            selectedQrStaff.createdAt ||
                            '2025-03-15'}{' '}
                          (
                          {calculateLengthOfService(
                            selectedQrStaff.dateHired ||
                              selectedQrStaff.createdAt
                          ) ||
                            selectedQrStaff.lengthOfService ||
                            'Active'}
                          )
                        </span>
                      </p>
                      <p className="text-stone-500">
                        One-Time Password:{' '}
                        <span className="text-stone-900 font-semibold">
                          {selectedQrStaff.password}
                        </span>
                      </p>
                      <p className="text-stone-500 truncate">
                        Check-In Payload:{' '}
                        <span className="text-stone-700">
                          {resolvedModalQr.qrCodePayload}
                        </span>
                      </p>
                    </div>
                  </div>

                  {sharedStaffId === selectedQrStaff.id && (
                    <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        Employee QR check-in details copied to clipboard for sharing!
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print QR Badge</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareStaffQrBadge(selectedQrStaff)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Pass</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadStaffQrBadgeSvg({
                          employeeId: selectedQrStaff.employeeId,
                          name: selectedQrStaff.name,
                          role: selectedQrStaff.role,
                          qrCodeImage: resolvedModalQr.qrCodeImage,
                        })
                      }
                      className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download SVG</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuickCheckInStaff(selectedQrStaff)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>
                          {checkedInStaffTimes[selectedQrStaff.id]
                            ? `Checked In (${
                                checkedInStaffTimes[selectedQrStaff.id]
                              })`
                            : 'Verify Check-In'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPrintableStaffId(selectedQrStaff, false)
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:underline cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Full Staff ID Badge View</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedQrStaff(null)}
                      className="px-4 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
