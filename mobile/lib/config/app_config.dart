/// Environment-style configuration.
///
/// The API base URL is read from a compile-time define so it never has to be
/// hardcoded per build:
///
///   flutter run    --dart-define=API_URL=http://192.168.1.20:5000/api/v1
///   flutter build apk --release --dart-define=API_URL=https://api.parksmart.app/api/v1
///
/// Default targets the Android emulator, where the host machine's localhost is
/// reachable at 10.0.2.2 (so the same backend the web app uses on
/// http://localhost:5000 works with no extra setup). For a physical device,
/// pass your machine's LAN IP via --dart-define as shown above.
class AppConfig {
  const AppConfig._();

  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5000/api/v1',
  );

  /// Fallback map centre — the seeded "Evergreen Institute" campus. The map
  /// recentres on real slot data once it loads.
  static const double campusLat = 12.9716;
  static const double campusLng = 77.5946;
  static const double defaultZoom = 16;

  /// Average walking speed (km/h) for the "distance to slot" estimate.
  static const double avgWalkKmh = 4.8;
}
