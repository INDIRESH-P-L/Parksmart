import 'package:flutter/foundation.dart';
import '../models/parking_slot.dart';
import '../models/availability.dart';
import '../services/parking_service.dart';

/// Slot catalogue + live availability, with simple filter state.
class ParkingProvider extends ChangeNotifier {
  final _service = ParkingService();

  List<ParkingSlot> _slots = [];
  Availability? _availability;
  bool _loading = false;
  String? _error;

  String statusFilter = '';
  String typeFilter = '';
  String search = '';

  List<ParkingSlot> get slots => _slots;
  Availability? get availability => _availability;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> fetchSlots() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _slots = await _service.listSlots(
        status: statusFilter,
        type: typeFilter,
        search: search,
      );
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> fetchAvailability() async {
    try {
      _availability = await _service.availability();
      notifyListeners();
    } catch (_) {
      // availability is decorative on the dashboard — never block on it
    }
  }

  void setStatusFilter(String value) {
    statusFilter = value;
    fetchSlots();
  }

  void setTypeFilter(String value) {
    typeFilter = value;
    fetchSlots();
  }

  void setSearch(String value) {
    search = value;
    fetchSlots();
  }

  Future<void> refresh() async {
    await Future.wait([fetchSlots(), fetchAvailability()]);
  }
}
