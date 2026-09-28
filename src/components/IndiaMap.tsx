import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DonationBatch, FoodBankPartner, VolunteerDriver, ReceiverArea } from '../types';
import {
  RS_ZONES,
  CITY_TO_ZONE,
  PUNJAB_AGRO_PROFILE,
  classifyVigor,
  getZoneById,
  getZoneForLocation,
} from '../data/remoteSensing';
import { RemoteSensingPanel } from './RemoteSensingPanel';
import {
  Satellite,
  Clock,
  Building2,
  Truck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  HeartHandshake,
  Users,
  Phone,
  Compass,
  ShieldCheck,
  ChevronRight,
  Map as MapIcon,
  Navigation,
} from 'lucide-react';

interface IndiaMapProps {
  batches: DonationBatch[];
  foodBanks: FoodBankPartner[];
  drivers: VolunteerDriver[];
  receiverAreas?: ReceiverArea[];
  selectedCity: string;
  onSelectBatch: (batch: DonationBatch) => void;
  onSelectFoodBank: (fb: FoodBankPartner) => void;
  onSelectReceiverArea?: (area: ReceiverArea) => void;
  onSelectCity?: (city: string) => void;
  onOpenTaxSlip?: (batch: DonationBatch) => void;
  onNavigateBatch?: (batch: DonationBatch) => void;
  selectedBatchId?: string;
  selectedFoodBankId?: string;
  selectedReceiverAreaId?: string;
}

/** India focus bounds — everything auto-fits inside this on first load. */
const INDIA_BOUNDS = L.latLngBounds(
  [7.2, 68.2],   // SW (Kanyakumari / Kutch)
  [36.8, 97.2]   // NE (Kashmir / Arunachal)
);

/** City → map focus (center + zoom) for the header city selector. */
const CITY_FOCUS: Record<string, { center: [number, number]; zoom: number }> = {
  'Delhi NCR': { center: [28.61, 77.21], zoom: 9.5 },
  Mumbai: { center: [19.08, 72.88], zoom: 9.5 },
  Bengaluru: { center: [12.97, 77.59], zoom: 9.5 },
  Hyderabad: { center: [17.39, 78.49], zoom: 9.5 },
  Chennai: { center: [13.08, 80.27], zoom: 9.5 },
  Kolkata: { center: [22.57, 88.36], zoom: 9.5 },
  Pune: { center: [18.52, 73.86], zoom: 9.5 },
  Ahmedabad: { center: [23.02, 72.57], zoom: 9.5 },
  Jaipur: { center: [26.91, 75.79], zoom: 9.5 },
  Lucknow: { center: [26.85, 80.95], zoom: 9.5 },
  'Kochi (Kerala)': { center: [9.93, 76.27], zoom: 9.5 },
  'Guwahati (Northeast)': { center: [26.14, 91.74], zoom: 9.5 },
  'Jammu & Kashmir': { center: [33.6, 75.1], zoom: 7.5 },
  'Bhopal / Indore (MP)': { center: [23.3, 77.4], zoom: 8 },
  'Bhubaneswar (Odisha)': { center: [20.3, 85.8], zoom: 8.5 },
  'Patna (Bihar)': { center: [25.6, 85.15], zoom: 9 },
  Goa: { center: [15.35, 74.05], zoom: 9.5 },
  'Dehradun (Uttarakhand)': { center: [30.32, 78.03], zoom: 9.5 },
  Punjab: { center: [31.1, 75.4], zoom: 7.8 },
};

/** Punjabi cities shown when Punjab Agro-Hub is focused. */
const PUNJAB_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'Amritsar (Langar)', lat: 31.63, lng: 74.87 },
  { name: 'Ludhiana (Verka)', lat: 30.9, lng: 75.85 },
  { name: 'Jalandhar', lat: 31.33, lng: 75.58 },
  { name: 'Chandigarh', lat: 30.73, lng: 76.78 },
];

export const IndiaMap: React.FC<IndiaMapProps> = ({
  batches,
  foodBanks,
  drivers = [],
  receiverAreas = [],
  selectedCity,
  onSelectBatch,
  onSelectFoodBank,
  onSelectReceiverArea,
  onSelectCity,
  onOpenTaxSlip,
  onNavigateBatch,
  selectedBatchId,
  selectedFoodBankId,
  selectedReceiverAreaId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const satLayerRef = useRef<L.TileLayer | null>(null);
  const fallbackLayerRef = useRef<L.TileLayer | null>(null);
  const paneLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const rsLayerRef = useRef<L.LayerGroup | null>(null);
  const fitDoneRef = useRef(false);
  const popupRefsRef = useRef<Map<string, L.Popup>>(new Map());

  const [mapReady, setMapReady] = useState(false);
  const [basemap, setBasemap] = useState<'roads' | 'satellite'>('roads');
  const [googleTilesAlive, setGoogleTilesAlive] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'urgent' | 'cooked' | 'transit'>('all');
  const [showFoodBanks, setShowFoodBanks] = useState<boolean>(true);
  const [showReceiverAreas, setShowReceiverAreas] = useState<boolean>(true);
  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [showPunjabFocus, setShowPunjabFocus] = useState<boolean>(selectedCity === 'Punjab');
  const [showRemoteSensing, setShowRemoteSensing] = useState<boolean>(false);
  const [activeZoneId, setActiveZoneId] = useState<string | undefined>(undefined);
  const [activeSelectedBatch, setActiveSelectedBatch] = useState<DonationBatch | null>(() => {
    return batches.find((b) => b.id === selectedBatchId) || batches[0] || null;
  });

  const punjabZone = getZoneById('rs-punjab');
  const punjabLiveBatches = useMemo(
    () =>
      batches.filter((b) => {
        if (b.status === 'delivered') return false;
        return getZoneForLocation(b.location.lat, b.location.lng).id === 'rs-punjab';
      }),
    [batches]
  );

  const filteredBatches = batches.filter((b) => {
    if (selectedCity !== 'Pan-India' && selectedCity !== 'Punjab' && b.city !== selectedCity) return false;
    if (selectedCity === 'Punjab') {
      const z = getZoneForLocation(b.location.lat, b.location.lng);
      if (z.id !== 'rs-punjab') return false;
    }
    if (filterType === 'urgent') return b.urgency === 'Critical (<1h)' || b.urgency === 'Urgent (<3h)';
    if (filterType === 'cooked') return b.category === 'Cooked Meals';
    if (filterType === 'transit') return b.status === 'in_transit';
    return true;
  });

  const filteredFoodBanks = foodBanks.filter((fb) => {
    if (selectedCity !== 'Pan-India' && selectedCity !== 'Punjab' && fb.city !== selectedCity) return false;
    if (selectedCity === 'Punjab' && getZoneForLocation(fb.location.lat, fb.location.lng).id !== 'rs-punjab') return false;
    return true;
  });

  const filteredReceiverAreas = receiverAreas.filter((ra) => {
    if (selectedCity !== 'Pan-India' && selectedCity !== 'Punjab' && ra.city !== selectedCity) return false;
    if (selectedCity === 'Punjab' && getZoneForLocation(ra.location.lat, ra.location.lng).id !== 'rs-punjab') return false;
    return true;
  });

  // ---------------------------------------------------------------------------
  // Tile layers
  //   Primary  : Google's map tiles (mt0-3.google.com) — real Google Maps
  //              imagery. A CSS filter (index.css .google-dark-tiles) blends
  //              them into the app's dark slate theme; no key needed.
  //   Optional : Google satellite imagery (lyrs=s) — shown unfiltered.
  //   Fallback : Carto dark_all — swapped in automatically if Google tiles fail.
  // ---------------------------------------------------------------------------
  const makeGoogleRoads = () =>
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      className: 'google-dark-tiles',
      attribution: 'Map data &copy; Google',
    });

  const makeGoogleSatellite = () =>
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      className: 'google-sat-tiles',
      attribution: 'Imagery &copy; Google',
    });

  const makeFallback = () =>
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    });

  // ---------------------------------------------------------------------------
  // Init map once
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 4.4,
      maxZoom: 19,
      zoomSnap: 0.1,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 140,
      worldCopyJump: true,
    });
    map.fitBounds(INDIA_BOUNDS, { padding: [6, 6] });
    mapRef.current = map;

    const roads = makeGoogleRoads();
    const sat = makeGoogleSatellite();
    const fallback = makeFallback();
    baseLayerRef.current = roads;
    satLayerRef.current = sat;
    fallbackLayerRef.current = fallback;
    roads.addTo(map);

    // Detect dead tiles (network blocks Google) → swap to dark fallback once.
    let failures = 0;
    roads.on('tileerror', () => {
      failures += 1;
      if (failures === 6 && googleTilesAlive) {
        setGoogleTilesAlive(false);
        map.removeLayer(roads);
        fallback.addTo(map);
        baseLayerRef.current = fallback;
      }
    });

    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    paneLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    rsLayerRef.current = L.layerGroup().addTo(map);

    map.on('popupclose', () => {});
    setTimeout(() => map.invalidateSize(), 120);
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track Google tile liveness on satellite too (only swap if roads already died)
  useEffect(() => {
    const sat = satLayerRef.current;
    const map = mapRef.current;
    if (!sat || !map) return;
    let satFailures = 0;
    sat.on('tileerror', () => {
      satFailures += 1;
      if (satFailures >= 6 && !googleTilesAlive) {
        map.removeLayer(sat);
        fallbackLayerRef.current?.addTo(map);
      }
    });
  }, [basemap, googleTilesAlive]);

  // ---------------------------------------------------------------------------
  // Focus map when city / Punjab focus changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (showPunjabFocus || selectedCity === 'Punjab') {
      map.flyTo([31.1, 75.4], 7.8, { duration: 0.9 });
      return;
    }
    const focus = CITY_FOCUS[selectedCity];
    if (focus) {
      map.flyTo(focus.center, focus.zoom, { duration: 0.9 });
    } else if (selectedCity === 'Pan-India') {
      map.flyToBounds(INDIA_BOUNDS, { padding: [6, 6], duration: 0.9 });
    }
  }, [selectedCity, showPunjabFocus, mapReady]);

  // ---------------------------------------------------------------------------
  // Zoom / reset buttons — wired to the real map engine
  // ---------------------------------------------------------------------------
  const zoomIn = () => mapRef.current?.zoomIn(1);
  const zoomOut = () => mapRef.current?.zoomOut(1);
  const resetView = () => {
    setShowPunjabFocus(false);
    setShowRemoteSensing(false);
    setFilterType('all');
    const map = mapRef.current;
    if (!map) return;
    map.flyToBounds(INDIA_BOUNDS, { padding: [6, 6], duration: 0.8 });
    if (onSelectCity) onSelectCity('Pan-India');
  };

  // ---------------------------------------------------------------------------
  // Draw overlays (markers, routes, RS zones) whenever inputs change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const layer = paneLayerRef.current;
    if (!map || !layer || !mapReady) return;

    layer.clearLayers();
    popupRefsRef.current.clear();

    const fmt = new Intl.NumberFormat('en-IN');

    // ---- Strategic national food-redistribution corridors --------------------
    if (showCorridors) {
      const CORRIDORS: { name: string; color: string; coords: [number, number][] }[] = [
        {
          name: 'Grand Trunk Food Lifeline (Amritsar→Kolkata)',
          color: '#059669',
          coords: [
            [31.63, 74.87], [31.33, 75.58], [30.9, 75.85], [28.61, 77.21],
            [26.45, 80.33], [25.32, 82.99], [25.6, 85.15], [22.57, 88.36],
          ],
        },
        {
          name: 'Western Agrilogistics Freight Corridor',
          color: '#0d9488',
          coords: [[30.9, 75.85], [26.91, 75.79], [23.02, 72.57], [19.08, 72.88]],
        },
        {
          name: 'North-South Red Cross Lifeline',
          color: '#059669',
          coords: [[28.61, 77.21], [23.26, 77.41], [17.39, 78.49], [12.97, 77.59], [13.08, 80.27]],
        },
        {
          name: 'Northeast Supply Corridor (Kolkata→Guwahati)',
          color: '#0d9488',
          coords: [[22.57, 88.36], [26.72, 88.43], [26.14, 91.74]],
        },
        {
          name: 'Punjab Granary Spur (Amritsar→Chandigarh→Delhi)',
          color: '#eab308',
          coords: [[31.63, 74.87], [30.73, 76.78], [28.61, 77.21]],
        },
      ];
      CORRIDORS.forEach((c) => {
        L.polyline(c.coords, {
          color: c.color,
          weight: 2.2,
          opacity: 0.6,
          dashArray: '7 6',
        })
          .bindTooltip(`🛣 ${c.name}`, { direction: 'top', className: 'omniresq-tooltip' })
          .addTo(layer);
      });
    }

    // ---- In-transit delivery routes with live courier marker -----------------
    if (showCorridors) {
      filteredBatches
        .filter((b) => b.status === 'in_transit' && b.matchedFoodBankId)
        .forEach((batch) => {
          const fb = foodBanks.find((f) => f.id === batch.matchedFoodBankId);
          if (!fb) return;
          const start = L.latLng(batch.location.lat, batch.location.lng);
          const end = L.latLng(fb.location.lat, fb.location.lng);
          const mid = L.latLng(
            (start.lat + end.lat) / 2 + 0.35,
            (start.lng + end.lng) / 2 + 0.2
          );
          const progress = (batch.transitProgress || 55) / 100;

          L.polyline([start, mid, end], {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.85,
            dashArray: '6 6',
          }).addTo(layer);

          // approximate position along quadratic bezier
          const t = Math.min(1, Math.max(0, progress));
          const q = (a: number, b: number, c: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
          const cur = L.latLng(q(start.lat, mid.lat, end.lat), q(start.lng, mid.lng, end.lng));

          L.circleMarker(cur, {
            radius: 7,
            color: '#ffffff',
            weight: 2,
            fillColor: '#2563eb',
            fillOpacity: 1,
          })
            .bindTooltip(`🚚 ${batch.foodTitle} — ${Math.round(progress * 100)}% of route`, {
              direction: 'top',
              className: 'omniresq-tooltip',
            })
            .addTo(layer);
        });
    }

    // ---- Food banks ----------------------------------------------------------
    if (showFoodBanks) {
      filteredFoodBanks.forEach((fb) => {
        const isSelected = selectedFoodBankId === fb.id;
        L.circleMarker([fb.location.lat, fb.location.lng], {
          radius: isSelected ? 9 : 6.5,
          color: '#60a5fa',
          weight: isSelected ? 2.5 : 1.5,
          fillColor: '#1e40af',
          fillOpacity: 0.95,
        })
          .bindTooltip(
            buildHoverHtml({
              kicker: 'REDISTRIBUTION PARTNER',
              title: fb.name,
              subtitle: `${fb.city} · ${fb.type}`,
              rows: [
                `📦 Capacity: ${fmt.format(fb.currentAvailableCapacity)} / ${fmt.format(fb.dailyCapacityMeals)} meals`,
                `👤 ${fb.contactPerson} · 📞 ${fb.phone}`,
                fb.hasColdStorage ? '❄ Cold storage available' : 'Ambient storage only',
              ],
              accent: '#3b82f6',
            }),
            { sticky: true, direction: 'top', offset: [0, -8], className: 'omniresq-hovercard' }
          )
          .bindPopup(
            buildPopupHtml({
              kicker: 'REDISTRIBUTION PARTNER',
              title: fb.name,
              subtitle: `${fb.city} · ${fb.type}`,
              rows: [
                `Capacity: ${fmt.format(fb.currentAvailableCapacity)} / ${fmt.format(fb.dailyCapacityMeals)} meals`,
                `Contact: ${fb.contactPerson} · ${fb.phone}`,
                fb.hasColdStorage ? '❄ Cold storage available' : 'No cold storage',
              ],
              accent: '#3b82f6',
            })
          )
          .on('click', () => onSelectFoodBank(fb))
          .addTo(layer);
      });
    }

    // ---- Receiver areas (people in need) -------------------------------------
    if (showReceiverAreas) {
      filteredReceiverAreas.forEach((ra) => {
        const isSelected = selectedReceiverAreaId === ra.id;
        const isCritical = ra.urgencyLevel === 'Critical';
        const deficit = Math.max(0, ra.dailyMealsNeeded - ra.mealsReceivedToday);

        if (isCritical) {
          L.circleMarker([ra.location.lat, ra.location.lng], {
            radius: 16,
            color: '#f97316',
            weight: 1,
            fillColor: '#f97316',
            fillOpacity: 0.12,
          }).addTo(layer);
        }

        L.circleMarker([ra.location.lat, ra.location.lng], {
          radius: isSelected ? 9 : 6.5,
          color: '#ffffff',
          weight: 1.5,
          fillColor: isCritical ? '#ea580c' : '#f97316',
          fillOpacity: 0.95,
        })
          .bindTooltip(
            buildHoverHtml({
              kicker: 'PEOPLE IN NEED (HUNGER SPOT)',
              title: ra.name,
              subtitle: `${ra.city} · ${ra.communityType}`,
              rows: [
                `⚠ Deficit: ${fmt.format(deficit)} meals unfulfilled (Pop: ${fmt.format(ra.populationEstimate)})`,
                `👤 ${ra.communityCoordinator} · 📞 ${ra.phone}`,
                `🎯 ${ra.demographicFocus}`,
                `🚨 ${ra.urgencyLevel} hunger need`,
              ],
              accent: '#f97316',
            }),
            { sticky: true, direction: 'top', offset: [0, -8], className: 'omniresq-hovercard' }
          )
          .bindPopup(
            buildPopupHtml({
              kicker: 'PEOPLE IN NEED (HUNGER SPOT)',
              title: ra.name,
              subtitle: `${ra.city} · ${ra.communityType}`,
              rows: [
                `Deficit: ${fmt.format(deficit)} meals unfulfilled (Pop: ${fmt.format(ra.populationEstimate)})`,
                `Coordinator: ${ra.communityCoordinator} · ${ra.phone}`,
                `Focus: ${ra.demographicFocus}`,
                `Urgency: ${ra.urgencyLevel}`,
              ],
              accent: '#f97316',
            })
          )
          .on('click', () => onSelectReceiverArea?.(ra))
          .addTo(layer);
      });
    }

    // ---- Donor surplus batches (critical batches LAST = rendered on top) -----
    // Sort so critical batches are added last — Leaflet renders later layers
    // above earlier ones, keeping red alerts visually on top of everything.
    const sortedBatches = [...filteredBatches].sort((a, b) => {
      const rank = (x: DonationBatch) =>
        x.urgency === 'Critical (<1h)' ? 2 : x.urgency === 'Urgent (<3h)' ? 1 : 0;
      return rank(a) - rank(b);
    });
    sortedBatches.forEach((batch) => {
      const isSelected = selectedBatchId === batch.id || activeSelectedBatch?.id === batch.id;
      const isCritical = batch.urgency === 'Critical (<1h)';
      const isUrgent = batch.urgency === 'Urgent (<3h)';
      const color = isCritical ? '#f43f5e' : isUrgent ? '#f59e0b' : '#10b981';

      if (isCritical) {
        // Pulsing halo: CSS-animated so it BLINKS continuously — first-priority
        // visual on the map (see .orq-critical-pulse in index.css).
        const halo = L.circleMarker([batch.location.lat, batch.location.lng], {
          radius: 17,
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.22,
          className: 'orq-critical-pulse',
          interactive: false,
        }).addTo(layer);
        (halo as unknown as { setZIndexOffset: (n: number) => void }).setZIndexOffset(1000);
      }

      const marker = L.circleMarker([batch.location.lat, batch.location.lng], {
        radius: isSelected ? 9.5 : 7,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.97,
        className: isCritical ? 'orq-critical-core' : undefined,
      })
        .bindTooltip(
          buildHoverHtml({
            kicker: 'DONOR KITCHEN SURPLUS',
            title: batch.foodTitle,
            subtitle: `${batch.donorName} (${batch.city})`,
            rows: [
              `🍛 ${batch.quantityKg} kg (~${fmt.format(batch.estimatedMeals)} meals) · ${batch.urgency}`,
              `📞 Kitchen: ${batch.restaurantPhone} (${batch.restaurantManager?.split('(')[0]?.trim() || 'Manager'})`,
              batch.assignedDriverName
                ? `🚚 Rider: ${batch.assignedDriverName} · 📞 ${batch.driverPhone || '—'}`
                : '🚚 Rider: Auto-assign in progress',
              batch.riderVehicleNumber ? `🛵 Plate: ${batch.riderVehicleNumber}` : '',
              `⏱ ETA: ${batch.estimatedDeliveryMinutes || 24} min (${batch.targetDeliveryTime || '—'})${batch.deliveryTimeWindow ? ` · Window ${batch.deliveryTimeWindow}` : ''}`,
            ].filter(Boolean),
            accent: color,
          }),
          { sticky: true, direction: 'top', offset: [0, -8], className: 'omniresq-hovercard' }
        )
        .bindPopup(
          buildPopupHtml({
            kicker: 'DONOR KITCHEN SURPLUS',
            title: batch.foodTitle,
            subtitle: `${batch.donorName} (${batch.city})`,
            rows: [
              `${batch.quantityKg} kg (~${fmt.format(batch.estimatedMeals)} meals) · ${batch.urgency}`,
              `Kitchen: ${batch.restaurantManager?.split('(')[0]?.trim() || 'Manager'} · ${batch.restaurantPhone}`,
              batch.assignedDriverName
                ? `Rider: ${batch.assignedDriverName} · ${batch.driverPhone || ''}`
                : 'Rider: Auto-assign in progress',
              `ETA: ${batch.estimatedDeliveryMinutes || 24} min (${batch.targetDeliveryTime || '—'})`,
            ],
            accent: color,
          })
        )
        .on('click', () => {
          setActiveSelectedBatch(batch);
          onSelectBatch(batch);
        })
        .addTo(layer);
      if (isCritical)
        (marker as unknown as { setZIndexOffset: (n: number) => void }).setZIndexOffset(1000); // red nodes always on top

      // weight tag tooltip
      L.tooltip({ direction: 'right', className: 'omniresq-weight-tag', permanent: true, offset: [8, 0] })
        .setLatLng([batch.location.lat, batch.location.lng])
        .setContent(`${batch.quantityKg}kg`)
        .addTo(layer);
    });

    // ---- Punjab city labels when focused --------------------------------------
    if (showPunjabFocus || selectedCity === 'Punjab') {
      PUNJAB_CITIES.forEach((c) => {
        L.tooltip({ permanent: true, direction: 'right', className: 'omniresq-city-label' })
          .setLatLng([c.lat, c.lng])
          .setContent(c.name)
          .addTo(layer);
      });
      if (punjabZone) {
        L.tooltip({ permanent: true, direction: 'top', offset: [0, -6], className: 'omniresq-punjab-chip' })
          .setLatLng([31.1, 75.4])
          .setContent(
            `★ PUNJAB AGRO · NDVI ${punjabZone.ndvi.toFixed(2)} · LST ${punjabZone.lstC}°C · ${punjabLiveBatches.length} live batches`
          )
          .addTo(layer);
      }
    }
  }, [
    mapReady,
    filteredBatches,
    filteredFoodBanks,
    filteredReceiverAreas,
    showFoodBanks,
    showReceiverAreas,
    showCorridors,
    showPunjabFocus,
    selectedCity,
    selectedBatchId,
    selectedFoodBankId,
    selectedReceiverAreaId,
    activeSelectedBatch,
    foodBanks,
    onSelectBatch,
    onSelectFoodBank,
    onSelectReceiverArea,
  ]);

  // ---------------------------------------------------------------------------
  // Remote-sensing zone rectangles
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const layer = rsLayerRef.current;
    if (!map || !layer || !mapReady) return;
    layer.clearLayers();

    if (!showRemoteSensing) return;

    RS_ZONES.forEach((z) => {
      const vigor = classifyVigor(z.ndvi);
      const [minLat, maxLat, minLng, maxLng] = z.bbox;
      const bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
      const isActive = activeZoneId === z.id;

      L.rectangle(bounds, {
        color: vigor.color,
        weight: isActive ? 2.5 : 1,
        dashArray: '6 5',
        fillColor: vigor.color,
        fillOpacity: isActive ? 0.18 : 0.07,
      })
        .on('click', () => setActiveZoneId(z.id))
        .bindTooltip(`${z.name} — NDVI ${z.ndvi.toFixed(2)} (${vigor.label})`, {
          direction: 'top',
          className: 'omniresq-tooltip',
        })
        .addTo(layer);
    });
  }, [showRemoteSensing, activeZoneId, mapReady]);

  // ---------------------------------------------------------------------------
  // Basemap switch
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const roads = baseLayerRef.current;
    const sat = satLayerRef.current;
    const fallback = fallbackLayerRef.current;
    if (!roads || !sat || !fallback) return;

    if (basemap === 'satellite' && googleTilesAlive) {
      map.removeLayer(roads);
      map.removeLayer(fallback);
      sat.addTo(map);
      sat.bringToBack();
    } else if (basemap === 'satellite' && !googleTilesAlive) {
      map.removeLayer(roads);
      map.removeLayer(sat);
      fallback.addTo(map);
    } else {
      map.removeLayer(sat);
      if (googleTilesAlive) {
        map.removeLayer(fallback);
        roads.addTo(map);
        roads.bringToBack();
      } else {
        map.removeLayer(roads);
        fallback.addTo(map);
        fallback.bringToBack();
      }
    }
  }, [basemap, googleTilesAlive, mapReady]);

  // Selected batch popup auto-open
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !activeSelectedBatch) return;
    map.panTo([activeSelectedBatch.location.lat, activeSelectedBatch.location.lng], {
      animate: true,
    });
  }, [activeSelectedBatch?.id, mapReady]);

  return (
    <div className="relative w-full h-[720px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* Top Map Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-[500] flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Left Segmented Filter Group */}
        <div className="pointer-events-auto flex items-center bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-xl">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ALL-INDIA RADAR
          </div>
          <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Batches ({batches.length})
          </button>
          <button
            onClick={() => setFilterType('urgent')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'urgent' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Urgent (&lt;3h)
          </button>
          <button
            onClick={() => setFilterType('transit')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filterType === 'transit' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            In-Transit Fleet
          </button>
        </div>

        {/* Center / Right Layer Toggles */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const next = !showPunjabFocus;
              setShowPunjabFocus(next);
              setActiveZoneId(PUNJAB_AGRO_PROFILE.zoneId);
              if (onSelectCity) onSelectCity(next ? 'Punjab' : 'Pan-India');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-md transition-all shadow-md ${
              showPunjabFocus || selectedCity === 'Punjab'
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 ring-2 ring-yellow-400/30'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-yellow-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
            <span>🌾 Punjab Agro-Hub</span>
          </button>

          <button
            onClick={() => {
              setShowRemoteSensing(!showRemoteSensing);
              setActiveZoneId(CITY_TO_ZONE[selectedCity] || 'rs-punjab');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-md transition-all shadow-md ${
              showRemoteSensing
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/30'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-cyan-300'
            }`}
            title="Satellite remote sensing: NDVI, LST, soil moisture & rainfall by agro zone"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Remote Sensing</span>
          </button>

          <button
            onClick={() => setShowFoodBanks(!showFoodBanks)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border backdrop-blur-md transition-colors ${
              showFoodBanks
                ? 'bg-slate-900/90 border-blue-500/50 text-blue-400 shadow-sm'
                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            Food Banks ({foodBanks.length})
          </button>

          <button
            onClick={() => setShowReceiverAreas(!showReceiverAreas)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border backdrop-blur-md transition-colors ${
              showReceiverAreas
                ? 'bg-slate-900/90 border-amber-500/50 text-amber-400 shadow-sm'
                : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            People in Need ({filteredReceiverAreas.length})
          </button>

          <button
            onClick={() => setShowCorridors(!showCorridors)}
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border backdrop-blur-md transition-colors ${
              showCorridors
                ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/60 border-slate-700 text-slate-400'
            }`}
          >
            <Compass className="w-3 h-3 text-emerald-400" />
            Corridors
          </button>

          {/* Basemap switch: Google Roads / Google Satellite */}
          <div className="flex items-center bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-0.5 shadow-lg">
            <button
              onClick={() => setBasemap('roads')}
              className={`p-1.5 rounded-lg transition-colors ${
                basemap === 'roads' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Google Roads (dark-styled)"
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setBasemap('satellite')}
              className={`p-1.5 rounded-lg transition-colors ${
                basemap === 'satellite' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Google Satellite imagery"
            >
              <Satellite className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls — wired to the map engine */}
          <div className="flex items-center bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-0.5 shadow-lg">
            <button
              onClick={zoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={zoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset View to Pan-India"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real map canvas */}
      <div ref={containerRef} className="w-full h-full flex-1 z-[1]" />

      {/* Remote Sensing side panel */}
      <RemoteSensingPanel
        open={showRemoteSensing}
        onClose={() => setShowRemoteSensing(false)}
        focusZoneId={activeZoneId || CITY_TO_ZONE[selectedCity]}
      />

      {/* Docked Selected Entity Inspector Bar */}
      {activeSelectedBatch && (
        <div className="absolute bottom-11 left-3 right-3 z-[500] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm line-clamp-1">{activeSelectedBatch.foodTitle}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                  {activeSelectedBatch.quantityKg} kg (~{activeSelectedBatch.estimatedMeals} meals)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span>
                  Restaurant: <strong className="text-slate-200">{activeSelectedBatch.donorName}</strong> (
                  {activeSelectedBatch.restaurantManager?.split('(')[0] || 'Chef'})
                </span>
                <span aria-hidden="true">·</span>
                <a
                  href={`tel:${activeSelectedBatch.restaurantPhone}`}
                  className="text-emerald-400 hover:text-emerald-300 font-mono font-semibold flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>{activeSelectedBatch.restaurantPhone}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
            <div className="text-left md:text-right">
              <div className="flex items-center gap-1.5 md:justify-end text-[11px] text-blue-300 font-medium">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Rider: <strong>{activeSelectedBatch.assignedDriverName || 'Rameshwar Yadav'}</strong>
                </span>
                <a
                  href={`tel:${activeSelectedBatch.driverPhone || '+91 98118 76543'}`}
                  className="text-blue-400 hover:text-blue-300 font-mono text-[10px] ml-1"
                >
                  📞 {activeSelectedBatch.driverPhone || '+91 98118 76543'}
                </a>
              </div>
              <div className="flex items-center gap-1.5 md:justify-end text-[11px] font-mono text-amber-300 mt-0.5 font-bold">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>
                  ETA: {activeSelectedBatch.estimatedDeliveryMinutes || 24}m (
                  {activeSelectedBatch.targetDeliveryTime || '15:10 IST'})
                </span>
              </div>
            </div>

            <button
              onClick={() => onSelectBatch(activeSelectedBatch)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm shrink-0 flex items-center gap-1"
            >
              <span>Full Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Map Legend Bar */}
      <div className="absolute bottom-2 left-3 right-3 z-[500] bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-xl px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-300 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Donor Kitchen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Critical (&lt;1h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-900 border border-blue-400"></span>
            <span>Food Bank Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500 rotate-45 border border-white"></span>
            <span className="text-amber-300 font-medium">People in Need (-Deficit)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-yellow-400 border border-yellow-500"></span>
            <span className="text-yellow-300 font-bold">Punjab Granary Corridor</span>
          </div>
          {showRemoteSensing && (
            <div className="flex items-center gap-1.5">
              <Satellite className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-300 font-bold">RS Zones — green NDVI ≥0.7 · lime ≥0.55 · amber ≥0.4 stressed</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10.5px] text-slate-400 font-mono">
          <span>Click any node for Restaurant, Rider & Delivery Details</span>
          <span className="hidden md:inline text-slate-600">·</span>
          <span className="hidden md:inline">
            {googleTilesAlive ? 'Google Maps imagery' : 'Dark fallback tiles (Google unreachable)'}
          </span>
        </div>
      </div>
    </div>
  );
};

/** Shared popup markup — styled to the app theme (see index.css). */
function buildPopupHtml(opts: {
  kicker: string;
  title: string;
  subtitle: string;
  rows: string[];
  accent: string;
}): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
    <div class="orq-popup">
      <div class="orq-popup-kicker" style="color:${opts.accent}">${esc(opts.kicker)}</div>
      <div class="orq-popup-title">${esc(opts.title)}</div>
      <div class="orq-popup-sub">${esc(opts.subtitle)}</div>
      ${opts.rows.map((r) => `<div class="orq-popup-row">${esc(r)}</div>`).join('')}
    </div>
  `;
}

/**
 * Rich hover card (same information box the previous SVG map showed on
 * hover: kitchen contact, rider, plate, ETA / capacity / deficit). Sticky so
 * it follows the cursor over the node.
 */
function buildHoverHtml(opts: {
  kicker: string;
  title: string;
  subtitle: string;
  rows: string[];
  accent: string;
}): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
    <div class="orq-hover">
      <div class="orq-hover-kicker" style="color:${opts.accent}">${esc(opts.kicker)}</div>
      <div class="orq-hover-title">${esc(opts.title)}</div>
      <div class="orq-hover-sub">${esc(opts.subtitle)}</div>
      ${opts.rows.map((r) => `<div class="orq-hover-row">${esc(r)}</div>`).join('')}
      <div class="orq-hover-hint">Click node for full details</div>
    </div>
  `;
}
