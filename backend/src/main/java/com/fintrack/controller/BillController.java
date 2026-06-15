package com.fintrack.controller;

import com.fintrack.model.Bill;
import com.fintrack.service.BillService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Bills", description = "Invoice / bill management")
public class BillController {

    private final BillService billService;

    @GetMapping
    public ResponseEntity<?> getAllBills(@AuthenticationPrincipal String userId) {
        List<Bill> bills = billService.getBillsByUser(userId);
        List<Map<String, Object>> response = new ArrayList<>();
        for (Bill bill : bills) response.add(convertBillToMap(bill));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending/count")
    public ResponseEntity<?> getPendingCount(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(Map.of("count", billService.getPendingCount(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBillById(@PathVariable String id,
                                         @AuthenticationPrincipal String userId) {
        try {
            return ResponseEntity.ok(convertBillToMap(billService.getBillByIdAndUser(id, userId)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createBill(@RequestBody Map<String, Object> request,
                                        @AuthenticationPrincipal String userId) {
        try {
            Bill bill = new Bill();
            bill.setId("bill-" + System.currentTimeMillis());
            bill.setUserId(userId);
            bill.setCreatedAt(LocalDateTime.now());

            String supplierName = getStr(request, "supplier_name", "supplierName");
            if (supplierName == null) return ResponseEntity.badRequest().body(Map.of("error", "supplier_name is required"));
            bill.setSupplierName(supplierName);

            bill.setInvoiceNumber(getStr(request, "invoice_number", "invoiceNumber"));

            String dateStr = getStr(request, "invoice_date", "invoiceDate");
            bill.setInvoiceDate(dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now());

            bill.setTotalAmount(getBigDecimal(request, "total_amount", "totalAmount", BigDecimal.ZERO));
            bill.setTotalVat(getBigDecimal(request, "total_vat", "totalVat", BigDecimal.ZERO));
            bill.setCurrency(getStr(request, "currency", "currency") != null ? getStr(request, "currency", "currency") : "ZAR");
            bill.setStatus(getStr(request, "status", "status") != null ? getStr(request, "status", "status") : "PENDING");
            bill.setDocumentData(getStr(request, "document_data", "documentData"));
            bill.setDepositRequired(getBigDecimal(request, "deposit_required", "depositRequired", BigDecimal.ZERO));

            return ResponseEntity.status(HttpStatus.CREATED).body(convertBillToMap(billService.createBill(bill, userId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBillStatus(@PathVariable String id,
                                              @RequestBody Map<String, String> body,
                                              @AuthenticationPrincipal String userId) {
        String status = body.get("status");
        if (status == null) return ResponseEntity.badRequest().body(Map.of("error", "status field required"));
        try {
            return ResponseEntity.ok(convertBillToMap(billService.updateBillStatus(id, status, userId)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBill(@PathVariable String id,
                                        @AuthenticationPrincipal String userId) {
        try {
            billService.deleteBill(id, userId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    private String getStr(Map<String, Object> r, String snake, String camel) {
        if (r.containsKey(snake)) return (String) r.get(snake);
        if (r.containsKey(camel)) return (String) r.get(camel);
        return null;
    }

    private BigDecimal getBigDecimal(Map<String, Object> r, String snake, String camel, BigDecimal def) {
        Object v = r.containsKey(snake) ? r.get(snake) : r.get(camel);
        return v != null ? new BigDecimal(v.toString()) : def;
    }

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
