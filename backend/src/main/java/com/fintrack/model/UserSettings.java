package com.fintrack.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "user_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSettings {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Column(name = "preferred_currency")
    private String preferredCurrency = "ZAR";

    @Column(name = "date_format")
    private String dateFormat = "YYYY-MM-DD";

    @Column(name = "email_notifications")
    private Boolean emailNotifications = true;

    @Column(name = "two_factor_enabled")
    private Boolean twoFactorEnabled = false;

    private String theme = "light";
}