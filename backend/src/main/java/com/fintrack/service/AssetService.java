package com.fintrack.service;

import com.fintrack.model.Asset;
import com.fintrack.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
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

    public Asset createAsset(Asset asset, String userId) {
        asset.setId("asset-" + System.currentTimeMillis());
        asset.setUserId(userId);
        return assetRepository.save(asset);
    }

    public Asset updateAsset(String id, Asset assetDetails, String userId) {
        Asset asset = getAssetByIdAndUser(id, userId);
        asset.setName(assetDetails.getName());
        asset.setCategory(assetDetails.getCategory());
        asset.setPurchaseDate(assetDetails.getPurchaseDate());
        asset.setPurchasePrice(assetDetails.getPurchasePrice());
        asset.setSupplierName(assetDetails.getSupplierName());
        asset.setStatus(assetDetails.getStatus());
        return assetRepository.save(asset);
    }

    public void deleteAsset(String id, String userId) {
        Asset asset = getAssetByIdAndUser(id, userId);
        assetRepository.delete(asset);
    }
}