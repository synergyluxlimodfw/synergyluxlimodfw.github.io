export type Session = {
  name: string;
  occasion: string;
  destination: string;
  vipNote: string;
  chauffeur: string;
  etaMinutes: number;
  rideId?: string;
};

export type Screen = 'welcome' | 'why' | 'gallery' | 'booking';

export type RidePhase =
  | 'idle'
  | 'active'
  | 'midway'
  | 'pre_dropoff'
  | 'complete';

export type ModalType = 'midway' | 'pre_dropoff' | 'complete' | null;

export type Service = {
  id: string;
  icon: string;
  name: string;
  description: string;
  price: string;
  priceNote: string;
  deposit?: string;
  depositAmount?: string;
  fullLink?: string;
  depositLink?: string;
};

export type BookingFormData = {
  customerId: string;
  pickup: string;
  dropoff: string;
  scheduledAt: string;
  scheduledTime: string;
};
