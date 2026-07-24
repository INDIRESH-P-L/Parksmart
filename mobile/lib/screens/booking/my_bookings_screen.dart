import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/booking.dart';
import '../../providers/booking_provider.dart';
import '../../utils/constants.dart';
import '../../widgets/blob_background.dart';
import '../../widgets/booking_card.dart';
import '../../widgets/glass_card.dart';
import '../ticket/active_ticket_screen.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookingProvider>().fetchMyBookings();
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _cancel(Booking booking) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.inkSoft,
        title: const Text('Cancel booking?'),
        content: Text('Your booking for ${booking.slot?.slotNumber ?? 'this slot'} will be released.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep it')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Cancel booking'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await context.read<BookingProvider>().cancelBooking(booking.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Booking for ${booking.slot?.slotNumber} cancelled')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BookingProvider>();

    return AppScaffold(
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text('My bookings', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
            ),
          ),
          TabBar(
            controller: _tabs,
            indicatorColor: AppColors.accent,
            labelColor: AppColors.textPrimary,
            unselectedLabelColor: AppColors.textMuted,
            tabs: const [Tab(text: 'Active'), Tab(text: 'History')],
          ),
          Expanded(
            child: provider.loading && provider.bookings.isEmpty
                ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                : TabBarView(
                    controller: _tabs,
                    children: [
                      _list(provider.active, empty: 'No active bookings right now.'),
                      _list(provider.history, empty: 'No past bookings yet.'),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _list(List<Booking> items, {required String empty}) {
    if (items.isEmpty) {
      return RefreshIndicator(
        onRefresh: () => context.read<BookingProvider>().fetchMyBookings(),
        color: AppColors.accent,
        backgroundColor: AppColors.inkSoft,
        child: ListView(
          children: [
            const SizedBox(height: 80),
            Center(child: GlassCard(child: Text(empty, style: const TextStyle(color: AppColors.textMuted)))),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => context.read<BookingProvider>().fetchMyBookings(),
      color: AppColors.accent,
      backgroundColor: AppColors.inkSoft,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) {
          final b = items[i];
          return BookingCard(
            booking: b,
            onCancel: b.isCancellable ? () => _cancel(b) : null,
            onTapTicket: b.hasTicket
                ? () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => ActiveTicketScreen(booking: b)))
                : null,
          );
        },
      ),
    );
  }
}
