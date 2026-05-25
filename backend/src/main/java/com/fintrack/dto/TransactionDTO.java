package com.fintrack.dto;

import com.fintrack.model.Transaction;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class TransactionDTO {

    private TransactionDTO() {}

    public record CreateRequest(
            @NotNull(message = "Transaction type is required")
            Transaction.TransactionType type,

            @NotNull(message = "Amount is required")
            @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
            BigDecimal amount,

            BigDecimal vatAmount,

            Boolean vatInclusive,

            @NotBlank(message = "Description is required")
            @Size(max = 500)
            String description,

            @Size(max = 100) String referenceNumber,
            @Size(max = 255) String supplierName,
            @Size(max = 255) String customerName,
            @Size(max = 50)  String accountId,
            @Size(max = 20)  String accountCode,
            @Size(max = 3)   String currency,

            LocalDate transactionDate,

            @Size(max = 1000) String notes
    ) {}

    public record UpdateRequest(
            @Size(max = 500) String description,
            @DecimalMin(value = "0.01") BigDecimal amount,
            BigDecimal vatAmount,
            Transaction.TransactionStatus status,
            LocalDate transactionDate,
            @Size(max = 1000) String notes
    ) {}

    public record FilterRequest(
            Transaction.TransactionType type,
            Transaction.TransactionStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            String search,
            int page,
            int size
    ) {
        public FilterRequest {
            if (page < 0) page = 0;
            if (size < 1 || size > 100) size = 20;
        }
    }

    public record DashboardSummary(
            java.math.BigDecimal totalRevenue,
            java.math.BigDecimal totalExpenses,
            java.math.BigDecimal netProfit,
            java.math.BigDecimal totalVat,
            LocalDate periodStart,
            LocalDate periodEnd
    ) {}
}
