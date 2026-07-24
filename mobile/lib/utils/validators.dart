/// Form validators — mirror the backend zod rules so users get instant
/// feedback; the server stays the source of truth.
class Validators {
  const Validators._();

  static final RegExp _email = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  static String? email(String? value) {
    if (value == null || !_email.hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    return null;
  }

  static String? required(String? value, [String label = 'This field']) {
    if (value == null || value.trim().isEmpty) return '$label is required';
    return null;
  }

  static String? name(String? value) {
    if (value == null || value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return null;
  }

  static String? loginPassword(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    return null;
  }
}
