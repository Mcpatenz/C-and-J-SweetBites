import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Lock,
  UserCheck,
  QrCode,
  Eye,
  EyeOff,
} from 'lucide-react';
import { StaffGender, UserAccount } from '../types/bakery';
import {
  calculateAgeFromBirthdate,
  createStaffAvatarPlaceholder,
  evaluatePasswordSecurity,
  generateUniqueStaffQrDataUri,
} from '../utils/staffHelpers';

interface ProfileSecurityModalProps {
  isOpen: boolean;
  user: UserAccount;
  onClose: () => void;
  onSaveProfile: (updatedUser: UserAccount) => void;
}

export const ProfileSecurityModal: React.FC<ProfileSecurityModalProps> = ({
  isOpen,
  user,
  onClose,
  onSaveProfile,
}) => {
  const [firstName, setFirstName] = useState<string>(
    user.firstName || user.name.split(' ')[0] || ''
  );
  const [middleName, setMiddleName] = useState<string>(user.middleName || '');
  const [lastName, setLastName] = useState<string>(
    user.lastName || user.name.split(' ').slice(1).join(' ') || ''
  );
  const [email, setEmail] = useState<string>(user.email || '');
  const [phone, setPhone] = useState<string>(user.phone || '');
  const [address, setAddress] = useState<string>(user.address || '');
  const [birthdate, setBirthdate] = useState<string>(
    user.birthdate || '1998-05-15'
  );
  const [gender, setGender] = useState<StaffGender>(user.gender || 'Female');
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user.avatar || createStaffAvatarPlaceholder(user.name, user.role)
  );

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Password & Confirm Password Security state
  const [newPassword, setNewPassword] = useState<string>(user.password || '');
  const [confirmPassword, setConfirmPassword] = useState<string>(
    user.password || ''
  );
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFirstName(user.firstName || user.name.split(' ')[0] || '');
      setMiddleName(user.middleName || '');
      setLastName(
        user.lastName || user.name.split(' ').slice(1).join(' ') || ''
      );
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setBirthdate(user.birthdate || '1998-05-15');
      setGender(user.gender || 'Female');
      setAvatarPreview(
        user.avatar || createStaffAvatarPlaceholder(user.name, user.role)
      );
      setNewPassword(user.password || 'Password@123');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, user]);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleStartCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 320 },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setCameraError(
        'Camera access unavailable in this browser frame. Generating simulated live camera snapshot instead.'
      );
      const initials = `${firstName[0] || 'U'}${lastName[0] || 'S'}`;
      setAvatarPreview(createStaffAvatarPlaceholder(initials, user.role));
    }
  };

  const handleCaptureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 240, 240);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setAvatarPreview(dataUrl);
    }
    stopCameraStream();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const computedAge = calculateAgeFromBirthdate(birthdate);
  const passwordSecurity = evaluatePasswordSecurity(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('First name and last name are required.');
      return;
    }

    if (!passwordSecurity.isValid) {
      setErrorMsg(
        'Password must meet security requirements (minimum 8 characters, including uppercase, lowercase, number, and special character).'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(
        'Confirm Password does not match your password. Please re-enter both fields.'
      );
      return;
    }

    const fullName = [firstName.trim(), middleName.trim(), lastName.trim()]
      .filter(Boolean)
      .join(' ');

    const updatedQr =
      user.role === 'cashier' || user.role === 'delivery'
        ? generateUniqueStaffQrDataUri({
            employeeId: user.employeeId || 'EMP-2026-001',
            fullName,
            role: user.role,
            email: email.trim().toLowerCase(),
          })
        : null;

    const updatedUser: UserAccount = {
      ...user,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      birthdate,
      age: typeof computedAge === 'number' ? computedAge : user.age,
      gender,
      avatar: avatarPreview,
      password: newPassword,
      isOneTimePassword: false,
      ...(updatedQr
        ? {
            qrCodeImage: updatedQr.qrDataUri,
            qrCodePayload: updatedQr.payload,
          }
        : {}),
    };

    onSaveProfile(updatedUser);
    setSuccessMsg(
      'Profile and password security updated! Your changes are now active.'
    );
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-900 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold text-amber-900 uppercase">
                ACCOUNT PROFILE &amp; PASSWORD SECURITY · {user.role.toUpperCase()}
              </p>
              <h2 className="text-lg font-display font-semibold text-stone-900">
                Update Profile &amp; Security Credentials
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {user.isOneTimePassword && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-700/40 text-xs text-amber-950 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                One-Time Password (OTP) Active on Your Account
              </p>
              <p className="mt-0.5 text-amber-900">
                You signed in with an Admin-issued One-Time Password. Please set a permanent high-security password and confirm it below.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Profile Photo Upload or Camera Capture with Preview + QR Code (if staff) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200/90 items-center">
            <div className="sm:col-span-7 flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-stone-300 bg-white shrink-0 flex items-center justify-center relative">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={avatarPreview}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-stone-900">
                  Profile Image (Upload or Camera with Preview)
                </p>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 font-medium cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-900" />
                      <span>Use Camera</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCaptureCameraPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Capture Snapshot</span>
                    </button>
                  )}
                </div>
                {cameraError && (
                  <p className="text-[11px] text-amber-800">{cameraError}</p>
                )}
              </div>
            </div>

            {(user.role === 'cashier' || user.role === 'delivery') &&
              user.qrCodeImage && (
                <div className="sm:col-span-5 flex items-center gap-3 sm:border-l border-stone-200 sm:pl-4">
                  <img
                    src={user.qrCodeImage}
                    alt="Staff QR Code"
                    className="w-16 h-16 rounded-lg border border-stone-200 bg-white p-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono font-semibold text-amber-900 flex items-center gap-1">
                      <QrCode className="w-3 h-3" />
                      <span>STAFF QR BADGE</span>
                    </p>
                    <p className="font-mono font-semibold text-stone-900 truncate">
                      {user.employeeId || 'EMP-2026'}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Unique Staff ID QR
                    </p>
                  </div>
                </div>
              )}
          </div>

          {/* Personal Details: Employee ID (if staff), Last Name, First Name, Middle Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900"
              />
            </div>
          </div>

          {/* Birthdate, Auto-Calculated Age, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Birthdate *
              </label>
              <input
                type="date"
                required
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-mono text-stone-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Age (Auto-Computed)
              </label>
              <input
                type="text"
                readOnly
                value={
                  computedAge !== '' ? `${computedAge} yrs old` : 'Enter birthdate'
                }
                className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-100 font-mono font-semibold text-amber-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as StaffGender)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Contact Number, Email Address, Home Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Contact Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-mono text-stone-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-mono text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Home Address *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Unit No., Street, Barangay, City, Province"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900"
            />
          </div>

          {/* Password Security & Confirm Password Section */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                <Lock className="w-3.5 h-3.5 text-amber-900" />
                <span>Password Security &amp; Confirm Password Verification</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="inline-flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  New / Current Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong password"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-mono text-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password to confirm"
                  className={`w-full px-3 py-2 rounded-lg border bg-white font-mono text-stone-900 ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-500'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-emerald-600'
                      : 'border-stone-300'
                  }`}
                />
              </div>
            </div>

            {/* Password Security Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-600 font-medium">
                  Password Security Strength:
                </span>
                <span
                  className={`font-mono font-semibold ${
                    passwordSecurity.score >= 4
                      ? 'text-emerald-700'
                      : passwordSecurity.score === 3
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}
                >
                  {passwordSecurity.label} ({passwordSecurity.score}/5 rules)
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    passwordSecurity.score >= 4
                      ? 'bg-emerald-600'
                      : passwordSecurity.score === 3
                      ? 'bg-amber-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${(passwordSecurity.score / 5) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                {[
                  { ok: passwordSecurity.checks.minLength, label: '8+ Characters' },
                  {
                    ok: passwordSecurity.checks.hasUppercase,
                    label: 'Uppercase (A-Z)',
                  },
                  {
                    ok: passwordSecurity.checks.hasLowercase,
                    label: 'Lowercase (a-z)',
                  },
                  { ok: passwordSecurity.checks.hasNumber, label: 'Number (0-9)' },
                  {
                    ok: passwordSecurity.checks.hasSpecial,
                    label: 'Symbol (!@#$%)',
                  },
                  {
                    ok:
                      Boolean(confirmPassword) &&
                      confirmPassword === newPassword,
                    label: 'Passwords Match',
                  },
                ].map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-1 ${
                      rule.ok ? 'text-emerald-800 font-medium' : 'text-stone-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-medium hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirm Password &amp; Update Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
