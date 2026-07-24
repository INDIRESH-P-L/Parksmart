class ParkingSlot {
  final String id;
  final String slotNumber;
  final double latitude;
  final double longitude;
  final String status; // available | occupied | reserved
  final String type; // covered | open
  final String? floor;
  final String? zoneName;
  final String slotType; // standard | ev | disability | vip
  final double hourlyRate;
  final bool isActive;

  const ParkingSlot({
    required this.id,
    required this.slotNumber,
    required this.latitude,
    required this.longitude,
    required this.status,
    required this.type,
    this.floor,
    this.zoneName,
    required this.slotType,
    required this.hourlyRate,
    required this.isActive,
  });

  bool get isAvailable => status == 'available';

  static double _toDouble(dynamic v) =>
      v is num ? v.toDouble() : double.tryParse('$v') ?? 0;

  factory ParkingSlot.fromJson(Map<String, dynamic> json) => ParkingSlot(
        id: json['id'] as String,
        slotNumber: json['slot_number'] as String? ?? '',
        latitude: _toDouble(json['latitude']),
        longitude: _toDouble(json['longitude']),
        status: json['status'] as String? ?? 'available',
        type: json['type'] as String? ?? 'open',
        floor: json['floor'] as String?,
        zoneName: json['zone_name'] as String?,
        slotType: json['slot_type'] as String? ?? 'standard',
        hourlyRate: _toDouble(json['hourly_rate']),
        isActive: json['is_active'] as bool? ?? true,
      );
}
