package com.fintrack.service;

import com.fintrack.model.Session;
import com.fintrack.model.User;
import com.fintrack.model.UserSettings;
import com.fintrack.repository.SessionRepository;
import com.fintrack.repository.UserRepository;
import com.fintrack.repository.UserSettingsRepository;
import com.fintrack.security.PasswordUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final PasswordUtil passwordUtil;

    private static final int TOKEN_EXPIRY_HOURS = 24;

    @Transactional
    public Map<String, Object> register(String email, String password, String firstName, String lastName, String companyName) {
        Map<String, Object> response = new HashMap<>();

        if (userRepository.existsByEmail(email)) {
            response.put("success", false);
            response.put("message", "Email already registered");
            return response;
        }

        User user = new User();
        user.setId("usr-" + System.currentTimeMillis());
        user.setEmail(email);
        user.setPasswordHash(passwordUtil.hashPassword(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setCompanyName(companyName);
        user.setEmailVerified(true);
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);

        UserSettings settings = new UserSettings();
        settings.setUserId(user.getId());
        userSettingsRepository.save(settings);

        response.put("success", true);
        response.put("message", "Registration successful");
        response.put("userId", user.getId());

        return response;
    }

    @Transactional
    public Map<String, Object> login(String email, String password) {
        Map<String, Object> response = new HashMap<>();

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return response;
        }

        if (!passwordUtil.verifyPassword(password, user.getPasswordHash())) {
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return response;
        }

        // Clean old sessions for this user
        sessionRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString() + UUID.randomUUID().toString();
        Session session = new Session();
        session.setId("ses-" + System.currentTimeMillis());
        session.setUserId(user.getId());
        session.setToken(token);
        session.setExpiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS));
        session.setCreatedAt(LocalDateTime.now());
        sessionRepository.save(session);

        response.put("success", true);
        response.put("message", "Login successful");
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("email", user.getEmail());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("companyName", user.getCompanyName());

        return response;
    }

    public User validateToken(String token) {
        if (token == null || token.isEmpty()) return null;

        Session session = sessionRepository.findByToken(token).orElse(null);
        if (session == null || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            if (session != null) {
                sessionRepository.delete(session);
            }
            return null;
        }
        return userRepository.findById(session.getUserId()).orElse(null);
    }

    @Transactional
    public Map<String, Object> logout(String token) {
        if (token != null && !token.isEmpty()) {
            sessionRepository.deleteByToken(token);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Logged out successfully");
        return response;
    }

    public User getUserById(String userId) {
        return userRepository.findById(userId).orElse(null);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    @Transactional
    public Map<String, Object> changePassword(String userId, String oldPassword, String newPassword) {
        Map<String, Object> response = new HashMap<>();
        User user = getUserById(userId);

        if (user == null) {
            response.put("success", false);
            response.put("message", "User not found");
            return response;
        }

        if (!passwordUtil.verifyPassword(oldPassword, user.getPasswordHash())) {
            response.put("success", false);
            response.put("message", "Current password is incorrect");
            return response;
        }

        user.setPasswordHash(passwordUtil.hashPassword(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Invalidate all sessions
        sessionRepository.deleteByUserId(userId);

        response.put("success", true);
        response.put("message", "Password changed successfully");
        return response;
    }

    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void cleanExpiredSessions() {
        int deleted = sessionRepository.deleteExpiredSessions(LocalDateTime.now());
        if (deleted > 0) {
            System.out.println("Cleaned up " + deleted + " expired sessions");
        }
    }
}