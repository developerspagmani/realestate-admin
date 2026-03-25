export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt: string;
}

// Base interface for both co-working workspace and properties
export interface BaseListing {
  id: string;
  slug: string;
  name: string;
  title?: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  ownerId: string;
  owner?: Owner;
  amenities: string[];
  photos: string[];
  status: string | number;
  rating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

// Co-working Space (existing functionality preserved)
export interface Workspace extends BaseListing {
  totalWorkspaces: number;
  availableWorkspaces: number;
  operatingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
}

// Property Workspace (new functionality)
export interface Property extends BaseListing {
  propertyType?: number;
  listingType?: string;
  price: number;
  priceType: 'fixed' | 'per_month' | 'per_year' | 'per_sqft';
  addressLine2?: string;
  squareFootage: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  parkingSpaces?: number;
  lotSize?: number;
  features: string[];
  neighborhood: string;
  schoolDistrict?: string;
  hoaFees?: number;
  propertyTax?: number;
  utilitiesIncluded?: string[];
  leaseTerms?: {
    minLeaseTerm: number; // in months
    securityDeposit: number;
    petPolicy: 'allowed' | 'not_allowed' | 'with_deposit';
  };
  saleTerms?: {
    downPaymentRequired?: number;
    financingAvailable: boolean;
    closingCosts?: number;
  };
  mainImageId?: string;
  gallery?: any[];
  mainImage?: MediaItem;
  area?: number;
  floorPlanId?: string;
  floorPlan?: MediaItem;
  brochureId?: string;
  brochure?: MediaItem;
  agentId?: string;
  metadata?: any;
  categoryId?: string;
  videoUrl?: string;
  displayPrice?: boolean;
  units?: Unit[];
  workspace3D?: any;
  propertyAmenities?: any[];
}

export interface Unit {
  id: string;
  tenantId: string;
  propertyId: string;
  unitCategory: number;
  unitCode: string;
  floorNo?: number;
  capacity?: number;
  sizeSqft?: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  unitPricing?: any[];
  coworkingDetails?: any;
  realEstateDetails?: any;
  name?: string;
  unitType?: number;
  unitCode_alias?: string;
  price?: number;
  pricePerHour?: number;
  mainImageId?: string;
  gallery?: any[];
  mainImage?: MediaItem;
  slug?: string;
}

export interface Seats {
  id: string;
  name: string;
  slug: string;
  type: 'apartment' | 'house' | 'studio' | 'villa' | 'office' | 'shop' | 'warehouse';
  capacity?: number;
  floorNo?: number;
  sizeSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: number; // 1: unfurnished, 2: semi, 3: fully
  parkingSlots?: number;
  facing?: number;
  price?: number;
  monthlyRate?: number;
  hourlyRate?: number;
  spaceId: string;
  space?: Property;
  features: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'sold';
  createdAt: string;
  updatedAt: string;
  mainImageId?: string;
  gallery?: string[];
  mainImage?: MediaItem;
  displayPrice?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'owner' | 'agent';
  status?: 'active' | 'inactive' | 'suspended' | string;
  tenantId?: string;
  createdAt: string;
  lastLogin?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  website?: string;
  password?: string;
  bookingsCount?: number;
}

export interface Booking {
  id: string;
  userId: string;
  user?: User;
  unitId: string;
  agentId?: string;
  agent?: Agent;
  propertyId: string;
  startAt: string;
  endAt: string;
  totalPrice: number;
  status: number; // 1: pending, 2: confirmed, 3: cancelled, 4: completed
  paymentStatus: number; // 1: pending, 2: paid, 3: refunded
  notes?: string;
  specialRequests?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  unit?: Unit;
  property?: Property;
  lead?: Lead;
  createdAt: string;
  updatedAt: string;
}

// Property Inquiry (new for property listings)
export interface PropertyInquiry {
  id: string;
  propertyId: string;
  property?: Property;
  userId: string;
  user?: User;
  inquiryType: 'tour_request' | 'information' | 'application' | 'offer';
  message: string;
  preferredDate?: string;
  preferredTime?: string;
  contactMethod: 'email' | 'phone' | 'both';
  status: 'pending' | 'responded' | 'scheduled' | 'completed' | 'cancelled';
  response?: string;
  createdAt: string;
  updatedAt: string;
}

// Unified interface for both co-working bookings and property inquiries
export interface UnifiedReservation {
  id: string;
  userId: string;
  user?: User;
  type: 'coworking_booking' | 'property_inquiry';
  coworkingBooking?: Booking;
  propertyInquiry?: PropertyInquiry;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  source: 'website' | 'referral' | 'social' | 'email' | 'phone' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  budget?: number;
  requirements?: string;
  notes?: string;
  assignedTo?: string;
  propertyId?: string;
  unitId?: string;
  property?: Property;
  unit?: Unit;
  createdAt: string;
  updatedAt: string;
  lastContacted?: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'whatsapp';
  subject?: string;
  content: string;
  targetAudience: string[];
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  scheduledDate?: string;
  sentDate?: string;
  metrics: {
    sent?: number;
    delivered?: number;
    opened?: number;
    clicked?: number;
    converted?: number;
  };
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface Ad {
  id: string;
  name: string;
  platform: 'google' | 'meta';
  type: 'search' | 'display' | 'social' | 'video';
  title: string;
  description: string;
  imageUrl?: string;
  targetUrl: string;
  budget: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  metrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    cost?: number;
    ctr?: number;
    cpc?: number;
  };
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface SocialPost {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  content: string;
  imageUrl?: string;
  scheduledDate?: string;
  postedDate?: string;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  metrics: {
    likes?: number;
    comments?: number;
    shares?: number;
    reach?: number;
    engagement?: number;
  };
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface MediaItem {
  id: string;
  title: string;
  filename: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  size: number; // in bytes
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for video/audio in seconds
  alt: string;
  caption: string;
  description: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  folder?: string;
  metadata: {
    exif?: Record<string, any>;
    colorPalette?: string[];
    dominantColor?: string;
  };
}

export interface WhatsAppBroadcast {
  id: string;
  name: string;
  message: string;
  messageType: 'text' | 'image' | 'document' | 'video';
  mediaUrl?: string;
  recipientList: string[]; // phone numbers
  targetAudience: string[]; // audience segments
  scheduledDate?: string;
  sentDate?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
  metrics: {
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    failedCount: number;
    replyCount: number;
    clickRate?: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  template?: string; // WhatsApp template name if using template
}

export interface WhatsAppChatbot {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'testing';
  welcomeMessage: string;
  fallbackMessage: string;
  flows: ChatbotFlow[];
  settings: {
    businessHours: {
      monday: { open: string; close: string };
      tuesday: { open: string; close: string };
      wednesday: { open: string; close: string };
      thursday: { open: string; close: string };
      friday: { open: string; close: string };
      saturday: { open: string; close: string };
      sunday: { open: string; close: string };
    };
    autoResponse: boolean;
    escalationPhone?: string;
    maxResponseTime: number; // in minutes
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ChatbotFlow {
  id: string;
  trigger: string; // keyword or pattern
  triggerType: 'keyword' | 'pattern' | 'default';
  steps: ChatbotStep[];
}

export interface ChatbotStep {
  id: string;
  type: 'message' | 'question' | 'workspace_search' | 'booking_request' | 'contact_info';
  content: string;
  options?: ChatbotOption[];
  nextStepId?: string;
  variableName?: string; // for storing user input
  validation?: {
    required: boolean;
    pattern?: string;
    errorMessage?: string;
  };
}

export interface ChatbotOption {
  id: string;
  text: string;
  nextStepId: string;
  value?: string;
}

export interface WhatsAppConversation {
  id: string;
  phoneNumber: string;
  customerName?: string;
  status: 'active' | 'resolved' | 'escalated';
  messages: WhatsAppMessage[];
  workspaceInterest?: {
    type: 'private' | 'shared' | 'meeting' | 'event';
    capacity?: number;
    location?: string;
    budget?: number;
    moveInDate?: string;
  };
  leadScore: number; // 0-100
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'video' | 'location' | 'contact';
  sender: 'user' | 'bot' | 'agent';
  timestamp: string;
  mediaUrl?: string;
  metadata?: {
    location?: {
      latitude: number;
      longitude: number;
      address: string;
    };
    contact?: {
      name: string;
      phone: string;
      email?: string;
    };
  };
}

export interface WhatsAppContact {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  source: 'website' | 'manual' | 'import' | 'conversation';
  tags: string[];
  status: 'active' | 'inactive' | 'blocked';
  lastContact?: string;
  conversations: string[]; // conversation IDs
  preferences: {
    marketingOptIn: boolean;
    notifications: boolean;
    language: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  components: WhatsAppTemplateComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'button';
  text?: string;
  format?: 'text' | 'image' | 'video' | 'document';
  buttons?: WhatsAppTemplateButton[];
  variables?: string[]; // placeholder variables
}

export interface WhatsAppTemplateButton {
  type: 'quick_reply' | 'url' | 'phone_number';
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface Amenity {
  id: string;
  name: string;
  category: number; // 1: facilities, 2: technology, ...
  icon?: string;
  status: number;
  tenantId?: string;
  createdAt?: string;
}

export interface Agent {
  id: string;
  tenantId: string;
  userId: string;
  specialization?: string;
  commissionRate: number;
  status: number; // 1: Active, 2: Inactive, 3: On Leave
  lastLeadAssignedAt?: string;
  totalLeads: number;
  totalDeals: number;
  createdAt: string;
  updatedAt: string;
  user?: { // Nested user details
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    phone?: string;
  };
}

export interface Commission {
  id: string;
  agentId: string;
  bookingId?: string;
  amount: number;
  rateSnapshot: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  booking?: any;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  sortOrder: number;
  status: number;
  tenantId?: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { properties: number; children: number };
}


export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content?: string;
  status?: number;
  authorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketingForm {
  id: string;
  name: string;
  fields?: any[];
  tenantId?: string;
  createdAt?: string;
}

export interface Website {
  id: string;
  name: string;
  slug: string;
  status: number;
  customDomain?: string;
  propertyId?: string;
  propertyIds?: string[];
  configuration: any;
  tenantId?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  name: string;
  type: string;
  uniqueId: string;
  propertyId?: string;
  configuration: any;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: number;
  dueDate?: string | null;
  status: number;
  assignedTo?: string | null;
  leadId?: string | null;
  agent?: Agent;
  lead?: Lead;
  createdAt: string;
  updatedAt: string;
}

export interface WebsitePopup {
  id: string;
  name: string;
  websiteId: string;
  type: 'modal' | 'banner' | 'slide_in';
  trigger: 'on_load' | 'exit_intent' | 'scroll' | 'delay';
  triggerValue?: string;
    content: {
    title?: string;
    body?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
    marketingFormId?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    afterSubmitAction?: 'none' | 'download_document' | 'redirect';
    downloadUrl?: string;
    redirectUrl?: string;
    layout?: 'stacked' | 'split';
    textAlign?: 'left' | 'center' | 'right';
    showFloatingTrigger?: boolean;
    emailEnabled?: boolean;
    mobileEnabled?: boolean;
    autoDownload?: boolean;
    inputBorderColor?: string;
    inputBorderRadius?: string;
    inputBackgroundColor?: string;
    buttonBorderRadius?: string;
    buttonBorderColor?: string;
    buttonBorderWidth?: string;
    width?: 'small' | 'medium' | 'large';
    height?: 'auto' | 'small' | 'medium' | 'large';
    thankYouTitle?: string;
    thankYouBody?: string;
    isIntelligentEnabled?: boolean;
  };
  targetWidgetIds?: string[];
  isActive: boolean;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

