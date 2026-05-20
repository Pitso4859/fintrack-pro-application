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

    @Query("SELECT a FROM Account a WHERE a.userId = :userId OR a.userId IS NULL ORDER BY a.code")
    List<Account> findAccountsByUserId(@Param("userId") String userId);

    Optional<Account> findByIdAndUserId(String id, String userId);

    Optional<Account> findByCodeAndUserId(String code, String userId);

    boolean existsByCodeAndUserId(String code, String userId);

    @Query("SELECT a FROM Account a ORDER BY a.code")
    List<Account> findAllAccountsOrderByCode();

    Optional<Account> findById(String id);

    boolean existsByCode(String code);

    Optional<Account> findByCode(String code);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.type = 'Asset' AND (a.userId = :userId OR a.userId IS NULL)")
    BigDecimal getTotalAssets(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.type = 'Liability' AND (a.userId = :userId OR a.userId IS NULL)")
    BigDecimal getTotalLiabilities(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.type = 'Revenue' AND (a.userId = :userId OR a.userId IS NULL)")
    BigDecimal getTotalRevenue(@Param("userId") String userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.type = 'Expense' AND (a.userId = :userId OR a.userId IS NULL)")
    BigDecimal getTotalExpenses(@Param("userId") String userId);
}