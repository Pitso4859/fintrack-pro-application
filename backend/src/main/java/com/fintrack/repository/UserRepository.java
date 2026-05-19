package com.fintrack.repository;

import com.fintrack.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationToken(String token);
    Optional<User> findByResetPasswordToken(String token);
    boolean existsByEmail(String email);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.emailVerified = true, u.verificationToken = null WHERE u.verificationToken = :token")
    int verifyEmail(@Param("token") String token);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.resetPasswordToken = :token, u.resetPasswordExpires = :expires WHERE u.email = :email")
    int setResetPasswordToken(@Param("email") String email, @Param("token") String token, @Param("expires") LocalDateTime expires);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.passwordHash = :passwordHash, u.resetPasswordToken = null, u.resetPasswordExpires = null WHERE u.resetPasswordToken = :token")
    int updatePassword(@Param("token") String token, @Param("passwordHash") String passwordHash);
}