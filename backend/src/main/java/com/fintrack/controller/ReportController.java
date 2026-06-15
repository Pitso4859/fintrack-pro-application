package com.fintrack.controller;

import com.fintrack.service.ReportService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Reports", description = "Financial reports — P&L, Balance Sheet, VAT 201")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/pnl")
    public ResponseEntity<?> getProfitAndLoss(
            @RequestParam(defaultValue = "2024") int year,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(reportService.getProfitAndLoss(userId, year));
    }

    @GetMapping("/balance-sheet")
    public ResponseEntity<?> getBalanceSheet(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(reportService.getBalanceSheet(userId));
    }

    @GetMapping("/vat201")
    public ResponseEntity<?> getVAT201(
            @RequestParam(defaultValue = "1") int quarter,
            @RequestParam(defaultValue = "2024") int year,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(reportService.getVAT201Report(userId, quarter, year));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(reportService.getDashboardData(userId));
    }
}
