class AppUser {
  final String id;
  final String name;
  final String email;
  final String role; // user | admin | operator
  final String? phoneNumber;
  final String? vehicleNumber;
  final DateTime? createdAt;

  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phoneNumber,
    this.vehicleNumber,
    this.createdAt,
  });

  bool get isAdmin => role == 'admin';
  bool get isOperator => role == 'operator';
  bool get isStaff => isAdmin || isOperator;

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        email: json['email'] as String? ?? '',
        role: json['role'] as String? ?? 'user',
        phoneNumber: json['phone_number'] as String?,
        vehicleNumber: json['vehicle_number'] as String?,
        createdAt: json['created_at'] != null
            ? DateTime.tryParse(json['created_at'] as String)
            : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'phone_number': phoneNumber,
        'vehicle_number': vehicleNumber,
        'created_at': createdAt?.toIso8601String(),
      };
}
