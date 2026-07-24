import 'package:flutter/foundation.dart';
import '../models/booking.dart';
import '../services/booking_service.dart';
import '../services/notification_service.dart';

/// Current user's bookings + create/cancel.
class BookingProvider extends ChangeNotifier {
  final _service = BookingService();

  List<Booking> _bookings = [];
  bool _loading = false;
  String? _error;

  List<Booking> get bookings => _bookings;
  bool get loading => _loading;
  String? get error => _error;

  List<Booking> get active => _bookings.where((b) => b.isActive).toList();
  List<Booking> get history => _bookings.where((b) => !b.isActive).toList();

  Future<void> fetchMyBookings() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _bookings = await _service.myBookings();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// Returns the confirmed booking (with QR) so the caller can navigate to the
  /// wallet ticket. Also fires the local confirmation + expiry notifications.
  Future<Booking> createBooking({
    required String slotId,
    DateTime? startTime,
    DateTime? endTime,
  }) async {
    final booking = await _service.createBooking(
      slotId: slotId,
      startTime: startTime,
      endTime: endTime,
    );
    _bookings = [booking, ..._bookings];
    notifyListeners();
    // fire-and-forget: a notification hiccup must not fail the booking
    NotificationService.bookingConfirmed(booking).catchError((_) {});
    return booking;
  }

  Future<void> cancelBooking(String id) async {
    final updated = await _service.cancelBooking(id);
    _bookings = _bookings.map((b) => b.id == id ? updated : b).toList();
    notifyListeners();
  }
}
