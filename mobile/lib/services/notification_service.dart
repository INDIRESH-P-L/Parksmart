import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tzdata;
import '../models/booking.dart';
import '../utils/helpers.dart';

/// Local push notifications: booking confirmation (immediate) and an expiry
/// warning (scheduled 15 min before a booking's end_time). No server push
/// infra needed — this is on-device only, matching the spec's bonus feature.
class NotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _ready = false;

  static const _channel = AndroidNotificationDetails(
    'parksmart_bookings',
    'ParkSmart bookings',
    channelDescription: 'Booking confirmations and expiry reminders',
    importance: Importance.high,
    priority: Priority.high,
    color: Color(0xFFD7FF1F),
  );

  static Future<void> init() async {
    if (_ready) return;
    tzdata.initializeTimeZones();

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );

    // Android 13+ runtime permission.
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
    _ready = true;
  }

  static Future<void> _ensure() async {
    if (!_ready) await init();
  }

  static Future<void> bookingConfirmed(Booking booking) async {
    await _ensure();
    await _plugin.show(
      booking.id.hashCode & 0x7fffffff,
      'Booking confirmed 🎉',
      'Slot ${booking.slot?.slotNumber ?? ''} is yours until ${Format.time(booking.endTime)}. '
          'Show your QR ticket at the gate.',
      const NotificationDetails(android: _channel, iOS: DarwinNotificationDetails()),
    );
    await scheduleExpiryWarning(booking);
  }

  /// Schedules a heads-up 15 minutes before the booking ends (skipped if that
  /// moment is already in the past).
  static Future<void> scheduleExpiryWarning(Booking booking) async {
    final end = booking.endTime;
    if (end == null) return;
    final when = end.toLocal().subtract(const Duration(minutes: 15));
    if (when.isBefore(DateTime.now())) return;

    await _ensure();
    try {
      await _plugin.zonedSchedule(
        (booking.id.hashCode & 0x7fffffff) ^ 0x55,
        'Parking ends soon ⏳',
        'Slot ${booking.slot?.slotNumber ?? ''} expires at ${Format.time(end)}.',
        tz.TZDateTime.from(when, tz.local),
        const NotificationDetails(android: _channel, iOS: DarwinNotificationDetails()),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    } catch (e) {
      // Exact-alarm permission may be denied on some OEMs — non-fatal.
      debugPrint('expiry schedule skipped: $e');
    }
  }
}
