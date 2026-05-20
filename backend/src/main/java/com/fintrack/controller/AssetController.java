package com.fintrack.controller;

import com.fintrack.model.Asset;
import com.fintrack.model.User;
import com.fintrack.service.AssetService;
import com.fintrack.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.Map;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;
    private final AuthService authService;

    private User getAuthenticatedUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        return authService.validateToken(token);
    }

    @GetMapping
    public ResponseEntity<?> getAllAssets(@RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        List<Asset> assets = assetService.getAssetsByUser(user.getId());

        // Convert to snake_case response
        List<Map<String, Object>> response = new ArrayList<>();
        for (Asset asset : assets) {
            response.add(convertAssetToMap(asset));
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAssetById(@PathVariable String id, @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            Asset asset = assetService.getAssetByIdAndUser(id, user.getId());
            return ResponseEntity.ok(convertAssetToMap(asset));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createAsset(@RequestBody Map<String, Object> request,
                                         @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            System.out.println("=== Create Asset Request ===");
            System.out.println("Request body: " + request);

            Asset asset = new Asset();
            asset.setId("asset-" + System.currentTimeMillis());
            asset.setUserId(user.getId());
            asset.setCreatedAt(java.time.LocalDateTime.now());

            // Extract fields from request (handle snake_case)
            if (request.containsKey("name")) {
                asset.setName((String) request.get("name"));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
            }

            if (request.containsKey("category")) {
                asset.setCategory((String) request.get("category"));
            }

            if (request.containsKey("purchase_date")) {
                String dateStr = (String) request.get("purchase_date");
                asset.setPurchaseDate(LocalDate.parse(dateStr));
            } else if (request.containsKey("purchaseDate")) {
                String dateStr = (String) request.get("purchaseDate");
                asset.setPurchaseDate(LocalDate.parse(dateStr));
            }

            if (request.containsKey("purchase_price")) {
                asset.setPurchasePrice(new BigDecimal(request.get("purchase_price").toString()));
            } else if (request.containsKey("purchasePrice")) {
                asset.setPurchasePrice(new BigDecimal(request.get("purchasePrice").toString()));
            } else {
                asset.setPurchasePrice(BigDecimal.ZERO);
            }

            if (request.containsKey("supplier_name")) {
                asset.setSupplierName((String) request.get("supplier_name"));
            } else if (request.containsKey("supplierName")) {
                asset.setSupplierName((String) request.get("supplierName"));
            }

            if (request.containsKey("status")) {
                asset.setStatus((String) request.get("status"));
            } else {
                asset.setStatus("ACTIVE");
            }

            if (request.containsKey("location")) {
                asset.setLocation((String) request.get("location"));
            }

            if (request.containsKey("serial_number")) {
                asset.setSerialNumber((String) request.get("serial_number"));
            } else if (request.containsKey("serialNumber")) {
                asset.setSerialNumber((String) request.get("serialNumber"));
            }

            if (request.containsKey("warranty_expiry")) {
                String expiryStr = (String) request.get("warranty_expiry");
                if (expiryStr != null && !expiryStr.isEmpty()) {
                    asset.setWarrantyExpiry(LocalDate.parse(expiryStr));
                }
            } else if (request.containsKey("warrantyExpiry")) {
                String expiryStr = (String) request.get("warrantyExpiry");
                if (expiryStr != null && !expiryStr.isEmpty()) {
                    asset.setWarrantyExpiry(LocalDate.parse(expiryStr));
                }
            }

            if (request.containsKey("transaction_id")) {
                asset.setTransactionId((String) request.get("transaction_id"));
            } else if (request.containsKey("transactionId")) {
                asset.setTransactionId((String) request.get("transactionId"));
            }

            Asset created = assetService.createAsset(asset, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(convertAssetToMap(created));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAsset(@PathVariable String id,
                                         @RequestBody Map<String, Object> request,
                                         @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        try {
            Asset asset = assetService.getAssetByIdAndUser(id, user.getId());

            if (request.containsKey("name")) {
                asset.setName((String) request.get("name"));
            }
            if (request.containsKey("category")) {
                asset.setCategory((String) request.get("category"));
            }
            if (request.containsKey("purchase_date") || request.containsKey("purchaseDate")) {
                String dateStr = request.containsKey("purchase_date") ?
                        (String) request.get("purchase_date") : (String) request.get("purchaseDate");
                if (dateStr != null && !dateStr.isEmpty()) {
                    asset.setPurchaseDate(LocalDate.parse(dateStr));
                }
            }
            if (request.containsKey("purchase_price") || request.containsKey("purchasePrice")) {
                BigDecimal price = request.containsKey("purchase_price") ?
                        new BigDecimal(request.get("purchase_price").toString()) :
                        new BigDecimal(request.get("purchasePrice").toString());
                asset.setPurchasePrice(price);
            }
            if (request.containsKey("supplier_name") || request.containsKey("supplierName")) {
                String supplier = request.containsKey("supplier_name") ?
                        (String) request.get("supplier_name") : (String) request.get("supplierName");
                asset.setSupplierName(supplier);
            }
            if (request.containsKey("status")) {
                asset.setStatus((String) request.get("status"));
            }
            if (request.containsKey("location")) {
                asset.setLocation((String) request.get("location"));
            }
            if (request.containsKey("serial_number") || request.containsKey("serialNumber")) {
                String serial = request.containsKey("serial_number") ?
                        (String) request.get("serial_number") : (String) request.get("serialNumber");
                asset.setSerialNumber(serial);
            }

            Asset updated = assetService.updateAsset(id, asset, user.getId());
            return ResponseEntity.ok(convertAssetToMap(updated));

        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAsset(@PathVariable String id,
                                         @RequestHeader("Authorization") String authHeader) {
        User user = getAuthenticatedUser(authHeader);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            assetService.deleteAsset(id, user.getId());
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // Helper method to convert Asset to snake_case Map
    private Map<String, Object> convertAssetToMap(Asset asset) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", asset.getId());
        map.put("name", asset.getName());
        map.put("category", asset.getCategory());
        map.put("purchase_date", asset.getPurchaseDate() != null ? asset.getPurchaseDate().toString() : null);
        map.put("purchase_price", asset.getPurchasePrice());
        map.put("supplier_name", asset.getSupplierName());
        map.put("status", asset.getStatus());
        map.put("location", asset.getLocation());
        map.put("serial_number", asset.getSerialNumber());
        map.put("warranty_expiry", asset.getWarrantyExpiry() != null ? asset.getWarrantyExpiry().toString() : null);
        map.put("transaction_id", asset.getTransactionId());
        map.put("document_data", asset.getDocumentData());
        map.put("created_at", asset.getCreatedAt() != null ? asset.getCreatedAt().toString() : null);
        map.put("user_id", asset.getUserId());
        return map;
    }
}