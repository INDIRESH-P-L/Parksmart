import 'package:dio/dio.dart';
import '../config/app_config.dart';
import 'storage_service.dart';

/// Thrown on any non-2xx / transport error, carrying the backend's friendly
/// message from the { success, data, message } envelope.
class ApiException implements Exception {
  final String message;
  final int? status;
  ApiException(this.message, [this.status]);
  @override
  String toString() => message;
}

/// Single Dio client for the whole app.
/// - injects the Bearer token on every request
/// - unwraps the { success, data, message } envelope, returning `data`
/// - normalises errors into ApiException with a human-readable message
class ApiService {
  ApiService._() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
      // We handle status ourselves so we can read the envelope on 4xx/5xx.
      validateStatus: (_) => true,
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await StorageService.getToken();
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
    ));
  }

  static final ApiService instance = ApiService._();
  late final Dio _dio;

  /// Returns the `data` object from the envelope, or throws ApiException.
  Future<dynamic> _handle(Future<Response> future) async {
    try {
      final res = await future;
      final body = res.data;
      final ok = res.statusCode != null &&
          res.statusCode! >= 200 &&
          res.statusCode! < 300;
      if (body is Map && body['success'] == true && ok) {
        return body['data'];
      }
      final msg = (body is Map && body['message'] is String)
          ? body['message'] as String
          : 'Request failed (${res.statusCode})';
      throw ApiException(msg, res.statusCode);
    } on ApiException {
      rethrow;
    } on DioException catch (e) {
      throw ApiException(
        e.type == DioExceptionType.connectionTimeout ||
                e.type == DioExceptionType.receiveTimeout
            ? 'The server took too long to respond'
            : 'Cannot reach the ParkSmart server — is the backend running and API_URL correct?',
      );
    }
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _handle(_dio.get(path, queryParameters: query));

  Future<dynamic> post(String path, {Object? body}) =>
      _handle(_dio.post(path, data: body));

  Future<dynamic> put(String path, {Object? body}) =>
      _handle(_dio.put(path, data: body));

  Future<dynamic> patch(String path, {Object? body}) =>
      _handle(_dio.patch(path, data: body));

  Future<dynamic> delete(String path) => _handle(_dio.delete(path));
}
