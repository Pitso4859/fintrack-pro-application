package com.fintrack.service;

import com.fintrack.model.Account;
import com.fintrack.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    public List<Account> getAccountsByUser(String userId) {
        if (userId == null) {
            return accountRepository.findAllAccountsOrderByCode();
        }
        return accountRepository.findAccountsByUserId(userId);
    }

    public Account getAccountByIdAndUser(String id, String userId) {
        return accountRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    @Transactional
    public Account createAccount(Account account, String userId) {
        // Check for duplicate code for this user
        boolean codeExists = accountRepository.existsByCodeAndUserId(account.getCode(), userId);

        // Also check system accounts (userId null)
        if (!codeExists) {
            // Check if code exists in system accounts
            Account existingSystemAccount = accountRepository.findByCode(account.getCode()).orElse(null);
            if (existingSystemAccount != null && existingSystemAccount.getUserId() == null) {
                codeExists = true;
            }
        }

        if (codeExists) {
            throw new RuntimeException("Account code already exists");
        }

        account.setId("acc-" + System.currentTimeMillis());
        account.setUserId(userId);
        account.setCreatedAt(LocalDateTime.now());
        if (account.getBalance() == null) {
            account.setBalance(BigDecimal.ZERO);
        }
        return accountRepository.save(account);
    }

    @Transactional
    public Account updateAccount(String id, Account accountDetails, String userId) {
        Account account = getAccountByIdAndUser(id, userId);
        account.setName(accountDetails.getName());
        account.setCode(accountDetails.getCode());
        account.setType(accountDetails.getType());
        if (accountDetails.getBalance() != null) {
            account.setBalance(accountDetails.getBalance());
        }
        return accountRepository.save(account);
    }

    @Transactional
    public void deleteAccount(String id, String userId) {
        Account account = getAccountByIdAndUser(id, userId);
        accountRepository.delete(account);
    }

    public Map<String, BigDecimal> getBalanceSummary(String userId) {
        Map<String, BigDecimal> summary = new HashMap<>();
        summary.put("assets", accountRepository.getTotalAssets(userId));
        summary.put("liabilities", accountRepository.getTotalLiabilities(userId));
        summary.put("revenue", accountRepository.getTotalRevenue(userId));
        summary.put("expenses", accountRepository.getTotalExpenses(userId));
        summary.put("equity", accountRepository.getTotalRevenue(userId).subtract(accountRepository.getTotalExpenses(userId)));
        return summary;
    }
}