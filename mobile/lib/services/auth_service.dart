import '../models/user.dart';
import 'api_service.dart';

class AuthResult {
  final AppUser user;
  final String token;
  const AuthResult(this.user, this.token);
}

/// Auth + profile API calls.
class AuthService {
  final _api = ApiService.instance;

  Future<AuthResult> login(String email, String password) async {
    final data = await _api.post('/auth/login',
        body: {'email': email.trim(), 'password': password});
    return AuthResult(
      AppUser.fromJson(data['user'] as Map<String, dynamic>),
      data['token'] as String,
    );
  }

  Future<AuthResult> register(Map<String, dynamic> payload) async {
    final data = await _api.post('/auth/register', body: payload);
    return AuthResult(
      AppUser.fromJson(data['user'] as Map<String, dynamic>),
      data['token'] as String,
    );
  }

  Future<AppUser> me() async {
    final data = await _api.get('/auth/me');
    return AppUser.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    await _api.post('/auth/logout');
  }

  Future<AppUser> updateProfile(Map<String, dynamic> fields) async {
    final data = await _api.put('/users/profile', body: fields);
    return AppUser.fromJson(data['user'] as Map<String, dynamic>);
  }
}
