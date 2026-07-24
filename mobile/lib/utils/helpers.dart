import 'dart:math';
import 'package:intl/intl.dart';
import '../config/app_config.dart';

/// Formatting + geo helpers shared across screens.
class Format {
  const Format._();

  static String currency(num? value) => '₹${(value ?? 0).toStringAsFixed(2)}';

  static String date(DateTime? d) =>
      d == null ? '—' : DateFormat('d MMM yyyy').format(d.toLocal());

  static String time(DateTime? d) =>
      d == null ? '—' : DateFormat('hh:mm a').format(d.toLocal());

  static String dateTime(DateTime? d) =>
      d == null ? '—' : '${date(d)} · ${time(d)}';

  /// "in 2 h", "35 min ago" — lightweight relative time.
  static String relative(DateTime? d) {
    if (d == null) return '';
    final diff = d.toLocal().difference(DateTime.now());
    final mins = diff.inMinutes;
    final abs = mins.abs();
    String phrase;
    if (abs < 60) {
      phrase = '${abs} min';
    } else if (abs < 60 * 24) {
      phrase = '${(abs / 60).round()} h';
    } else {
      phrase = '${(abs / (60 * 24)).round()} d';
    }
    return mins >= 0 ? 'in $phrase' : '$phrase ago';
  }

  static String initials(String? name) {
    if (name == null || name.trim().isEmpty) return '?';
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts.take(2).map((p) => p[0].toUpperCase()).join();
  }
}

/// Haversine great-circle distance (km) — the walking-distance estimate needs
/// no paid API. Accurate to well under 1% at campus scale.
double haversineKm(double lat1, double lng1, double lat2, double lng2) {
  const r = 6371.0;
  double toRad(double d) => d * pi / 180;
  final dLat = toRad(lat2 - lat1);
  final dLng = toRad(lng2 - lng1);
  final a = pow(sin(dLat / 2), 2) +
      cos(toRad(lat1)) * cos(toRad(lat2)) * pow(sin(dLng / 2), 2);
  return 2 * r * asin(sqrt(a.toDouble()));
}

class WalkEstimate {
  final double km;
  final String distance;
  final int minutes;
  const WalkEstimate(this.km, this.distance, this.minutes);
}

WalkEstimate walkingEstimate(
    double lat1, double lng1, double lat2, double lng2) {
  final km = haversineKm(lat1, lng1, lat2, lng2);
  final minutes = max(1, (km / AppConfig.avgWalkKmh * 60).round());
  final distance =
      km < 1 ? '${(km * 1000).round()} m' : '${km.toStringAsFixed(1)} km';
  return WalkEstimate(km, distance, minutes);
}

/// Mirrors the backend pricing rule (15-min increments, minimum one) so the
/// booking screen previews the exact price the server will charge.
double estimatePrice(num hourlyRate, DateTime start, DateTime end) {
  final ms = end.difference(start).inMilliseconds;
  if (ms <= 0) return 0;
  final quarters = max(1, (ms / (15 * 60 * 1000)).ceil());
  return double.parse((hourlyRate * (quarters / 4)).toStringAsFixed(2));
}
