import 'package:flutter/material.dart';
import '../models/parking_slot.dart';
import '../utils/constants.dart';
import '../utils/helpers.dart';
import 'glass_card.dart';
import 'status_badge.dart';

/// Slot card for the map list and search results.
class ParkingCard extends StatelessWidget {
  final ParkingSlot slot;
  final VoidCallback? onTap;
  final VoidCallback? onBook;

  const ParkingCard({super.key, required this.slot, this.onTap, this.onBook});

  @override
  Widget build(BuildContext context) {
    final statusColor = SlotStatus.color[slot.status] ?? AppColors.lime;
    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              StatusDot(color: statusColor),
              const SizedBox(width: 8),
              Text(slot.slotNumber,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const Spacer(),
              StatusBadge(
                  label: SlotStatus.label[slot.status] ?? slot.status,
                  color: statusColor),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.place_outlined, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  '${slot.zoneName ?? 'Campus'}${slot.floor != null ? ' · ${slot.floor}' : ''}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _chip('${SlotTypeMeta.emoji[slot.slotType] ?? ''} ${SlotTypeMeta.label[slot.slotType] ?? slot.slotType}'),
              const SizedBox(width: 6),
              _chip(slot.type),
              const Spacer(),
            ],
          ),
          if (onBook != null) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: slot.isAvailable ? onBook : null,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  foregroundColor: AppColors.ink,
                  disabledBackgroundColor: Colors.white.withOpacity(0.08),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(slot.isAvailable ? 'Book slot' : SlotStatus.label[slot.status] ?? 'Unavailable'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _chip(String text) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(text,
            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
      );
}
