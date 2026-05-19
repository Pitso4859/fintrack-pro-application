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

    // Global methods (ignore userId)
    @Query("SELECT t FROM Transaction t ORDER BY t.transactionDate DESC")
    List<Transaction> findAllTransactionsOrderByDateDesc();

    @Query("SELECT t FROM Transaction t WHERE t.transactionDate BETWEEN :start AND :end")
    List<Transaction> findByTransactionDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    Optional<Transaction> findById(String id);

    // Aggregation queries
    @Query("SELECT COALESCE(SUM(t.amount - t.vatAmount), 0) FROM Transaction t WHERE t.type = 'INVOICE'")
    BigDecimal getTotalRevenueExcludingVat();

    @Query("SELECT COALESCE(SUM(t.vatAmount), 0) FROM Transaction t WHERE t.type = 'INVOICE'")
    BigDecimal getTotalOutputVat();

    @Query("SELECT COALESCE(SUM(t.amount - t.vatAmount), 0) FROM Transaction t WHERE t.type = 'EXPENSE' AND t.isVatClaimed = true")
    BigDecimal getTotalExpensesExcludingVat();

    @Query("SELECT COALESCE(SUM(t.vatAmount), 0) FROM Transaction t WHERE t.type = 'EXPENSE' AND t.isVatClaimed = true")
    BigDecimal getTotalInputVat();

    @Query("SELECT COALESCE(SUM(t.vatAmount), 0) FROM Transaction t WHERE t.type = 'EXPENSE' AND t.isVatClaimed = false")
    BigDecimal getTotalUnclaimedVat();

    @Query("SELECT t.category, COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = :type GROUP BY t.category")
    List<Object[]> getCategoryBreakdown(@Param("type") String type);

    @Query(value = "SELECT DATE_TRUNC('month', transaction_date) as month, COALESCE(SUM(amount), 0) as total " +
            "FROM transactions WHERE type = :type " +
            "GROUP BY DATE_TRUNC('month', transaction_date) ORDER BY month DESC LIMIT 6", nativeQuery = true)
    List<Object[]> getMonthlyTrend(@Param("type") String type);
}