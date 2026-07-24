import 'package:flutter/material.dart';

/// Design tokens — mirror the web "Liquid Glass" theme so the two clients feel
/// like one product.
class AppColors {
  const AppColors._();

  static const Color ink = Color(0xFF0A0A0A); // app background
  static const Color inkSoft = Color(0xFF101010);
  static const Color accent = Color(0xFFD7FF1F); // primary volt
  static const Color accentDim = Color(0xFFAACC19);
  static const Color lime = Color(0xFF9FFF2D); // success
  static const Color mint = Color(0xFF10B981); // secondary emerald
  static const Color mintSoft = Color(0xFF34D399);
  static const Color teal = Color(0xFF0D9488);

  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB5B5B5);
  static const Color textMuted = Color(0xFF6F6F6F);

  static const Color danger = Color(0xFFFF5A5A);
  static const Color warn = Color(0xFFFFC93D);

  static const Color glassBorder = Color(0x1AFFFFFF); // white @ ~10%
  static const Color glassFill = Color(0x14FFFFFF); // white @ ~8%
}

/// Slot status → colour + label.
class SlotStatus {
  static const Map<String, Color> color = {
    'available': AppColors.lime,
    'occupied': AppColors.danger,
    'reserved': AppColors.warn,
  };
  static const Map<String, String> label = {
    'available': 'Available',
    'occupied': 'Occupied',
    'reserved': 'Reserved',
  };
}

/// Booking status → colour + label.
class BookingStatus {
  static const Map<String, Color> color = {
    'pending': AppColors.warn,
    'confirmed': AppColors.accent,
    'active': AppColors.lime,
    'completed': AppColors.mintSoft,
    'cancelled': AppColors.danger,
  };
  static const Map<String, String> label = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'active': 'Active',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };
}

class SlotTypeMeta {
  static const Map<String, String> label = {
    'standard': 'Standard',
    'ev': 'EV Charging',
    'disability': 'Accessible',
    'vip': 'VIP',
  };
  static const Map<String, String> emoji = {
    'standard': '🚗',
    'ev': '⚡',
    'disability': '♿',
    'vip': '⭐',
  };
}

/// OpenStreetMap dark tiles (CARTO) — same source as the web map. Uses the
/// subdomain-less host so we don't depend on flutter_map's `subdomains` param
/// (its API shifted across v6/v7).
const String kTileUrlDark =
    'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
const String kTileUserAgent = 'com.parksmart.app';
