package com.fintrack.security;

import org.springframework.stereotype.Component;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class PasswordUtil {

    private static final int SALT_LENGTH = 16;
    private static final int ITERATIONS = 10000;
    private static final SecureRandom secureRandom = new SecureRandom();

    public String hashPassword(String password) {
        try {
            byte[] salt = new byte[SALT_LENGTH];
            secureRandom.nextBytes(salt);

            byte[] hashed = hashWithSalt(password, salt);

            String hash = Base64.getEncoder().encodeToString(hashed);
            String saltStr = Base64.getEncoder().encodeToString(salt);

            return hash + ":" + saltStr + ":" + ITERATIONS;
        } catch (Exception e) {
            throw new RuntimeException("Password hashing failed", e);
        }
    }

    public boolean verifyPassword(String password, String storedHash) {
        try {
            String[] parts = storedHash.split(":");
            if (parts.length < 2) {
                return false;
            }

            String hash = parts[0];
            byte[] salt = Base64.getDecoder().decode(parts[1]);
            int iterations = parts.length > 2 ? Integer.parseInt(parts[2]) : ITERATIONS;

            byte[] computedHash = hashWithSalt(password, salt, iterations);
            String computedHashStr = Base64.getEncoder().encodeToString(computedHash);

            return computedHashStr.equals(hash);
        } catch (Exception e) {
            return false;
        }
    }

    private byte[] hashWithSalt(String password, byte[] salt) throws Exception {
        return hashWithSalt(password, salt, ITERATIONS);
    }

    private byte[] hashWithSalt(String password, byte[] salt, int iterations) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        md.update(salt);
        byte[] hashed = md.digest(password.getBytes());

        for (int i = 1; i < iterations; i++) {
            md.reset();
            hashed = md.digest(hashed);
        }

        return hashed;
    }

    public String generateRandomToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}