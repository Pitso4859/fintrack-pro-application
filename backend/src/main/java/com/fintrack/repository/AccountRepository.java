package com.fintrack.repository;

import com.fintrack.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, String> {

    List<Account> findByUserIdAndIsActiveTrueOrderByCodeAsc(String userId);

    List<Account> findByUserIdAndTypeOrderByCodeAsc(String userId, Account.AccountType type);

    Optional<Account> findByUserIdAndCode(String userId, String code);

    boolean existsByUserIdAndCode(String userId, String code);
}
