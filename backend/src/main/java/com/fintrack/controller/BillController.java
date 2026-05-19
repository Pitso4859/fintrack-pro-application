package com.fintrack.controller;

import com.fintrack.model.Bill;
import com.fintrack.model.User;
import com.fintrack.service.BillService;
import com.fintrack.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;
    private final AuthService authService;

    private User getAuthenticatedUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        return authService.validateToken(token);
    }

    // DTO for creating a bill from snake_case input
    public static class CreateBillRequest {
        public String supplier_name;
        public String invoice_number;
        public String invoice_date;
        public BigDecimal total_amount;
        public BigDecimal total_vat;
        public String currency;
        public String status;
        public String document_data;
        public BigDecimal deposit_required;
    }

    @GetMapping
    public ResponseEntity<?> getAllBills(@RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        List<Bill> bills = billService.getBillsByUser(user.getId());

        // Convert to snake_case response
        List<Map<String, Object>> response = new ArrayList<>();
        for (Bill bill : bills) {
            response.add(convertBillToMap(bill));
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending/count")
    public ResponseEntity<?> getPendingCount(@RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(Map.of("count", billService.getPendingCount(user.getId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBillById(@PathVariable String id, @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            Bill bill = billService.getBillByIdAndUser(id, user.getId());
            return ResponseEntity.ok(convertBillToMap(bill));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createBill(@RequestBody Map<String, Object> request,
                                        @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            Bill bill = new Bill();
            bill.setId("bill-" + System.currentTimeMillis());
            bill.setUserId(user.getId());
            bill.setCreatedAt(LocalDateTime.now());

            // Handle both camelCase and snake_case field names
            // Try snake_case first, then camelCase as fallback

            // Supplier Name
            if (request.containsKey("supplier_name")) {
                bill.setSupplierName((String) request.get("supplier_name"));
            } else if (request.containsKey("supplierName")) {
                bill.setSupplierName((String) request.get("supplierName"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "supplier_name is required"));
            }

            // Invoice Number
            if (request.containsKey("invoice_number")) {
                bill.setInvoiceNumber((String) request.get("invoice_number"));
            } else if (request.containsKey("invoiceNumber")) {
                bill.setInvoiceNumber((String) request.get("invoiceNumber"));
            }

            // Invoice Date
            if (request.containsKey("invoice_date")) {
                String dateStr = (String) request.get("invoice_date");
                bill.setInvoiceDate(LocalDate.parse(dateStr));
            } else if (request.containsKey("invoiceDate")) {
                String dateStr = (String) request.get("invoiceDate");
                bill.setInvoiceDate(LocalDate.parse(dateStr));
            } else {
                bill.setInvoiceDate(LocalDate.now());
            }

            // Total Amount
            if (request.containsKey("total_amount")) {
                bill.setTotalAmount(new BigDecimal(request.get("total_amount").toString()));
            } else if (request.containsKey("totalAmount")) {
                bill.setTotalAmount(new BigDecimal(request.get("totalAmount").toString()));
            } else {
                bill.setTotalAmount(BigDecimal.ZERO);
            }

            // Total VAT
            if (request.containsKey("total_vat")) {
                bill.setTotalVat(new BigDecimal(request.get("total_vat").toString()));
            } else if (request.containsKey("totalVat")) {
                bill.setTotalVat(new BigDecimal(request.get("totalVat").toString()));
            } else {
                bill.setTotalVat(BigDecimal.ZERO);
            }

            // Currency
            if (request.containsKey("currency")) {
                bill.setCurrency((String) request.get("currency"));
            } else {
                bill.setCurrency("ZAR");
            }

            // Status
            if (request.containsKey("status")) {
                bill.setStatus((String) request.get("status"));
            } else {
                bill.setStatus("PENDING");
            }

            // Document Data
            if (request.containsKey("document_data")) {
                bill.setDocumentData((String) request.get("document_data"));
            } else if (request.containsKey("documentData")) {
                bill.setDocumentData((String) request.get("documentData"));
            }

            // Deposit Required
            if (request.containsKey("deposit_required")) {
                bill.setDepositRequired(new BigDecimal(request.get("deposit_required").toString()));
            } else if (request.containsKey("depositRequired")) {
                bill.setDepositRequired(new BigDecimal(request.get("depositRequired").toString()));
            } else {
                bill.setDepositRequired(BigDecimal.ZERO);
            }

            Bill created = billService.createBill(bill, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(convertBillToMap(created));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBillStatus(@PathVariable String id,
                                              @RequestBody Map<String, String> body,
                                              @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String status = body.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "status field required"));
        }
        try {
            Bill updated = billService.updateBillStatus(id, status, user.getId());
            return ResponseEntity.ok(convertBillToMap(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBill(@PathVariable String id,
                                        @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            billService.deleteBill(id, user.getId());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // Helper method to convert Bill to snake_case Map
    private Map<String, Object> convertBillToMap(Bill bill) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", bill.getId());
        map.put("supplier_name", bill.getSupplierName());
        map.put("invoice_number", bill.getInvoiceNumber());
        map.put("invoice_date", bill.getInvoiceDate() != null ? bill.getInvoiceDate().toString() : null);
        map.put("total_amount", bill.getTotalAmount());
        map.put("total_vat", bill.getTotalVat());
        map.put("currency", bill.getCurrency());
        map.put("status", bill.getStatus());
        map.put("document_data", bill.getDocumentData());
        map.put("deposit_required", bill.getDepositRequired());
        map.put("created_at", bill.getCreatedAt() != null ? bill.getCreatedAt().toString() : null);
        map.put("user_id", bill.getUserId());
        return map;
    }
}