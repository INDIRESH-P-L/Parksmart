import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

/// Persists the JWT + cached user across app launches (SharedPreferences).
class StorageService {
  static const _kToken = 'ps_token';
  static const _kUser = 'ps_user';

  static SharedPreferences? _prefs;
  static Future<SharedPreferences> get _p async =>
      _prefs ??= await SharedPreferences.getInstance();

  static Future<void> saveToken(String token) async =>
      (await _p).setString(_kToken, token);

  static Future<String?> getToken() async => (await _p).getString(_kToken);

  static Future<void> saveUser(AppUser user) async =>
      (await _p).setString(_kUser, jsonEncode(user.toJson()));

  static Future<AppUser?> getUser() async {
    final raw = (await _p).getString(_kUser);
    if (raw == null) return null;
    try {
      return AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  static Future<void> clear() async {
    final p = await _p;
    await p.remove(_kToken);
    await p.remove(_kUser);
  }
}
