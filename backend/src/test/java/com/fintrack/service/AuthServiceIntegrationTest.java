package com.fintrack.service;

import com.fintrack.dto.AuthDTO;
import com.fintrack.exception.AuthException;
import com.fintrack.repository.RefreshTokenRepository;
import com.fintrack.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Testcontainers
@DisplayName("AuthService Integration Tests")
class AuthServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("fintrack_test")
            .withUsername("fintrack")
            .withPassword("test_password");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.properties.hibernate.dialect",
                () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("app.jwt.secret",
                () -> "test-secret-key-that-is-long-enough-for-hs512-at-least-256-bits");
    }

    @Autowired private AuthService authService;
    @Autowired private UserRepository userRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void cleanDb() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ----------------------------------------------------------------
    // REGISTRATION
    // ----------------------------------------------------------------

    @Nested
    @DisplayName("Registration")
    class Registration {

        @Test
        @DisplayName("registers a new user and returns JWT tokens")
        void registerSuccess() {
            var request = new AuthDTO.RegisterRequest(
                    "Alice", "Smith", "alice@example.com",
                    "securePass123!", "ACME Ltd", null, null);

            AuthDTO.AuthResponse response = authService.register(request);

            assertThat(response.accessToken()).isNotBlank();
            assertThat(response.refreshToken()).isNotBlank();
            assertThat(response.user().email()).isEqualTo("alice@example.com");
            assertThat(response.user().firstName()).isEqualTo("Alice");
            assertThat(userRepository.findByEmail("alice@example.com")).isPresent();
        }

        @Test
        @DisplayName("throws AuthException when email already exists")
        void registerDuplicateEmail() {
            var request = new AuthDTO.RegisterRequest(
                    "Bob", "Jones", "bob@example.com",
                    "securePass123!", null, null, null);
            authService.register(request);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(AuthException.class)
                    .hasMessageContaining("already exists");
        }
    }

    // ----------------------------------------------------------------
    // LOGIN
    // ----------------------------------------------------------------

    @Nested
    @DisplayName("Login")
    class Login {

        @Test
        @DisplayName("returns tokens for valid credentials")
        void loginSuccess() {
            authService.register(new AuthDTO.RegisterRequest(
                    "Carol", "White", "carol@example.com",
                    "myPassword99!", "Corp", null, null));

            AuthDTO.AuthResponse response = authService.login(
                    new AuthDTO.LoginRequest("carol@example.com", "myPassword99!"));

            assertThat(response.accessToken()).isNotBlank();
            assertThat(response.user().email()).isEqualTo("carol@example.com");
        }

        @Test
        @DisplayName("throws AuthException for wrong password")
        void loginWrongPassword() {
            authService.register(new AuthDTO.RegisterRequest(
                    "Dave", "Black", "dave@example.com",
                    "correctPass1!", null, null, null));

            assertThatThrownBy(() -> authService.login(
                    new AuthDTO.LoginRequest("dave@example.com", "wrongPass!")))
                    .isInstanceOf(AuthException.class);
        }

        @Test
        @DisplayName("throws AuthException for unknown email")
        void loginUnknownEmail() {
            assertThatThrownBy(() -> authService.login(
                    new AuthDTO.LoginRequest("nobody@example.com", "pass")))
                    .isInstanceOf(AuthException.class);
        }
    }

    // ----------------------------------------------------------------
    // TOKEN REFRESH
    // ----------------------------------------------------------------

    @Nested
    @DisplayName("Token refresh")
    class TokenRefresh {

        @Test
        @DisplayName("issues new token pair and revokes old refresh token")
        void refreshSuccess() {
            AuthDTO.AuthResponse initial = authService.register(
                    new AuthDTO.RegisterRequest("Eve", "Green", "eve@example.com",
                            "pass1234!", null, null, null));

            AuthDTO.AuthResponse refreshed = authService.refreshToken(initial.refreshToken());

            assertThat(refreshed.accessToken()).isNotEqualTo(initial.accessToken());
            assertThat(refreshed.refreshToken()).isNotEqualTo(initial.refreshToken());
        }

        @Test
        @DisplayName("throws AuthException for an already-used refresh token")
        void refreshRevokedToken() {
            AuthDTO.AuthResponse initial = authService.register(
                    new AuthDTO.RegisterRequest("Frank", "Blue", "frank@example.com",
                            "pass1234!", null, null, null));

            authService.refreshToken(initial.refreshToken()); // consumes token

            assertThatThrownBy(() -> authService.refreshToken(initial.refreshToken()))
                    .isInstanceOf(AuthException.class);
        }
    }
}
