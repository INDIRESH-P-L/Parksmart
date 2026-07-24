import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

/// Auth session state: user + token, persisted to SharedPreferences and
/// re-validated against GET /auth/me on boot.
class AuthProvider extends ChangeNotifier {
  final _service = AuthService();

  AppUser? _user;
  bool _booting = true;

  AppUser? get user => _user;
  bool get booting => _booting;
  bool get isAuthed => _user != null;
  bool get isAdmin => _user?.isAdmin ?? false;
  bool get isStaff => _user?.isStaff ?? false;

  /// Called once at startup: hydrate from storage, then verify the token.
  Future<void> bootstrap() async {
    final token = await StorageService.getToken();
    if (token == null) {
      _booting = false;
      notifyListeners();
      return;
    }
    _user = await StorageService.getUser(); // optimistic
    try {
      _user = await _service.me(); // authoritative (also catches revoked tokens)
      await StorageService.saveUser(_user!);
    } catch (_) {
      await StorageService.clear();
      _user = null;
    }
    _booting = false;
    notifyListeners();
  }

  Future<AppUser> login(String email, String password) async {
    final result = await _service.login(email, password);
    await _persist(result.user, result.token);
    return result.user;
  }

  Future<AppUser> register(Map<String, dynamic> payload) async {
    final result = await _service.register(payload);
    await _persist(result.user, result.token);
    return result.user;
  }

  Future<void> updateProfile(Map<String, dynamic> fields) async {
    _user = await _service.updateProfile(fields);
    await StorageService.saveUser(_user!);
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await _service.logout();
    } catch (_) {
      // offline logout is still a logout
    }
    await StorageService.clear();
    _user = null;
    notifyListeners();
  }

  Future<void> _persist(AppUser user, String token) async {
    await StorageService.saveToken(token);
    await StorageService.saveUser(user);
    _user = user;
    notifyListeners();
  }
}
