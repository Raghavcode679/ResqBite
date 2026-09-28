export type UserRole = 'donor' | 'driver' | 'foodbank' | 'admin';

export type FoodCategory =
  | 'Cooked Meals'
  | 'Raw Produce / Veg'
  | 'Bakery & Grains'
  | 'Dairy & Perishables'
  | 'Packaged Foods';

export type UrgencyLevel = 'Critical (<1h)' | 'Urgent (<3h)' | 'Moderate (<6h)' | 'Standard (<24h)';

export type DonationStatus = 'available' | 'claimed' | 'in_transit' | 'delivered' | 'inspected';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface DonorFacility {
  id: string;
  name: string;
  type: '5-Star Hotel Banquet' | 'IT Park Cafeteria' | 'Food Processing Plant' | 'University Central Mess' | 'Cloud Kitchen Hub' | 'Hospital Canteen';
  city: string;
  location: LocationCoordinates;
  contactPerson: string;
  phone: string;
  fssaiNumber: string;
  isVerified: boolean;
  rating: number;
  totalDonatedKg: number;
}

export interface AIAnalysisResult {
  remainingShelfLifeHours: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendedDispatchWindow: string;
  foodSafetyGuidelines: string[];
  optimalRecipientType: string;
  estimatedMealsCount: number;
  co2AvoidedKg: number;
  waterSavedLiters: number;
  safetyVerdictSummary: string;
}

export interface DonationBatch {
  id: string;
  donorId: string;
  donorName: string;
  donorType: string;
  city: string;
  location: LocationCoordinates;
  foodTitle: string;
  category: FoodCategory;
  quantityKg: number;
  estimatedMeals: number;
  preparedAt: string;
  expiresAt: string;
  remainingHours: number;
  storageTempRequired: string; // e.g. "Keep above 65°C" or "Refrigerate 2-4°C"
  currentStorageTemp: number; // in °C
  isVeg: boolean;
  packagingType: 'Stainless Steel Insulated Urns' | 'Tamper-evident Foil Trays' | 'Crates' | 'Aseptic Boxes';
  urgency: UrgencyLevel;
  status: DonationStatus;
  matchedFoodBankId?: string;
  matchedFoodBankName?: string;
  matchedFoodBankAddress?: string;
  targetReceiverAreaId?: string;
  targetReceiverAreaName?: string;
  // Restaurant / Kitchen Details
  restaurantPhone: string;
  restaurantManager: string;
  restaurantFSSAI: string;
  restaurantPickupBay?: string;

  // Rider Details & Delivery Time
  assignedDriverId?: string;
  assignedDriverName?: string;
  driverPhone?: string;
  riderRating?: number;
  riderVehicleNumber?: string;
  riderLiveStatus?: string;
  vehicleType?: string;
  estimatedDeliveryMinutes?: number;
  targetDeliveryTime?: string;
  deliveryTimeWindow?: string;

  aiAnalysis?: AIAnalysisResult;
  notes?: string;
  createdAt: string;
  pickupOtp?: string;
  deliveryOtp?: string;
  transitProgress?: number; // 0 to 100%
}

export type ReceiverCommunityType =
  | 'Slum Settlement'
  | 'Night Shelter / Destitute Home'
  | 'Daily Wage Labor Camp'
  | 'Orphanage / Children Care'
  | 'Elderly Care Shelter'
  | 'Hospital Patient Attendant Center'
  | 'Disaster Relief Camp';

export interface ReceiverArea {
  id: string;
  name: string;
  areaName: string;
  city: string;
  location: LocationCoordinates;
  communityType: ReceiverCommunityType;
  populationEstimate: number;
  dailyMealsNeeded: number;
  mealsReceivedToday: number;
  urgencyLevel: 'Critical' | 'High' | 'Moderate';
  preferredDietary: 'Cooked Hot Meals' | 'Dry Grains & Pulses' | 'Child Nutrition' | 'Any Nutritious Food';
  communityCoordinator: string;
  phone: string;
  operatingNGO?: string;
  distributionPointLandmark: string;
  demographicFocus: string;
  notes?: string;
}

export interface FoodBankPartner {
  id: string;
  name: string;
  type: 'NGO Food Bank' | 'Community Kitchen' | 'Shelter Home' | 'Child Nutrition Center' | 'Mid-day Meal Trust';
  city: string;
  location: LocationCoordinates;
  contactPerson: string;
  phone: string;
  dailyCapacityMeals: number;
  currentAvailableCapacity: number;
  hasColdStorage: boolean;
  activeDeliveriesCount: number;
  rating: number;
  operatingHours: string;
}

export interface VolunteerDriver {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'EV Cargo Van' | 'Insulated Three-Wheeler' | 'Temperature-controlled Mini Truck' | 'Thermal Bike Courier';
  vehiclePlate: string;
  city: string;
  currentLocation: { lat: number; lng: number };
  isAvailable: boolean;
  completedPickups: number;
  rating: number;
  activeBatchId?: string;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  urgency: 'critical' | 'high' | 'info' | 'success';
  batchId?: string;
  city: string;
  read: boolean;
}

export interface RouteStep {
  name: string;
  action: 'Pickup' | 'Dropoff' | 'Transit Checkpoint';
  estArrivalOffsetMinutes: number;
}

export interface RouteOptimizationData {
  estimatedDistanceKm: number;
  estimatedTimeMinutes: number;
  recommendedRouteDescription: string;
  coldChainProtocol: string;
  navigationWaypoints: RouteStep[];
  carbonSavedKgVsDiesel: number;
  dispatchUrgencyAdvice: string;
}
