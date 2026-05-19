package com.fintrack.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Asset {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    private String category;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "purchase_price", precision = 15, scale = 2)
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Column(name = "supplier_name")
    private String supplierName;

    @Column(name = "warranty_expiry")
    private LocalDate warrantyExpiry;

    @Column(name = "serial_number")
    private String serialNumber;

    private String location;
    private String status = "ACTIVE";

    @Column(name = "document_data", columnDefinition = "TEXT")
    private String documentData;

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "user_id")
    private String userId;
}