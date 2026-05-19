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
        // Ignore userId - return all accounts
        List<Account> accounts = accountRepository.findAllAccountsOrderByCode();
        System.out.println("=== AccountService Debug ===");
        System.out.println("Returning " + (accounts != null ? accounts.size() : 0) + " accounts");
        if (accounts != null) {
            for (Account acc : accounts) {
                System.out.println("  - " + acc.getCode() + ": " + acc.getName() + " (" + acc.getType() + ") - Balance: " + acc.getBalance());
            }
        }
        return accounts;
    }

    public Account getAccountByIdAndUser(String id, String userId) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    @Transactional
    public Account createAccount(Account account, String userId) {
        // Check for duplicate code in all accounts
        List<Account> existingAccounts = accountRepository.findAllAccountsOrderByCode();
        boolean codeExists = existingAccounts.stream()
                .anyMatch(a -> a.getCode().equals(account.getCode()));

        if (codeExists) {
            throw new RuntimeException("Account code already exists");
        }

        account.setId("acc-" + System.currentTimeMillis());
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
        summary.put("assets", accountRepository.getTotalAssets());
        summary.put("liabilities", accountRepository.getTotalLiabilities());
        summary.put("revenue", accountRepository.getTotalRevenue());
        summary.put("expenses", accountRepository.getTotalExpenses());
        summary.put("equity", accountRepository.getTotalRevenue().subtract(accountRepository.getTotalExpenses()));
        return summary;
    }
}