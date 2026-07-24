import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../models/booking.dart';
import '../utils/constants.dart';
import '../utils/helpers.dart';
import 'glass_card.dart';
import 'status_badge.dart';

/// Decodes a base64 data-URL PNG (the backend's qr_code_url) to bytes for
/// Image.memory. Returns null if the string isn't a data URL.
Uint8List? decodeDataUrl(String? dataUrl) {
  if (dataUrl == null) return null;
  final idx = dataUrl.indexOf('base64,');
  if (idx == -1) return null;
  try {
    return base64Decode(dataUrl.substring(idx + 7));
  } catch (_) {
    return null;
  }
}

/// A booking row in My Bookings. The QR thumbnail is a Hero → the wallet ticket
/// (shared-element transition, the mobile analogue of the web layoutId morph).
class BookingCard extends StatelessWidget {
  final Booking booking;
  final VoidCallback? onCancel;
  final VoidCallback? onTapTicket;

  const BookingCard({super.key, required this.booking, this.onCancel, this.onTapTicket});

  @override
  Widget build(BuildContext context) {
    final statusColor = BookingStatus.color[booking.status] ?? AppColors.warn;
    final qrBytes = booking.hasTicket ? decodeDataUrl(booking.qrCodeUrl) : null;

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (qrBytes != null) ...[
            GestureDetector(
              onTap: onTapTicket,
              child: Hero(
                tag: 'qr-${booking.id}',
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(4),
                    child: Image.memory(qrBytes, width: 64, height: 64),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        booking.slot?.slotNumber ?? 'Slot',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                    ),
                    StatusBadge(
                        label: BookingStatus.label[booking.status] ?? booking.status,
                        color: statusColor),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  '${Format.dateTime(booking.startTime)} → ${Format.dateTime(booking.endTime)}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_subtitle()} · ${Format.currency(booking.totalPrice)}',
                  style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
                if (booking.isCancellable && onCancel != null) ...[
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: OutlinedButton.icon(
                      onPressed: onCancel,
                      icon: const Icon(Icons.cancel_outlined, size: 16),
                      label: const Text('Cancel'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.danger,
                        side: BorderSide(color: AppColors.danger.withOpacity(0.4)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _subtitle() {
    switch (booking.status) {
      case 'active':
        return 'Checked in ${Format.relative(booking.checkInTime)}';
      case 'completed':
        return 'Checked out ${Format.relative(booking.checkOutTime)}';
      default:
        return 'Starts ${Format.relative(booking.startTime)}';
    }
  }
}
