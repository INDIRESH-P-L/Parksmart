import '../models/parking_slot.dart';
import '../models/availability.dart';
import 'api_service.dart';

/// Parking catalogue + availability API calls.
class ParkingService {
  final _api = ApiService.instance;

  Future<List<ParkingSlot>> listSlots({
    String? status,
    String? type,
    String? zone,
    String? search,
  }) async {
    final query = <String, dynamic>{};
    if (status != null && status.isNotEmpty) query['status'] = status;
    if (type != null && type.isNotEmpty) query['type'] = type;
    if (zone != null && zone.isNotEmpty) query['zone'] = zone;
    if (search != null && search.isNotEmpty) query['search'] = search;

    final data = await _api.get('/parking/slots', query: query);
    return (data['slots'] as List<dynamic>)
        .map((s) => ParkingSlot.fromJson(s as Map<String, dynamic>))
        .toList();
  }

  Future<ParkingSlot> getSlot(String id) async {
    final data = await _api.get('/parking/slots/$id');
    return ParkingSlot.fromJson(data['slot'] as Map<String, dynamic>);
  }

  Future<Availability> availability() async {
    final data = await _api.get('/parking/availability');
    return Availability.fromJson(data as Map<String, dynamic>);
  }
}
