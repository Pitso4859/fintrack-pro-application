package com.fintrack.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Auth DTOs — uses Java records for immutability and conciseness.
 */
public final class AuthDTO {

    private AuthDTO() {}

    // ----------------------------------------------------------------
    // REQUESTS
    // ----------------------------------------------------------------

    public record RegisterRequest(
            @NotBlank(message = "First name is required")
            @Size(max = 100)
            String firstName,

            @NotBlank(message = "Last name is required")
            @Size(max = 100)
            String lastName,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 128, message = "Password must be 8–128 characters")
            String password,

            @Size(max = 255)
            String companyName,

            @Size(max = 50)
            String taxNumber,

            @Size(max = 50)
            String vatNumber
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    public record RefreshTokenRequest(
            @NotBlank(message = "Refresh token is required")
            String refreshToken
    ) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 128) String newPassword
    ) {}

    // ----------------------------------------------------------------
    // RESPONSES
    // ----------------------------------------------------------------

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long expiresIn,
            UserInfo user
    ) {
        public static AuthResponse of(String accessToken, String refreshToken,
                                      long expiresIn, UserInfo user) {
            return new AuthResponse(accessToken, refreshToken, "Bearer", expiresIn, user);
        }
    }

    public record UserInfo(
            String id,
            String email,
            String firstName,
            String lastName,
            String companyName,
            String role,
            String defaultCurrency
    ) {}

    public record MessageResponse(boolean success, String message) {
        public static MessageResponse success(String message) {
            return new MessageResponse(true, message);
        }
        public static MessageResponse error(String message) {
            return new MessageResponse(false, message);
        }
    }
}
