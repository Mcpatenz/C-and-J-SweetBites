import React, { useState } from 'react';
import {
  CreditCard,
  Download,
  Printer,
  QrCode,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  UserCheck,
  Clock,
} from 'lucide-react';
import { BusinessSettings, UserAccount } from '../types/bakery';
import {
  calculateAgeFromBirthdate,
  calculateLengthOfService,
  createStaffAvatarPlaceholder,
  downloadPrintableStaffIdCardSvg,
  downloadStaffQrBadgeSvg,
  extractCheckInCodeFromPayload,
  generateUniqueStaffQrDataUri,
} from '../utils/staffHelpers';

interface StaffDashboardIdBadgeProps {
  staff: UserAccount;
  businessSettings?: BusinessSettings;
  onQuickAttendanceAction?: (action: 'Check-In' | 'Check-Out') => void;
  defaultExpanded?: boolean;
}

export const StaffDashboardIdBadge: React.FC<StaffDashboardIdBadgeProps> = ({
  staff,
  businessSettings,
  onQuickAttendanceAction,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [badgeViewMode, setBadgeViewMode] = useState<'landscape' | 'duplex'>(
    'landscape'
  );
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  const isDelivery = staff.role === 'delivery';
  const storeName = businessSettings?.businessName || 'Dulce & Kusina';
  const storeAddress =
    businessSettings?.address ||
    '19 East Capitol Drive, Kapitolyo, Pasig City, Metro Manila';
  const storePhone = businessSettings?.contactNumber || '0917 880 4421';

  const generatedQr = generateUniqueStaffQrDataUri({
    employeeId: staff.employeeId || staff.id,
    fullName: staff.name,
    role: staff.role,
    email: staff.email,
  });

  const qrCodeImage = staff.qrCodeImage || generatedQr.qrDataUri;
  const qrCodePayload = staff.qrCodePayload || generatedQr.payload;
  const checkInCode = extractCheckInCodeFromPayload(
    qrCodePayload,
    staff.employeeId
  );

  const computedAge =
    staff.age ?? calculateAgeFromBirthdate(staff.birthdate || '');
  const dateHired = staff.dateHired || staff.createdAt || '2024-06-12';
  const lengthOfService =
    calculateLengthOfService(dateHired, { compact: true }) ||
    staff.lengthOfService ||
    'Active Tenure';

  const avatarUri =
    staff.avatar || createStaffAvatarPlaceholder(staff.name, staff.role);

  const isOnDuty = staff.status !== 'Off Duty';

  const handleDownloadFullIdCard = () => {
    downloadPrintableStaffIdCardSvg({
      businessName: storeName,
      businessAddress: storeAddress,
      businessPhone: storePhone,
      employeeId: staff.employeeId || 'EMP-2026',
      fullName: staff.name,
      role: staff.role,
      age: computedAge || 26,
      birthdate: staff.birthdate || '1999-08-19',
      gender: staff.gender || 'Staff',
      phone: staff.phone,
      email: staff.email,
      address: staff.address || 'Metro Manila',
      shift: staff.shift || 'Regular Shift',
      terminal:
        staff.terminal ||
        (isDelivery ? 'Chilled Delivery Fleet' : 'POS Counter 01'),
      checkInCode,
      qrCodeImage,
      avatar: avatarUri,
    });
  };

  const handleDownloadQrSvg = () => {
    downloadStaffQrBadgeSvg({
      employeeId: staff.employeeId,
      name: staff.name,
      role: staff.role,
      qrCodeImage,
    });
  };

  const handleCopyCredentials = async () => {
    const summary = [
      `${storeName.toUpperCase()} — OFFICIAL STAFF ID BADGE`,
      `Name: ${staff.name}`,
      `Employee ID: ${staff.employeeId || 'EMP-2026'}`,
      `Role: ${staff.role.toUpperCase()}`,
      `Date Hired: ${dateHired} (${lengthOfService})`,
      `Check-In Code: ${checkInCode}`,
      `QR Payload: ${qrCodePayload}`,
    ].join('\n');

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(summary);
      }
    } catch {
      // ignore clipboard restriction
    }
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden shadow-xs transition-all ${
        isDelivery ? 'border-amber-900/25' : 'border-emerald-800/25'
      }`}
    >
      {/* Top Bar of the Dashboard ID Badge Section */}
      <div
        className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
          isDelivery
            ? 'bg-amber-50/50 border-amber-900/15'
            : 'bg-emerald-50/50 border-emerald-800/15'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
              isDelivery ? 'bg-amber-900' : 'bg-emerald-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[11px] font-mono uppercase tracking-wider font-bold ${
                  isDelivery ? 'text-amber-900' : 'text-emerald-800'
                }`}
              >
                OFFICIAL {isDelivery ? 'DELIVERY RIDER' : 'CASHIER POS'} ID BADGE
              </span>
              <span className="text-stone-300" aria-hidden="true">
                ·
              </span>
              <span className="font-mono text-xs font-semibold text-stone-900">
                {staff.employeeId || 'EMP-2026'}
              </span>
              <span className="text-stone-300" aria-hidden="true">
                ·
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  isOnDuty ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {isOnDuty ? '● Checked In (On Duty)' : '○ Checked Out (Off Duty)'}
              </span>
            </div>
            <p className="text-xs text-stone-600 truncate">
              {staff.name} · Hired {dateHired} ({lengthOfService}) · Check-In Pass:{' '}
              <span className="font-mono font-semibold text-stone-900">
                {checkInCode}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isExpanded && (
            <div className="flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-lg">
              <button
                type="button"
                onClick={() => setBadgeViewMode('landscape')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  badgeViewMode === 'landscape'
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                CR80 Landscape Badge
              </button>
              <button
                type="button"
                onClick={() => setBadgeViewMode('duplex')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  badgeViewMode === 'duplex'
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Front &amp; Back Portrait
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownloadFullIdCard}
            className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-900" />
            <span>Download ID SVG</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-stone-700" />
            <span>Print Badge</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{isExpanded ? 'Compact' : 'Show ID Card'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Official ID Badge Display */}
      {isExpanded && (
        <div className="p-5 sm:p-6 bg-stone-50/50">
          {badgeViewMode === 'landscape' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left 7 Cols: Official CR80 Landscape Staff ID Card */}
              <div className="lg:col-span-7 flex justify-center">
                <div className="relative bg-[#FAF9F6] border-2 border-stone-300 rounded-2xl overflow-hidden shadow-md w-full max-w-[560px] flex flex-col justify-between select-none">
                  {/* Top Header Band with Lanyard Slot */}
                  <div
                    className={`px-5 py-3 text-white flex items-center justify-between gap-4 ${
                      isDelivery ? 'bg-amber-900' : 'bg-emerald-900'
                    }`}
                  >
                    <div>
                      <p className="font-display font-bold text-base tracking-tight">
                        {storeName}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-stone-200">
                        OFFICIAL STAFF IDENTIFICATION BADGE · CR80
                      </p>
                    </div>
                    <div className="w-12 h-2.5 rounded-full bg-[#FAF9F6] border border-black/20 shadow-inner hidden sm:block" />
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded bg-black/25 font-mono text-[10px] font-bold uppercase tracking-wider">
                        {staff.employeeId || 'EMP-2026'} ·{' '}
                        {staff.role.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Card Center Body */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-7 space-y-3">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={avatarUri}
                          alt={staff.name}
                          className={`w-16 h-16 rounded-xl object-cover border-2 shrink-0 bg-white ${
                            isDelivery
                              ? 'border-amber-900'
                              : 'border-emerald-800'
                          }`}
                        />
                        <div className="min-w-0">
                          <p
                            className={`font-mono text-[10px] font-bold uppercase ${
                              isDelivery
                                ? 'text-amber-900'
                                : 'text-emerald-800'
                            }`}
                          >
                            {isDelivery
                              ? 'Delivery Dispatch Specialist'
                              : 'POS & Counter Cashier'}
                          </p>
                          <h3 className="font-display font-bold text-base text-stone-900 truncate">
                            {staff.name}
                          </h3>
                          <p className="font-mono text-[10px] text-stone-500">
                            Age {computedAge || 26} · {staff.gender || 'Staff'} ·
                            DOB: {staff.birthdate || '1999-08-19'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] pt-2 border-t border-stone-200">
                        <div>
                          <span className="text-stone-400 font-mono uppercase text-[9px] block">
                            Date Hired
                          </span>
                          <span className="font-mono font-semibold text-stone-800">
                            {dateHired}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 font-mono uppercase text-[9px] block">
                            Length of Service
                          </span>
                          <span className="font-mono font-semibold text-emerald-800">
                            {lengthOfService}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 font-mono uppercase text-[9px] block">
                            Phone
                          </span>
                          <span className="font-mono font-semibold text-stone-800">
                            {staff.phone}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 font-mono uppercase text-[9px] block">
                            Email
                          </span>
                          <span className="font-mono text-stone-800 truncate block">
                            {staff.email}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-stone-400 font-mono uppercase text-[9px] block">
                            Shift &amp; Station
                          </span>
                          <span className="font-medium text-stone-800 truncate block">
                            {staff.shift || 'Full-Day Shift'} ·{' '}
                            {staff.terminal ||
                              (isDelivery
                                ? 'In-House Chilled Van'
                                : 'POS Counter 01')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right 5 Cols inside Badge: Scannable QR Code */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center bg-white border border-stone-200 rounded-xl p-3 text-center">
                      <img
                        src={qrCodeImage}
                        alt={`Staff QR for ${staff.name}`}
                        className="w-28 h-28 object-contain"
                      />
                      <span className="font-mono text-[10px] font-bold text-stone-900 mt-1">
                        {checkInCode}
                      </span>
                      <span className="font-mono text-[8px] uppercase text-stone-500">
                        SCAN FOR SHIFT ATTENDANCE
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-2 bg-stone-900 text-stone-300 font-mono text-[9px] flex items-center justify-between">
                    <span className="truncate">{storeAddress}</span>
                    <span className="shrink-0 ml-2">Tel: {storePhone}</span>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Live Badge Credentials & Quick Actions */}
              <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-4 space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div>
                    <p className="font-mono text-[10px] uppercase font-semibold text-stone-500">
                      ACTIVE CREDENTIAL SUMMARY
                    </p>
                    <h4 className="text-sm font-semibold text-stone-900">
                      {staff.name} ({staff.employeeId || 'EMP-2026'})
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                      isOnDuty
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                    <span className="text-[9px] uppercase text-stone-400 block">
                      Date Hired
                    </span>
                    <span className="font-semibold text-stone-900">
                      {dateHired}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                    <span className="text-[9px] uppercase text-stone-400 block">
                      Length of Service
                    </span>
                    <span className="font-semibold text-emerald-800">
                      {lengthOfService}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                    <span className="text-[9px] uppercase text-stone-400 block">
                      QR Check-In Code
                    </span>
                    <span className="font-semibold text-amber-900">
                      {checkInCode}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                    <span className="text-[9px] uppercase text-stone-400 block">
                      Last Attendance
                    </span>
                    <span className="font-semibold text-stone-800 truncate block">
                      {staff.lastAttendanceTime || 'Today · Shift Active'}
                    </span>
                  </div>
                </div>

                {onQuickAttendanceAction && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onQuickAttendanceAction('Check-In')}
                      className="py-2 px-3 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>QR Check-In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickAttendanceAction('Check-Out')}
                      className="py-2 px-3 rounded-lg border border-stone-300 bg-white hover:bg-amber-50 text-stone-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-900" />
                      <span>QR Check-Out</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadQrSvg}
                    className="flex-1 py-2 px-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Download QR Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="flex-1 py-2 px-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedNotice ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copied Badge Info</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-amber-900" />
                        <span>Copy Badge Token</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Front & Back Portrait Duplex View */
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              {/* Front Portrait Card */}
              <div className="relative bg-[#FAF9F6] border-2 border-stone-300 rounded-2xl overflow-hidden shadow-md w-[320px] min-h-[480px] flex flex-col justify-between select-none">
                <div
                  className={`px-4 pt-3 pb-3 text-white ${
                    isDelivery ? 'bg-amber-900' : 'bg-emerald-900'
                  }`}
                >
                  <div className="mx-auto w-14 h-2.5 rounded-full bg-[#FAF9F6] border border-black/20 mb-2 shadow-inner" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-sm">{storeName}</p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-stone-200">
                        FRONT · STAFF ID BADGE
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-black/25 font-mono text-[10px] font-bold uppercase">
                      {staff.role.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={avatarUri}
                      alt={staff.name}
                      className={`w-18 h-18 rounded-xl object-cover border-2 shrink-0 bg-white ${
                        isDelivery ? 'border-amber-900' : 'border-emerald-800'
                      }`}
                    />
                    <div className="min-w-0">
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          isDelivery ? 'text-amber-900' : 'text-emerald-800'
                        }`}
                      >
                        {staff.employeeId || 'EMP-2026'}
                      </span>
                      <h4 className="font-display font-bold text-sm text-stone-900">
                        {staff.name}
                      </h4>
                      <p className="font-mono text-[10px] text-stone-500">
                        Age {computedAge || 26} · {staff.gender || 'Staff'}
                      </p>
                      <p className="font-mono text-[10px] text-emerald-800 font-semibold mt-0.5">
                        Service: {lengthOfService}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 text-[10px]">
                    <div>
                      <span className="block font-mono text-[9px] uppercase text-stone-400">
                        Date Hired
                      </span>
                      <span className="font-mono font-semibold text-stone-800">
                        {dateHired}
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
                    <div className="col-span-2">
                      <span className="block font-mono text-[9px] uppercase text-stone-400">
                        Shift &amp; Station
                      </span>
                      <span className="font-medium text-stone-800 block truncate">
                        {staff.shift || 'Regular Shift'} ·{' '}
                        {staff.terminal || 'Main Branch'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-stone-200">
                    <img
                      src={qrCodeImage}
                      alt={staff.name}
                      className="w-18 h-18 object-contain shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] font-bold uppercase text-amber-900">
                        QUICK CHECK-IN QR
                      </p>
                      <p className="font-mono text-[11px] font-bold text-stone-900">
                        {checkInCode}
                      </p>
                      <p className="text-[9px] text-stone-500">
                        Scan at POS or Dispatch Kiosk
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2 bg-stone-900 text-stone-300 font-mono text-[9px] flex items-center justify-between">
                  <span className="truncate">{storeName}</span>
                  <span>{storePhone}</span>
                </div>
              </div>

              {/* Back Portrait Card */}
              <div className="relative bg-[#FAF9F6] border-2 border-stone-300 rounded-2xl overflow-hidden shadow-md w-[320px] min-h-[480px] flex flex-col justify-between select-none">
                <div>
                  <div className="pt-3 pb-2 bg-stone-100 border-b border-stone-200">
                    <div className="mx-auto w-14 h-2.5 rounded-full bg-[#FAF9F6] border border-black/20 shadow-inner" />
                  </div>
                  <div className="h-7 bg-stone-900 flex items-center justify-between px-4 font-mono text-[9px] text-stone-300">
                    <span>REVERSE · QR PASS</span>
                    <span>{staff.employeeId || 'EMP-2026'}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col items-center justify-between text-center space-y-3">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase text-amber-900">
                      SCANNABLE ATTENDANCE QR
                    </p>
                    <p className="text-xs font-semibold text-stone-900">
                      {staff.name}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border-2 border-stone-200">
                    <img
                      src={qrCodeImage}
                      alt="Reverse QR"
                      className="w-40 h-40 object-contain"
                    />
                  </div>

                  <div className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-left font-mono text-[9px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-400">CHECK-IN CODE:</span>
                      <span className="font-bold text-stone-900">
                        {checkInCode}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-stone-100 text-[8px] text-stone-500 break-all">
                      {qrCodePayload}
                    </div>
                  </div>

                  <p className="text-[9px] text-stone-500">
                    Official property of {storeName} · {storeAddress}
                  </p>
                </div>

                <div
                  className={`h-2.5 ${
                    isDelivery ? 'bg-amber-900' : 'bg-emerald-900'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
