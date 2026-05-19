package com.fintrack.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {

    @Id
    private String id;

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "invoice_number")
    private String invoiceNumber;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "total_vat", precision = 15, scale = 2)
    private BigDecimal totalVat = BigDecimal.ZERO;

    private String currency = "ZAR";
    private String status = "PENDING";

    @Column(name = "document_data", columnDefinition = "TEXT")
    private String documentData;

    @Column(name = "deposit_required", precision = 15, scale = 2)
    private BigDecimal depositRequired = BigDecimal.ZERO;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "user_id")
    private String userId;

    @Transient
    private List<BillItem> lineItems = new ArrayList<>();
}