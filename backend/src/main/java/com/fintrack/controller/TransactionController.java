package com.fintrack.controller;

import com.fintrack.model.Transaction;
import com.fintrack.model.User;
import com.fintrack.service.TransactionService;
import com.fintrack.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final AuthService authService;

    private User getAuthenticatedUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        return authService.validateToken(token);
    }

    @GetMapping
    public ResponseEntity<?> getAllTransactions(@RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            return ResponseEntity.ok(transactionService.getTransactionsByUser(user.getId()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTransactionById(@PathVariable String id, @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            return ResponseEntity.ok(transactionService.getTransactionByIdAndUser(id, user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createTransaction(@RequestBody Map<String, Object> request,
                                               @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            System.out.println("=== Create Transaction Request ===");
            System.out.println("Request body: " + request);

            // Extract fields from request (handle both camelCase and snake_case)
            String transactionDate = request.containsKey("transaction_date") ?
                    (String) request.get("transaction_date") : (String) request.get("date");
            String description = (String) request.get("description");

            BigDecimal amount = BigDecimal.ZERO;
            if (request.containsKey("amount")) {
                amount = new BigDecimal(request.get("amount").toString());
            }

            BigDecimal vatAmount = BigDecimal.ZERO;
            if (request.containsKey("vat_amount")) {
                vatAmount = new BigDecimal(request.get("vat_amount").toString());
            } else if (request.containsKey("vatAmount")) {
                vatAmount = new BigDecimal(request.get("vatAmount").toString());
            }

            BigDecimal vatRate = new BigDecimal("0.15");
            if (request.containsKey("vat_rate")) {
                vatRate = new BigDecimal(request.get("vat_rate").toString());
            } else if (request.containsKey("vatRate")) {
                vatRate = new BigDecimal(request.get("vatRate").toString());
            }

            String fromAccountId = null;
            if (request.containsKey("from_account_id")) {
                fromAccountId = (String) request.get("from_account_id");
            } else if (request.containsKey("fromAccount")) {
                fromAccountId = (String) request.get("fromAccount");
            } else if (request.containsKey("fromAccountId")) {
                fromAccountId = (String) request.get("fromAccountId");
            }

            String toAccountId = null;
            if (request.containsKey("to_account_id")) {
                toAccountId = (String) request.get("to_account_id");
            } else if (request.containsKey("toAccount")) {
                toAccountId = (String) request.get("toAccount");
            } else if (request.containsKey("toAccountId")) {
                toAccountId = (String) request.get("toAccountId");
            }

            String category = (String) request.get("category");
            String type = (String) request.get("type");

            Boolean isVatClaimed = false;
            if (request.containsKey("is_vat_claimed")) {
                isVatClaimed = (Boolean) request.get("is_vat_claimed");
            } else if (request.containsKey("isVatClaimed")) {
                isVatClaimed = (Boolean) request.get("isVatClaimed");
            }

            String billId = null;
            if (request.containsKey("bill_id")) {
                billId = (String) request.get("bill_id");
            } else if (request.containsKey("billId")) {
                billId = (String) request.get("billId");
            }

            Transaction transaction = new Transaction();
            transaction.setTransactionDate(LocalDate.parse(transactionDate));
            transaction.setDescription(description);
            transaction.setAmount(amount);
            transaction.setVatAmount(vatAmount);
            transaction.setVatRate(vatRate);
            transaction.setFromAccountId(fromAccountId);
            transaction.setToAccountId(toAccountId);
            transaction.setCategory(category);
            transaction.setType(type);
            transaction.setIsVatClaimed(isVatClaimed);
            transaction.setBillId(billId);

            Transaction created = transactionService.createTransaction(transaction, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTransactionVatClaim(@PathVariable String id,
                                                       @RequestBody Map<String, Object> body,
                                                       @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            Boolean isVatClaimed = null;
            if (body.containsKey("is_vat_claimed")) {
                isVatClaimed = (Boolean) body.get("is_vat_claimed");
            } else if (body.containsKey("isVatClaimed")) {
                isVatClaimed = (Boolean) body.get("isVatClaimed");
            }

            if (isVatClaimed == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "isVatClaimed field required"));
            }

            Transaction updated = transactionService.updateTransactionVatClaim(id, isVatClaimed, user.getId());
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable String id,
                                               @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            transactionService.deleteTransaction(id, user.getId());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}