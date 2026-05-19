package com.fintrack.repository;

import com.fintrack.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends JpaRepository<Asset, String> {
    List<Asset> findByUserIdOrderByPurchaseDateDesc(String userId);
    List<Asset> findByUserIdAndStatus(String userId, String status);
    Optional<Asset> findByIdAndUserId(String id, String userId);

    @Query("SELECT COALESCE(SUM(a.purchasePrice), 0) FROM Asset a WHERE a.userId = :userId")
    BigDecimal getTotalAssetValue(@Param("userId") String userId);

    @Query("SELECT a.category, COALESCE(SUM(a.purchasePrice), 0) FROM Asset a WHERE a.userId = :userId GROUP BY a.category")
    List<Object[]> getAssetValueByCategory(@Param("userId") String userId);
}