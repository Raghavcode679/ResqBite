// ============================================================================= 
// Remote Sensing Data Engine
// =============================================================================
// Simulates an agro-meteorological remote-sensing pipeline for India, fusing
// the kind of open data that real programmes publish:
//   • Sentinel-2 (ESA)  — NDVI / EVI vegetation indices, 10 m / 5-day revisit
//   • MODIS (NASA)      — Land Surface Temperature (LST), crop masking
//   • SMAP (NASA)       — L4 soil moisture product
//   • CHIRPS / IMD      — gauge-satellite merged rainfall
//   • ISRO Resourcesat  — crop type / LULC classification
// In production these read from Google Earth Engine / ISRO Bhuvan / Sentinel
// Hub APIs; here the same data structures are served deterministically so the
// whole platform works offline for demos and hackathon judging.

export interface RemoteSensingZone {
  id: string;
  name: string;
  region: string;
  /** Bounding box: [minLat, maxLat, minLng, maxLng] for zone matching */
  bbox: [number, number, number, number];
  dominantCrops: string[];
  /** 0-1 fraction — Sentinel-2 NDVI (crop health / greenness) */
  ndvi: number;
  /** 0-1 fraction — Enhanced Vegetation Index */
  evi: number;
  /** °C — MODIS day Land Surface Temperature */
  lstC: number;
  /** m³/m³ fraction — SMAP root-zone soil moisture */
  soilMoisture: number;
  /** mm cumulative last 7 days (CHIRPS/IMD) */
  rainfall7dMm: number;
  /** W/m² — solar irradiance for drying/curing models */
  solarRadiation: number;
  /** Irrigated vs rainfed share */
  irrigationCoveragePct: number;
  /** Remote-sensed stress flags */
  stressFlags: string[];
  /** Rough number of active surplus-collection points in the zone */
  mandiCount: number;
}

/** 15 agro-climatic zones covering India's key foodsheds */
export const RS_ZONES: RemoteSensingZone[] = [
  {
    id: 'rs-punjab',
    name: 'Punjab Granary Zone',
    region: 'Punjab / Chandigarh',
    bbox: [29.5, 32.6, 73.8, 76.9],
    dominantCrops: ['Wheat (Rabi)', 'Paddy (Kharif)', 'Sugarcane', 'Potato'],
    ndvi: 0.78, evi: 0.61, lstC: 29.4, soilMoisture: 0.34,
    rainfall7dMm: 12.5, solarRadiation: 21.8, irrigationCoveragePct: 98,
    stressFlags: ['Paddy stubble-burning plume risk (Oct–Nov)', 'Groundwater depletion watch'],
    mandiCount: 142,
  },
  {
    id: 'rs-haryana-ncr',
    name: 'Haryana–Delhi NCR Belt',
    region: 'Haryana / Delhi NCR',
    bbox: [27.6, 30.9, 76.0, 78.3],
    dominantCrops: ['Wheat', 'Basmati Rice', 'Mustard', 'Vegetables'],
    ndvi: 0.66, evi: 0.52, lstC: 31.8, soilMoisture: 0.27,
    rainfall7dMm: 8.2, solarRadiation: 22.4, irrigationCoveragePct: 91,
    stressFlags: ['Urban heat-island LST anomaly', 'Aerosol optical depth elevated'],
    mandiCount: 118,
  },
  {
    id: 'rs-west-up',
    name: 'Western UP Gangetic Basin',
    region: 'Uttar Pradesh (West)',
    bbox: [26.0, 29.6, 77.3, 80.5],
    dominantCrops: ['Sugarcane', 'Wheat', 'Potato', 'Pulses'],
    ndvi: 0.71, evi: 0.56, lstC: 30.6, soilMoisture: 0.31,
    rainfall7dMm: 15.0, solarRadiation: 20.9, irrigationCoveragePct: 84,
    stressFlags: ['Cane borer incidence (field reports)'],
    mandiCount: 210,
  },
  {
    id: 'rs-rajasthan',
    name: 'Eastern Rajasthan Arid Margin',
    region: 'Rajasthan',
    bbox: [24.0, 28.3, 71.0, 77.5],
    dominantCrops: ['Pearl Millet (Bajra)', 'Mustard', 'Guar', 'Wheat (irrigated)'],
    ndvi: 0.38, evi: 0.28, lstC: 36.2, soilMoisture: 0.14,
    rainfall7dMm: 3.1, solarRadiation: 24.1, irrigationCoveragePct: 42,
    stressFlags: ['Meteorological drought watch (SPI -1.2)', 'Heat-stress LST > 35°C'],
    mandiCount: 96,
  },
  {
    id: 'rs-gujarat',
    name: 'Gujarat Agro-Industrial Corridor',
    region: 'Gujarat',
    bbox: [20.0, 24.7, 68.1, 74.5],
    dominantCrops: ['Groundnut', 'Cotton', 'Castor', 'Onion'],
    ndvi: 0.52, evi: 0.41, lstC: 33.5, soilMoisture: 0.21,
    rainfall7dMm: 6.0, solarRadiation: 23.6, irrigationCoveragePct: 63,
    stressFlags: ['Coastal salinity ingress (Saurashtra)'],
    mandiCount: 104,
  },
  {
    id: 'rs-maharashtra',
    name: 'Deccan Marathwada Belt',
    region: 'Maharashtra',
    bbox: [16.0, 21.5, 72.6, 80.9],
    dominantCrops: ['Sugarcane', 'Onion', 'Soybean', 'Cotton', 'Grapes'],
    ndvi: 0.55, evi: 0.43, lstC: 32.1, soilMoisture: 0.23,
    rainfall7dMm: 9.8, solarRadiation: 22.8, irrigationCoveragePct: 58,
    stressFlags: ['Onion storage transpiration loss high (Nashik godowns)'],
    mandiCount: 187,
  },
  {
    id: 'rs-mp',
    name: 'Malwa Plateau (MP)',
    region: 'Madhya Pradesh',
    bbox: [21.0, 26.9, 74.0, 82.0],
    dominantCrops: ['Soybean', 'Wheat', 'Gram', 'Garlic'],
    ndvi: 0.62, evi: 0.48, lstC: 30.9, soilMoisture: 0.26,
    rainfall7dMm: 11.2, solarRadiation: 22.1, irrigationCoveragePct: 55,
    stressFlags: [],
    mandiCount: 160,
  },
  {
    id: 'rs-bengal',
    name: 'Lower Ganga Delta',
    region: 'West Bengal',
    bbox: [21.4, 27.4, 85.8, 89.9],
    dominantCrops: ['Aman Paddy', 'Boro Rice', 'Jute', 'Potato'],
    ndvi: 0.74, evi: 0.58, lstC: 29.8, soilMoisture: 0.38,
    rainfall7dMm: 22.4, solarRadiation: 18.6, irrigationCoveragePct: 72,
    stressFlags: ['Cyclone-season logistics disruption risk'],
    mandiCount: 149,
  },
  {
    id: 'rs-bihar',
    name: 'Middle Ganga Plain',
    region: 'Bihar',
    bbox: [24.2, 27.6, 83.2, 88.3],
    dominantCrops: ['Rice', 'Wheat', 'Maize', 'Litchi'],
    ndvi: 0.69, evi: 0.54, lstC: 30.2, soilMoisture: 0.35,
    rainfall7dMm: 18.6, solarRadiation: 19.8, irrigationCoveragePct: 68,
    stressFlags: ['Flood-plain waterlogging (North Bihar)'],
    mandiCount: 132,
  },
  {
    id: 'rs-assam-ne',
    name: 'Brahmaputra Valley',
    region: 'Assam / Northeast',
    bbox: [24.0, 28.4, 89.6, 96.5],
    dominantCrops: ['Sali Paddy', 'Tea', 'Mustard', 'Ginger'],
    ndvi: 0.81, evi: 0.66, lstC: 27.6, soilMoisture: 0.44,
    rainfall7dMm: 34.0, solarRadiation: 16.9, irrigationCoveragePct: 35,
    stressFlags: ['High humidity mould risk in storage', 'Flood watch'],
    mandiCount: 71,
  },
  {
    id: 'rs-odisha',
    name: 'Eastern Ghats Coastal Plain',
    region: 'Odisha',
    bbox: [17.7, 22.6, 81.3, 87.6],
    dominantCrops: ['Kharif Rice', 'Pulses', 'Vegetables'],
    ndvi: 0.64, evi: 0.50, lstC: 31.4, soilMoisture: 0.33,
    rainfall7dMm: 20.1, solarRadiation: 20.2, irrigationCoveragePct: 51,
    stressFlags: ['Cyclone corridor (Bay low-pressure watch)'],
    mandiCount: 88,
  },
  {
    id: 'rs-telangana',
    name: 'Godavari Basin',
    region: 'Telangana',
    bbox: [15.8, 19.9, 77.2, 81.8],
    dominantCrops: ['Paddy', 'Cotton', 'Maize', 'Turmeric'],
    ndvi: 0.58, evi: 0.45, lstC: 33.0, soilMoisture: 0.24,
    rainfall7dMm: 10.4, solarRadiation: 22.6, irrigationCoveragePct: 66,
    stressFlags: [],
    mandiCount: 115,
  },
  {
    id: 'rs-andhra',
    name: 'Krung Krishna Delta (Andhra)',
    region: 'Andhra Pradesh',
    bbox: [12.6, 19.2, 76.7, 84.9],
    dominantCrops: ['Rice', 'Chillies', 'Mango', 'Aquaculture feed crops'],
    ndvi: 0.67, evi: 0.53, lstC: 32.6, soilMoisture: 0.30,
    rainfall7dMm: 14.8, solarRadiation: 21.5, irrigationCoveragePct: 79,
    stressFlags: [],
    mandiCount: 107,
  },
  {
    id: 'rs-karnataka',
    name: 'Deccan Karnataka Plateau',
    region: 'Karnataka',
    bbox: [11.5, 18.5, 74.0, 78.6],
    dominantCrops: ['Ragi', 'Maize', 'Grapes', 'Tomato', 'Coffee'],
    ndvi: 0.57, evi: 0.44, lstC: 30.4, soilMoisture: 0.25,
    rainfall7dMm: 9.0, solarRadiation: 21.9, irrigationCoveragePct: 61,
    stressFlags: ['Tomato leaf-curl virus pockets (Kolar)'],
    mandiCount: 128,
  },
  {
    id: 'rs-tamilnadu',
    name: 'Kaveri Delta',
    region: 'Tamil Nadu / Kerala / Puducherry',
    bbox: [8.0, 13.6, 76.0, 80.6],
    dominantCrops: ['Samba Rice', 'Coconut', 'Banana', 'Spices'],
    ndvi: 0.70, evi: 0.55, lstC: 31.0, soilMoisture: 0.29,
    rainfall7dMm: 11.6, solarRadiation: 21.2, irrigationCoveragePct: 74,
    stressFlags: ['NE-monsoon variability watch'],
    mandiCount: 111,
  },
];

/**
 * Map UI city selector values (see mockData CITIES) to remote-sensing zones,
 * so the map can highlight the satellite context of the selected region.
 */
export const CITY_TO_ZONE: Record<string, string> = {
  Punjab: 'rs-punjab',
  'Delhi NCR': 'rs-haryana-ncr',
  Mumbai: 'rs-maharashtra',
  Pune: 'rs-maharashtra',
  Bengaluru: 'rs-karnataka',
  Hyderabad: 'rs-telangana',
  Chennai: 'rs-tamilnadu',
  'Kochi (Kerala)': 'rs-tamilnadu',
  Kolkata: 'rs-bengal',
  'Guwahati (Northeast)': 'rs-assam-ne',
  'Patna (Bihar)': 'rs-bihar',
  'Bhubaneswar (Odisha)': 'rs-odisha',
  'Bhopal / Indore (MP)': 'rs-mp',
  Jaipur: 'rs-rajasthan',
  Ahmedabad: 'rs-gujarat',
  Goa: 'rs-maharashtra',
  'Jammu & Kashmir': 'rs-punjab',
  'Dehradun (Uttarakhand)': 'rs-haryana-ncr',
  Lucknow: 'rs-west-up',
  'Pan-India': 'rs-punjab',
};

/** Match a lat/lng to the covering remote-sensing zone (falls back to nearest centre). */
export function getZoneForLocation(lat: number, lng: number): RemoteSensingZone {
  const inside = RS_ZONES.find(
    (z) => lat >= z.bbox[0] && lat <= z.bbox[1] && lng >= z.bbox[2] && lng <= z.bbox[3]
  );
  if (inside) return inside;

  let best = RS_ZONES[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const z of RS_ZONES) {
    const [minLat, maxLat, minLng, maxLng] = z.bbox;
    const cLat = (minLat + maxLat) / 2;
    const cLng = (minLng + maxLng) / 2;
    const d = (lat - cLat) ** 2 + (lng - cLng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = z;
    }
  }
  return best;
}

export function getZoneById(id: string): RemoteSensingZone | undefined {
  return RS_ZONES.find((z) => z.id === id);
}

/** Qualitative crop-health classification from NDVI (Sentinel-2 scale). */
export function classifyVigor(ndvi: number): { label: string; color: string } {
  if (ndvi >= 0.7) return { label: 'Peak Green / Vigorous', color: '#22c55e' };
  if (ndvi >= 0.55) return { label: 'Healthy Vegetation', color: '#84cc16' };
  if (ndvi >= 0.4) return { label: 'Moderate / Maturing', color: '#eab308' };
  if (ndvi >= 0.25) return { label: 'Stressed / Senescing', color: '#f97316' };
  return { label: 'Barren / Harvested', color: '#ef4444' };
}

/**
 * Deterministic 6-week pseudo-history for sparkline charts — stable per zone
 * (no Math.random, so re-renders don't flicker).
 */
export function zoneNdviHistory(zone: RemoteSensingZone): number[] {
  const seed = zone.id.length + zone.ndvi * 100;
  return Array.from({ length: 6 }, (_, i) => {
    const wobble = Math.sin(seed + i * 1.7) * 0.03;
    const trend = (i - 2.5) * 0.004;
    return Math.max(0.05, Math.min(0.92, Number((zone.ndvi + wobble + trend).toFixed(2))));
  });
}

// =============================================================================
// Punjab Agro Zone — flagship storytelling block for the map
// =============================================================================
export const PUNJAB_AGRO_PROFILE = {
  zoneId: 'rs-punjab',
  title: 'Punjab Agro-Hub — “Granary of India”',
  tagline: 'India’s highest-yield wheat & paddy foodshed, wired into the OmniResQ radar',
  facts: [
    'Grows ~12% of India’s food grain from ~1.5% of its land area.',
    'Mandi network (142 procurement centres) feeds the Grand Trunk Food Lifeline corridor visible on the map.',
    'Largest contributor to FCI central pool: wheat (Rabi, Apr–Jun) & paddy (Kharif, Oct–Dec).',
    'Surplus from langar kitchens, Verka dairies & banquet halls around Amritsar–Ludhiana–Jalandhar flows through the OmniResQ driver HUD daily.',
    'Remote-sensing watch: stubble-burning plumes (Oct–Nov) tracked via MODIS thermal anomalies to re-route cold-chain fleets.',
  ],
  cropCalendar: [
    { season: 'Rabi (Nov–Apr)', crop: 'Wheat', note: 'Harvest surge Apr–Jun — maximum mandi surplus inflow' },
    { season: 'Kharif (Jun–Oct)', crop: 'Paddy (Rice)', note: 'Procurement peak Oct–Dec; stubble season logistics watch' },
    { season: 'Year-round', crop: 'Dairy (Verka) & Vegetables', note: 'Daily perishable surplus into city food banks' },
  ],
};
