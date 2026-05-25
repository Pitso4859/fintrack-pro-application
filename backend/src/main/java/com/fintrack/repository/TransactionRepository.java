package com.fintrack.repository;

import com.fintrack.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    Page<Transaction> findByUserIdOrderByTransactionDateDesc(String userId, Pageable pageable);

    List<Transaction> findByUserIdOrderByTransactionDateDesc(String userId);

    @Query("""
        SELECT t FROM Transaction t
        WHERE t.userId = :userId
          AND (:type IS NULL OR t.type = :type)
          AND (:status IS NULL OR t.status = :status)
          AND (:fromDate IS NULL OR t.transactionDate >= :fromDate)
          AND (:toDate IS NULL OR t.transactionDate <= :toDate)
          AND (:search IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(t.supplierName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(t.referenceNumber) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY t.transactionDate DESC
        """)
    Page<Transaction> findByFilters(
            @Param("userId") String userId,
            @Param("type") Transaction.TransactionType type,
            @Param("status") Transaction.TransactionStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("search") String search,
            Pageable pageable);

    @Query("""
        SELECT SUM(t.amount) FROM Transaction t
        WHERE t.userId = :userId
          AND t.type = 'INVOICE'
          AND t.transactionDate BETWEEN :from AND :to
        """)
    BigDecimal sumRevenueByPeriod(@Param("userId") String userId,
                                  @Param("from") LocalDate from,
                                  @Param("to") LocalDate to);

    @Query("""
        SELECT SUM(t.amount) FROM Transaction t
        WHERE t.userId = :userId
          AND t.type = 'EXPENSE'
          AND t.transactionDate BETWEEN :from AND :to
        """)
    BigDecimal sumExpensesByPeriod(@Param("userId") String userId,
                                   @Param("from") LocalDate from,
                                   @Param("to") LocalDate to);

    @Query("""
        SELECT SUM(t.vatAmount) FROM Transaction t
        WHERE t.userId = :userId
          AND t.transactionDate BETWEEN :from AND :to
        """)
    BigDecimal sumVatByPeriod(@Param("userId") String userId,
                              @Param("from") LocalDate from,
                              @Param("to") LocalDate to);

    List<Transaction> findByUserIdAndTransactionDateBetweenOrderByTransactionDateAsc(
            String userId, LocalDate from, LocalDate to);
}
