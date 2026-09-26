export type UserRole = 'customer' | 'cashier' | 'delivery' | 'admin';

export type StaffGender = 'Female' | 'Male' | 'Non-Binary' | 'Prefer not to say';

export interface UserAccount {
  id: string;
  employeeId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  isOneTimePassword?: boolean;
  role: UserRole;
  address?: string;
  birthdate?: string;
  age?: number;
  gender?: StaffGender;
  avatar?: string;
  qrCodeImage?: string;
  qrCodePayload?: string;
  shift?: string;
  terminal?: string;
  status?: 'Active' | 'Off Duty';
  lastAttendanceAction?: 'Check-In' | 'Check-Out';
  lastAttendanceTime?: string;
  dateHired?: string;
  lengthOfService?: string;
  createdAt?: string;
}

export type AttendanceScanMethod =
  | 'QR Camera Scan'
  | 'QR Badge Upload'
  | 'QR Code Scanner'
  | 'Quick QR Tap';

export interface StaffAttendanceLog {
  id: string;
  staffId: string;
  employeeId: string;
  staffName: string;
  role: UserRole;
  action: 'Check-In' | 'Check-Out';
  statusAfter: 'Active' | 'Off Duty';
  checkInCode: string;
  qrPayload: string;
  shift: string;
  terminal: string;
  timestamp: string;
  verifiedByCashier: string;
  method: AttendanceScanMethod;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  address: string;
  contactNumber: string;
  operatingHours: string;
  gcashAccountName: string;
  gcashNumber: string;
  gcashQrImage: string;
  mayaAccountName: string;
  mayaNumber: string;
  mayaQrImage: string;
  bankAccountInfo: string;
}

export type CategoryId =
  | 'all'
  | 'cakes'
  | 'brownies'
  | 'cassava'
  | 'desserts'
  | 'food_packs'
  | 'bundles';

export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled';

export type PaymentMethod =
  | 'Cash on Delivery'
  | 'Cash on Pickup'
  | 'GCash'
  | 'Maya'
  | 'Bank Transfer';

export type PaymentStatus =
  | 'Pending Verification'
  | 'Verified'
  | 'Collect on Fulfillment'
  | 'Paid';

export type FulfillmentType = 'Delivery' | 'Pickup';

export interface ProductVariation {
  id: string;
  label: string;
  priceDelta: number;
}

export interface Product {
  id: string;
  name: string;
  category: Exclude<CategoryId, 'all'>;
  subcategory: string;
  price: number;
  unitLabel: string;
  prepTime: string;
  description: string;
  image: string;
  featured: boolean;
  stock: number;
  lowStockThreshold: number;
  soldCount: number;
  rating: number;
  reviewCount: number;
  variations?: ProductVariation[];
  inclusions?: string[];
}

export interface CustomCakeSpec {
  size: '6" Round' | '8" Round' | '10" Tiered' | 'Custom Bento';
  flavor: 'Chocolate' | 'Vanilla' | 'Red Velvet' | 'Ube' | 'Mocha';
  filling:
    | 'Chantilly Cream'
    | 'Belgian Chocolate'
    | 'Guimaras Mango'
    | 'Ube Halaya'
    | 'Salted Caramel';
  frosting:
    | 'Swiss Meringue Buttercream'
    | 'Whipped Cream Cheese'
    | 'Dark Ganache Glaze'
    | 'Minimalist Naked Coat';
  theme:
    | 'Minimalist Pastel'
    | 'Vintage Lambeth Piping'
    | 'Tropical Floral Crown'
    | 'Gold Leaf & Macarons'
    | 'Kids Character Theme';
  message: string;
  inspirationImage?: string;
  inspirationNote?: string;
  preferredDate: string;
  preferredTime: string;
  estimatedPrice: number;
}

export interface PartyPackageCustomization {
  eventType:
    | 'Birthday'
    | 'Wedding'
    | 'Baptism'
    | 'Graduation'
    | 'Anniversary'
    | 'Corporate Events'
    | 'Christmas';
  cakeFlavor: string;
  brownieAssortment: string;
  savoryMenuChoice: string;
  eventNotes?: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  category: Exclude<CategoryId, 'all'>;
  unitPrice: number;
  quantity: number;
  image: string;
  selectedVariation?: string;
  customCake?: CustomCakeSpec;
  partyPackage?: PartyPackageCustomization;
}

export interface OrderNotification {
  id: string;
  orderNumber: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  isTransitionAlert?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  fulfillmentType: FulfillmentType;
  scheduledDate: string;
  scheduledTime: string;
  deliveryAddress: string;
  specialInstructions: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentProofImage?: string;
  status: OrderStatus;
  assignedRider?: string;
  processedByCashier?: string;
  createdAt: string;
  rating?: number;
  reviewComment?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  favoriteProductIds: string[];
  lastOrderDate: string;
}
