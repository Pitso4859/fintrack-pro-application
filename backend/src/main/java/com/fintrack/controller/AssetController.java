package com.fintrack.controller;

import com.fintrack.model.Asset;
import com.fintrack.service.AssetService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Assets", description = "Fixed asset management")
public class AssetController {

    private final AssetService assetService;

    @GetMapping
    public ResponseEntity<?> getAllAssets(@AuthenticationPrincipal String userId) {
        List<Asset> assets = assetService.getAssetsByUser(userId);
        List<Map<String, Object>> response = new ArrayList<>();
        for (Asset asset : assets) response.add(convertAssetToMap(asset));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAssetById(@PathVariable String id,
                                          @AuthenticationPrincipal String userId) {
        try {
            return ResponseEntity.ok(convertAssetToMap(assetService.getAssetByIdAndUser(id, userId)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createAsset(@RequestBody Map<String, Object> request,
                                         @AuthenticationPrincipal String userId) {
        try {
            Asset asset = new Asset();
            asset.setId("asset-" + System.currentTimeMillis());
            asset.setUserId(userId);
            asset.setCreatedAt(LocalDateTime.now());

            if (!request.containsKey("name"))
                return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
            asset.setName((String) request.get("name"));

            asset.setCategory(getStr(request, "category", "category"));

            String pd = getStr(request, "purchase_date", "purchaseDate");
            if (pd != null) asset.setPurchaseDate(LocalDate.parse(pd));

            asset.setPurchasePrice(getBD(request, "purchase_price", "purchasePrice", BigDecimal.ZERO));
            asset.setSupplierName(getStr(request, "supplier_name", "supplierName"));
            asset.setStatus(getStr(request, "status", "status") != null ? getStr(request, "status", "status") : "ACTIVE");
            asset.setLocation(getStr(request, "location", "location"));
            asset.setSerialNumber(getStr(request, "serial_number", "serialNumber"));
            asset.setTransactionId(getStr(request, "transaction_id", "transactionId"));

            String we = getStr(request, "warranty_expiry", "warrantyExpiry");
            if (we != null && !we.isEmpty()) asset.setWarrantyExpiry(LocalDate.parse(we));

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(convertAssetToMap(assetService.createAsset(asset, userId)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAsset(@PathVariable String id,
                                         @RequestBody Map<String, Object> request,
                                         @AuthenticationPrincipal String userId) {
        try {
            Asset asset = assetService.getAssetByIdAndUser(id, userId);

            if (request.containsKey("name"))     asset.setName((String) request.get("name"));
            if (request.containsKey("category")) asset.setCategory((String) request.get("category"));
            if (request.containsKey("status"))   asset.setStatus((String) request.get("status"));
            if (request.containsKey("location")) asset.setLocation((String) request.get("location"));

            String pd = getStr(request, "purchase_date", "purchaseDate");
            if (pd != null && !pd.isEmpty()) asset.setPurchaseDate(LocalDate.parse(pd));

            BigDecimal pp = getBD(request, "purchase_price", "purchasePrice", null);
            if (pp != null) asset.setPurchasePrice(pp);

            String supplier = getStr(request, "supplier_name", "supplierName");
            if (supplier != null) asset.setSupplierName(supplier);

            String serial = getStr(request, "serial_number", "serialNumber");
            if (serial != null) asset.setSerialNumber(serial);

            return ResponseEntity.ok(convertAssetToMap(assetService.updateAsset(id, asset, userId)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAsset(@PathVariable String id,
                                         @AuthenticationPrincipal String userId) {
        try {
            assetService.deleteAsset(id, userId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // ---- helpers ----
    private String getStr(Map<String, Object> r, String snake, String camel) {
        if (r.containsKey(snake)) return (String) r.get(snake);
        if (r.containsKey(camel)) return (String) r.get(camel);
        return null;
    }

    private BigDecimal getBD(Map<String, Object> r, String snake, String camel, BigDecimal def) {
        Object v = r.containsKey(snake) ? r.get(snake) : r.get(camel);
        return v != null ? new BigDecimal(v.toString()) : def;
    }

    private Map<String, Object> convertAssetToMap(Asset asset) {
        Map<String, Object> map = new HashMap<>();
        map.put("id",              asset.getId());
        map.put("name",            asset.getName());
        map.put("category",        asset.getCategory());
        map.put("purchase_date",   asset.getPurchaseDate()    != null ? asset.getPurchaseDate().toString()    : null);
        map.put("purchase_price",  asset.getPurchasePrice());
        map.put("supplier_name",   asset.getSupplierName());
        map.put("status",          asset.getStatus());
        map.put("location",        asset.getLocation());
        map.put("serial_number",   asset.getSerialNumber());
        map.put("warranty_expiry", asset.getWarrantyExpiry()  != null ? asset.getWarrantyExpiry().toString()  : null);
        map.put("transaction_id",  asset.getTransactionId());
        map.put("document_data",   asset.getDocumentData());
        map.put("created_at",      asset.getCreatedAt()       != null ? asset.getCreatedAt().toString()       : null);
        map.put("user_id",         asset.getUserId());
        return map;
    }
}
