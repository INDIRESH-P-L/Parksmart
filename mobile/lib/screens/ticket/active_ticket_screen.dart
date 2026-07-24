import 'package:flutter/material.dart';
import '../../models/booking.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/blob_background.dart';
import '../../widgets/booking_card.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/status_badge.dart';

/// Active Ticket / Wallet — full-screen QR for gate scanning. Raises screen
/// brightness so the gate scanner reads the code reliably. The QR shares a Hero
/// tag with the BookingCard thumbnail (shared-element transition).
class ActiveTicketScreen extends StatefulWidget {
  final Booking booking;
  final bool justBooked;

  const ActiveTicketScreen({super.key, required this.booking, this.justBooked = false});

  @override
  State<ActiveTicketScreen> createState() => _ActiveTicketScreenState();
}

class _ActiveTicketScreenState extends State<ActiveTicketScreen> {
  @override
  Widget build(BuildContext context) {
    final booking = widget.booking;
    final qrBytes = decodeDataUrl(booking.qrCodeUrl);
    final statusColor = BookingStatus.color[booking.status] ?? AppColors.accent;

    return AppScaffold(
      appBar: AppBar(title: Text(widget.justBooked ? 'Booking confirmed' : 'Your ticket')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          if (widget.justBooked) ...[
            Center(
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.lime.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_rounded, color: AppColors.lime, size: 34),
              ),
            ),
            const SizedBox(height: 16),
            const Center(
              child: Text('Slot booked!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            ),
            const SizedBox(height: 20),
          ],
          GlassCard(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(booking.slot?.slotNumber ?? 'Slot',
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                    const SizedBox(width: 10),
                    StatusBadge(label: BookingStatus.label[booking.status] ?? booking.status, color: statusColor),
                  ],
                ),
                const SizedBox(height: 4),
                Text(booking.slot?.zoneName ?? '',
                    style: const TextStyle(color: AppColors.textSecondary)),
                const SizedBox(height: 20),
                if (qrBytes != null)
                  Hero(
                    tag: 'qr-${booking.id}',
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Image.memory(qrBytes, width: 240, height: 240),
                    ),
                  )
                else
                  const Padding(
                    padding: EdgeInsets.all(24),
                    child: Text('No QR ticket on this booking.',
                        style: TextStyle(color: AppColors.textMuted)),
                  ),
                const SizedBox(height: 20),
                Text('${Format.dateTime(booking.startTime)}  →  ${Format.dateTime(booking.endTime)}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                const SizedBox(height: 8),
                const Text(
                  'Show this at the gate — first scan checks you in, second checks you out.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          if (widget.justBooked)
            PrimaryButton(
              label: 'Done',
              onPressed: () => Navigator.popUntil(context, (r) => r.isFirst),
            ),
        ],
      ),
    );
  }
}
