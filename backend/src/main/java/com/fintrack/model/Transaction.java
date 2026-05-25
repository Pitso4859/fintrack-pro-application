package com.fintrack.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions", indexes = {
        @Index(name = "idx_tx_user",   columnList = "user_id"),
        @Index(name = "idx_tx_date",   columnList = "transaction_date"),
        @Index(name = "idx_tx_type",   columnList = "type"),
        @Index(name = "idx_tx_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TransactionType type;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "vat_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "net_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal netAmount;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "ZAR";

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "supplier_name", length = 255)
    private String supplierName;

    @Column(name = "customer_name", length = 255)
    private String customerName;

    @Column(name = "account_id", length = 50)
    private String accountId;

    @Column(name = "account_code", length = 20)
    private String accountCode;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.PENDING;

    @Column(name = "invoice_image_url", length = 512)
    private String invoiceImageUrl;

    @Column(name = "ai_processed", nullable = false)
    @Builder.Default
    private Boolean aiProcessed = false;

    @Column(name = "notes", length = 1000)
    private String notes;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum TransactionType {
        INVOICE, EXPENSE, TRANSFER, JOURNAL, CREDIT_NOTE, DEBIT_NOTE
    }

    public enum TransactionStatus {
        PENDING, APPROVED, REJECTED, RECONCILED
    }
}
