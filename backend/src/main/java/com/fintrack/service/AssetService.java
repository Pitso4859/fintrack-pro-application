package com.fintrack.service;

import com.fintrack.model.Asset;
import com.fintrack.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;

    public List<Asset> getAssetsByUser(String userId) {
        return assetRepository.findByUserIdOrderByPurchaseDateDesc(userId);
    }

    public Asset getAssetByIdAndUser(String id, String userId) {
        return assetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
    }

    @Transactional
    public Asset createAsset(Asset asset, String userId) {
        asset.setId("asset-" + System.currentTimeMillis());
        asset.setUserId(userId);
        asset.setCreatedAt(LocalDateTime.now());
        return assetRepository.save(asset);
    }

    @Transactional
    public Asset updateAsset(String id, Asset assetDetails, String userId) {
        Asset asset = getAssetByIdAndUser(id, userId);
        asset.setName(assetDetails.getName());
        asset.setCategory(assetDetails.getCategory());
        asset.setPurchaseDate(assetDetails.getPurchaseDate());
        asset.setPurchasePrice(assetDetails.getPurchasePrice());
        asset.setSupplierName(assetDetails.getSupplierName());
        asset.setStatus(assetDetails.getStatus());
        asset.setLocation(assetDetails.getLocation());
        asset.setSerialNumber(assetDetails.getSerialNumber());
        asset.setWarrantyExpiry(assetDetails.getWarrantyExpiry());
        asset.setTransactionId(assetDetails.getTransactionId());
        return assetRepository.save(asset);
    }

    @Transactional
    public void deleteAsset(String id, String userId) {
        Asset asset = getAssetByIdAndUser(id, userId);
        assetRepository.delete(asset);
    }
}