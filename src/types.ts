export type UserRole = 'Donor' | 'NGO' | 'Volunteer' | 'Admin';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  city: string;
  area: string;
  createdAt: string;
}

export type DonationStatus = 'Available' | 'Accepted' | 'Collected' | 'Distributed';

export interface Donation {
  donationId: string;
  foodName: string;
  category: string;
  quantity: string;
  preparedTime: string;
  expiryTime: string;
  pickupAddress: string;
  description: string;
  imageUrl: string;
  donorId: string;
  donorName: string;
  status: DonationStatus;
  createdAt: string;
  city?: string; // Helpful for local area matching
  area?: string; // Helpful for local area matching
}

export interface RequestRecord {
  requestId: string;
  donationId: string;
  ngoId: string | null;
  volunteerId: string | null;
  status: DonationStatus;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface ChatMessage {
  messageId: string;
  donationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}
