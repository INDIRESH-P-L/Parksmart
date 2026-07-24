import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../config/app_config.dart';
import '../../models/parking_slot.dart';
import '../../providers/parking_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/blob_background.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/status_badge.dart';
import '../booking/book_slot_screen.dart';
import '../slot/slot_details_screen.dart';

class ParkingMapScreen extends StatefulWidget {
  const ParkingMapScreen({super.key});

  @override
  State<ParkingMapScreen> createState() => _ParkingMapScreenState();
}

class _ParkingMapScreenState extends State<ParkingMapScreen> {
  final _mapController = MapController();
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ParkingProvider>().fetchSlots();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  LatLng get _center {
    final slots = context.read<ParkingProvider>().slots;
    if (slots.isEmpty) return const LatLng(AppConfig.campusLat, AppConfig.campusLng);
    final lat = slots.map((s) => s.latitude).reduce((a, b) => a + b) / slots.length;
    final lng = slots.map((s) => s.longitude).reduce((a, b) => a + b) / slots.length;
    return LatLng(lat, lng);
  }

  void _openSlotSheet(ParkingSlot slot) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _SlotSheet(
        slot: slot,
        onDetails: () {
          Navigator.pop(context);
          Navigator.push(context, MaterialPageRoute(builder: (_) => SlotDetailsScreen(slotId: slot.id)));
        },
        onBook: slot.isAvailable
            ? () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => BookSlotScreen(slot: slot)));
              }
            : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final parking = context.watch<ParkingProvider>();

    return AppScaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                const Expanded(
                  child: Text('Live map', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                ),
                Text('${parking.slots.length} slots',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchController,
              onSubmitted: parking.setSearch,
              decoration: InputDecoration(
                hintText: 'Search slot number or zone…',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          parking.setSearch('');
                        },
                      ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          _statusFilters(parking),
          const SizedBox(height: 10),
          Expanded(
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  child: FlutterMap(
                    mapController: _mapController,
                    options: MapOptions(
                      initialCenter: _center,
                      initialZoom: AppConfig.defaultZoom,
                    ),
                    children: [
                      TileLayer(
                        urlTemplate: kTileUrlDark,
                        userAgentPackageName: kTileUserAgent,
                      ),
                      MarkerLayer(
                        markers: parking.slots
                            .map((slot) => Marker(
                                  point: LatLng(slot.latitude, slot.longitude),
                                  width: 26,
                                  height: 26,
                                  child: GestureDetector(
                                    onTap: () => _openSlotSheet(slot),
                                    child: _MapPin(color: SlotStatus.color[slot.status] ?? AppColors.lime),
                                  ),
                                ))
                            .toList(),
                      ),
                    ],
                  ),
                ),
                if (parking.loading)
                  const Positioned(
                    top: 16,
                    right: 16,
                    child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusFilters(ParkingProvider parking) {
    const options = [
      ('', 'All'),
      ('available', 'Available'),
      ('occupied', 'Occupied'),
      ('reserved', 'Reserved'),
    ];
    return SizedBox(
      height: 34,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          for (final (value, label) in options)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(label),
                selected: parking.statusFilter == value,
                onSelected: (_) => parking.setStatusFilter(value),
                showCheckmark: false,
                labelStyle: TextStyle(
                  fontSize: 12,
                  color: parking.statusFilter == value ? AppColors.ink : AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
                selectedColor: AppColors.accent,
                backgroundColor: Colors.white.withOpacity(0.05),
                side: BorderSide(color: AppColors.glassBorder),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              ),
            ),
        ],
      ),
    );
  }
}

class _MapPin extends StatelessWidget {
  final Color color;
  const _MapPin({required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.ink, width: 2.5),
        boxShadow: [BoxShadow(color: color.withOpacity(0.5), blurRadius: 8)],
      ),
    );
  }
}

class _SlotSheet extends StatelessWidget {
  final ParkingSlot slot;
  final VoidCallback onDetails;
  final VoidCallback? onBook;

  const _SlotSheet({required this.slot, required this.onDetails, this.onBook});

  @override
  Widget build(BuildContext context) {
    final statusColor = SlotStatus.color[slot.status] ?? AppColors.lime;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: GlassCard(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                StatusDot(color: statusColor),
                const SizedBox(width: 8),
                Text(slot.slotNumber, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                const Spacer(),
                StatusBadge(label: SlotStatus.label[slot.status] ?? slot.status, color: statusColor),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${slot.zoneName ?? 'Campus'}${slot.floor != null ? ' · ${slot.floor}' : ''} · ${slot.type} · ${Format.currency(slot.hourlyRate)}/hr',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onDetails,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textPrimary,
                      side: BorderSide(color: AppColors.glassBorder),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Details'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: onBook,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: AppColors.ink,
                      disabledBackgroundColor: Colors.white.withOpacity(0.08),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(slot.isAvailable ? 'Book slot' : 'Unavailable'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
