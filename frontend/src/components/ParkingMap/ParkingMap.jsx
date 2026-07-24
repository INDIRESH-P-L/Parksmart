// React-Leaflet map with status-coloured divIcon markers.
// Green markers pulse (CSS ring in globals.css) to advertise availability.
// On click, the marker's SCREEN position is passed up so the Slot Details
// panel can fly in from that exact point rather than just appearing.
import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
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
        // taller default for the dedicated map page comes from the parent's className
      >
        <TileLayer key={tiles} url={tiles} attribution={TILE_ATTRIBUTION} />
        <Recenter center={center} />
        {markers}
      </MapContainer>
    </div>
  );
}
