package com.fintrack.controller;

import com.fintrack.dto.TransactionDTO;
import com.fintrack.model.Transaction;
import com.fintrack.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Transactions", description = "Financial transaction management")
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    @Operation(summary = "List transactions with optional filters and pagination")
    public ResponseEntity<Page<Transaction>> list(
            @AuthenticationPrincipal String userId,
            @RequestParam(required = false) Transaction.TransactionType type,
            @RequestParam(required = false) Transaction.TransactionStatus status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        var filter = new TransactionDTO.FilterRequest(
                type, status, fromDate, toDate, search, page, size);
        return ResponseEntity.ok(transactionService.findByFilters(userId, filter));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new transaction")
    public ResponseEntity<Transaction> create(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody TransactionDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionService.create(userId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing transaction")
    public ResponseEntity<Transaction> update(
            @AuthenticationPrincipal String userId,
            @PathVariable String id,
            @Valid @RequestBody TransactionDTO.UpdateRequest request) {
        return ResponseEntity.ok(transactionService.update(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a transaction")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal String userId,
            @PathVariable String id) {
        transactionService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    @Operation(summary = "Get dashboard summary (current month)")
    public ResponseEntity<TransactionDTO.DashboardSummary> summary(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(transactionService.getDashboardSummary(userId));
    }
}
