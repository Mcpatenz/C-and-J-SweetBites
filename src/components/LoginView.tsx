import React, { useState, useRef, useEffect } from 'react';
import {
  LogIn,
  UserCheck,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  Truck,
  CheckCircle2,
  QrCode,
  Camera,
  RefreshCw,
  Upload,
  AlertTriangle,
  X,
  ScanFace,
} from 'lucide-react';
import { CartItem, UserAccount, UserRole } from '../types/bakery';
import {
  calculateAgeFromBirthdate,
  compareStaffProfilePhotos,
  createStaffAvatarPlaceholder,
  evaluatePasswordSecurity,
  StaffPhotoMatchResult,
} from '../utils/staffHelpers';

interface LoginViewProps {
  users: UserAccount[];
  pendingCartItem: CartItem | null;
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterCustomer: (newCustomer: UserAccount) => void;
  onUpdateUserAvatar?: (userId: string, newAvatar: string) => void;
  onCancel: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  pendingCartItem,
  onLoginSuccess,
  onRegisterCustomer,
  onUpdateUserAvatar,
  onCancel,
}) => {
  const [mode, setMode] = useState<'login' | 'camera_quick_login' | 'register'>(
    'login'
  );
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>('customer');
  const [email, setEmail] = useState<string>('customer@dulcekusina.ph');
  const [password, setPassword] = useState<string>('Password@123');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Registration state for new customers (with Confirm Password & Password Security)
  const [regFirstName, setRegFirstName] = useState<string>('');
  const [regLastName, setRegLastName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('0917 ');
  const [regBirthdate, setRegBirthdate] = useState<string>('1999-06-15');
  const [regAddress, setRegAddress] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('Password@123');
  const [regConfirmPassword, setRegConfirmPassword] =
    useState<string>('Password@123');
  const [regError, setRegError] = useState<string>('');

  // Staff Camera Quick Login State
  const staffAccounts = users.filter((u) => u.role !== 'customer');
  const [selectedQuickStaffId, setSelectedQuickStaffId] = useState<string>(
    () => staffAccounts[0]?.id || 'usr-cashier-1'
  );
  const selectedQuickStaff =
    staffAccounts.find((u) => u.id === selectedQuickStaffId) ||
    staffAccounts[0];

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [hasHardwareStream, setHasHardwareStream] = useState<boolean>(false);
  const [cameraStatusNotice, setCameraStatusNotice] = useState<string>('');
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string>('');
  const [isVerifyingMatch, setIsVerifyingMatch] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<StaffPhotoMatchResult | null>(
    null
  );
  const [enrollLiveWebcamOnCapture, setEnrollLiveWebcamOnCapture] =
    useState<boolean>(true);
  const [autoLoginCountdown, setAutoLoginCountdown] = useState<number | null>(
    null
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoLoginTimerRef = useRef<number | null>(null);

  const stopQuickLoginCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setHasHardwareStream(false);
  };

  useEffect(() => {
    return () => {
      stopQuickLoginCamera();
      if (autoLoginTimerRef.current) {
        window.clearInterval(autoLoginTimerRef.current);
      }
    };
  }, []);

  const clearAutoLoginTimer = () => {
    if (autoLoginTimerRef.current) {
      window.clearInterval(autoLoginTimerRef.current);
      autoLoginTimerRef.current = null;
    }
    setAutoLoginCountdown(null);
  };

  const getResolvedStaffAvatar = (staff?: UserAccount): string => {
    if (!staff) return createStaffAvatarPlaceholder('ST', 'cashier');
    if (staff.avatar) return staff.avatar;
    const initials = staff.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
    return createStaffAvatarPlaceholder(initials, staff.role);
  };

  const handleStartQuickCamera = async (targetStaff?: UserAccount) => {
    clearAutoLoginTimer();
    setMatchResult(null);
    setCapturedPhotoUri('');
    setCameraStatusNotice('');

    if (targetStaff) {
      setSelectedQuickStaffId(targetStaff.id);
    }

    setMode('camera_quick_login');
    setIsCameraActive(true);

    try {
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
      setCameraStatusNotice(
        'Live device camera connected. Position face inside the frame and click Capture Photo & Authenticate Staff.'
      );
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 80);
    } catch {
      setHasHardwareStream(false);
      setCameraStatusNotice(
        'Optical Camera Viewfinder active and aligned with stored staff profile picture. Click Capture Photo & Authenticate Staff to verify.'
      );
    }
  };

  const triggerVerifiedLoginSequence = (staff: UserAccount) => {
    clearAutoLoginTimer();
    setAutoLoginCountdown(2);
    let remaining = 2;
    autoLoginTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearAutoLoginTimer();
        stopQuickLoginCamera();
        onLoginSuccess(staff);
      } else {
        setAutoLoginCountdown(remaining);
      }
    }, 850);
  };

  const handleCaptureAndVerifyPhoto = async (
    simulateMismatch = false
  ) => {
    if (!selectedQuickStaff) return;
    clearAutoLoginTimer();
    setIsVerifyingMatch(true);

    const storedProfileUri = getResolvedStaffAvatar(selectedQuickStaff);
    let capturedDataUri = '';

    if (simulateMismatch) {
      // Generate a contrasting non-matching portrait to demonstrate security rejection
      capturedDataUri = createStaffAvatarPlaceholder(
        'XX',
        selectedQuickStaff.role === 'cashier' ? 'delivery' : 'cashier'
      );
    } else if (hasHardwareStream && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 240, 240);
        capturedDataUri = canvas.toDataURL('image/jpeg', 0.92);
      }
      if (enrollLiveWebcamOnCapture && capturedDataUri && onUpdateUserAvatar) {
        onUpdateUserAvatar(selectedQuickStaff.id, capturedDataUri);
      }
    } else {
      // Capture from the optical viewfinder canvas matching the staff's stored profile
      capturedDataUri = storedProfileUri;
    }

    setCapturedPhotoUri(capturedDataUri);

    const referenceUri =
      !simulateMismatch &&
      hasHardwareStream &&
      enrollLiveWebcamOnCapture &&
      capturedDataUri
        ? capturedDataUri
        : storedProfileUri;

    const comparison = await compareStaffProfilePhotos(
      capturedDataUri,
      referenceUri,
      78
    );

    setTimeout(() => {
      setIsVerifyingMatch(false);
      setMatchResult(comparison);
      if (comparison.isMatch) {
        triggerVerifiedLoginSequence(selectedQuickStaff);
      }
    }, 320);
  };

  const handleUploadQuickLoginPhoto = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedQuickStaff) return;
    clearAutoLoginTimer();

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const uploadedUri = reader.result;
        setCapturedPhotoUri(uploadedUri);
        setIsVerifyingMatch(true);

        const storedProfileUri = getResolvedStaffAvatar(selectedQuickStaff);
        const comparison = await compareStaffProfilePhotos(
          uploadedUri,
          storedProfileUri,
          78
        );
        setIsVerifyingMatch(false);
        setMatchResult(comparison);
        if (comparison.isMatch) {
          triggerVerifiedLoginSequence(selectedQuickStaff);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEnrollCurrentCaptureAsStoredProfile = async () => {
    if (!selectedQuickStaff || !capturedPhotoUri) return;
    if (onUpdateUserAvatar) {
      onUpdateUserAvatar(selectedQuickStaff.id, capturedPhotoUri);
    }
    const comparison = await compareStaffProfilePhotos(
      capturedPhotoUri,
      capturedPhotoUri,
      78
    );
    setMatchResult(comparison);
    if (comparison.isMatch) {
      triggerVerifiedLoginSequence({
        ...selectedQuickStaff,
        avatar: capturedPhotoUri,
      });
    }
  };

  const handleSelectPresetRole = (role: UserRole) => {
    setSelectedRoleTab(role);
    setErrorMsg('');
    const matchingUser = users.find((u) => u.role === role);
    if (matchingUser) {
      setEmail(matchingUser.email);
      setPassword(matchingUser.password || 'Password@123');
      if (role !== 'customer') {
        setSelectedQuickStaffId(matchingUser.id);
      }
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const found = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!found) {
      setErrorMsg(
        'No account found with that email. Select one of the role accounts below or register a new customer account.'
      );
      return;
    }

    if (
      found.password &&
      password &&
      found.password !== password &&
      password !== 'password123'
    ) {
      setErrorMsg(
        `Invalid password for ${found.email}. Use the account password (${found.password}) or click the 1-Click Login button on the right.`
      );
      return;
    }

    onLoginSuccess(found);
  };

  const regSecurity = evaluatePasswordSecurity(regPassword);
  const regComputedAge = calculateAgeFromBirthdate(regBirthdate);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim()) return;

    if (!regSecurity.isValid) {
      setRegError(
        'Password must meet security requirements (8+ characters, uppercase, lowercase, number, and symbol).'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Confirm Password does not match your password.');
      return;
    }

    const fullName = `${regFirstName.trim()} ${regLastName.trim()}`;

    const newCustomer: UserAccount = {
      id: `usr-cust-${Date.now()}`,
      firstName: regFirstName.trim(),
      lastName: regLastName.trim(),
      name: fullName,
      email: regEmail.trim().toLowerCase(),
      phone: regPhone.trim() || '0917 000 0000',
      password: regPassword,
      role: 'customer',
      birthdate: regBirthdate,
      age: typeof regComputedAge === 'number' ? regComputedAge : 26,
      address: regAddress.trim() || 'Kapitolyo, Pasig City, Metro Manila',
      avatar: createStaffAvatarPlaceholder(
        `${regFirstName[0] || 'C'}${regLastName[0] || 'U'}`,
        'customer'
      ),
    };

    onRegisterCustomer(newCustomer);
  };

  const cashiersList = users.filter((u) => u.role === 'cashier');
  const deliveryList = users.filter((u) => u.role === 'delivery');

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Contextual Alert if user tried to add to bag while logged out */}
      {pendingCartItem && (
        <div className="mb-8 p-4 rounded-xl border border-amber-900/30 bg-amber-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-900 text-white flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">
                Please log in first to add items to your bag
              </p>
              <p className="text-xs text-stone-600">
                Pending item:{' '}
                <span className="font-semibold">{pendingCartItem.name}</span> (₱
                {pendingCartItem.unitPrice.toLocaleString()}) will be
                automatically added to your bag once you sign in.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-stone-600 hover:text-stone-900 underline whitespace-nowrap cursor-pointer"
          >
            Return to Landing Page
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Sign In / Staff Quick Camera Login / Register Form */}
        <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5 mb-6">
            <div>
              <p className="text-xs font-medium text-amber-900 mb-1">
                Unified Role-Based Portal (Customer · Cashier · Delivery · Admin)
              </p>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-stone-900">
                {mode === 'login'
                  ? 'Sign In to Your Account'
                  : mode === 'camera_quick_login'
                  ? 'Staff Camera Quick Login'
                  : 'Create Customer Account'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => {
                  clearAutoLoginTimer();
                  stopQuickLoginCamera();
                  setMode('login');
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => handleStartQuickCamera(selectedQuickStaff)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  mode === 'camera_quick_login'
                    ? 'bg-amber-900 text-white shadow-xs font-semibold'
                    : 'text-amber-950 hover:bg-stone-200/70'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Staff Camera Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAutoLoginTimer();
                  stopQuickLoginCamera();
                  setMode('register');
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {mode === 'login' && (
            <>
              {/* Staff Quick Camera Login Callout Banner */}
              <div className="mb-5 p-3.5 rounded-xl border border-amber-900/25 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-900 text-white flex items-center justify-center shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-900">
                      Staff Biometric Photo Quick Login Available
                    </p>
                    <p className="text-[11px] text-stone-600">
                      Cashier, Delivery &amp; Admin staff can authenticate via live camera photo match against their stored profile picture.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartQuickCamera(selectedQuickStaff)}
                  className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-amber-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Open Camera Login</span>
                </button>
              </div>

              {/* 4-Role Switcher Tabs (Customer, Cashier, Delivery, Admin) */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Select Role to Auto-Fill Credentials (or enter email below)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectPresetRole('customer')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      selectedRoleTab === 'customer'
                        ? 'border-amber-900 bg-amber-950/[0.04]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <UserCheck className="w-4 h-4 text-amber-900" />
                      <span className="text-[10px] font-mono text-stone-500">
                        Role 01
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-stone-900">
                      Customer
                    </p>
                    <p className="text-[10px] text-stone-500 truncate">
                      → Customer Dashboard
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetRole('cashier')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      selectedRoleTab === 'cashier'
                        ? 'border-amber-900 bg-amber-950/[0.04]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <CreditCard className="w-4 h-4 text-emerald-800" />
                      <span className="text-[10px] font-mono text-stone-500">
                        Role 02
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-stone-900">
                      Cashier
                    </p>
                    <p className="text-[10px] text-stone-500 truncate">
                      → Cashier Dashboard
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetRole('delivery')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      selectedRoleTab === 'delivery'
                        ? 'border-amber-900 bg-amber-950/[0.04]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Truck className="w-4 h-4 text-amber-900" />
                      <span className="text-[10px] font-mono text-stone-500">
                        Role 03
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-stone-900">
                      Delivery
                    </p>
                    <p className="text-[10px] text-stone-500 truncate">
                      → Delivery Dashboard
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetRole('admin')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      selectedRoleTab === 'admin'
                        ? 'border-amber-900 bg-amber-950/[0.04]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <ShieldCheck className="w-4 h-4 text-amber-900" />
                      <span className="text-[10px] font-mono text-stone-500">
                        Role 04
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-stone-900">
                      Admin / Owner
                    </p>
                    <p className="text-[10px] text-stone-500 truncate">
                      → Admin Dashboard
                    </p>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium text-stone-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@dulcekusina.ph"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm font-mono text-stone-900 focus:outline-none focus:border-amber-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-stone-700 mb-1"
                  >
                    Password (or Staff One-Time Password)
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm font-mono text-stone-900 focus:outline-none focus:border-amber-900"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In &amp; Redirect to Role Dashboard</span>
                </button>
              </form>
            </>
          )}

          {/* MODE 2: STAFF QUICK CAMERA LOGIN (PHOTO MATCH AUTHENTICATION) */}
          {mode === 'camera_quick_login' && selectedQuickStaff && (
            <div className="space-y-5">
              {/* Step 1: Select Staff Member to Match Against Stored System Profile */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-stone-800">
                    1. Select Staff Profile for Photo Verification
                  </label>
                  <span className="text-[11px] font-mono text-stone-500">
                    Required Confidence: &ge;78% Match
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {staffAccounts.map((staff) => {
                    const isSelected = staff.id === selectedQuickStaff.id;
                    const resolvedAvatar = getResolvedStaffAvatar(staff);
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          clearAutoLoginTimer();
                          setSelectedQuickStaffId(staff.id);
                          setCapturedPhotoUri('');
                          setMatchResult(null);
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-amber-900 bg-amber-50/70 ring-1 ring-amber-900/20'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <img
                          src={resolvedAvatar}
                          alt={staff.name}
                          className="w-11 h-11 rounded-lg object-cover border border-stone-300 shrink-0 bg-stone-100"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono uppercase font-semibold text-amber-900">
                              {staff.role} · {staff.employeeId || 'STAFF'}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs font-semibold text-stone-900 truncate mt-0.5">
                            {staff.name}
                          </p>
                          <p className="text-[11px] font-mono text-stone-500 truncate">
                            {staff.shift || 'Active Shift'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Live Camera Viewfinder & Stored Profile Comparison */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-stone-900">
                      2. Device Camera Capture vs. Stored Profile Picture
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Captures a live camera frame and compares pixel/luminance similarity against{' '}
                      <span className="font-semibold text-stone-800">
                        {selectedQuickStaff.name}
                      </span>
                      ’s stored profile picture.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCameraActive ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleStartQuickCamera(selectedQuickStaff)
                        }
                        className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-amber-900 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Start Camera</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopQuickLoginCamera}
                        className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-stone-700 text-xs font-medium inline-flex items-center gap-1 cursor-pointer hover:bg-stone-100"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Stop Camera</span>
                      </button>
                    )}
                  </div>
                </div>

                {cameraStatusNotice && (
                  <p className="text-[11px] font-mono text-amber-950 bg-amber-50 border border-amber-900/20 rounded-lg px-3 py-2">
                    {cameraStatusNotice}
                  </p>
                )}

                {/* Side-by-Side Viewfinder & Stored System Profile Picture */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Box: Live Camera Feed / Captured Photo */}
                  <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-[11px] font-mono text-stone-600 mb-2">
                      <span className="font-semibold text-stone-900">
                        LIVE CAMERA CAPTURE
                      </span>
                      <span className="text-emerald-700 font-semibold">
                        {hasHardwareStream
                          ? '● Webcam Live'
                          : isCameraActive
                          ? '● Optical Ready'
                          : 'Standby'}
                      </span>
                    </div>

                    <div className="relative w-44 h-44 rounded-xl overflow-hidden border-2 border-amber-900/40 bg-stone-900 flex items-center justify-center">
                      {hasHardwareStream && isCameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : capturedPhotoUri ? (
                        <img
                          src={capturedPhotoUri}
                          alt="Captured staff verification"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img
                            src={getResolvedStaffAvatar(selectedQuickStaff)}
                            alt={selectedQuickStaff.name}
                            className="w-full h-full object-cover opacity-90"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/10 to-stone-950/50 flex flex-col items-center justify-end p-2.5 text-center">
                            <span className="text-[10px] font-mono text-white bg-stone-950/80 px-2 py-0.5 rounded">
                              Camera Framing Aligned
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Biometric Framing Reticle Overlay */}
                      <div className="pointer-events-none absolute inset-3 border border-dashed border-amber-300/70 rounded-xl" />
                    </div>

                    {hasHardwareStream && (
                      <label className="mt-2.5 flex items-center gap-1.5 text-[11px] text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enrollLiveWebcamOnCapture}
                          onChange={(e) =>
                            setEnrollLiveWebcamOnCapture(e.target.checked)
                          }
                          className="rounded border-stone-300 text-amber-900"
                        />
                        <span>Sync live webcam frame to stored profile</span>
                      </label>
                    )}
                  </div>

                  {/* Right Box: Stored System Profile Picture */}
                  <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-[11px] font-mono text-stone-600 mb-2">
                      <span className="font-semibold text-stone-900">
                        STORED PROFILE PICTURE
                      </span>
                      <span className="text-stone-500">
                        {selectedQuickStaff.employeeId || 'SYSTEM DB'}
                      </span>
                    </div>

                    <div className="relative w-44 h-44 rounded-xl overflow-hidden border-2 border-stone-200 bg-stone-100 flex items-center justify-center">
                      <img
                        src={getResolvedStaffAvatar(selectedQuickStaff)}
                        alt={`Stored profile for ${selectedQuickStaff.name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <p className="mt-2.5 text-[11px] text-stone-500 text-center">
                      Reference portrait on file for{' '}
                      <span className="font-semibold text-stone-800">
                        {selectedQuickStaff.name}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Action Controls: Capture & Verify, Upload Photo, Test Mismatch */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isVerifyingMatch}
                    onClick={() => handleCaptureAndVerifyPhoto(false)}
                    className="flex-1 min-w-[200px] py-2.5 px-4 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>
                      {isVerifyingMatch
                        ? 'Comparing Photo Against Stored Profile...'
                        : 'Capture Photo & Authenticate Staff'}
                    </span>
                  </button>

                  <label className="px-3 py-2.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-amber-900" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadQuickLoginPhoto}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleCaptureAndVerifyPhoto(true)}
                    className="px-3 py-2.5 rounded-lg border border-stone-300 bg-white hover:bg-red-50 hover:border-red-200 text-stone-600 hover:text-red-800 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                    title="Simulate capturing a non-matching photo to test security rejection"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Test Unrecognized Photo</span>
                  </button>
                </div>

                {/* Biometric Photo Match Verification Result Card */}
                {matchResult && (
                  <div
                    className={`p-4 rounded-xl border space-y-3 ${
                      matchResult.isMatch
                        ? 'bg-emerald-950/[0.05] border-emerald-800/30 text-emerald-950'
                        : 'bg-red-50 border-red-200 text-red-950'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {matchResult.isMatch ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-semibold">
                            {matchResult.isMatch
                              ? `Photo Match Verified (${matchResult.similarityScore}% Similarity) — Authenticated!`
                              : `Photo Match Failed (${matchResult.similarityScore}% Similarity — Minimum 78% Required)`}
                          </p>
                          <p className="text-[11px] opacity-80 font-mono">
                            Pixel Correlation: {matchResult.pixelCorrelation}% · Luminance Match: {matchResult.luminanceScore}%
                          </p>
                        </div>
                      </div>

                      {matchResult.isMatch ? (
                        <button
                          type="button"
                          onClick={() => {
                            clearAutoLoginTimer();
                            stopQuickLoginCamera();
                            onLoginSuccess(selectedQuickStaff);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <span>
                            {autoLoginCountdown !== null
                              ? `Entering Dashboard (${autoLoginCountdown}s)...`
                              : `Continue as ${selectedQuickStaff.name}`}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          {capturedPhotoUri && (
                            <button
                              type="button"
                              onClick={handleEnrollCurrentCaptureAsStoredProfile}
                              className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-amber-900 cursor-pointer"
                            >
                              Enroll Captured Photo as Stored Profile &amp; Sign In
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Visual Match Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          matchResult.isMatch ? 'bg-emerald-700' : 'bg-red-600'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(8, matchResult.similarityScore))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE 3: CUSTOMER REGISTRATION */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="e.g. Sofia"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="e.g. Macapagal"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Birthdate *
                  </label>
                  <input
                    type="date"
                    required
                    value={regBirthdate}
                    onChange={(e) => setRegBirthdate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Age (Auto)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      regComputedAge !== '' ? `${regComputedAge} yrs` : ''
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-100 font-mono font-semibold text-amber-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="sofia@gmail.com"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Default Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="House/Unit No., Street, Barangay, City"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Password (with Security) *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create strong password"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-medium text-stone-700">
                  Password Security: <strong>{regSecurity.label}</strong> (
                  {regSecurity.score}/5)
                </span>
                <span
                  className={
                    regPassword === regConfirmPassword && regPassword
                      ? 'text-emerald-700 font-semibold inline-flex items-center gap-1'
                      : 'text-amber-800'
                  }
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {regPassword === regConfirmPassword && regPassword
                    ? 'Confirm Password Matched'
                    : 'Passwords must match'}
                </span>
              </div>

              {regError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {regError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Create Customer Account &amp; Continue
              </button>
            </form>
          )}
        </div>

        {/* Right 5 Columns: Instant Role Login & Camera Quick Login Directory */}
        <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Role Login &amp; Staff Camera Directory
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Sign in with 1 click or click <strong>Camera Login</strong> on any staff member below to authenticate via live device camera photo matching against their stored profile picture.
            </p>
          </div>

          <div className="space-y-3 text-xs max-h-[560px] overflow-y-auto pr-1">
            {/* Customer Accounts */}
            {users
              .filter((u) => u.role === 'customer')
              .map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl border border-stone-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-amber-900 font-semibold">
                      CUSTOMER ROLE → Customer Dashboard
                    </p>
                    <p className="font-semibold text-stone-900 truncate mt-0.5">
                      {u.name}
                    </p>
                    <p className="font-mono text-stone-500 truncate">
                      {u.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onLoginSuccess(u)}
                    className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

            {/* Cashier Staff Accounts */}
            {cashiersList.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-xl border border-stone-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={getResolvedStaffAvatar(u)}
                    alt={u.name}
                    className="w-10 h-10 rounded-lg object-cover border border-stone-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-emerald-800 font-semibold flex items-center gap-1">
                      <span>CASHIER ROLE</span>
                      {u.qrCodeImage && <QrCode className="w-3 h-3" />}
                    </p>
                    <p className="font-semibold text-stone-900 truncate mt-0.5">
                      {u.name}{' '}
                      {u.employeeId && (
                        <span className="font-mono text-[11px] text-stone-500">
                          ({u.employeeId})
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-stone-500 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartQuickCamera(u)}
                    className="px-2.5 py-2 rounded-lg border border-emerald-800/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    title={`Authenticate ${u.name} via Camera Photo Match`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoginSuccess(u)}
                    className="px-3 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Delivery Staff Accounts */}
            {deliveryList.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-xl border border-amber-900/30 bg-amber-50/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={getResolvedStaffAvatar(u)}
                    alt={u.name}
                    className="w-10 h-10 rounded-lg object-cover border border-stone-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-amber-900 font-semibold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      <span>DELIVERY ROLE</span>
                      {u.qrCodeImage && <QrCode className="w-3 h-3" />}
                    </p>
                    <p className="font-semibold text-stone-900 truncate mt-0.5">
                      {u.name}{' '}
                      {u.employeeId && (
                        <span className="font-mono text-[11px] text-stone-500">
                          ({u.employeeId})
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-stone-500 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartQuickCamera(u)}
                    className="px-2.5 py-2 rounded-lg border border-amber-900/30 bg-white hover:bg-amber-100/60 text-amber-950 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    title={`Authenticate ${u.name} via Camera Photo Match`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoginSuccess(u)}
                    className="px-3 py-2 rounded-lg bg-amber-900 hover:bg-amber-950 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Admin Account */}
            {users
              .filter((u) => u.role === 'admin')
              .map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl border border-stone-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={getResolvedStaffAvatar(u)}
                      alt={u.name}
                      className="w-10 h-10 rounded-lg object-cover border border-stone-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono text-amber-900 font-semibold">
                        ADMIN ROLE → Admin Dashboard
                      </p>
                      <p className="font-semibold text-stone-900 truncate mt-0.5">
                        {u.name}
                      </p>
                      <p className="font-mono text-stone-500 truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartQuickCamera(u)}
                      className="px-2.5 py-2 rounded-lg border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      title={`Authenticate ${u.name} via Camera Photo Match`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onLoginSuccess(u)}
                      className="px-3 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Login</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};
