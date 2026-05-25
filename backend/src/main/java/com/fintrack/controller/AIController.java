package com.fintrack.controller;

import com.fintrack.service.GeminiAIService;
import com.fintrack.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "AI Insights", description = "Gemini AI-powered financial analysis")
public class AIController {

    private final GeminiAIService geminiAIService;
    private final TransactionService transactionService;

    @PostMapping("/analyze")
    @Operation(summary = "Analyse financial data and return AI insights")
    public ResponseEntity<Map<String, String>> analyze(
            @AuthenticationPrincipal String userId,
            @RequestBody Map<String, String> body) {

        String query = body.getOrDefault("query", "Give me an overview of my finances");
        var transactions = transactionService.findAllByUser(userId);
        String result = geminiAIService.analyzeFinances(transactions, query);
        return ResponseEntity.ok(Map.of("result", result));
    }

    @PostMapping("/process-invoice")
    @Operation(summary = "Extract structured data from an invoice image using Gemini Vision")
    public ResponseEntity<Map<String, Object>> processInvoice(
            @RequestBody Map<String, String> body) {

        String base64Image = body.get("base64Image");
        if (base64Image == null || base64Image.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "base64Image is required"));
        }
        return ResponseEntity.ok(geminiAIService.extractInvoiceData(base64Image));
    }

    @PostMapping("/suggest-account")
    @Operation(summary = "Suggest chart-of-account details for an account name")
    public ResponseEntity<Map<String, Object>> suggestAccount(
            @RequestBody Map<String, @NotBlank String> body) {

        String accountName = body.get("accountName");
        if (accountName == null || accountName.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "accountName is required"));
        }
        return ResponseEntity.ok(geminiAIService.suggestAccountDetails(accountName));
    }
}
