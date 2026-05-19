package com.fintrack.repository;

import com.fintrack.model.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, String> {
    Optional<UserSettings> findByUserId(String userId);

    @Modifying
    @Transactional
    @Query("UPDATE UserSettings u SET u.preferredCurrency = :currency WHERE u.userId = :userId")
    int updateCurrency(@Param("userId") String userId, @Param("currency") String currency);

    @Modifying
    @Transactional
    @Query("UPDATE UserSettings u SET u.theme = :theme WHERE u.userId = :userId")
    int updateTheme(@Param("userId") String userId, @Param("theme") String theme);
}