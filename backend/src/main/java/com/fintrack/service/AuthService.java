package com.fintrack.service;

import com.fintrack.dto.AuthDTO;
import com.fintrack.exception.AuthException;
import com.fintrack.model.RefreshToken;
import com.fintrack.model.User;
import com.fintrack.repository.RefreshTokenRepository;
import com.fintrack.repository.UserRepository;
import com.fintrack.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    // ----------------------------------------------------------------
    // REGISTRATION
    // ----------------------------------------------------------------

    @Transactional
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AuthException("An account with this email already exists");
        }

        User user = User.builder()
                .email(request.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .companyName(request.companyName())
                .taxNumber(request.taxNumber())
                .vatNumber(request.vatNumber())
                .emailVerified(true) // Skip email verification for now
                .role(User.UserRole.ADMIN)
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    // ----------------------------------------------------------------
    // LOGIN
    // ----------------------------------------------------------------

    @Transactional
    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new AuthException("Invalid email or password"));

        if (!user.getIsActive()) {
            throw new AuthException("Account is deactivated. Please contact support.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException("Invalid email or password");
        }

        // Revoke all existing refresh tokens for this user (single device policy)
        refreshTokenRepository.revokeAllByUserId(user.getId());

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    // ----------------------------------------------------------------
    // TOKEN REFRESH
    // ----------------------------------------------------------------

    @Transactional
    public AuthDTO.AuthResponse refreshToken(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new AuthException("Invalid refresh token"));

        if (!refreshToken.isValid()) {
            refreshTokenRepository.delete(refreshToken);
            throw new AuthException("Refresh token expired or revoked. Please log in again.");
        }

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new AuthException("User not found"));

        // Rotate: revoke old, issue new
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(user);
    }

    // ----------------------------------------------------------------
    // LOGOUT
    // ----------------------------------------------------------------

    @Transactional
    public void logout(String refreshTokenStr) {
        refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    // ----------------------------------------------------------------
    // GET CURRENT USER
    // ----------------------------------------------------------------

    public AuthDTO.UserInfo getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));
        return toUserInfo(user);
    }

    // ----------------------------------------------------------------
    // CHANGE PASSWORD
    // ----------------------------------------------------------------

    @Transactional
    public void changePassword(String userId, AuthDTO.ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new AuthException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Revoke all refresh tokens — force re-login on all devices
        refreshTokenRepository.revokeAllByUserId(userId);
        log.info("Password changed for user: {}", user.getEmail());
    }

    // ----------------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------------

    @Scheduled(cron = "0 0 2 * * *") // Daily at 02:00
    @Transactional
    public void cleanExpiredTokens() {
        int deleted = refreshTokenRepository.deleteExpiredAndRevoked(Instant.now());
        if (deleted > 0) log.info("Cleaned {} expired/revoked refresh tokens", deleted);
    }

    // ----------------------------------------------------------------
    // PRIVATE HELPERS
    // ----------------------------------------------------------------

    private AuthDTO.AuthResponse buildAuthResponse(User user) {
        String accessToken  = tokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        Instant expiresAt = Instant.now().plusMillis(
                tokenProvider.getRefreshTokenExpirationMs());

        RefreshToken rt = RefreshToken.builder()
                .token(refreshToken)
                .userId(user.getId())
                .expiresAt(expiresAt)
                .build();
        refreshTokenRepository.save(rt);

        return AuthDTO.AuthResponse.of(
                accessToken,
                refreshToken,
                tokenProvider.getAccessTokenExpirationMs() / 1000,
                toUserInfo(user)
        );
    }

    private AuthDTO.UserInfo toUserInfo(User user) {
        return new AuthDTO.UserInfo(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getCompanyName(),
                user.getRole().name(),
                user.getDefaultCurrency()
        );
    }
}
