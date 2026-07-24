import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../models/booking.dart';
import '../../services/booking_service.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/status_badge.dart';

/// Gate QR scanner (admin/operator). Scans a ticket, calls verify-qr, and shows
/// the result — the backend decides check-in vs check-out and updates the slot.
class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final _controller = MobileScannerController(detectionSpeed: DetectionSpeed.noDuplicates);
  final _service = BookingService();
  bool _busy = false; // prevents re-entrancy while a scan is being verified

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_busy) return;
    // Avoid `firstOrNull` (package:collection) — use an explicit empty check.
    final raw = capture.barcodes.isEmpty ? null : capture.barcodes.first.rawValue;
    if (raw == null || raw.isEmpty) return;

    setState(() => _busy = true);
    await _controller.stop();
    try {
      final result = await _service.verifyQr(raw);
      if (mounted) await _showResult(success: true, result: result);
    } catch (e) {
      if (mounted) await _showResult(success: false, message: e.toString());
    } finally {
      if (mounted) {
        setState(() => _busy = false);
        await _controller.start();
      }
    }
  }

  Future<void> _showResult({required bool success, QrVerifyResult? result, String? message}) async {
    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _ResultSheet(success: success, result: result, message: message),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Scan gate QR'),
        actions: [
          IconButton(onPressed: () => _controller.toggleTorch(), icon: const Icon(Icons.flash_on)),
          IconButton(onPressed: () => _controller.switchCamera(), icon: const Icon(Icons.cameraswitch)),
        ],
      ),
      extendBodyBehindAppBar: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
          // viewfinder
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.accent, width: 3),
                borderRadius: BorderRadius.circular(24),
              ),
            ),
          ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 48,
            child: GlassCard(
              child: Row(
                children: [
                  if (_busy)
                    const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent))
                  else
                    const Icon(Icons.qr_code_2, color: AppColors.accent),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _busy ? 'Verifying ticket…' : 'Point the camera at a rider\'s QR ticket',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ResultSheet extends StatelessWidget {
  final bool success;
  final QrVerifyResult? result;
  final String? message;

  const _ResultSheet({required this.success, this.result, this.message});

  @override
  Widget build(BuildContext context) {
    final Booking? booking = result?.booking;
    final isCheckIn = result?.direction == 'check-in';
    final color = success ? (isCheckIn ? AppColors.lime : AppColors.mintSoft) : AppColors.danger;

    return Padding(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 16,
        bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: GlassCard(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
              child: Icon(success ? (isCheckIn ? Icons.login : Icons.logout) : Icons.error_outline, color: color, size: 30),
            ),
            const SizedBox(height: 16),
            Text(
              success ? (isCheckIn ? 'Checked in' : 'Checked out') : 'Scan rejected',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            if (success && booking != null) ...[
              Text(booking.slot?.slotNumber ?? '',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.accent)),
              const SizedBox(height: 4),
              Text(booking.slot?.zoneName ?? '',
                  style: const TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 8),
              StatusBadge(label: BookingStatus.label[booking.status] ?? booking.status, color: color),
            ] else
              Text(message ?? 'This ticket could not be verified.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 20),
            PrimaryButton(label: 'Scan next', onPressed: () => Navigator.pop(context)),
          ],
        ),
      ),
    );
  }
}
