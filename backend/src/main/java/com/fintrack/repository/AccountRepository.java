package com.fintrack.repository;

import com.fintrack.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    @Query("SELECT a FROM Account a ORDER BY a.code")
    List<Account> findAllAccountsOrderByCode();

    Optional<Account> findById(String id);

    boolean existsByCode(String code);

    Optional<Account> findByCode(String code);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.type = 'Asset'")
    BigDecimal getTotalAssets();

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.type = 'Liability'")
    BigDecimal getTotalLiabilities();

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.type = 'Revenue'")
    BigDecimal getTotalRevenue();

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.type = 'Expense'")
    BigDecimal getTotalExpenses();
}