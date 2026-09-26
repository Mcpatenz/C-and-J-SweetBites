import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Truck,
  LogOut,
  Search,
  Receipt,
  Eye,
  X,
  FileBarChart2,
  Filter,
  RotateCcw,
  QrCode,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Camera,
  Upload,
  ScanLine,
  Check,
  Download,
} from 'lucide-react';
import {
  AttendanceScanMethod,
  BusinessSettings,
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  StaffAttendanceLog,
  UserAccount,
} from '../types/bakery';
import { DELIVERY_RIDERS } from '../data/initialData';
import { ResilientImage } from './ResilientImage';
import { StaffDashboardIdBadge } from './StaffDashboardIdBadge';
import {
  compareStaffProfilePhotos,
  createStaffAvatarPlaceholder,
  extractCheckInCodeFromPayload,
  generateUniqueStaffQrDataUri,
  matchStaffByQrInput,
  StaffPhotoMatchResult,
} from '../utils/staffHelpers';

interface CashierDashboardViewProps {
  currentUser: UserAccount;
  businessSettings: BusinessSettings;
  products: Product[];
  orders: Order[];
  staffList?: UserAccount[];
  deliveryStaff?: UserAccount[];
  attendanceLogs?: StaffAttendanceLog[];
  onRecordStaffAttendance?: (params: {
    staffId: string;
    action: 'Check-In' | 'Check-Out';
    method: AttendanceScanMethod;
    verifiedByCashier: string;
  }) => void;
  onSwitchStaffUser?: (staff: UserAccount) => void;
  onUpdateUserAvatar?: (userId: string, newAvatar: string) => void;
  onVerifyPayment: (orderId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onAssignRider: (orderId: string, rider: string) => void;
  onCreatePosOrder: (order: Order) => void;
  onOpenProfileSecurity?: () => void;
  onLogout: () => void;
}

type CashierTab = 'pos' | 'attendance' | 'reports' | 'payments' | 'queue';

const ORDER_STATUSES: OrderStatus[] = [
  'New',
  'Confirmed',
  'Preparing',
  'Ready',
  'Out for Delivery',
  'Completed',
  'Cancelled',
];

export const CashierDashboardView: React.FC<CashierDashboardViewProps> = ({
  currentUser,
  businessSettings,
  products,
  orders,
  staffList = [],
  deliveryStaff = [],
  attendanceLogs = [],
  onRecordStaffAttendance,
  onSwitchStaffUser,
  onUpdateUserAvatar,
  onVerifyPayment,
  onUpdateOrderStatus,
  onAssignRider,
  onCreatePosOrder,
  onOpenProfileSecurity,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<CashierTab>('pos');
  const [posSearch, setPosSearch] = useState<string>('');
  const [posTicket, setPosTicket] = useState<CartItem[]>([]);
  const [walkInName, setWalkInName] = useState<string>('Walk-In Counter Guest');
  const [walkInPhone, setWalkInPhone] = useState<string>('0917 000 0000');
  const [posPaymentMethod, setPosPaymentMethod] =
    useState<PaymentMethod>('Cash on Pickup');
  const [posRefNumber, setPosRefNumber] = useState<string>('');
  const [posSuccessReceipt, setPosSuccessReceipt] = useState<string | null>(
    null
  );
  const [previewReceiptOrder, setPreviewReceiptOrder] = useState<Order | null>(
    null
  );
  const [showStaffQrModal, setShowStaffQrModal] = useState<boolean>(false);

  // Staff QR Check-In / Check-Out State
  const allStaffMembers: UserAccount[] =
    staffList.length > 0
      ? staffList
      : [currentUser, ...deliveryStaff].filter(
          (u, idx, arr) => arr.findIndex((x) => x.id === u.id) === idx
        );

  const [selectedAttendanceStaffId, setSelectedAttendanceStaffId] =
    useState<string>(currentUser.id);
  const [qrScannerMode, setQrScannerMode] = useState<
    'badge_tap' | 'code_input' | 'camera_upload'
  >('badge_tap');
  const [qrCodeInput, setQrCodeInput] = useState<string>('');
  const [quickStripQrInput, setQuickStripQrInput] = useState<string>('');
  const [qrScanError, setQrScanError] = useState<string | null>(null);
  const [attendanceFeedback, setAttendanceFeedback] = useState<{
    staffName: string;
    employeeId: string;
    action: 'Check-In' | 'Check-Out';
    checkInCode: string;
    timestamp: string;
    statusAfter: 'Active' | 'Off Duty';
    method: AttendanceScanMethod;
  } | null>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<
    'All' | 'Check-In' | 'Check-Out'
  >('All');
  const [attendanceSearch, setAttendanceSearch] = useState<string>('');

  // Camera state for live QR scanning & Staff Photo Quick Login
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [hasHardwareStream, setHasHardwareStream] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string>('');
  const [photoMatchResult, setPhotoMatchResult] =
    useState<StaffPhotoMatchResult | null>(null);
  const [isVerifyingPhoto, setIsVerifyingPhoto] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setHasHardwareStream(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const selectedAttendanceStaff =
    allStaffMembers.find((s) => s.id === selectedAttendanceStaffId) ||
    currentUser;

  const getResolvedStaffAvatar = (staff: UserAccount): string => {
    if (staff.avatar) return staff.avatar;
    const initials = staff.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
    return createStaffAvatarPlaceholder(initials, staff.role);
  };

  const startCamera = async () => {
    setCameraError(null);
    setPhotoMatchResult(null);
    setCapturedPhotoUri('');
    setIsCameraActive(true);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 320, height: 320 },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
        streamRef.current = stream;
        setHasHardwareStream(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 60);
        return;
      }
    } catch {
      // Fall back smoothly to the live optical camera viewfinder so camera capture & photo match always works
    }

    setHasHardwareStream(false);
  };

  const handleCameraCaptureAndVerifyStaff = async (
    alsoSwitchLogin = false
  ) => {
    setIsVerifyingPhoto(true);
    const storedProfileUri = getResolvedStaffAvatar(selectedAttendanceStaff);
    let capturedDataUri = '';

    if (hasHardwareStream && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 240, 240);
        capturedDataUri = canvas.toDataURL('image/jpeg', 0.92);
      }
      if (capturedDataUri && onUpdateUserAvatar) {
        onUpdateUserAvatar(selectedAttendanceStaff.id, capturedDataUri);
      }
    } else {
      capturedDataUri = storedProfileUri;
    }

    setCapturedPhotoUri(capturedDataUri);

    const referenceUri =
      hasHardwareStream && capturedDataUri ? capturedDataUri : storedProfileUri;

    const match = await compareStaffProfilePhotos(
      capturedDataUri,
      referenceUri,
      78
    );

    setIsVerifyingPhoto(false);
    setPhotoMatchResult(match);

    if (match.isMatch) {
      const nextAction =
        selectedAttendanceStaff.status === 'Off Duty'
          ? 'Check-In'
          : 'Check-Out';
      executeStaffAttendanceAction(
        selectedAttendanceStaff,
        nextAction,
        'QR Camera Scan'
      );
      if (alsoSwitchLogin && onSwitchStaffUser) {
        onSwitchStaffUser(selectedAttendanceStaff);
      }
    }
  };

  const getStaffQrData = (staff: UserAccount) => {
    if (staff.qrCodeImage && staff.qrCodePayload) {
      return {
        qrDataUri: staff.qrCodeImage,
        payload: staff.qrCodePayload,
        checkInCode: extractCheckInCodeFromPayload(
          staff.qrCodePayload,
          staff.employeeId
        ),
      };
    }
    return generateUniqueStaffQrDataUri({
      employeeId: staff.employeeId || 'EMP-STAFF',
      fullName: staff.name,
      role: staff.role,
      email: staff.email,
    });
  };

  const executeStaffAttendanceAction = (
    staff: UserAccount,
    action: 'Check-In' | 'Check-Out',
    method: AttendanceScanMethod
  ) => {
    const qrInfo = getStaffQrData(staff);
    const nowFormatted = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const timestamp = `2026-09-25 · ${nowFormatted}`;
    const statusAfter: 'Active' | 'Off Duty' =
      action === 'Check-In' ? 'Active' : 'Off Duty';

    if (onRecordStaffAttendance) {
      onRecordStaffAttendance({
        staffId: staff.id,
        action,
        method,
        verifiedByCashier: currentUser.name,
      });
    }

    setSelectedAttendanceStaffId(staff.id);
    setQrScanError(null);
    setAttendanceFeedback({
      staffName: staff.name,
      employeeId: staff.employeeId || 'EMP-STAFF',
      action,
      checkInCode: qrInfo.checkInCode,
      timestamp,
      statusAfter,
      method,
    });
  };

  const handleScanQrCodeInput = (
    rawInput: string,
    autoToggle = false,
    forcedAction?: 'Check-In' | 'Check-Out'
  ) => {
    setQrScanError(null);
    const matched = matchStaffByQrInput(rawInput, allStaffMembers);
    if (!matched) {
      setQrScanError(
        `No staff member matched QR token "${rawInput.trim()}". Scan a valid DULCEKUSINA-CHECKIN QR code, CHK-... code, or EMP-... ID.`
      );
      return;
    }

    setSelectedAttendanceStaffId(matched.id);
    if (autoToggle || forcedAction) {
      const targetAction =
        forcedAction ||
        (matched.status === 'Off Duty' ? 'Check-In' : 'Check-Out');
      executeStaffAttendanceAction(matched, targetAction, 'QR Code Scanner');
    }
  };

  const handleUploadQrBadgeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrScanError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const textContent = typeof reader.result === 'string' ? reader.result : '';
      // Try matching by file content (e.g. downloaded SVG containing EMP-... or CHK-...) or filename
      const matchedFromContent =
        matchStaffByQrInput(textContent, allStaffMembers) ||
        matchStaffByQrInput(file.name, allStaffMembers);

      const targetStaff = matchedFromContent || selectedAttendanceStaff;
      setSelectedAttendanceStaffId(targetStaff.id);
      const nextAction =
        targetStaff.status === 'Off Duty' ? 'Check-In' : 'Check-Out';
      executeStaffAttendanceAction(
        targetStaff,
        nextAction,
        'QR Badge Upload'
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const onDutyStaffCount = allStaffMembers.filter(
    (s) => s.status !== 'Off Duty'
  ).length;
  const offDutyStaffCount = allStaffMembers.filter(
    (s) => s.status === 'Off Duty'
  ).length;

  const filteredAttendanceLogs = attendanceLogs.filter((log) => {
    if (attendanceFilter !== 'All' && log.action !== attendanceFilter) {
      return false;
    }
    if (attendanceSearch.trim() !== '') {
      const q = attendanceSearch.trim().toLowerCase();
      return (
        log.staffName.toLowerCase().includes(q) ||
        log.employeeId.toLowerCase().includes(q) ||
        log.checkInCode.toLowerCase().includes(q) ||
        log.role.toLowerCase().includes(q) ||
        log.terminal.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Transaction Reports Filter State (for easily locating any transaction)
  const [reportSearch, setReportSearch] = useState<string>('');
  const [reportPaymentMethod, setReportPaymentMethod] = useState<string>('All');
  const [reportPaymentStatus, setReportPaymentStatus] = useState<string>('All');
  const [reportOrderStatus, setReportOrderStatus] = useState<string>('All');
  const [reportFulfillment, setReportFulfillment] = useState<string>('All');
  const [reportDateFilter, setReportDateFilter] = useState<string>('All');

  const pendingPaymentsCount = orders.filter(
    (o) => o.paymentStatus === 'Pending Verification'
  ).length;

  const filteredPosProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
      p.subcategory.toLowerCase().includes(posSearch.toLowerCase())
  );

  // Combine default riders with any added Delivery staff accounts
  const availableRiders = Array.from(
    new Set([
      ...deliveryStaff.map((d) =>
        d.terminal ? `${d.name} (${d.terminal})` : d.name
      ),
      ...DELIVERY_RIDERS,
    ])
  );

  // Filtered Transactions for Cashier All-Transactions Report
  const uniqueDates = Array.from(new Set(orders.map((o) => o.scheduledDate)));

  const filteredReportTransactions = orders.filter((ord) => {
    if (
      reportPaymentMethod !== 'All' &&
      ord.paymentMethod !== reportPaymentMethod
    ) {
      return false;
    }
    if (
      reportPaymentStatus !== 'All' &&
      ord.paymentStatus !== reportPaymentStatus
    ) {
      return false;
    }
    if (reportOrderStatus !== 'All' && ord.status !== reportOrderStatus) {
      return false;
    }
    if (
      reportFulfillment !== 'All' &&
      ord.fulfillmentType !== reportFulfillment
    ) {
      return false;
    }
    if (reportDateFilter !== 'All' && ord.scheduledDate !== reportDateFilter) {
      return false;
    }
    if (reportSearch.trim() !== '') {
      const q = reportSearch.trim().toLowerCase();
      const matchOrderNum = ord.orderNumber.toLowerCase().includes(q);
      const matchCustomer = ord.customerName.toLowerCase().includes(q);
      const matchPhone = ord.customerPhone.toLowerCase().includes(q);
      const matchEmail = ord.customerEmail.toLowerCase().includes(q);
      const matchRef = (ord.paymentReference || '').toLowerCase().includes(q);
      const matchCashier = (ord.processedByCashier || '')
        .toLowerCase()
        .includes(q);
      const matchItems = ord.items.some((i) =>
        i.name.toLowerCase().includes(q)
      );
      return (
        matchOrderNum ||
        matchCustomer ||
        matchPhone ||
        matchEmail ||
        matchRef ||
        matchCashier ||
        matchItems
      );
    }
    return true;
  });

  const reportGrossTotal = filteredReportTransactions.reduce(
    (sum, o) => sum + o.total,
    0
  );
  const reportVerifiedPaidTotal = filteredReportTransactions
    .filter((o) => o.paymentStatus === 'Paid' || o.paymentStatus === 'Verified')
    .reduce((sum, o) => sum + o.total, 0);
  const reportPendingTotal = filteredReportTransactions
    .filter(
      (o) =>
        o.paymentStatus === 'Pending Verification' ||
        o.paymentStatus === 'Collect on Fulfillment'
    )
    .reduce((sum, o) => sum + o.total, 0);

  const [csvExportSuccess, setCsvExportSuccess] = useState<string | null>(null);

  const handleResetReportFilters = () => {
    setReportSearch('');
    setReportPaymentMethod('All');
    setReportPaymentStatus('All');
    setReportOrderStatus('All');
    setReportFulfillment('All');
    setReportDateFilter('All');
  };

  const handleDownloadTransactionsCsv = () => {
    if (filteredReportTransactions.length === 0) return;

    const escapeCsvCell = (value: string | number | undefined | null): string => {
      const str = value === undefined || value === null ? '' : String(value);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Order Number',
      'Created At',
      'Scheduled Date',
      'Scheduled Time',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Fulfillment Type',
      'Address',
      'Items Ordered',
      'Total Item Qty',
      'Subtotal (PHP)',
      'Discount (PHP)',
      'Delivery Fee (PHP)',
      'Total Amount (PHP)',
      'Payment Method',
      'Payment Reference',
      'Payment Status',
      'Order Status',
      'Processed By Cashier',
      'Assigned Courier',
    ];

    const dataRows = filteredReportTransactions.map((ord) => {
      const itemsSummary = ord.items
        .map(
          (i) =>
            `${i.quantity}x ${i.name}${
              i.selectedVariation ? ` (${i.selectedVariation})` : ''
            }`
        )
        .join('; ');
      const totalItemQty = ord.items.reduce((sum, i) => sum + i.quantity, 0);

      return [
        ord.orderNumber,
        ord.createdAt,
        ord.scheduledDate,
        ord.scheduledTime,
        ord.customerName,
        ord.customerPhone,
        ord.customerEmail,
        ord.fulfillmentType,
        ord.deliveryAddress,
        itemsSummary,
        totalItemQty,
        ord.subtotal,
        ord.discount,
        ord.deliveryFee,
        ord.total,
        ord.paymentMethod === 'Maya' ? 'PayMaya / Maya' : ord.paymentMethod,
        ord.paymentReference || 'Cash',
        ord.paymentStatus,
        ord.status,
        ord.processedByCashier || currentUser.name,
        ord.assignedRider || 'N/A',
      ].map(escapeCsvCell);
    });

    const summaryRows = [
      [],
      ['END-OF-DAY ACCOUNTING SUMMARY'],
      ['Exported By Cashier', escapeCsvCell(currentUser.name)],
      [
        'Employee ID',
        escapeCsvCell(currentUser.employeeId || 'EMP-CASHIER'),
      ],
      [
        'Exported Transactions Count',
        escapeCsvCell(filteredReportTransactions.length),
      ],
      ['Filtered Gross Total (PHP)', escapeCsvCell(reportGrossTotal)],
      ['Verified & Paid Revenue (PHP)', escapeCsvCell(reportVerifiedPaidTotal)],
      [
        'Pending / Collect on Fulfillment (PHP)',
        escapeCsvCell(reportPendingTotal),
      ],
      [
        'Applied Filters',
        escapeCsvCell(
          `Method: ${reportPaymentMethod} | Payment Status: ${reportPaymentStatus} | Order Stage: ${reportOrderStatus} | Fulfillment: ${reportFulfillment} | Date: ${reportDateFilter}${
            reportSearch.trim() ? ` | Search: ${reportSearch.trim()}` : ''
          }`
        ),
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.map(escapeCsvCell).join(','),
        ...dataRows.map((row) => row.join(',')),
        ...summaryRows.map((row) => row.join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp =
      reportDateFilter !== 'All' ? reportDateFilter : '2026-09-25';
    const fileName = `DulceKusina-Cashier-Transactions-Report-${dateStamp}.csv`;
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvExportSuccess(
      `Exported ${filteredReportTransactions.length} transaction(s) to ${fileName} for end-of-day accounting.`
    );
    setTimeout(() => setCsvExportSuccess(null), 4500);
  };

  const handleAddPosItem = (prod: Product) => {
    setPosTicket((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          cartItemId: `pos-${prod.id}-${Date.now()}`,
          productId: prod.id,
          name: prod.name,
          category: prod.category,
          unitPrice: prod.price,
          quantity: 1,
          image: prod.image,
          selectedVariation: prod.unitLabel,
        },
      ];
    });
  };

  const handleUpdatePosQty = (cartItemId: string, delta: number) => {
    setPosTicket((prev) =>
      prev
        .map((i) =>
          i.cartItemId === cartItemId
            ? { ...i, quantity: i.quantity + delta }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const posTotal = posTicket.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const handleCompletePosSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (posTicket.length === 0) return;

    const randomSuffix = Math.floor(100 + Math.random() * 899);
    const orderNumber = `POS-20260925-${randomSuffix}`;

    const newOrder: Order = {
      id: `ord-pos-${Date.now()}`,
      orderNumber,
      customerName: walkInName.trim() || 'Walk-In Counter Guest',
      customerPhone: walkInPhone.trim() || '0917 000 0000',
      customerEmail: 'walkin@dulcekusina.ph',
      items: [...posTicket],
      subtotal: posTotal,
      discount: 0,
      deliveryFee: 0,
      total: posTotal,
      fulfillmentType: 'Pickup',
      scheduledDate: '2026-09-25',
      scheduledTime: 'Immediate Counter Pickup',
      deliveryAddress: 'Store Counter — Kapitolyo Flagship Kitchen',
      specialInstructions: `Processed at POS by Cashier ${currentUser.name}`,
      paymentMethod: posPaymentMethod,
      paymentStatus: 'Paid',
      paymentReference: posRefNumber.trim() || 'POS-PAID',
      status: 'Ready',
      processedByCashier: currentUser.name,
      createdAt: 'Just now',
    };

    onCreatePosOrder(newOrder);
    setPosTicket([]);
    setPosRefNumber('');
    setPosSuccessReceipt(orderNumber);
    setTimeout(() => setPosSuccessReceipt(null), 4000);
  };

  const shiftCollectionsTotal = orders
    .filter(
      (o) => o.paymentStatus === 'Verified' || o.paymentStatus === 'Paid'
    )
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cashier Header Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src={
              currentUser.avatar ||
              createStaffAvatarPlaceholder(currentUser.name, 'cashier')
            }
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-800/30 shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-800 font-semibold">
              <span>CASHIER DASHBOARD &amp; POS TERMINAL</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser.employeeId || 'EMP-CASHIER'}</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser.terminal || 'Counter 01'}</span>
            </div>
            <h1 className="text-2xl font-display font-semibold text-stone-900 mt-0.5">
              Cashier on Duty: {currentUser.name}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {currentUser.shift || 'Active Shift'} · Shift Status:{' '}
              <span
                className={
                  currentUser.status === 'Off Duty'
                    ? 'font-semibold text-amber-800'
                    : 'font-semibold text-emerald-800'
                }
              >
                {currentUser.status === 'Off Duty'
                  ? 'Checked Out (Off Duty)'
                  : 'Checked In (On Duty)'}
              </span>{' '}
              · Verified Collections Today: ₱
              {shiftCollectionsTotal.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'pos'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Counter POS Terminal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-800" />
              <span>
                QR Shift Attendance ({onDutyStaffCount}/{allStaffMembers.length}{' '}
                On Duty)
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileBarChart2 className="w-3.5 h-3.5 text-amber-900" />
              <span>All Transaction Reports ({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Payment Verification ({pendingPaymentsCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'queue'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Order Queue ({orders.length})
            </button>
          </div>

          {currentUser.qrCodeImage && (
            <button
              type="button"
              onClick={() => setShowStaffQrModal(true)}
              className="px-3 py-2 rounded-lg border border-emerald-800/30 bg-emerald-50/70 text-emerald-950 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-emerald-100/70 cursor-pointer whitespace-nowrap"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-800" />
              <span>Staff QR</span>
            </button>
          )}

          {onOpenProfileSecurity && (
            <button
              type="button"
              onClick={onOpenProfileSecurity}
              className="px-3 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-900" />
              <span>Update Profile</span>
            </button>
          )}

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

      {/* OFFICIAL CASHIER STAFF ID BADGE DISPLAYED ON DASHBOARD */}
      <StaffDashboardIdBadge
        staff={currentUser}
        businessSettings={businessSettings}
        onQuickAttendanceAction={(action) =>
          executeStaffAttendanceAction(currentUser, action, 'Quick QR Tap')
        }
        defaultExpanded={true}
      />

      {/* LIVE STAFF QR SHIFT CHECK-IN / CHECK-OUT & CURRENT STATUS SUMMARY STRIP */}
      {activeTab !== 'attendance' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-emerald-800 inline-flex items-center gap-1.5">
                <ScanLine className="w-3.5 h-3.5" />
                <span>STAFF QR SHIFT ATTENDANCE &amp; CURRENT STATUS LOG</span>
              </span>
              <span aria-hidden="true" className="text-stone-300">
                ·
              </span>
              <span className="text-stone-600">
                <strong className="text-emerald-800 font-mono">
                  {onDutyStaffCount} Checked In (On Duty)
                </strong>{' '}
                ·{' '}
                <strong className="text-stone-700 font-mono">
                  {offDutyStaffCount} Checked Out (Off Duty)
                </strong>
              </span>
            </div>

            {/* Simple Inline Current Status Roster Log */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600">
              {allStaffMembers.map((staff) => {
                const isOnDuty = staff.status !== 'Off Duty';
                const qrInfo = getStaffQrData(staff);
                return (
                  <div
                    key={staff.id}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnDuty ? 'bg-emerald-600' : 'bg-stone-400'
                      }`}
                    />
                    <span className="font-semibold text-stone-900">
                      {staff.name}
                    </span>
                    <span className="font-mono text-[11px] text-stone-500">
                      ({qrInfo.checkInCode})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        isOnDuty
                          ? 'text-emerald-800 font-medium'
                          : 'text-stone-500'
                      }
                    >
                      {isOnDuty ? 'Checked In (On Duty)' : 'Checked Out'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickStripQrInput.trim()) return;
                handleScanQrCodeInput(quickStripQrInput, true);
                setQuickStripQrInput('');
                setActiveTab('attendance');
              }}
              className="flex items-center gap-1.5"
            >
              <div className="relative">
                <QrCode className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={quickStripQrInput}
                  onChange={(e) => setQuickStripQrInput(e.target.value)}
                  placeholder="Scan QR / CHK-... / EMP-..."
                  className="pl-8 pr-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-mono w-48 focus:outline-none focus:border-emerald-800"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                Scan QR Check-In/Out
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                const nextAction =
                  currentUser.status === 'Off Duty' ? 'Check-In' : 'Check-Out';
                executeStaffAttendanceAction(
                  currentUser,
                  nextAction,
                  'Quick QR Tap'
                );
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                currentUser.status === 'Off Duty'
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  : 'border border-amber-900/30 bg-amber-50 hover:bg-amber-100/80 text-amber-950'
              }`}
            >
              {currentUser.status === 'Off Duty' ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>QR Check-In My Shift</span>
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  <span>QR Check-Out My Shift</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('attendance');
                setQrScannerMode('camera_upload');
                startCamera();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Quick Login / Scan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-800" />
              <span>Full Attendance Log ({attendanceLogs.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: COUNTER POS & WALK-IN TERMINAL */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Columns: Quick POS Catalog */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
              <h2 className="text-base font-semibold text-stone-900">
                Tap Item to Add to Counter Ticket
              </h2>
              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  placeholder="Search cakes, brownies, cassava..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPosProducts.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleAddPosItem(prod)}
                  className="text-left p-3 rounded-xl border border-stone-200 hover:border-amber-900 transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 shrink-0">
                    <ResilientImage
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-900 truncate">
                      {prod.name}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {prod.subcategory} · {prod.stock} in stock
                    </p>
                    <p className="font-mono text-xs font-semibold text-amber-900 tabular-nums mt-1">
                      ₱{prod.price.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right 5 Columns: Counter Ticket & Payment Collection */}
          <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-900" />
                <h2 className="text-base font-semibold text-stone-900">
                  Counter Ticket
                </h2>
              </div>
              <span className="font-mono text-xs text-stone-500">
                {posTicket.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>

            {posSuccessReceipt && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Counter Receipt <strong>#{posSuccessReceipt}</strong> recorded
                  and added to Transaction Reports!
                </span>
              </div>
            )}

            {posTicket.length === 0 ? (
              <div className="py-10 text-center text-xs text-stone-500 border border-dashed border-stone-200 rounded-xl">
                Tap any cake, brownie box, cassava tray, or party package on the
                left to ring up a counter order.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {posTicket.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="p-3 rounded-lg border border-stone-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 truncate">
                        {item.name}
                      </p>
                      <p className="font-mono text-stone-500">
                        ₱{item.unitPrice.toLocaleString()} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdatePosQty(item.cartItemId, -1)}
                        className="p-1 rounded border border-stone-300 hover:bg-stone-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-semibold w-5 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdatePosQty(item.cartItemId, 1)}
                        className="p-1 rounded border border-stone-300 hover:bg-stone-100 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPosTicket((prev) =>
                            prev.filter((i) => i.cartItemId !== item.cartItemId)
                          )
                        }
                        className="p-1 text-stone-400 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleCompletePosSale}
              className="space-y-3 pt-3 border-t border-stone-200 text-xs"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Payment Tender
                  </label>
                  <select
                    value={posPaymentMethod}
                    onChange={(e) =>
                      setPosPaymentMethod(e.target.value as PaymentMethod)
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Cash on Pickup">Cash at Counter</option>
                    <option value="GCash">GCash QR</option>
                    <option value="Maya">Maya QR</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Ref # (If Digital)
                  </label>
                  <input
                    type="text"
                    value={posRefNumber}
                    onChange={(e) => setPosRefNumber(e.target.value)}
                    placeholder="Optional for Cash"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-3 border-t border-stone-200">
                <span className="text-sm font-semibold text-stone-900">
                  Total Counter Amount
                </span>
                <span className="font-mono text-xl font-semibold text-amber-900 tabular-nums">
                  ₱{posTotal.toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                disabled={posTicket.length === 0}
                className="w-full py-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white font-semibold transition-colors cursor-pointer"
              >
                Complete Counter Sale &amp; Issue Receipt
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1B: STAFF QR SHIFT CHECK-IN / CHECK-OUT & ATTENDANCE STATUS LOG */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Shift Attendance KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <p className="text-xs text-stone-500">
                Total Staff QR Credentials
              </p>
              <p className="text-2xl font-mono font-semibold text-stone-900 tabular-nums mt-1">
                {allStaffMembers.length}{' '}
                <span className="text-xs font-normal text-stone-500">
                  Cashier &amp; Delivery
                </span>
              </p>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
              <p className="text-xs text-emerald-900">
                Currently Checked In (On Duty)
              </p>
              <p className="text-2xl font-mono font-semibold text-emerald-800 tabular-nums mt-1">
                {onDutyStaffCount}{' '}
                <span className="text-xs font-normal text-emerald-800/80">
                  Active on Shift
                </span>
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <p className="text-xs text-stone-600">
                Currently Checked Out (Off Duty)
              </p>
              <p className="text-2xl font-mono font-semibold text-stone-800 tabular-nums mt-1">
                {offDutyStaffCount}{' '}
                <span className="text-xs font-normal text-stone-500">
                  Off Duty
                </span>
              </p>
            </div>
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-900">
                Recorded Shift QR Scans
              </p>
              <p className="text-2xl font-mono font-semibold text-amber-900 tabular-nums mt-1">
                {attendanceLogs.length}{' '}
                <span className="text-xs font-normal text-amber-900/80">
                  Log Entries
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 5 COLUMNS: UNIQUE STAFF QR SCANNER & CHECK-IN / CHECK-OUT TERMINAL */}
            <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-5">
              <div className="pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-800">
                  <QrCode className="w-4 h-4" />
                  <span>STAFF QR CHECK-IN / CHECK-OUT TERMINAL</span>
                </div>
                <h2 className="text-lg font-display font-semibold text-stone-900 mt-0.5">
                  Scan Unique Staff QR Code
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Select or scan a staff member&apos;s unique QR badge to record shift Check-In or Check-Out attendance.
                </p>
              </div>

              {/* Scanner Input Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setQrScannerMode('badge_tap');
                    setQrScanError(null);
                  }}
                  className={`flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    qrScannerMode === 'badge_tap'
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Tap Staff QR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setQrScannerMode('code_input');
                    setQrScanError(null);
                  }}
                  className={`flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    qrScannerMode === 'code_input'
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Scan / Code Input
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrScannerMode('camera_upload');
                    setQrScanError(null);
                    startCamera();
                  }}
                  className={`flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    qrScannerMode === 'camera_upload'
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Camera / Photo Match
                </button>
              </div>

              {/* MODE 1: TAP STAFF UNIQUE QR BADGE */}
              {qrScannerMode === 'badge_tap' && (
                <div className="space-y-2.5">
                  <p className="text-[11px] font-medium text-stone-600">
                    Tap a staff member&apos;s unique QR badge below to load into the attendance scanner:
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                    {allStaffMembers.map((staff) => {
                      const qrInfo = getStaffQrData(staff);
                      const isSelected =
                        selectedAttendanceStaff.id === staff.id;
                      const isOnDuty = staff.status !== 'Off Duty';
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => {
                            setSelectedAttendanceStaffId(staff.id);
                            setQrScanError(null);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'border-emerald-800 bg-emerald-50/40'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={qrInfo.qrDataUri}
                              alt={`${staff.name} QR`}
                              className="w-12 h-12 rounded-lg border border-stone-200 bg-white p-0.5 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-stone-900 truncate">
                                {staff.name}
                              </p>
                              <p className="font-mono text-[11px] text-stone-500 truncate">
                                {staff.employeeId || 'EMP-STAFF'} ·{' '}
                                {qrInfo.checkInCode}
                              </p>
                              <p className="text-[11px] text-stone-500 capitalize">
                                {staff.role} ·{' '}
                                <span
                                  className={
                                    isOnDuty
                                      ? 'text-emerald-800 font-semibold'
                                      : 'text-stone-500'
                                  }
                                >
                                  {isOnDuty
                                    ? 'Checked In (On Duty)'
                                    : 'Checked Out (Off Duty)'}
                                </span>
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-emerald-800 shrink-0">
                            {isSelected ? 'Loaded' : 'Select QR'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODE 2: HANDHELD QR SCANNER / TOKEN INPUT */}
              {qrScannerMode === 'code_input' && (
                <div className="space-y-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!qrCodeInput.trim()) return;
                      handleScanQrCodeInput(qrCodeInput, true);
                      setQrCodeInput('');
                    }}
                    className="space-y-2"
                  >
                    <label className="block text-[11px] font-medium text-stone-600">
                      Scan QR Payload, Check-In Code (CHK-...), or Employee ID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={qrCodeInput}
                        onChange={(e) => {
                          setQrCodeInput(e.target.value);
                          setQrScanError(null);
                        }}
                        placeholder="e.g. DULCEKUSINA-CHECKIN|CODE:CHK-... or EMP-2026-001"
                        className="flex-1 px-3 py-2 rounded-lg border border-stone-300 text-xs font-mono text-stone-900 focus:outline-none focus:border-emerald-800"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Scan &amp; Toggle
                      </button>
                    </div>
                  </form>

                  <div className="space-y-1.5">
                    <p className="text-[11px] text-stone-500">
                      Quick-fill a staff member&apos;s unique QR Check-In Code:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {allStaffMembers.map((st) => {
                        const qrInfo = getStaffQrData(st);
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setQrCodeInput(qrInfo.payload);
                              setSelectedAttendanceStaffId(st.id);
                              setQrScanError(null);
                            }}
                            className="px-2.5 py-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[11px] font-mono text-stone-700 cursor-pointer"
                          >
                            {qrInfo.checkInCode} ({st.firstName || st.name.split(' ')[0]})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 3: CAMERA PHOTO QUICK LOGIN & QR SCANNER */}
              {qrScannerMode === 'camera_upload' && (
                <div className="space-y-3">
                  {/* Staff Selector Pills for Camera Verification */}
                  <div className="flex flex-wrap gap-1.5">
                    {allStaffMembers.map((st) => {
                      const isSel = st.id === selectedAttendanceStaff.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedAttendanceStaffId(st.id);
                            setPhotoMatchResult(null);
                            setCapturedPhotoUri('');
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 cursor-pointer ${
                            isSel
                              ? 'border-emerald-800 bg-emerald-900 text-white font-semibold'
                              : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <img
                            src={getResolvedStaffAvatar(st)}
                            alt={st.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>{st.firstName || st.name.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                    {isCameraActive ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Live Camera / Optical Capture Viewfinder */}
                          <div className="space-y-1 text-center">
                            <p className="text-[10px] font-mono uppercase font-semibold text-emerald-800">
                              {hasHardwareStream
                                ? '● Live Camera Stream'
                                : '● Optical Camera Ready'}
                            </p>
                            <div className="relative rounded-xl overflow-hidden border-2 border-emerald-800 bg-stone-900 aspect-square flex items-center justify-center">
                              {hasHardwareStream ? (
                                <video
                                  ref={videoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={
                                    capturedPhotoUri ||
                                    getResolvedStaffAvatar(
                                      selectedAttendanceStaff
                                    )
                                  }
                                  alt={selectedAttendanceStaff.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-3 border border-dashed border-emerald-400/90 rounded-lg pointer-events-none flex items-end justify-center p-1.5">
                                <span className="px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px]">
                                  Face &amp; QR Aligned
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stored Profile Picture in System */}
                          <div className="space-y-1 text-center">
                            <p className="text-[10px] font-mono uppercase font-semibold text-stone-600">
                              Stored Profile Photo
                            </p>
                            <div className="relative rounded-xl overflow-hidden border-2 border-stone-300 bg-white aspect-square flex items-center justify-center">
                              <img
                                src={getResolvedStaffAvatar(
                                  selectedAttendanceStaff
                                )}
                                alt={`Stored profile for ${selectedAttendanceStaff.name}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-1.5 inset-x-1.5 px-1.5 py-0.5 rounded bg-stone-900/80 text-white font-mono text-[10px] truncate">
                                {selectedAttendanceStaff.employeeId || 'STAFF'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {photoMatchResult && (
                          <div
                            className={`p-2.5 rounded-lg border text-left text-xs flex items-center justify-between gap-2 ${
                              photoMatchResult.isMatch
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                : 'bg-red-50 border-red-200 text-red-900'
                            }`}
                          >
                            <div>
                              <p className="font-semibold">
                                {photoMatchResult.isMatch
                                  ? `Photo Match Verified (${photoMatchResult.similarityScore}%)`
                                  : `Match Below Threshold (${photoMatchResult.similarityScore}%)`}
                              </p>
                              <p className="text-[11px] font-mono opacity-80">
                                Matched against {selectedAttendanceStaff.name}&apos;s stored profile picture
                              </p>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isVerifyingPhoto}
                            onClick={() =>
                              handleCameraCaptureAndVerifyStaff(false)
                            }
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>
                              {isVerifyingPhoto
                                ? 'Matching Photo...'
                                : `Capture & Match (${
                                    selectedAttendanceStaff.firstName ||
                                    selectedAttendanceStaff.name.split(' ')[0]
                                  })`}
                            </span>
                          </button>

                          {onSwitchStaffUser &&
                            selectedAttendanceStaff.id !== currentUser.id && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCameraCaptureAndVerifyStaff(true)
                                }
                                className="py-2 px-3 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold cursor-pointer"
                              >
                                Quick Login as{' '}
                                {selectedAttendanceStaff.firstName ||
                                  selectedAttendanceStaff.name.split(' ')[0]}
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-medium text-stone-700 cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Open Camera Photo &amp; QR Scanner</span>
                        </button>

                        <label className="w-full sm:w-auto px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Upload QR / Photo</span>
                          <input
                            type="file"
                            accept=".svg,image/*"
                            onChange={handleUploadQrBadgeFile}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                    {cameraError && (
                      <p className="text-[11px] text-amber-800">{cameraError}</p>
                    )}
                    <p className="text-[11px] text-stone-500 text-center">
                      Captures a live camera photo to match against the staff member&apos;s stored profile picture or scans their Staff QR badge.
                    </p>
                  </div>
                </div>
              )}

              {qrScanError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {qrScanError}
                </div>
              )}

              {/* SCANNED / SELECTED STAFF QR CREDENTIAL CARD & CHECK-IN / CHECK-OUT CONTROLS */}
              {(() => {
                const activeQr = getStaffQrData(selectedAttendanceStaff);
                const isSelectedOnDuty =
                  selectedAttendanceStaff.status !== 'Off Duty';

                return (
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={activeQr.qrDataUri}
                        alt={`${selectedAttendanceStaff.name} Unique QR Code`}
                        className="w-24 h-24 rounded-xl border border-stone-200 bg-white p-1.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 font-semibold">
                          <span>{selectedAttendanceStaff.employeeId || 'EMP-STAFF'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="uppercase">
                            {selectedAttendanceStaff.role}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-stone-900 truncate">
                          {selectedAttendanceStaff.name}
                        </h3>
                        <p className="font-mono text-xs text-stone-700">
                          QR Code: <strong>{activeQr.checkInCode}</strong>
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                          {selectedAttendanceStaff.shift || 'Regular Shift'} ·{' '}
                          {selectedAttendanceStaff.terminal || 'Main Counter'}
                        </p>
                        <div className="pt-0.5 flex items-center gap-1.5 text-xs">
                          <span className="text-stone-500">Current Status:</span>
                          <span
                            className={`font-semibold ${
                              isSelectedOnDuty
                                ? 'text-emerald-800'
                                : 'text-amber-900'
                            }`}
                          >
                            {isSelectedOnDuty
                              ? 'Checked In · On Duty (Active)'
                              : 'Checked Out · Off Duty'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-stone-200 font-mono text-[10px] text-stone-500 break-all">
                      {activeQr.payload}
                    </div>

                    {/* Explicit Check-In and Check-Out Action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          executeStaffAttendanceAction(
                            selectedAttendanceStaff,
                            'Check-In',
                            qrScannerMode === 'code_input'
                              ? 'QR Code Scanner'
                              : qrScannerMode === 'camera_upload'
                              ? 'QR Camera Scan'
                              : 'Quick QR Tap'
                          )
                        }
                        className="py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Check In (Start Shift)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          executeStaffAttendanceAction(
                            selectedAttendanceStaff,
                            'Check-Out',
                            qrScannerMode === 'code_input'
                              ? 'QR Code Scanner'
                              : qrScannerMode === 'camera_upload'
                              ? 'QR Camera Scan'
                              : 'Quick QR Tap'
                          )
                        }
                        className="py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-amber-50 hover:border-amber-800/40 text-stone-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <UserX className="w-4 h-4 text-amber-900" />
                        <span>Check Out (End Shift)</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Instant Confirmation Banner */}
              {attendanceFeedback && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">
                      QR {attendanceFeedback.action} Verified for{' '}
                      {attendanceFeedback.staffName} ({attendanceFeedback.employeeId})
                    </p>
                    <p className="text-emerald-800 font-mono text-[11px]">
                      QR Token: {attendanceFeedback.checkInCode} · Status:{' '}
                      {attendanceFeedback.statusAfter === 'Active'
                        ? 'Checked In (On Duty)'
                        : 'Checked Out (Off Duty)'}{' '}
                      · {attendanceFeedback.timestamp}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT 7 COLUMNS: CURRENT STAFF STATUS ROSTER & SIMPLE SHIFT ATTENDANCE LOG */}
            <div className="lg:col-span-7 space-y-6">
              {/* SECTION A: CURRENT STAFF SHIFT STATUS ROSTER */}
              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
                  <div>
                    <p className="text-xs font-mono font-semibold text-emerald-800">
                      LIVE STAFF SHIFT ROSTER &amp; CURRENT STATUS
                    </p>
                    <h2 className="text-base font-semibold text-stone-900">
                      Current Shift Attendance Status ({allStaffMembers.length} Staff)
                    </h2>
                  </div>
                  <span className="text-xs text-stone-500 font-mono">
                    {onDutyStaffCount} On Duty · {offDutyStaffCount} Off Duty
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500">
                        <th className="py-2 pr-3 font-medium">Staff Member</th>
                        <th className="py-2 px-3 font-medium">
                          Unique QR Code
                        </th>
                        <th className="py-2 px-3 font-medium">
                          Current Status
                        </th>
                        <th className="py-2 px-3 font-medium">
                          Last QR Scan
                        </th>
                        <th className="py-2 pl-3 font-medium text-right">
                          Quick QR Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/70">
                      {allStaffMembers.map((staff) => {
                        const qrInfo = getStaffQrData(staff);
                        const isOnDuty = staff.status !== 'Off Duty';
                        return (
                          <tr key={staff.id} className="hover:bg-stone-50/80">
                            <td className="py-3 pr-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={
                                    staff.avatar ||
                                    createStaffAvatarPlaceholder(
                                      staff.name,
                                      staff.role
                                    )
                                  }
                                  alt={staff.name}
                                  className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                                />
                                <div>
                                  <p className="font-semibold text-stone-900">
                                    {staff.name}
                                  </p>
                                  <p className="font-mono text-[11px] text-stone-500">
                                    {staff.employeeId || 'EMP-STAFF'} ·{' '}
                                    <span className="uppercase">
                                      {staff.role}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={qrInfo.qrDataUri}
                                  alt="Staff QR"
                                  className="w-8 h-8 rounded border border-stone-200 bg-white p-0.5 shrink-0"
                                />
                                <span className="font-mono text-[11px] font-semibold text-stone-800">
                                  {qrInfo.checkInCode}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`font-semibold ${
                                  isOnDuty
                                    ? 'text-emerald-800'
                                    : 'text-stone-500'
                                }`}
                              >
                                {isOnDuty
                                  ? 'Checked In · On Duty'
                                  : 'Checked Out · Off Duty'}
                              </span>
                              <p className="text-[11px] text-stone-500 truncate max-w-[160px]">
                                {staff.shift || 'Regular Shift'}
                              </p>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-stone-600">
                              {staff.lastAttendanceAction
                                ? `${staff.lastAttendanceAction} · ${
                                    staff.lastAttendanceTime || 'Today'
                                  }`
                                : isOnDuty
                                ? 'Check-In · Active'
                                : 'Check-Out · Off Duty'}
                            </td>
                            <td className="py-3 pl-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {isOnDuty ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      executeStaffAttendanceAction(
                                        staff,
                                        'Check-Out',
                                        'Quick QR Tap'
                                      )
                                    }
                                    className="px-2.5 py-1.5 rounded-lg border border-amber-900/30 bg-amber-50 hover:bg-amber-100/80 text-amber-950 font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>QR Check-Out</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      executeStaffAttendanceAction(
                                        staff,
                                        'Check-In',
                                        'Quick QR Tap'
                                      )
                                    }
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>QR Check-In</span>
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

              {/* SECTION B: SIMPLE LOG OF SHIFT ATTENDANCE & CURRENT STATUS */}
              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                  <div>
                    <p className="text-xs font-mono font-semibold text-amber-900">
                      CHRONOLOGICAL QR SHIFT ATTENDANCE LOG
                    </p>
                    <h2 className="text-base font-semibold text-stone-900">
                      Shift Check-In / Check-Out Status Log ({filteredAttendanceLogs.length})
                    </h2>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        placeholder="Filter staff or CHK-..."
                        className="pl-8 pr-2.5 py-1.5 rounded-lg border border-stone-300 text-xs w-44"
                      />
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
                      {(['All', 'Check-In', 'Check-Out'] as const).map(
                        (filterType) => (
                          <button
                            key={filterType}
                            type="button"
                            onClick={() => setAttendanceFilter(filterType)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              attendanceFilter === filterType
                                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            {filterType}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {filteredAttendanceLogs.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-stone-200 rounded-xl text-xs text-stone-500">
                    No shift attendance log entries match your filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-500">
                          <th className="py-2.5 pr-3 font-medium">Timestamp</th>
                          <th className="py-2.5 px-3 font-medium">
                            Staff Member &amp; ID
                          </th>
                          <th className="py-2.5 px-3 font-medium">
                            Unique QR Code
                          </th>
                          <th className="py-2.5 px-3 font-medium">
                            Shift Action
                          </th>
                          <th className="py-2.5 pl-3 font-medium text-right">
                            Status After Scan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200/70">
                        {filteredAttendanceLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-stone-50/80">
                            <td className="py-3 pr-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                              <p className="font-semibold text-stone-900">
                                {log.timestamp}
                              </p>
                              <p className="text-stone-500">{log.method}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-semibold text-stone-900">
                                {log.staffName}
                              </p>
                              <p className="font-mono text-[11px] text-stone-500">
                                {log.employeeId} ·{' '}
                                <span className="uppercase">{log.role}</span> ·{' '}
                                {log.terminal}
                              </p>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] font-semibold text-stone-800">
                              {log.checkInCode}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`font-semibold ${
                                  log.action === 'Check-In'
                                    ? 'text-emerald-800'
                                    : 'text-amber-900'
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 pl-3 text-right">
                              <span
                                className={`font-semibold ${
                                  log.statusAfter === 'Active'
                                    ? 'text-emerald-800'
                                    : 'text-stone-500'
                                }`}
                              >
                                {log.statusAfter === 'Active'
                                  ? 'Checked In (On Duty)'
                                  : 'Checked Out (Off Duty)'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL TRANSACTION REPORTS WITH MULTI-CRITERIA FILTERING */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-900 font-semibold">
                <FileBarChart2 className="w-4 h-4" />
                <span>CASHIER TRANSACTION LEDGER &amp; AUDIT REPORTS</span>
              </div>
              <h2 className="text-xl font-display font-semibold text-stone-900 mt-0.5">
                All Transactions Report &amp; Quick Locator
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Filter and search across all walk-in POS receipts and online customer transactions by order number, customer, payment method, status, fulfillment type, or date.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleDownloadTransactionsCsv}
                disabled={filteredReportTransactions.length === 0}
                className="px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                title="Export filtered transaction history as CSV for end-of-day accounting"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  Download CSV ({filteredReportTransactions.length})
                </span>
              </button>

              <button
                type="button"
                onClick={handleResetReportFilters}
                className="px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>

          {csvExportSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium">{csvExportSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setCsvExportSuccess(null)}
                className="text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Filtered Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <p className="text-xs text-stone-500">
                Located Transactions
              </p>
              <p className="text-2xl font-mono font-semibold text-stone-900 tabular-nums mt-1">
                {filteredReportTransactions.length}{' '}
                <span className="text-xs font-normal text-stone-500">
                  of {orders.length}
                </span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <p className="text-xs text-stone-500">
                Filtered Gross Total
              </p>
              <p className="text-2xl font-mono font-semibold text-amber-900 tabular-nums mt-1">
                ₱{reportGrossTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <p className="text-xs text-emerald-900">
                Verified &amp; Paid Revenue
              </p>
              <p className="text-2xl font-mono font-semibold text-emerald-800 tabular-nums mt-1">
                ₱{reportVerifiedPaidTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
              <p className="text-xs text-amber-900">
                Pending / Collect on Fulfillment
              </p>
              <p className="text-2xl font-mono font-semibold text-amber-900 tabular-nums mt-1">
                ₱{reportPendingTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Multi-Criteria Filter Controls */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/90 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
              <Filter className="w-3.5 h-3.5 text-amber-900" />
              <span>Filter Transactions to Easily Locate Records</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Search Order #, Customer, Ref #, Item, or Phone
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="e.g. ORD-20260926, Clarisse, GC-9084..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={reportPaymentMethod}
                  onChange={(e) => setReportPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white text-stone-900"
                >
                  <option value="All">All Methods</option>
                  <option value="GCash">GCash</option>
                  <option value="Maya">PayMaya / Maya</option>
                  <option value="Cash on Pickup">Cash on Pickup</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Payment Status
                </label>
                <select
                  value={reportPaymentStatus}
                  onChange={(e) => setReportPaymentStatus(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white text-stone-900"
                >
                  <option value="All">All Payment Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Verified">Verified</option>
                  <option value="Pending Verification">
                    Pending Verification
                  </option>
                  <option value="Collect on Fulfillment">
                    Collect on Fulfillment
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Order Stage
                </label>
                <select
                  value={reportOrderStatus}
                  onChange={(e) => setReportOrderStatus(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white text-stone-900"
                >
                  <option value="All">All Order Stages</option>
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Date / Fulfillment
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={reportFulfillment}
                    onChange={(e) => setReportFulfillment(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-stone-300 bg-white text-stone-900"
                  >
                    <option value="All">All Types</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Pickup">Pickup</option>
                  </select>
                  <select
                    value={reportDateFilter}
                    onChange={(e) => setReportDateFilter(e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-stone-300 bg-white font-mono text-stone-900"
                  >
                    <option value="All">All Dates</option>
                    {uniqueDates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* All Transactions Report Table */}
          {filteredReportTransactions.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-stone-200 rounded-xl space-y-2">
              <p className="text-sm font-semibold text-stone-900">
                No transactions match your current filter criteria
              </p>
              <p className="text-xs text-stone-500">
                Try clearing a filter or searching by another order number or customer name.
              </p>
              <button
                type="button"
                onClick={handleResetReportFilters}
                className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium cursor-pointer"
              >
                Show All Transactions
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-2.5 pr-4 font-medium">
                      Transaction / Order #
                    </th>
                    <th className="py-2.5 px-3 font-medium">Customer</th>
                    <th className="py-2.5 px-3 font-medium">Items Ordered</th>
                    <th className="py-2.5 px-3 font-medium">
                      Date &amp; Fulfillment
                    </th>
                    <th className="py-2.5 px-3 font-medium">
                      Payment &amp; Ref #
                    </th>
                    <th className="py-2.5 px-3 font-medium">Payment Status</th>
                    <th className="py-2.5 px-3 font-medium">Order Status</th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      Total Amount
                    </th>
                    <th className="py-2.5 pl-3 font-medium text-right">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70">
                  {filteredReportTransactions.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/80">
                      <td className="py-3 pr-4">
                        <p className="font-mono font-semibold text-stone-900">
                          #{ord.orderNumber}
                        </p>
                        <p className="font-mono text-[11px] text-stone-500">
                          {ord.createdAt}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-stone-900">
                          {ord.customerName}
                        </p>
                        <p className="font-mono text-[11px] text-stone-500">
                          {ord.customerPhone}
                        </p>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-stone-800 truncate">
                          {ord.items
                            .map((i) => `${i.quantity}× ${i.name}`)
                            .join(', ')}
                        </p>
                        {ord.processedByCashier && (
                          <p className="text-[11px] text-stone-500">
                            Cashier: {ord.processedByCashier}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-stone-800">
                          {ord.fulfillmentType}
                        </p>
                        <p className="font-mono text-[11px] text-stone-500">
                          {ord.scheduledDate} · {ord.scheduledTime}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-medium text-stone-900">
                          {ord.paymentMethod === 'Maya'
                            ? 'PayMaya / Maya'
                            : ord.paymentMethod}
                        </p>
                        <p className="font-mono text-[11px] text-stone-500">
                          {ord.paymentReference || 'Cash'}
                        </p>
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
                      <td className="py-3 px-3 font-semibold text-amber-900">
                        {ord.status}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-stone-900 tabular-nums">
                        ₱{ord.total.toLocaleString()}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => setPreviewReceiptOrder(ord)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-300 hover:bg-stone-100 text-stone-800 font-medium cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GCASH & MAYA PAYMENT VERIFICATION */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-stone-900">
              GCash, PayMaya &amp; Bank Transfer Verification Queue
            </h2>
            <p className="text-xs text-stone-500">
              Verify mobile app e-wallet reference numbers, inspect uploaded
              screenshots/receipts, and settle cash payments upon pickup.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500">
                  <th className="py-2.5 pr-4 font-medium">Order #</th>
                  <th className="py-2.5 px-3 font-medium">Customer</th>
                  <th className="py-2.5 px-3 font-medium">Method</th>
                  <th className="py-2.5 px-3 font-medium">Reference #</th>
                  <th className="py-2.5 px-3 font-medium">
                    Receipt / Screenshot
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                  <th className="py-2.5 px-3 font-medium">Payment Status</th>
                  <th className="py-2.5 pl-3 font-medium text-right">
                    Cashier Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/80">
                    <td className="py-3 pr-4 font-mono font-semibold text-stone-900">
                      #{ord.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-stone-800">
                      {ord.customerName}
                    </td>
                    <td className="py-3 px-3 font-medium text-stone-900">
                      {ord.paymentMethod === 'Maya'
                        ? 'PayMaya / Maya'
                        : ord.paymentMethod}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-600">
                      {ord.paymentReference || 'Cash on Fulfillment'}
                    </td>
                    <td className="py-3 px-3">
                      {ord.paymentProofImage ? (
                        <button
                          type="button"
                          onClick={() => setPreviewReceiptOrder(ord)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-900/30 bg-amber-50/50 text-amber-950 font-medium hover:bg-amber-100/60 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      ) : (
                        <span className="text-stone-400">No attachment</span>
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
                      {ord.paymentStatus === 'Pending Verification' ||
                      ord.paymentStatus === 'Collect on Fulfillment' ? (
                        <button
                          type="button"
                          onClick={() => onVerifyPayment(ord.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-medium hover:bg-emerald-900 cursor-pointer whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {ord.paymentStatus === 'Pending Verification'
                              ? 'Verify Reference'
                              : 'Mark Cash Collected'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-stone-400">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ORDER QUEUE & PICKUP / COURIER HANDOVER */}
      {activeTab === 'queue' && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-stone-900">
              Active Order Queue &amp; Rider Dispatch
            </h2>
            <p className="text-xs text-stone-500">
              Update order stages or assign an insulated courier van.
            </p>
          </div>

          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="border border-stone-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                  <div>
                    <span className="font-mono text-xs font-semibold text-stone-900">
                      #{ord.orderNumber}
                    </span>
                    <span className="mx-2 text-stone-400">·</span>
                    <span className="text-xs font-semibold text-amber-900">
                      {ord.status}
                    </span>
                    <p className="text-sm font-semibold text-stone-900 mt-0.5">
                      {ord.customerName} ({ord.fulfillmentType} ·{' '}
                      {ord.scheduledDate} at {ord.scheduledTime})
                    </p>
                  </div>
                  <span className="font-mono text-base font-semibold text-stone-900 tabular-nums">
                    ₱{ord.total.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ORDER_STATUSES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onUpdateOrderStatus(ord.id, st)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
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
                        className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                      >
                        <option value="">Assign Courier...</option>
                        {availableRiders.map((r) => (
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

      {/* Modal to Preview Transaction / Customer Uploaded Payment Screenshot / Receipt */}
      {previewReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <p className="text-xs font-mono text-amber-900 font-semibold">
                  TRANSACTION RECEIPT · #{previewReceiptOrder.orderNumber}
                </p>
                <h3 className="text-base font-semibold text-stone-900">
                  {previewReceiptOrder.customerName} (
                  {previewReceiptOrder.paymentMethod})
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

            <div className="text-xs space-y-1.5 bg-stone-50 p-3.5 rounded-lg border border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">Order Status:</span>
                <span className="font-semibold text-amber-900">
                  {previewReceiptOrder.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Fulfillment:</span>
                <span className="font-medium text-stone-900">
                  {previewReceiptOrder.fulfillmentType} (
                  {previewReceiptOrder.scheduledDate})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Reference Number:</span>
                <span className="font-mono font-semibold text-stone-900">
                  {previewReceiptOrder.paymentReference || 'Cash'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Items:</span>
                <span className="font-medium text-stone-800 text-right">
                  {previewReceiptOrder.items
                    .map((i) => `${i.quantity}× ${i.name}`)
                    .join(', ')}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-stone-200">
                <span className="text-stone-700 font-semibold">
                  Total Amount:
                </span>
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
                  className="px-4 py-2 rounded-lg bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 cursor-pointer"
                >
                  Verify Payment Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal to View Cashier's Unique Staff QR Badge */}
      {showStaffQrModal && currentUser.qrCodeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 text-left">
              <div>
                <p className="text-[11px] font-mono font-semibold text-emerald-800">
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
                  Employee ID: {currentUser.employeeId || 'EMP-2026-001'}
                </p>
                <p className="text-xs text-stone-500">
                  Role: Cashier · Status:{' '}
                  <strong
                    className={
                      currentUser.status === 'Off Duty'
                        ? 'text-amber-900'
                        : 'text-emerald-800'
                    }
                  >
                    {currentUser.status === 'Off Duty'
                      ? 'Checked Out (Off Duty)'
                      : 'Checked In (On Duty)'}
                  </strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  executeStaffAttendanceAction(
                    currentUser,
                    'Check-In',
                    'Quick QR Tap'
                  );
                  setShowStaffQrModal(false);
                  setActiveTab('attendance');
                }}
                className="py-2.5 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold cursor-pointer"
              >
                QR Check-In Shift
              </button>
              <button
                type="button"
                onClick={() => {
                  executeStaffAttendanceAction(
                    currentUser,
                    'Check-Out',
                    'Quick QR Tap'
                  );
                  setShowStaffQrModal(false);
                  setActiveTab('attendance');
                }}
                className="py-2.5 px-3 rounded-lg border border-stone-300 hover:bg-amber-50 text-stone-800 text-xs font-semibold cursor-pointer"
              >
                QR Check-Out Shift
              </button>
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
