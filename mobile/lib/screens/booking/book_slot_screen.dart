import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/booking.dart';
import '../../models/parking_slot.dart';
import '../../providers/booking_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/blob_background.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/status_badge.dart';
import '../ticket/active_ticket_screen.dart';

/// Book Slot — pick a time window (live price preview), confirm → QR ticket.
class BookSlotScreen extends StatefulWidget {
  final ParkingSlot slot;
  const BookSlotScreen({super.key, required this.slot});

  @override
  State<BookSlotScreen> createState() => _BookSlotScreenState();
}

class _BookSlotScreenState extends State<BookSlotScreen> {
  late DateTime _start = DateTime.now();
  late DateTime _end = DateTime.now().add(const Duration(hours: 1));
  bool _submitting = false;

  double get _price => estimatePrice(widget.slot.hourlyRate, _start, _end);

  Future<void> _pick({required bool isStart}) async {
    final initial = isStart ? _start : _end;
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(minutes: 1)),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(initial));
    if (time == null) return;
    final picked = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    setState(() {
      if (isStart) {
        _start = picked;
        if (!_end.isAfter(_start)) _end = _start.add(const Duration(hours: 1));
      } else {
        _end = picked;
      }
    });
  }

  Future<void> _confirm() async {
    if (!_end.isAfter(_start)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('End time must be after the start time')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final booking = await context.read<BookingProvider>().createBooking(
            slotId: widget.slot.id,
            startTime: _start,
            endTime: _end,
          );
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => ActiveTicketScreen(booking: booking, justBooked: true)),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final slot = widget.slot;
    final statusColor = SlotStatus.color[slot.status] ?? AppColors.lime;

    return AppScaffold(
      appBar: AppBar(title: const Text('Book your spot')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          GlassCard(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      StatusDot(color: statusColor),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(slot.slotNumber, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                          Text('${slot.zoneName ?? 'Campus'}${slot.floor != null ? ' · ${slot.floor}' : ''}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                      const Spacer(),
                      Text('${Format.currency(slot.hourlyRate)}/hr',
                          style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                _timeRow('From', _start, () => _pick(isStart: true)),
                const SizedBox(height: 12),
                _timeRow('Until', _end, () => _pick(isStart: false)),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      const Text('Estimated total', style: TextStyle(color: AppColors.textSecondary)),
                      const Spacer(),
                      Text(Format.currency(_price),
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.accent)),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                const Text('Billed in 15-minute increments — same rule as the server.',
                    textAlign: TextAlign.right,
                    style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                const SizedBox(height: 20),
                PrimaryButton(label: 'Confirm booking', loading: _submitting, onPressed: _confirm),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _timeRow(String label, DateTime value, VoidCallback onTap) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today_outlined, size: 18, color: AppColors.textSecondary),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                Text(Format.dateTime(value), style: const TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
            const Spacer(),
            const Icon(Icons.edit_outlined, size: 16, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}
