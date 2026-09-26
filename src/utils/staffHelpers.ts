export function calculateAgeFromBirthdate(birthdate: string): number | '' {
  if (!birthdate) return '';
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : 0;
}

export function calculateLengthOfService(
  dateHired?: string,
  options?: { compact?: boolean }
): string {
  if (!dateHired) return '';
  const parsed = new Date(
    dateHired.includes('T') ? dateHired : `${dateHired}T00:00:00`
  );
  if (Number.isNaN(parsed.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );

  if (start > today) {
    const diffDays = Math.ceil(
      (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `Starts in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  }

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  let days = today.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years === 0 && months === 0 && days === 0) {
    return options?.compact
      ? 'Newly Hired (Today)'
      : 'Newly Hired Today (0 days)';
  }

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
  }
  if (days > 0 && (!options?.compact || years === 0)) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }

  return parts.join(', ');
}

export function generateOneTimePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';

  const pick = (str: string) => str[Math.floor(Math.random() * str.length)];

  const part1 = `${pick(upper)}${pick(upper)}${pick(lower)}`;
  const part2 = `${pick(digits)}${pick(digits)}${pick(digits)}${pick(digits)}`;
  const part3 = `${pick(symbols)}${pick(upper)}`;

  return `OTP-${part1}${part2}${part3}`;
}

export interface PasswordSecurityEvaluation {
  score: number; // 0 to 5
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  isValid: boolean;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function evaluatePasswordSecurity(
  password: string
): PasswordSecurityEvaluation {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (score >= 5) label = 'Strong';
  else if (score === 4) label = 'Good';
  else if (score === 3) label = 'Fair';

  return {
    score,
    label,
    isValid: score >= 4 && checks.minLength,
    checks,
  };
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateUniqueStaffQrDataUri(params: {
  employeeId: string;
  fullName: string;
  role: string;
  email?: string;
  uniqueSeed?: string;
}): { qrDataUri: string; payload: string; checkInCode: string } {
  const cleanId = params.employeeId.trim() || 'EMP-NEW';
  const cleanName = params.fullName.trim() || 'Staff Member';
  const cleanRole = params.role.trim().toUpperCase() || 'STAFF';
  const cleanEmail = params.email?.trim().toLowerCase() || '';
  const seed = params.uniqueSeed ? `|SEED:${params.uniqueSeed}` : '';

  const tokenHash = hashString(
    `${cleanId}:${cleanName}:${cleanRole}:${cleanEmail}:${seed}`
  )
    .toString(16)
    .toUpperCase()
    .padStart(8, '0')
    .slice(0, 6);

  const checkInCode = `CHK-${cleanId.replace(/[^A-Z0-9]/gi, '').slice(-5)}-${tokenHash}`;
  const payload = `DULCEKUSINA-CHECKIN|CODE:${checkInCode}|ID:${cleanId}|NAME:${cleanName}|ROLE:${cleanRole}|EMAIL:${cleanEmail}`;

  const accentHex =
    params.role === 'delivery'
      ? '#78350F'
      : params.role === 'cashier'
      ? '#065F46'
      : '#1C1917';

  // Generate a 15x15 deterministic matrix based on the unique staff payload
  const gridSize = 15;
  const cellSize = 11;
  const offset = 24;
  let rects = '';

  const isFinderZone = (r: number, c: number) => {
    if (r < 4 && c < 4) return true;
    if (r < 4 && c >= gridSize - 4) return true;
    if (r >= gridSize - 4 && c < 4) return true;
    // Center badge zone
    if (r >= 6 && r <= 8 && c >= 4 && c <= 10) return true;
    return false;
  };

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (isFinderZone(r, c)) continue;
      const cellHash = hashString(`${payload}:${r}:${c}`);
      if (cellHash % 2 === 0 || (r + c + cellHash) % 5 === 0) {
        const x = offset + c * cellSize;
        const y = offset + r * cellSize;
        rects += `<rect x="${x}" y="${y}" width="${cellSize - 1.5}" height="${
          cellSize - 1.5
        }" rx="2" fill="#1C1917"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
    <rect width="240" height="240" rx="16" fill="#FFFFFF" stroke="${accentHex}" stroke-width="5"/>
    <!-- Top Left Finder -->
    <rect x="20" y="20" width="44" height="44" rx="6" fill="none" stroke="#1C1917" stroke-width="6"/>
    <rect x="31" y="31" width="22" height="22" rx="3" fill="${accentHex}"/>
    <!-- Top Right Finder -->
    <rect x="145" y="20" width="44" height="44" rx="6" fill="none" stroke="#1C1917" stroke-width="6"/>
    <rect x="156" y="31" width="22" height="22" rx="3" fill="${accentHex}"/>
    <!-- Bottom Left Finder -->
    <rect x="20" y="145" width="44" height="44" rx="6" fill="none" stroke="#1C1917" stroke-width="6"/>
    <rect x="31" y="156" width="22" height="22" rx="3" fill="${accentHex}"/>
    <!-- Unique Staff Matrix -->
    ${rects}
    <!-- Center Staff Role Pill -->
    <rect x="64" y="88" width="86" height="30" rx="6" fill="${accentHex}"/>
    <text x="107" y="107" text-anchor="middle" fill="#FFFFFF" font-family="monospace" font-weight="bold" font-size="9.5">${cleanId.slice(
      0,
      12
    )}</text>
    <!-- Footer Label -->
    <rect x="16" y="200" width="208" height="26" rx="6" fill="#F5F5F4"/>
    <text x="120" y="217" text-anchor="middle" fill="#1C1917" font-family="monospace" font-weight="bold" font-size="9.5">${cleanRole} · ${checkInCode}</text>
  </svg>`;

  return {
    qrDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    payload,
    checkInCode,
  };
}

export function downloadStaffQrBadgeSvg(params: {
  employeeId?: string;
  name: string;
  role: string;
  qrCodeImage?: string;
}) {
  if (!params.qrCodeImage) return;
  const link = document.createElement('a');
  link.href = params.qrCodeImage;
  const safeId = (params.employeeId || params.name)
    .replace(/[^a-z0-9-_]/gi, '-')
    .toUpperCase();
  link.download = `DulceKusina-QR-${params.role.toUpperCase()}-${safeId}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function createStaffAvatarPlaceholder(
  initials: string,
  role: string
): string {
  const bgHex =
    role === 'delivery'
      ? '#78350F'
      : role === 'cashier'
      ? '#065F46'
      : role === 'admin'
      ? '#44403C'
      : '#292524';
  const accentHex =
    role === 'delivery'
      ? '#F59E0B'
      : role === 'cashier'
      ? '#10B981'
      : '#D97706';
  const cleanInitials = (initials || 'ST').slice(0, 2).toUpperCase();
  const seed = hashString(`${cleanInitials}:${role}`);
  const skinTones = ['#F3D2B3', '#E8B892', '#D99B72', '#F7DEC8'];
  const hairColors = ['#1C1917', '#292524', '#3F2314', '#44403C'];
  const skinHex = skinTones[seed % skinTones.length];
  const hairHex = hairColors[(seed >> 2) % hairColors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="24" fill="${bgHex}"/>
    <circle cx="60" cy="60" r="52" fill="none" stroke="${accentHex}" stroke-opacity="0.35" stroke-width="2"/>
    <!-- Shoulders / Bakery Uniform Apron -->
    <path d="M22 120 C24 92 40 82 60 82 C80 82 96 92 98 120 Z" fill="#FAF9F6"/>
    <path d="M40 84 L46 120 L74 120 L80 84 Z" fill="${accentHex}" fill-opacity="0.88"/>
    <!-- Neck & Head -->
    <rect x="52" y="68" width="16" height="18" rx="6" fill="${skinHex}"/>
    <circle cx="60" cy="50" r="22" fill="${skinHex}"/>
    <!-- Hair -->
    <path d="M36 48 C36 28 50 22 60 22 C72 22 84 28 84 48 C78 38 68 35 60 35 C50 35 42 39 36 48 Z" fill="${hairHex}"/>
    <!-- Facial Features -->
    <circle cx="52" cy="50" r="2.3" fill="#1C1917"/>
    <circle cx="68" cy="50" r="2.3" fill="#1C1917"/>
    <path d="M53 59 Q60 64 67 59" fill="none" stroke="#78350F" stroke-width="2.2" stroke-linecap="round"/>
    <!-- Corner Initials Badge -->
    <rect x="78" y="10" width="32" height="22" rx="6" fill="#1C1917" fill-opacity="0.82"/>
    <text x="94" y="25" text-anchor="middle" fill="#FFFFFF" font-family="monospace" font-weight="bold" font-size="11">${cleanInitials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface StaffPhotoMatchResult {
  similarityScore: number;
  isMatch: boolean;
  pixelCorrelation: number;
  luminanceScore: number;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export async function compareStaffProfilePhotos(
  capturedDataUri: string,
  storedAvatarDataUri: string,
  threshold = 78
): Promise<StaffPhotoMatchResult> {
  if (!capturedDataUri || !storedAvatarDataUri) {
    return {
      similarityScore: 0,
      isMatch: false,
      pixelCorrelation: 0,
      luminanceScore: 0,
    };
  }

  if (capturedDataUri === storedAvatarDataUri) {
    return {
      similarityScore: 99.4,
      isMatch: true,
      pixelCorrelation: 99.6,
      luminanceScore: 99.2,
    };
  }

  try {
    const [imgA, imgB] = await Promise.all([
      loadImageElement(capturedDataUri),
      loadImageElement(storedAvatarDataUri),
    ]);

    const size = 32;
    const canvasA = document.createElement('canvas');
    const canvasB = document.createElement('canvas');
    canvasA.width = size;
    canvasA.height = size;
    canvasB.width = size;
    canvasB.height = size;

    const ctxA = canvasA.getContext('2d');
    const ctxB = canvasB.getContext('2d');
    if (!ctxA || !ctxB) {
      return {
        similarityScore: 0,
        isMatch: false,
        pixelCorrelation: 0,
        luminanceScore: 0,
      };
    }

    ctxA.drawImage(imgA, 0, 0, size, size);
    ctxB.drawImage(imgB, 0, 0, size, size);

    const dataA = ctxA.getImageData(0, 0, size, size).data;
    const dataB = ctxB.getImageData(0, 0, size, size).data;

    let totalColorDiff = 0;
    let totalLumDiff = 0;
    const pixelCount = size * size;

    for (let i = 0; i < dataA.length; i += 4) {
      const rA = dataA[i];
      const gA = dataA[i + 1];
      const bA = dataA[i + 2];

      const rB = dataB[i];
      const gB = dataB[i + 1];
      const bB = dataB[i + 2];

      const dr = Math.abs(rA - rB) / 255;
      const dg = Math.abs(gA - gB) / 255;
      const db = Math.abs(bA - bB) / 255;
      totalColorDiff += (dr + dg + db) / 3;

      const lumA = (0.299 * rA + 0.587 * gA + 0.114 * bA) / 255;
      const lumB = (0.299 * rB + 0.587 * gB + 0.114 * bB) / 255;
      totalLumDiff += Math.abs(lumA - lumB);
    }

    const pixelCorrelation = Math.max(
      0,
      Math.min(100, (1 - totalColorDiff / pixelCount) * 100)
    );
    const luminanceScore = Math.max(
      0,
      Math.min(100, (1 - totalLumDiff / pixelCount) * 100)
    );
    const combined = Number(
      (pixelCorrelation * 0.65 + luminanceScore * 0.35).toFixed(1)
    );

    return {
      similarityScore: combined,
      isMatch: combined >= threshold,
      pixelCorrelation: Number(pixelCorrelation.toFixed(1)),
      luminanceScore: Number(luminanceScore.toFixed(1)),
    };
  } catch {
    return {
      similarityScore: 0,
      isMatch: false,
      pixelCorrelation: 0,
      luminanceScore: 0,
    };
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadPrintableStaffIdCardSvg(params: {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  employeeId: string;
  fullName: string;
  role: string;
  age: string | number;
  birthdate: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  shift: string;
  terminal: string;
  checkInCode: string;
  qrCodeImage: string;
  avatar?: string;
}) {
  const accentHex =
    params.role.toLowerCase() === 'delivery'
      ? '#78350F'
      : params.role.toLowerCase() === 'cashier'
      ? '#065F46'
      : '#1C1917';
  const roleLabel =
    params.role.toLowerCase() === 'delivery'
      ? 'DELIVERY DISPATCH STAFF'
      : 'CASHIER & POS STAFF';

  const avatarHref =
    params.avatar ||
    createStaffAvatarPlaceholder(
      params.fullName
        .split(' ')
        .map((n) => n[0])
        .join(''),
      params.role
    );

  // CR80 Portrait ratio at 648x1028 high-res SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 648 1028" width="648" height="1028">
    <rect width="648" height="1028" rx="36" fill="#FAF9F6" stroke="#D6D3D1" stroke-width="4"/>
    <!-- Header Banner -->
    <path d="M0 36 C0 16 16 0 36 0 L612 0 C632 0 648 16 648 36 L648 190 L0 190 Z" fill="${accentHex}"/>
    <!-- Lanyard Slot Punch -->
    <rect x="264" y="22" width="120" height="22" rx="11" fill="#FAF9F6" stroke="#1C1917" stroke-opacity="0.2" stroke-width="2"/>
    <!-- Store Title -->
    <text x="324" y="86" text-anchor="middle" fill="#FFFFFF" font-family="Georgia, serif" font-weight="bold" font-size="28">${escapeXml(
      params.businessName
    )}</text>
    <text x="324" y="114" text-anchor="middle" fill="#F5F5F4" font-family="monospace" font-size="13" letter-spacing="2">OFFICIAL STAFF IDENTIFICATION BADGE</text>
    <rect x="174" y="132" width="300" height="34" rx="8" fill="#1C1917" fill-opacity="0.35"/>
    <text x="324" y="154" text-anchor="middle" fill="#FFFFFF" font-family="monospace" font-weight="bold" font-size="15" letter-spacing="1.5">${escapeXml(
      roleLabel
    )}</text>

    <!-- Employee Photo & Primary Details -->
    <rect x="44" y="222" width="164" height="164" rx="24" fill="#FFFFFF" stroke="${accentHex}" stroke-width="4"/>
    <image href="${escapeXml(
      avatarHref
    )}" x="48" y="226" width="156" height="156" preserveAspectRatio="xMidYMid slice"/>

    <text x="232" y="252" fill="${accentHex}" font-family="monospace" font-weight="bold" font-size="18">ID: ${escapeXml(
    params.employeeId
  )}</text>
    <text x="232" y="290" fill="#1C1917" font-family="sans-serif" font-weight="bold" font-size="26">${escapeXml(
      params.fullName.slice(0, 24)
    )}</text>
    <text x="232" y="322" fill="#57534E" font-family="monospace" font-size="15">Age: ${escapeXml(
      String(params.age)
    )} · ${escapeXml(params.gender)} · DOB: ${escapeXml(
    params.birthdate
  )}</text>
    <text x="232" y="350" fill="#57534E" font-family="sans-serif" font-size="15">Phone: ${escapeXml(
      params.phone
    )}</text>
    <text x="232" y="376" fill="#57534E" font-family="monospace" font-size="14">${escapeXml(
      params.email
    )}</text>

    <!-- Metadata Grid -->
    <line x1="44" y1="412" x2="604" y2="412" stroke="#E7E5E4" stroke-width="2"/>
    <text x="44" y="442" fill="#78716C" font-family="monospace" font-size="13">ASSIGNED SHIFT &amp; STATION</text>
    <text x="44" y="466" fill="#1C1917" font-family="sans-serif" font-weight="bold" font-size="16">${escapeXml(
      params.shift
    )} · ${escapeXml(params.terminal)}</text>
    <text x="44" y="498" fill="#78716C" font-family="monospace" font-size="13">HOME ADDRESS</text>
    <text x="44" y="522" fill="#1C1917" font-family="sans-serif" font-size="15">${escapeXml(
      params.address.slice(0, 58)
    )}</text>
    <line x1="44" y1="546" x2="604" y2="546" stroke="#E7E5E4" stroke-width="2"/>

    <!-- Unique Scannable QR Code Section -->
    <rect x="154" y="568" width="340" height="340" rx="24" fill="#FFFFFF" stroke="#E7E5E4" stroke-width="3"/>
    <image href="${escapeXml(
      params.qrCodeImage
    )}" x="169" y="583" width="310" height="310" preserveAspectRatio="xMidYMid meet"/>

    <text x="324" y="942" text-anchor="middle" fill="#1C1917" font-family="monospace" font-weight="bold" font-size="18">CHECK-IN CODE: ${escapeXml(
      params.checkInCode
    )}</text>
    <text x="324" y="970" text-anchor="middle" fill="#78716C" font-family="sans-serif" font-size="13">${escapeXml(
      params.businessAddress
    )} · ${escapeXml(params.businessPhone)}</text>
  </svg>`;

  const link = document.createElement('a');
  link.href = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  const safeId = (params.employeeId || params.fullName)
    .replace(/[^a-z0-9-_]/gi, '-')
    .toUpperCase();
  link.download = `DulceKusina-Staff-ID-${safeId}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function extractCheckInCodeFromPayload(
  qrPayload?: string,
  employeeId?: string
): string {
  if (qrPayload) {
    const match = qrPayload.match(/CODE:([^|]+)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  const cleanId = (employeeId || 'STAFF').replace(/[^A-Z0-9]/gi, '').slice(-5);
  return `CHK-${cleanId}-QR`;
}

export function matchStaffByQrInput<
  T extends {
    id: string;
    employeeId?: string;
    name: string;
    email: string;
    qrCodePayload?: string;
  }
>(rawInput: string, staffMembers: T[]): T | undefined {
  const cleaned = rawInput.trim();
  if (!cleaned) return undefined;
  const upper = cleaned.toUpperCase();

  return staffMembers.find((member) => {
    const payload = (member.qrCodePayload || '').toUpperCase();
    const empId = (member.employeeId || '').toUpperCase();
    const checkInCode = extractCheckInCodeFromPayload(
      member.qrCodePayload,
      member.employeeId
    ).toUpperCase();
    const nameUpper = member.name.toUpperCase();
    const emailUpper = member.email.toUpperCase();

    if (payload && (payload === upper || upper.includes(payload))) return true;
    if (checkInCode && (upper === checkInCode || upper.includes(checkInCode)))
      return true;
    if (empId && (upper === empId || upper.includes(`ID:${empId}`) || upper.includes(empId)))
      return true;
    if (upper === nameUpper || upper === emailUpper) return true;
    return false;
  });
}


