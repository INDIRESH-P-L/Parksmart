import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../../models/parking_slot.dart';
import '../../services/parking_service.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/blob_background.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/status_badge.dart';
import '../booking/book_slot_screen.dart';

class SlotDetailsScreen extends StatefulWidget {
  final String slotId;
  const SlotDetailsScreen({super.key, required this.slotId});

  @override
  State<SlotDetailsScreen> createState() => _SlotDetailsScreenState();
}

class _SlotDetailsScreenState extends State<SlotDetailsScreen> {
  final _service = ParkingService();
  ParkingSlot? _slot;
  String? _error;
  WalkEstimate? _walk;
  bool _locating = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final slot = await _service.getSlot(widget.slotId);
      setState(() => _slot = slot);
    } catch (e) {
      setState(() => _error = e.toString());
    }
  }

  Future<void> _computeWalk() async {
    final slot = _slot;
    if (slot == null) return;
    setState(() => _locating = true);
    try {
      // permission flow
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        throw 'Location permission denied';
      }
      final pos = await Geolocator.getCurrentPosition();
      setState(() => _walk =
          walkingEstimate(pos.latitude, pos.longitude, slot.latitude, slot.longitude));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not read location: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(title: const Text('Slot details')),
      body: _error != null
          ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.danger)))
          : _slot == null
              ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
              : _content(_slot!),
    );
  }

  Widget _content(ParkingSlot slot) {
    final statusColor = SlotStatus.color[slot.status] ?? AppColors.lime;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        GlassCard(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  StatusDot(color: statusColor, size: 12),
                  const SizedBox(width: 10),
                  Text(slot.slotNumber, style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700)),
                  const SizedBox(width: 10),
                  StatusBadge(label: SlotStatus.label[slot.status] ?? slot.status, color: statusColor),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.place_outlined, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text('${slot.zoneName ?? 'Campus'}${slot.floor != null ? ' · Floor ${slot.floor}' : ''}',
                      style: const TextStyle(color: AppColors.textSecondary)),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  _metric('Status', SlotStatus.label[slot.status] ?? slot.status, AppColors.accent),
                  const SizedBox(width: 10),
                  _metric('Cover', slot.type, AppColors.textPrimary),
                  const SizedBox(width: 10),
                  _metric('Type', SlotTypeMeta.label[slot.slotType] ?? slot.slotType, AppColors.textPrimary),
                ],
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _locating ? null : _computeWalk,
                icon: _locating
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.navigation_outlined, size: 16),
                label: Text(_walk == null
                    ? 'Walking distance from me'
                    : '${_walk!.distance} away · ~${_walk!.minutes} min walk'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: _walk == null ? AppColors.textPrimary : AppColors.mintSoft,
                  side: BorderSide(color: AppColors.glassBorder),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
              const SizedBox(height: 16),
              PrimaryButton(
                label: slot.isAvailable ? 'Book this slot' : 'Currently ${SlotStatus.label[slot.status]?.toLowerCase()}',
                onPressed: slot.isAvailable
                    ? () => Navigator.push(context, MaterialPageRoute(builder: (_) => BookSlotScreen(slot: slot)))
                    : null,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 240,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: FlutterMap(
              options: MapOptions(
                initialCenter: LatLng(slot.latitude, slot.longitude),
                initialZoom: 17,
                interactionOptions: const InteractionOptions(flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag),
              ),
              children: [
                TileLayer(
                  urlTemplate: kTileUrlDark,
                  userAgentPackageName: kTileUserAgent,
                ),
                MarkerLayer(markers: [
                  Marker(
                    point: LatLng(slot.latitude, slot.longitude),
                    width: 26,
                    height: 26,
                    child: Container(
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.ink, width: 2.5),
                      ),
                    ),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _metric(String label, String value, Color color) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label.toUpperCase(),
                  style: const TextStyle(fontSize: 10, color: AppColors.textMuted, letterSpacing: 0.5)),
              const SizedBox(height: 4),
              Text(value,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: color),
                  overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      );
}
