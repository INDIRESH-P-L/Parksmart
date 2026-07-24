import '../models/booking.dart';
import 'api_service.dart';

class QrVerifyResult {
  final String direction; // 'check-in' | 'check-out'
  final Booking booking;
  const QrVerifyResult(this.direction, this.booking);
}

/// Booking API calls (incl. the operator gate-scan).
class BookingService {
  final _api = ApiService.instance;

  Future<Booking> createBooking({
    required String slotId,
    DateTime? startTime,
    DateTime? endTime,
  }) async {
    final body = <String, dynamic>{'slot_id': slotId};
    if (startTime != null) body['start_time'] = startTime.toUtc().toIso8601String();
    if (endTime != null) body['end_time'] = endTime.toUtc().toIso8601String();
    final data = await _api.post('/bookings/create', body: body);
    return Booking.fromJson(data['booking'] as Map<String, dynamic>);
  }

  Future<List<Booking>> myBookings() async {
    final data = await _api.get('/bookings/my-bookings');
    return (data['bookings'] as List<dynamic>)
        .map((b) => Booking.fromJson(b as Map<String, dynamic>))
        .toList();
  }

  Future<Booking> cancelBooking(String id) async {
    final data = await _api.post('/bookings/$id/cancel');
    return Booking.fromJson(data['booking'] as Map<String, dynamic>);
  }

  /// Gate scan (admin/operator). Backend decides check-in vs check-out.
  Future<QrVerifyResult> verifyQr(String qrData) async {
    final data = await _api.post('/bookings/verify-qr', body: {'qr_data': qrData});
    return QrVerifyResult(
      data['direction'] as String,
      Booking.fromJson(data['booking'] as Map<String, dynamic>),
    );
  }
}
