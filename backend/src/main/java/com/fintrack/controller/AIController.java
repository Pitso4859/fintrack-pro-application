package com.fintrack.controller;

import com.fintrack.model.User;
import com.fintrack.service.AIService;
import com.fintrack.service.AuthService;
import com.fintrack.service.TransactionService;
import com.fintrack.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.*;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;
    private final AuthService authService;
    private final TransactionService transactionService;
    private final AccountService accountService;

    private User getAuthenticatedUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        return authService.validateToken(token);
    }

    @PostMapping("/analyze")
    public ResponseEntity<Map<String, String>> analyzeFinances(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String query = request.get("query");
        var transactions = transactionService.getTransactionsByUser(user.getId());
        var accounts = accountService.getAccountsByUser(user.getId());

        String result = aiService.analyzeFinances(transactions, accounts, query);
        return ResponseEntity.ok(Map.of("result", result));
    }

    @PostMapping("/suggest-account")
    public ResponseEntity<Map<String, Object>> suggestAccount(@RequestBody Map<String, String> request) {
        String accountName = request.get("accountName");
        Map<String, Object> suggestion = aiService.suggestAccountDetails(accountName);

        if (suggestion == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Could not generate suggestion");
            return ResponseEntity.ok(error);
        }
        return ResponseEntity.ok(suggestion);
    }

    @PostMapping("/process-invoice")
    public ResponseEntity<Map<String, Object>> processInvoice(@RequestBody Map<String, String> request) {
        String base64Image = request.get("base64Image");

        if (base64Image == null || base64Image.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "No image provided");
            return ResponseEntity.badRequest().body(error);
        }

        // For now, return mock data - later integrate with actual Gemini Vision API
        Map<String, Object> response = new HashMap<>();
        response.put("supplierName", "ABC Suppliers");
        response.put("invoiceNumber", "INV-" + System.currentTimeMillis());
        response.put("date", LocalDate.now().toString());
        response.put("currency", "ZAR");
        response.put("totalAmount", 1500.00);
        response.put("totalVat", 195.65);
        response.put("depositRequired", 0);

        List<Map<String, Object>> lineItems = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("description", "Office Supplies");
        item.put("quantity", 10);
        item.put("unitPrice", 130.43);
        item.put("total", 1304.30);
        item.put("vatAmount", 195.65);
        lineItems.add(item);

        response.put("lineItems", lineItems);

        return ResponseEntity.ok(response);
    }
}