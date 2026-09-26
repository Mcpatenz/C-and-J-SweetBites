import React, { useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  Check,
  QrCode,
  Scissors,
  UserCheck,
  Phone,
  MapPin,
  Mail,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  Layers,
  CreditCard,
  Grid,
} from 'lucide-react';
import { BusinessSettings, UserAccount } from '../types/bakery';
import {
  calculateAgeFromBirthdate,
  calculateLengthOfService,
  createStaffAvatarPlaceholder,
  downloadPrintableStaffIdCardSvg,
  downloadStaffQrBadgeSvg,
  generateUniqueStaffQrDataUri,
} from '../utils/staffHelpers';

interface PrintableStaffIdViewProps {
  staffList: UserAccount[];
  selectedStaff: UserAccount | null;
  onSelectStaff: (staff: UserAccount) => void;
  businessSettings: BusinessSettings;
  checkedInStaffTimes: Record<string, string>;
  onQuickCheckInStaff: (staff: UserAccount) => void;
  onShareStaffQrBadge: (staff: UserAccount) => void;
  sharedStaffId: string | null;
  onBackToDirectory?: () => void;
}

type BadgeOrientation = 'portrait' | 'landscape';
type BadgeLayoutMode = 'duplex' | 'single' | 'sheet';

export const PrintableStaffIdView: React.FC<PrintableStaffIdViewProps> = ({
  staffList,
  selectedStaff,
  onSelectStaff,
  businessSettings,
  checkedInStaffTimes,
  onQuickCheckInStaff,
  onShareStaffQrBadge,
  sharedStaffId,
  onBackToDirectory,
}) => {
  const [orientation, setOrientation] = useState<BadgeOrientation>('portrait');
  const [layoutMode, setLayoutMode] = useState<BadgeLayoutMode>('duplex');
  const [roleFilter, setRoleFilter] = useState<'all' | 'cashier' | 'delivery'>(
    'all'
  );
  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [showOtpCredential, setShowOtpCredential] = useState<boolean>(true);

  const filteredStaff = staffList.filter((s) =>
    roleFilter === 'all' ? true : s.role === roleFilter
  );

  const activeStaff =
    selectedStaff || filteredStaff[0] || staffList[0] || null;

  const resolveStaffQr = (staff: UserAccount) => {
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

  const handlePrintNow = () => {
    window.print();
  };

  if (!activeStaff) {
    return (
      <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
        No staff accounts available. Add a Cashier or Delivery staff member first to generate their printable Staff ID badge.
      </div>
    );
  }

  const renderPortraitFrontCard = (staff: UserAccount, includeLargeQr: boolean) => {
    const qr = resolveStaffQr(staff);
    const isDelivery = staff.role === 'delivery';
    const computedAge =
      staff.age ?? calculateAgeFromBirthdate(staff.birthdate || '');
    const formattedName =
      staff.lastName && staff.firstName
        ? `${staff.lastName.toUpperCase()}, ${staff.firstName} ${
            staff.middleName || ''
          }`.trim()
        : staff.name;

    return (
      <div
        className={`relative bg-[#FAF9F6] border-2 border-stone-300 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between select-none print:shadow-none ${
          includeLargeQr ? 'w-[336px] min-h-[536px]' : 'w-[336px] min-h-[520px]'
        }`}
      >
        {/* Top Header Band with Lanyard Slot Punch */}
        <div
          className={`px-4 pt-3 pb-3.5 text-white relative ${
            isDelivery ? 'bg-amber-900' : 'bg-emerald-900'
          }`}
        >
          {/* Standard Lanyard Slot Punch Guide (13mm x 3mm) */}
          <div className="mx-auto w-14 h-2.5 rounded-full bg-[#FAF9F6] border border-black/20 mb-2.5 shadow-inner" />

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display font-bold text-sm tracking-tight truncate">
                {businessSettings.businessName}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-stone-200">
                OFFICIAL STAFF ID BADGE · CR80
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block px-2 py-0.5 rounded bg-black/25 font-mono text-[10px] font-bold uppercase tracking-wider">
                {isDelivery ? 'DELIVERY' : 'CASHIER'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Employee Identity Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          {/* Photo + Core ID Block */}
          <div className="flex items-start gap-3.5">
            <div
              className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 bg-white shadow-xs ${
                isDelivery ? 'border-amber-900' : 'border-emerald-800'
              }`}
            >
              <img
                src={
                  staff.avatar ||
                  createStaffAvatarPlaceholder(staff.name, staff.role)
                }
                alt={staff.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`font-mono text-[11px] font-bold ${
                    isDelivery ? 'text-amber-900' : 'text-emerald-800'
                  }`}
                >
                  {staff.employeeId || 'EMP-2026-001'}
                </span>
                <span className="font-mono text-[9px] text-stone-500">
                  {staff.status || 'Active'}
                </span>
              </div>
              <h4 className="font-display font-bold text-sm text-stone-900 leading-snug">
                {staff.name}
              </h4>
              <p className="font-mono text-[10px] text-stone-600 truncate">
                {formattedName}
              </p>
              <p className="text-[10px] font-medium text-stone-700 pt-0.5">
                {isDelivery
                  ? 'Chilled Van Dispatch Rider'
                  : 'POS Counter & Order Cashier'}
              </p>
            </div>
          </div>

          {/* Employee Demographic & Contact Details Grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2.5 border-t border-stone-200 text-[10px]">
            <div>
              <span className="block font-mono text-[9px] uppercase text-stone-400">
                Birthdate &amp; Age
              </span>
              <span className="font-mono font-semibold text-stone-800">
                {staff.birthdate || '1999-08-19'} ({computedAge || 25} yrs)
              </span>
            </div>
            <div>
              <span className="block font-mono text-[9px] uppercase text-stone-400">
                Gender
              </span>
              <span className="font-semibold text-stone-800">
                {staff.gender || 'Female'}
              </span>
            </div>
            <div>
              <span className="block font-mono text-[9px] uppercase text-stone-400">
                Date Hired
              </span>
              <span className="font-mono font-semibold text-stone-800">
                {staff.dateHired || staff.createdAt || '2025-03-15'}
              </span>
            </div>
            <div>
              <span className="block font-mono text-[9px] uppercase text-stone-400">
                Length of Service
              </span>
              <span className="font-mono font-semibold text-emerald-800">
                {calculateLengthOfService(
                  staff.dateHired || staff.createdAt,
                  { compact: true }
                ) ||
                  staff.lengthOfService ||
                  'Active'}
              </span>
            </div>
            <div>
              <span className="block font-mono text-[9px] uppercase text-stone-400">
                Contact No.
              </span>
              <span className="font-mono font-semibold text-stone-800">
                {staff.phone}
              </span>
            </div>
            <div>
              <span className="block font-mono text-[9px] uppercase text-stone-400">
                Login Email
              </span>
              <span className="font-mono text-stone-800 truncate block">
                {staff.email}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block font-mono text-[9px] uppercase text-stone-400">
                Shift &amp; Assigned Station
              </span>
              <span className="font-medium text-stone-800 block truncate">
                {staff.shift || 'Morning Shift (7:00 AM – 3:00 PM)'} ·{' '}
                {staff.terminal || 'Main Branch'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block font-mono text-[9px] uppercase text-stone-400">
                Home Address
              </span>
              <span className="text-stone-700 block truncate">
                {staff.address || 'Kapitolyo, Pasig City, Metro Manila'}
              </span>
            </div>
          </div>

          {/* Unique Generated QR Code Block on Front Card */}
          <div className="pt-2.5 border-t border-stone-200 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-stone-200/90">
            <img
              src={qr.qrCodeImage}
              alt={`Unique QR code for ${staff.name}`}
              className={`${
                includeLargeQr ? 'w-28 h-28' : 'w-20 h-20'
              } object-contain rounded-lg border border-stone-200 p-1 bg-white shrink-0`}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase text-amber-900">
                <QrCode className="w-3 h-3 shrink-0" />
                <span>QUICK CHECK-IN QR</span>
              </div>
              <p className="font-mono text-[11px] font-bold text-stone-900">
                {qr.checkInCode}
              </p>
              <p className="text-[9px] text-stone-500 leading-tight">
                Scan at POS terminal or dispatch kiosk to log shift attendance.
              </p>
              {checkedInStaffTimes[staff.id] && (
                <p className="font-mono text-[9px] font-semibold text-emerald-800">
                  Verified Today: {checkedInStaffTimes[staff.id]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Store Footer Strip */}
        <div className="px-4 py-2 bg-stone-900 text-stone-300 font-mono text-[9px] flex items-center justify-between">
          <span className="truncate">{businessSettings.address}</span>
          <span className="shrink-0 ml-2">{businessSettings.contactNumber}</span>
        </div>
      </div>
    );
  };

  const renderPortraitBackCard = (staff: UserAccount) => {
    const qr = resolveStaffQr(staff);
    const isDelivery = staff.role === 'delivery';

    return (
      <div className="relative bg-[#FAF9F6] border-2 border-stone-300 rounded-2xl overflow-hidden shadow-md w-[336px] min-h-[520px] flex flex-col justify-between select-none print:shadow-none">
        {/* Top Magnetic / Barcode Strip + Lanyard Slot */}
        <div>
          <div className="pt-3 pb-2 bg-stone-100 border-b border-stone-200">
            <div className="mx-auto w-14 h-2.5 rounded-full bg-[#FAF9F6] border border-black/20 shadow-inner" />
          </div>
          <div className="h-7 bg-stone-900 flex items-center justify-between px-4 font-mono text-[9px] text-stone-300 tracking-wider">
            <span>REVERSE · QR VERIFICATION PASS</span>
            <span>{staff.employeeId || 'EMP-2026'}</span>
          </div>
        </div>

        {/* Center Large Scannable QR Code */}
        <div className="p-4 flex-1 flex flex-col items-center justify-between text-center space-y-3">
          <div className="space-y-0.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900">
              EMPLOYEE QUICK CHECK-IN QR CODE
            </p>
            <p className="text-xs font-semibold text-stone-900">{staff.name}</p>
            <p className="font-mono text-[10px] text-stone-500">
              {staff.employeeId} · {staff.role.toUpperCase()}
            </p>
          </div>

          <div
            className={`p-3 rounded-2xl bg-white border-2 shadow-xs ${
              isDelivery ? 'border-amber-900/40' : 'border-emerald-800/40'
            }`}
          >
            <img
              src={qr.qrCodeImage}
              alt={`Reverse Large QR for ${staff.name}`}
              className="w-44 h-44 object-contain"
            />
          </div>

          <div className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-left font-mono text-[9px] space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-400">CHECK-IN CODE:</span>
              <span className="font-bold text-stone-900">{qr.checkInCode}</span>
            </div>
            {showOtpCredential && (
              <div className="flex justify-between">
                <span className="text-stone-400">INITIAL LOGIN OTP:</span>
                <span className="font-bold text-amber-900">
                  {staff.password || 'OTP-Issued'}
                </span>
              </div>
            )}
            <div className="pt-1 border-t border-stone-100 text-[8px] text-stone-500 break-all leading-tight">
              {qr.qrCodePayload}
            </div>
          </div>

          {/* Return Notice & Authorized Signature */}
          <div className="w-full pt-2 border-t border-stone-200 space-y-2 text-[9px] text-stone-500">
            <p className="leading-snug">
              This badge is property of{' '}
              <strong className="text-stone-800">
                {businessSettings.businessName}
              </strong>
              . If found, please return to {businessSettings.address} or call{' '}
              {businessSettings.contactNumber}.
            </p>
            <div className="flex items-end justify-between pt-2 text-left">
              <div>
                <p className="font-display italic text-xs text-stone-800">
                  Chef Bea Santos
                </p>
                <div className="w-28 border-t border-stone-400 mt-0.5 pt-0.5 font-mono text-[8px] uppercase text-stone-500">
                  Authorized Issuer
                </div>
              </div>
              <div className="text-right font-mono text-[8px] text-stone-500">
                <p>ISSUED: {staff.createdAt || '2026-09-25'}</p>
                <p>STATUS: VALIDATED</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Accent Bar */}
        <div
          className={`h-2.5 ${
            isDelivery ? 'bg-amber-900' : 'bg-emerald-900'
          }`}
        />
      </div>
    );
  };

  const renderLandscapeCard = (staff: UserAccount) => {
    const qr = resolveStaffQr(staff);
    const isDelivery = staff.role === 'delivery';
    const computedAge =
      staff.age ?? calculateAgeFromBirthdate(staff.birthdate || '');

    return (
      <div className="relative bg-[#FAF9F6] border-2 border-stone-300 rounded-2xl overflow-hidden shadow-md w-full max-w-[540px] min-h-[336px] flex flex-col justify-between select-none print:shadow-none">
        {/* Top Header */}
        <div
          className={`px-5 py-3 text-white flex items-center justify-between gap-4 ${
            isDelivery ? 'bg-amber-900' : 'bg-emerald-900'
          }`}
        >
          <div>
            <p className="font-display font-bold text-base tracking-tight">
              {businessSettings.businessName}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-stone-200">
              STANDARD CR80 LANDSCAPE STAFF ID BADGE
            </p>
          </div>
          <div className="w-12 h-2.5 rounded-full bg-[#FAF9F6] border border-black/20 shadow-inner hidden sm:block" />
          <div className="text-right">
            <span className="px-2.5 py-1 rounded bg-black/25 font-mono text-[10px] font-bold uppercase tracking-wider">
              {staff.employeeId || 'EMP-2026'} · {staff.role.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Center Horizontal Split: Left Employee Details, Right Unique QR Code */}
        <div className="p-4 flex-1 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-7 flex flex-col justify-between h-full space-y-2.5">
            <div className="flex items-center gap-3">
              <img
                src={
                  staff.avatar ||
                  createStaffAvatarPlaceholder(staff.name, staff.role)
                }
                alt={staff.name}
                className={`w-16 h-16 rounded-xl object-cover border-2 shrink-0 ${
                  isDelivery ? 'border-amber-900' : 'border-emerald-800'
                }`}
              />
              <div className="min-w-0">
                <p
                  className={`font-mono text-[10px] font-bold uppercase ${
                    isDelivery ? 'text-amber-900' : 'text-emerald-800'
                  }`}
                >
                  {isDelivery ? 'Delivery Dispatch Staff' : 'Cashier POS Staff'}
                </p>
                <h4 className="font-display font-bold text-base text-stone-900 truncate">
                  {staff.name}
                </h4>
                <p className="font-mono text-[10px] text-stone-500">
                  Age {computedAge || 25} · {staff.gender || 'Female'} · DOB:{' '}
                  {staff.birthdate || '1999-08-19'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 text-[10px]">
              <div>
                <span className="block font-mono text-[8px] uppercase text-stone-400">
                  Phone Number
                </span>
                <span className="font-mono font-semibold text-stone-800">
                  {staff.phone}
                </span>
              </div>
              <div>
                <span className="block font-mono text-[8px] uppercase text-stone-400">
                  Date Hired &amp; Tenure
                </span>
                <span className="font-mono font-semibold text-emerald-800 truncate block">
                  {staff.dateHired || staff.createdAt || '2025-03-15'} (
                  {calculateLengthOfService(
                    staff.dateHired || staff.createdAt,
                    { compact: true }
                  ) || 'Active'}
                  )
                </span>
              </div>
              <div>
                <span className="block font-mono text-[8px] uppercase text-stone-400">
                  Email Address
                </span>
                <span className="font-mono text-stone-800 truncate block">
                  {staff.email}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block font-mono text-[8px] uppercase text-stone-400">
                  Assigned Shift &amp; Station
                </span>
                <span className="font-medium text-stone-800 truncate block">
                  {staff.shift || 'Morning Shift'} ·{' '}
                  {staff.terminal || 'Main Branch'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block font-mono text-[8px] uppercase text-stone-400">
                  Home Address
                </span>
                <span className="text-stone-700 truncate block">
                  {staff.address || 'Kapitolyo, Pasig City, Metro Manila'}
                </span>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Scannable QR Code */}
          <div className="col-span-5 bg-white border border-stone-200 rounded-xl p-3 flex flex-col items-center text-center space-y-1.5">
            <img
              src={qr.qrCodeImage}
              alt={`Unique QR code for ${staff.name}`}
              className="w-32 h-32 object-contain"
            />
            <p className="font-mono text-[10px] font-bold text-stone-900">
              {qr.checkInCode}
            </p>
            {showOtpCredential && (
              <p className="font-mono text-[9px] text-amber-900 font-semibold">
                OTP: {staff.password || 'OTP-Issued'}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2 bg-stone-900 text-stone-300 font-mono text-[9px] flex items-center justify-between">
          <span>
            {businessSettings.businessName} · {businessSettings.address}
          </span>
          <span>{businessSettings.contactNumber}</span>
        </div>
      </div>
    );
  };

  const activeQr = resolveStaffQr(activeStaff);

  return (
    <div className="space-y-6">
      {/* Top Non-Print Control Toolbar */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              {onBackToDirectory && (
                <button
                  type="button"
                  onClick={onBackToDirectory}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Table</span>
                </button>
              )}
              <span className="text-xs font-mono uppercase tracking-wider text-amber-900 font-semibold">
                STANDARD CR80 ID BADGE PRINT STUDIO
              </span>
            </div>
            <h2 className="text-lg font-display font-semibold text-stone-900 mt-1">
              Printable Staff ID View &amp; Unique QR Check-In Badge
            </h2>
            <p className="text-xs text-stone-500">
              Formatted to ISO/IEC 7810 ID-1 (CR80: 2.125&quot; × 3.375&quot; / 54mm × 85.6mm) standard badge dimensions with employee details, portrait photo, and unique scannable QR code.
            </p>
          </div>

          {/* Primary Print / Download / Share Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrintNow}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>
                {layoutMode === 'sheet'
                  ? `Print All Staff IDs (${filteredStaff.length})`
                  : `Print Staff ID Badge (${activeStaff.name})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                downloadPrintableStaffIdCardSvg({
                  businessName: businessSettings.businessName,
                  businessAddress: businessSettings.address,
                  businessPhone: businessSettings.contactNumber,
                  employeeId: activeStaff.employeeId || 'EMP-2026',
                  fullName: activeStaff.name,
                  role: activeStaff.role,
                  age:
                    activeStaff.age ??
                    calculateAgeFromBirthdate(activeStaff.birthdate || '') ??
                    25,
                  birthdate: activeStaff.birthdate || '1999-08-19',
                  gender: activeStaff.gender || 'Female',
                  phone: activeStaff.phone,
                  email: activeStaff.email,
                  address:
                    activeStaff.address ||
                    'Kapitolyo, Pasig City, Metro Manila',
                  shift: activeStaff.shift || 'Morning Shift',
                  terminal: activeStaff.terminal || 'Main Branch',
                  checkInCode: activeQr.checkInCode,
                  qrCodeImage: activeQr.qrCodeImage,
                  avatar: activeStaff.avatar,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full ID Card (.SVG)</span>
            </button>

            <button
              type="button"
              onClick={() => onShareStaffQrBadge(activeStaff)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              {sharedStaffId === activeStaff.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Copied Credentials!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-amber-900" />
                  <span>Share Pass</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Employee Selector & Badge Formatting Options */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs">
          {/* Left 5 cols: Select Staff Member */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <label className="font-semibold text-stone-700 shrink-0">
              Select Employee:
            </label>
            <select
              value={activeStaff.id}
              onChange={(e) => {
                const found = staffList.find((s) => s.id === e.target.value);
                if (found) onSelectStaff(found);
              }}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-medium text-stone-900"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.employeeId || 'EMP'} — {s.name} ({s.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Center 4 cols: Layout Mode Switcher */}
          <div className="lg:col-span-4 flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
            {[
              { id: 'duplex', label: 'Front + Back ID', icon: Layers },
              { id: 'single', label: 'Single Card', icon: CreditCard },
              {
                id: 'sheet',
                label: `Batch Sheet (${filteredStaff.length})`,
                icon: Grid,
              },
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setLayoutMode(mode.id as BadgeLayoutMode)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    layoutMode === mode.id
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right 3 cols: Orientation Switcher */}
          <div className="lg:col-span-3 flex items-center justify-end gap-1 p-1 bg-stone-100 rounded-lg">
            <button
              type="button"
              onClick={() => setOrientation('portrait')}
              className={`flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                orientation === 'portrait'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Portrait CR80
            </button>
            <button
              type="button"
              onClick={() => setOrientation('landscape')}
              className={`flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                orientation === 'landscape'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Landscape CR80
            </button>
          </div>
        </div>

        {/* Quick Staff Avatar Strip + Print Checkboxes */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `All (${staffList.length})` },
                {
                  id: 'cashier',
                  label: `Cashiers (${
                    staffList.filter((s) => s.role === 'cashier').length
                  })`,
                },
                {
                  id: 'delivery',
                  label: `Delivery (${
                    staffList.filter((s) => s.role === 'delivery').length
                  })`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer ${
                  roleFilter === tab.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <span className="text-stone-300 mx-1">|</span>

            {filteredStaff.map((staff) => {
              const isSelected = staff.id === activeStaff.id;
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => {
                    onSelectStaff(staff);
                    if (layoutMode === 'sheet') setLayoutMode('duplex');
                  }}
                  className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-amber-900 bg-amber-50/80 text-stone-900 font-semibold'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <img
                    src={
                      staff.avatar ||
                      createStaffAvatarPlaceholder(staff.name, staff.role)
                    }
                    alt={staff.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{staff.name}</span>
                  <span className="font-mono text-[10px] text-stone-500">
                    ({staff.employeeId})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-600">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showCropMarks}
                onChange={(e) => setShowCropMarks(e.target.checked)}
                className="rounded border-stone-300 text-amber-900"
              />
              <Scissors className="w-3.5 h-3.5 text-stone-500" />
              <span>Show Trim / Fold Marks</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showOtpCredential}
                onChange={(e) => setShowOtpCredential(e.target.checked)}
                className="rounded border-stone-300 text-amber-900"
              />
              <span>Include Initial OTP on Badge</span>
            </label>
          </div>
        </div>
      </div>

      {/* PRINTABLE CANVAS SHEET */}
      <div className="printable-staff-id-sheet bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 print:border-0 print:p-0 print:shadow-none">
        {/* Print Sheet Header Guide (Hidden when printing if desired or subtle crop header) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-5 mb-6 border-b border-dashed border-stone-300 text-xs text-stone-500 print:mb-4 print:pb-2">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Scissors className="w-3.5 h-3.5 text-amber-900" />
            <span>
              PRINT SPECIFICATION: ISO/IEC 7810 ID-1 (CR80 STANDARD BADGE · 100% SCALE)
            </span>
          </div>
          <span className="font-mono text-[11px] text-stone-600">
            {businessSettings.businessName} · Official Staff Credential Sheet
          </span>
        </div>

        {/* MODE 1: DUPLEX FRONT + BACK FOR SELECTED STAFF */}
        {layoutMode === 'duplex' && (
          <div className="flex flex-col items-center space-y-6">
            {orientation === 'portrait' ? (
              <div
                className={`relative flex flex-col md:flex-row items-center justify-center gap-8 ${
                  showCropMarks
                    ? 'p-6 border border-dashed border-stone-300 rounded-2xl bg-stone-50/50 print:bg-white'
                    : ''
                }`}
              >
                {/* Front Face */}
                <div className="flex flex-col items-center space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 print:text-stone-700">
                    FRONT FACE · PHOTO &amp; EMPLOYEE DETAILS + QR
                  </span>
                  {renderPortraitFrontCard(activeStaff, false)}
                </div>

                {/* Center Fold / Cut Guide */}
                {showCropMarks && (
                  <div className="hidden md:flex flex-col items-center justify-center self-stretch py-6">
                    <div className="flex-1 border-l border-dashed border-stone-400" />
                    <span className="my-2 px-1.5 py-0.5 rounded bg-stone-200 font-mono text-[9px] text-stone-600 uppercase tracking-widest">
                      FOLD / TRIM
                    </span>
                    <div className="flex-1 border-l border-dashed border-stone-400" />
                  </div>
                )}

                {/* Back Face */}
                <div className="flex flex-col items-center space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 print:text-stone-700">
                    BACK FACE · LARGE CHECK-IN QR &amp; AUTHORIZATION
                  </span>
                  {renderPortraitBackCard(activeStaff)}
                </div>
              </div>
            ) : (
              <div
                className={`w-full flex flex-col items-center gap-6 ${
                  showCropMarks
                    ? 'p-6 border border-dashed border-stone-300 rounded-2xl bg-stone-50/50 print:bg-white'
                    : ''
                }`}
              >
                <div className="w-full flex flex-col items-center space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
                    LANDSCAPE CR80 FRONT · EMPLOYEE DETAILS &amp; SCANNABLE QR
                  </span>
                  {renderLandscapeCard(activeStaff)}
                </div>
              </div>
            )}

            {/* Interactive Verification & Employee Summary Footer (Hidden on physical paper print) */}
            <div className="w-full max-w-3xl bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs print:hidden">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <span className="font-semibold text-stone-900">
                    Ready for Standard CR80 Badge Printing ({activeStaff.name})
                  </span>
                </div>
                <p className="text-stone-600 font-mono text-[11px]">
                  Check-In Code: <strong>{activeQr.checkInCode}</strong> ·
                  Employee ID: <strong>{activeStaff.employeeId}</strong> · Role:{' '}
                  <strong className="uppercase">{activeStaff.role}</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onQuickCheckInStaff(activeStaff)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>
                    {checkedInStaffTimes[activeStaff.id]
                      ? `Checked In (${checkedInStaffTimes[activeStaff.id]})`
                      : 'Simulate QR Check-In'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadStaffQrBadgeSvg({
                      employeeId: activeStaff.employeeId,
                      name: activeStaff.name,
                      role: activeStaff.role,
                      qrCodeImage: activeQr.qrCodeImage,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 font-medium cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>QR Only (.SVG)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: SINGLE-SIDED ALL-IN-ONE BADGE */}
        {layoutMode === 'single' && (
          <div className="flex flex-col items-center space-y-4">
            <div
              className={`${
                showCropMarks
                  ? 'p-6 border border-dashed border-stone-300 rounded-2xl bg-stone-50/50 print:bg-white'
                  : ''
              }`}
            >
              {orientation === 'portrait'
                ? renderPortraitFrontCard(activeStaff, true)
                : renderLandscapeCard(activeStaff)}
            </div>
          </div>
        )}

        {/* MODE 3: BATCH SHEET PRINT (ALL FILTERED STAFF BADGES) */}
        {layoutMode === 'sheet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className={`flex flex-col items-center space-y-2 ${
                  showCropMarks
                    ? 'p-4 border border-dashed border-stone-300 rounded-2xl'
                    : ''
                }`}
              >
                <span className="font-mono text-[10px] text-stone-500">
                  {staff.employeeId} · {staff.name} ({staff.role.toUpperCase()})
                </span>
                {orientation === 'portrait'
                  ? renderPortraitFrontCard(staff, false)
                  : renderLandscapeCard(staff)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
