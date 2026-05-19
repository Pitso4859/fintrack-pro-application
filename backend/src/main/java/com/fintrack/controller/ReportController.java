package com.fintrack.controller;

import com.fintrack.model.User;
import com.fintrack.service.AuthService;
import com.fintrack.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final AuthService authService;

    private User getAuthenticatedUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        return authService.validateToken(token);
    }

    @GetMapping("/pnl")
    public ResponseEntity<?> getProfitAndLoss(@RequestParam(defaultValue = "2024") int year,
                                              @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(reportService.getProfitAndLoss(user.getId(), year));
    }

    @GetMapping("/balance-sheet")
    public ResponseEntity<?> getBalanceSheet(@RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(reportService.getBalanceSheet(user.getId()));
    }

    @GetMapping("/vat201")
    public ResponseEntity<?> getVAT201(@RequestParam(defaultValue = "1") int quarter,
                                       @RequestParam(defaultValue = "2024") int year,
                                       @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(reportService.getVAT201Report(user.getId(), quarter, year));
    }
}