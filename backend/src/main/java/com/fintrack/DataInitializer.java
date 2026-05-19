package com.fintrack;

import com.fintrack.model.Account;
import com.fintrack.model.Transaction;
import com.fintrack.model.User;
import com.fintrack.repository.AccountRepository;
import com.fintrack.repository.TransactionRepository;
import com.fintrack.repository.UserRepository;
import com.fintrack.security.PasswordUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final PasswordUtil passwordUtil;

    @Override
    public void run(String... args) {
        try {
            System.out.println("=== DataInitializer Started ===");

            // Create test user if not exists
            User user = userRepository.findByEmail("test@fintrack.pro").orElse(null);

            if (user == null) {
                user = new User();
                user.setId("usr-" + System.currentTimeMillis());
                user.setEmail("test@fintrack.pro");
                user.setPasswordHash(passwordUtil.hashPassword("Test123!"));
                user.setFirstName("Test");
                user.setLastName("User");
                user.setCompanyName("FinTrack Demo");
                user.setEmailVerified(true);
                user.setCreatedAt(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                user = userRepository.save(user);
                System.out.println("Test user created: test@fintrack.pro / Test123!");
            } else {
                System.out.println("Using existing user: " + user.getEmail());
            }

            // Check if accounts already exist (using global method)
            List<Account> existingAccounts = accountRepository.findAllAccountsOrderByCode();

            if (existingAccounts.isEmpty()) {
                System.out.println("Creating sample accounts...");
                createAccountSafely("FNB Business Account", "1200", "Asset", new BigDecimal("150000"));
                createAccountSafely("Trade Debtors", "1100", "Asset", new BigDecimal("25000"));
                createAccountSafely("Trade Creditors", "2100", "Liability", BigDecimal.ZERO);
                createAccountSafely("SARS VAT Control", "2200", "Liability", BigDecimal.ZERO);
                createAccountSafely("SARS PAYE Liability", "2300", "Liability", BigDecimal.ZERO);
                createAccountSafely("SARS CIT Provision", "2400", "Liability", BigDecimal.ZERO);
                createAccountSafely("Service Revenue", "4000", "Revenue", BigDecimal.ZERO);
                createAccountSafely("Operating Expenses", "5100", "Expense", BigDecimal.ZERO);
                createAccountSafely("Equity Capital", "3000", "Equity", new BigDecimal("175000"));
                System.out.println("Sample accounts created!");
            } else {
                System.out.println("Accounts already exist (" + existingAccounts.size() + " found).");

                // Ensure required accounts exist for bill processing
                ensureAccountExists("Trade Creditors", "2100", "Liability", BigDecimal.ZERO);
                ensureAccountExists("Operating Expenses", "5100", "Expense", BigDecimal.ZERO);
            }

            // Create sample transaction if none exist
            List<Transaction> existingTransactions = transactionRepository.findAllTransactionsOrderByDateDesc();

            if (existingTransactions.isEmpty()) {
                System.out.println("Creating sample transaction...");

                Account equityAccount = accountRepository.findByCode("3000").orElse(null);
                Account assetAccount = accountRepository.findByCode("1200").orElse(null);

                if (equityAccount != null && assetAccount != null) {
                    Transaction tx = new Transaction();
                    tx.setId("tx-" + System.currentTimeMillis());
                    tx.setTransactionDate(LocalDate.of(2024, 1, 1));
                    tx.setDescription("Initial Business Capital");
                    tx.setAmount(new BigDecimal("175000"));
                    tx.setVatAmount(BigDecimal.ZERO);
                    tx.setVatRate(BigDecimal.ZERO);
                    tx.setFromAccountId(equityAccount.getId());
                    tx.setToAccountId(assetAccount.getId());
                    tx.setCategory("Capital");
                    tx.setType("JOURNAL");
                    tx.setIsVatClaimed(false);
                    tx.setCreatedAt(LocalDateTime.now());
                    transactionRepository.save(tx);
                    System.out.println("Sample transaction created!");
                } else {
                    System.out.println("Could not find required accounts for sample transaction");
                }
            } else {
                System.out.println("Transactions already exist (" + existingTransactions.size() + " found).");
            }

            System.out.println("=== Data Initialization Complete ===");
            printAccountSummary();

        } catch (Exception e) {
            System.err.println("Error during data initialization: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createAccountSafely(String name, String code, String type, BigDecimal balance) {
        try {
            // Check if account with this code already exists (global check)
            boolean exists = accountRepository.existsByCode(code);

            if (!exists) {
                Account account = new Account();
                account.setId("acc-" + System.currentTimeMillis() + "-" + code);
                account.setName(name);
                account.setCode(code);
                account.setType(type);
                account.setBalance(balance);
                account.setCreatedAt(LocalDateTime.now());
                accountRepository.save(account);
                System.out.println("  Created: " + name + " (" + code + ") - Balance: " + balance);
            } else {
                System.out.println("  Already exists: " + name + " (" + code + ")");
            }
        } catch (Exception e) {
            System.err.println("  Failed to create account " + name + ": " + e.getMessage());
        }
    }

    private void ensureAccountExists(String name, String code, String type, BigDecimal balance) {
        try {
            boolean exists = accountRepository.existsByCode(code);

            if (!exists) {
                Account account = new Account();
                account.setId("acc-" + System.currentTimeMillis() + "-" + code);
                account.setName(name);
                account.setCode(code);
                account.setType(type);
                account.setBalance(balance);
                account.setCreatedAt(LocalDateTime.now());
                accountRepository.save(account);
                System.out.println("Created missing account: " + name + " (" + code + ")");
            } else {
                System.out.println("Account already exists: " + name + " (" + code + ")");
            }
        } catch (Exception e) {
            System.err.println("Failed to ensure account " + name + ": " + e.getMessage());
        }
    }

    private void printAccountSummary() {
        System.out.println("=== Account Summary ===");
        List<Account> accounts = accountRepository.findAllAccountsOrderByCode();
        if (accounts != null && !accounts.isEmpty()) {
            for (Account acc : accounts) {
                System.out.println("  Code: " + acc.getCode() +
                        ", Name: " + acc.getName() +
                        ", Type: " + acc.getType() +
                        ", Balance: " + acc.getBalance());
            }
        } else {
            System.out.println("  No accounts found!");
        }
    }
}