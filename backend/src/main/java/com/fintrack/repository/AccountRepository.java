package com.fintrack.repository;

import com.fintrack.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    List<Account> findByUserIdAndIsActiveTrueOrderByCodeAsc(String userId);

    List<Account> findByUserIdAndTypeOrderByCodeAsc(String userId, Account.AccountType type);

    Optional<Account> findByUserIdAndCode(String userId, String code);

    boolean existsByUserIdAndCode(String userId, String code);

    // Used by DataInitializer
    boolean existsByCode(String code);

    @Query("SELECT a FROM Account a WHERE a.userId = :userId OR a.userId IS NULL ORDER BY a.code ASC")
    List<Account> findAccountsByUserId(@Param("userId") String userId);

    @Query("SELECT a FROM Account a ORDER BY a.code ASC")
    List<Account> findAllAccountsOrderByCode();

    // Used by ReportService
    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.userId = :userId AND a.type = 'ASSET' AND a.isActive = true")
    BigDecimal getTotalAssets(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.userId = :userId AND a.type = 'LIABILITY' AND a.isActive = true")
    BigDecimal getTotalLiabilities(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.userId = :userId AND a.type = 'REVENUE' AND a.isActive = true")
    BigDecimal getTotalRevenue(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.userId = :userId AND a.type = 'EXPENSE' AND a.isActive = true")
    BigDecimal getTotalExpenses(@Param("userId") String userId);
}
