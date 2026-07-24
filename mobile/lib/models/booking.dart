import 'parking_slot.dart';

class Booking {
  final String id;
  final String userId;
  final String slotId;
  final DateTime? bookingTime;
  final DateTime? startTime;
  final DateTime? endTime;
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final double totalPrice;
  final String? qrCodeUrl; // base64 data URL PNG from the backend
  final String status; // pending | confirmed | active | completed | cancelled
  final ParkingSlot? slot; // embedded by the API

  const Booking({
    required this.id,
    required this.userId,
    required this.slotId,
    this.bookingTime,
    this.startTime,
    this.endTime,
    this.checkInTime,
    this.checkOutTime,
    required this.totalPrice,
    this.qrCodeUrl,
    required this.status,
    this.slot,
  });

  bool get isActive => const ['pending', 'confirmed', 'active'].contains(status);
  bool get isCancellable => const ['pending', 'confirmed'].contains(status);
  bool get hasTicket =>
      qrCodeUrl != null && const ['confirmed', 'active'].contains(status);

  static DateTime? _date(dynamic v) =>
      v == null ? null : DateTime.tryParse(v as String);
  static double _toDouble(dynamic v) =>
      v is num ? v.toDouble() : double.tryParse('$v') ?? 0;

  factory Booking.fromJson(Map<String, dynamic> json) => Booking(
        id: json['id'] as String,
        userId: json['user_id'] as String? ?? '',
        slotId: json['slot_id'] as String? ?? '',
        bookingTime: _date(json['booking_time']),
        startTime: _date(json['start_time']),
        endTime: _date(json['end_time']),
        checkInTime: _date(json['check_in_time']),
        checkOutTime: _date(json['check_out_time']),
        totalPrice: _toDouble(json['total_price']),
        qrCodeUrl: json['qr_code_url'] as String?,
        status: json['status'] as String? ?? 'pending',
        slot: json['slot'] != null
            ? ParkingSlot.fromJson(json['slot'] as Map<String, dynamic>)
            : null,
      );
}
