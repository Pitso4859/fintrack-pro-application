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
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Dashboard", description = "Dashboard summary statistics")
public class DashboardController {

    private final ReportService reportService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(reportService.getDashboardData(userId));
    }
}
