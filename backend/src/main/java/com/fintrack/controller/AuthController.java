package com.fintrack.controller;

import com.fintrack.dto.AuthDTO;
import com.fintrack.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, token refresh and logout")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new user account")
    public ResponseEntity<AuthDTO.AuthResponse> register(
            @Valid @RequestBody AuthDTO.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive JWT tokens")
    public ResponseEntity<AuthDTO.AuthResponse> login(
            @Valid @RequestBody AuthDTO.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange a refresh token for a new access token")
    public ResponseEntity<AuthDTO.AuthResponse> refresh(
            @Valid @RequestBody AuthDTO.RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.refreshToken()));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke refresh token (logout)")
    public ResponseEntity<AuthDTO.MessageResponse> logout(
            @Valid @RequestBody AuthDTO.RefreshTokenRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.ok(AuthDTO.MessageResponse.success("Logged out successfully"));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get the currently authenticated user's profile")
    public ResponseEntity<AuthDTO.UserInfo> me(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(authService.getCurrentUser(userId));
    }

    @PutMapping("/change-password")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Change password for the current user")
    public ResponseEntity<AuthDTO.MessageResponse> changePassword(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody AuthDTO.ChangePasswordRequest request) {
        authService.changePassword(userId, request);
        return ResponseEntity.ok(AuthDTO.MessageResponse.success("Password updated successfully"));
    }
}
