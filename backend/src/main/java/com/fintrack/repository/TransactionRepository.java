package com.fintrack.repository;

import com.fintrack.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    // User-specific methods
    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId ORDER BY t.transactionDate DESC")
    List<Transaction> findTransactionsByUserId(@Param("userId") String userId);

    Optional<Transaction> findByIdAndUserId(String id, String userId);

    List<Transaction> findByUserIdAndTransactionDateBetween(String userId, LocalDate start, LocalDate end);

    // Global methods (for system use only)
    @Query("SELECT t FROM Transaction t ORDER BY t.transactionDate DESC")
    List<Transaction> findAllTransactionsOrderByDateDesc();

    @Query("SELECT t FROM Transaction t WHERE t.transactionDate BETWEEN :start AND :end")
    List<Transaction> findByTransactionDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    Optional<Transaction> findById(String id);

    // User-specific aggregation queries
    @Query("SELECT COALESCE(SUM(t.amount - t.vatAmount), 0) FROM Transaction t WHERE t.type = 'INVOICE' AND t.userId = :userId")
    BigDecimal getTotalRevenueExcludingVat(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(t.vatAmount), 0) FROM Transaction t WHERE t.type = 'INVOICE' AND t.userId = :userId")
    BigDecimal getTotalOutputVat(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(t.amount - t.vatAmount), 0) FROM Transaction t WHERE t.type = 'EXPENSE' AND t.isVatClaimed = true AND t.userId = :userId")
    BigDecimal getTotalExpensesExcludingVat(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(t.vatAmount), 0) FROM Transaction t WHERE t.type = 'EXPENSE' AND t.isVatClaimed = true AND t.userId = :userId")
    BigDecimal getTotalInputVat(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(t.vatAmount), 0) FROM Transaction t WHERE t.type = 'EXPENSE' AND t.isVatClaimed = false AND t.userId = :userId AND t.vatAmount > 0")
    BigDecimal getTotalUnclaimedVat(@Param("userId") String userId);

    @Query("SELECT t.category, COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = :type AND t.userId = :userId GROUP BY t.category")
    List<Object[]> getCategoryBreakdown(@Param("type") String type, @Param("userId") String userId);

    @Query(value = "SELECT DATE_TRUNC('month', transaction_date) as month, COALESCE(SUM(amount), 0) as total " +
            "FROM transactions WHERE type = :type AND user_id = :userId " +
            "GROUP BY DATE_TRUNC('month', transaction_date) ORDER BY month DESC LIMIT 6", nativeQuery = true)
    List<Object[]> getMonthlyTrend(@Param("type") String type, @Param("userId") String userId);
}