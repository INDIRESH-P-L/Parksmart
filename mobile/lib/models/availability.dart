/// Zone-wise live availability, from GET /parking/availability.
class ZoneAvailability {
  final String zone;
  final int total;
  final int available;
  final int occupied;
  final int reserved;

  const ZoneAvailability({
    required this.zone,
    required this.total,
    required this.available,
    required this.occupied,
    required this.reserved,
  });

  double get density => total == 0 ? 0 : (occupied + reserved) / total;

  factory ZoneAvailability.fromJson(Map<String, dynamic> json) =>
      ZoneAvailability(
        zone: json['zone'] as String? ?? 'Zone',
        total: json['total'] as int? ?? 0,
        available: json['available'] as int? ?? 0,
        occupied: json['occupied'] as int? ?? 0,
        reserved: json['reserved'] as int? ?? 0,
      );
}

class Availability {
  final int total;
  final int available;
  final int occupied;
  final int reserved;
  final List<ZoneAvailability> zones;

  const Availability({
    required this.total,
    required this.available,
    required this.occupied,
    required this.reserved,
    required this.zones,
  });

  factory Availability.fromJson(Map<String, dynamic> json) {
    final totals = json['totals'] as Map<String, dynamic>? ?? const {};
    final zones = (json['zones'] as List<dynamic>? ?? const [])
        .map((z) => ZoneAvailability.fromJson(z as Map<String, dynamic>))
        .toList();
    return Availability(
      total: totals['total'] as int? ?? 0,
      available: totals['available'] as int? ?? 0,
      occupied: totals['occupied'] as int? ?? 0,
      reserved: totals['reserved'] as int? ?? 0,
      zones: zones,
    );
  }
}
