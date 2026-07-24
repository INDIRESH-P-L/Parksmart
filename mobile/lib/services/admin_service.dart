import 'api_service.dart';

/// Admin-only reads (analytics summary). Kept minimal — the mobile app focuses
/// on gate operations; full slot CRUD lives in the web admin console.
class AdminService {
  final _api = ApiService.instance;

  Future<Map<String, dynamic>> summary() async {
    final data = await _api.get('/analytics/summary');
    return data as Map<String, dynamic>;
  }
}
