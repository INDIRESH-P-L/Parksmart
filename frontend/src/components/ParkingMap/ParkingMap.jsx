import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  TILE_URL,
  TILE_URL_LIGHT,
  TILE_ATTRIBUTION,
  CAMPUS_CENTER,
  MAP_ZOOM,
} from '../../utils/constants.js';
import { cn } from '../../utils/helpers.js';

// One divIcon per status, built once — Leaflet icons are plain objects, not React.
const ICONS = {};
const iconFor = (status) => {
  if (!ICONS[status]) {
    ICONS[status] = L.divIcon({
      className: '', // reset Leaflet's default white box
      html: `<div class="ps-marker ps-marker--${status}">${
        status === 'available' ? '<div class="ps-marker__ring"></div>' : ''
      }<div class="ps-marker__dot"></div></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }
  return ICONS[status];
};

// Sri Eshwar College Main Campus Landmark Pin Icon
const CAMPUS_PIN_ICON = L.divIcon({
  className: '',
  html: `<div class="flex items-center gap-1 bg-[#D7FF1F] text-[#0A0D14] font-bold text-[11px] px-2.5 py-1 rounded-full shadow-lg border-2 border-white tracking-wide whitespace-nowrap">🏫 Sri Eshwar College</div>`,
  iconSize: [150, 32],
  iconAnchor: [75, 16],
});

// Imperatively recentre when the computed centre changes (MapContainer's
// `center` prop is initial-only by design).
function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function ParkingMap({
  slots = [],
  onMarkerClick,
  center = CAMPUS_CENTER,
  zoom = MAP_ZOOM,
  className = '',
}) {
  const { isDark } = useTheme();
  const tiles = isDark ? TILE_URL : TILE_URL_LIGHT;

  const markers = useMemo(
    () =>
      slots.map((slot) => (
        <Marker
          key={slot.id}
          position={[slot.latitude, slot.longitude]}
          icon={iconFor(slot.status)}
          eventHandlers={{
            click: (event) => {
              // clientX/Y of the tap → fly-in origin for the details panel
              const { clientX, clientY } = event.originalEvent;
              onMarkerClick?.(slot, { x: clientX, y: clientY });
            },
          }}
        />
      )),
    [slots, onMarkerClick]
  );

  return (
    <div className={cn('glass-panel overflow-hidden rounded-card p-1.5', className)}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full min-h-[320px] w-full rounded-[20px]"
      >
        <TileLayer key={tiles} url={tiles} attribution={TILE_ATTRIBUTION} />
        <Recenter center={center} />
        
        {/* Sri Eshwar College of Engineering Main Campus Pin */}
        <Marker position={CAMPUS_CENTER} icon={CAMPUS_PIN_ICON}>
          <Popup>
            <div className="p-1 text-center font-sans">
              <h3 className="font-bold text-sm text-gray-900">Sri Eshwar College of Engineering</h3>
              <p className="text-xs text-gray-600 mt-0.5">Vadasithur via, Kinathukadavu, Coimbatore 641202</p>
              <div className="mt-1.5 inline-block bg-lime-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                🅿️ Smart Campus Parking Hub
              </div>
            </div>
          </Popup>
        </Marker>

        {markers}
      </MapContainer>
    </div>
  );
}
