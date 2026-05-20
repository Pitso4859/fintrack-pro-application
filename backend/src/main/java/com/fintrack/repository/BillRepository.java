package com.fintrack.repository;

import com.fintrack.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, String> {

    List<Bill> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Bill> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);

    Optional<Bill> findByIdAndUserId(String id, String userId);

    long countByUserIdAndStatus(String userId, String status);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.userId = :userId AND b.status = 'PENDING'")
    BigDecimal getTotalPendingAmount(@Param("userId") String userId);

    @Query("SELECT b.supplierName, COUNT(b) FROM Bill b WHERE b.userId = :userId GROUP BY b.supplierName ORDER BY COUNT(b) DESC")
    List<Object[]> getTopSuppliers(@Param("userId") String userId);
}