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

            // Create system accounts (userId = null) - these are shared across all users
            createSystemAccounts();

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

            // Create user-specific accounts if they don't exist
            createUserAccounts(user.getId());

            System.out.println("=== Data Initialization Complete ===");
            printAccountSummary();

        } catch (Exception e) {
            System.err.println("Error during data initialization: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createSystemAccounts() {
        System.out.println("Creating system accounts...");

        createSystemAccount("FNB Business Account", "1200", "Asset", new BigDecimal("150000"));
        createSystemAccount("Trade Debtors", "1100", "Asset", new BigDecimal("25000"));
        createSystemAccount("Trade Creditors", "2100", "Liability", BigDecimal.ZERO);
        createSystemAccount("SARS VAT Control", "2200", "Liability", BigDecimal.ZERO);
        createSystemAccount("SARS PAYE Liability", "2300", "Liability", BigDecimal.ZERO);
        createSystemAccount("SARS CIT Provision", "2400", "Liability", BigDecimal.ZERO);
        createSystemAccount("Service Revenue", "4000", "Revenue", BigDecimal.ZERO);
        createSystemAccount("Operating Expenses", "5100", "Expense", BigDecimal.ZERO);
        createSystemAccount("Equity Capital", "3000", "Equity", new BigDecimal("175000"));
    }

    private void createSystemAccount(String name, String code, String type, BigDecimal balance) {
        try {
            boolean exists = accountRepository.existsByCode(code);

            if (!exists) {
                Account account = new Account();
                account.setId("sys-acc-" + code);
                account.setName(name);
                account.setCode(code);
                account.setType(type);
                account.setBalance(balance);
                account.setUserId(null); // System account - shared
                account.setCreatedAt(LocalDateTime.now());
                accountRepository.save(account);
                System.out.println("  Created system account: " + name + " (" + code + ")");
            } else {
                System.out.println("  System account already exists: " + name + " (" + code + ")");
            }
        } catch (Exception e) {
            System.err.println("  Failed to create system account " + name + ": " + e.getMessage());
        }
    }

    private void createUserAccounts(String userId) {
        System.out.println("Creating user-specific accounts for: " + userId);

        // Check if user already has custom accounts
        List<Account> userAccounts = accountRepository.findAccountsByUserId(userId);
        if (!userAccounts.isEmpty()) {
            System.out.println("User accounts already exist (" + userAccounts.size() + " found).");
            return;
        }

        // Create user-specific accounts (these will override system accounts for this user)
        createUserAccount("Petty Cash", "1010", "Asset", BigDecimal.ZERO, userId);
        createUserAccount("Inventory", "1300", "Asset", BigDecimal.ZERO, userId);
        createUserAccount("Marketing Expense", "5200", "Expense", BigDecimal.ZERO, userId);
        createUserAccount("Salaries Expense", "5300", "Expense", BigDecimal.ZERO, userId);
    }

    private void createUserAccount(String name, String code, String type, BigDecimal balance, String userId) {
        try {
            boolean exists = accountRepository.existsByCodeAndUserId(code, userId);

            if (!exists) {
                Account account = new Account();
                account.setId("acc-" + System.currentTimeMillis() + "-" + code);
                account.setName(name);
                account.setCode(code);
                account.setType(type);
                account.setBalance(balance);
                account.setUserId(userId);
                account.setCreatedAt(LocalDateTime.now());
                accountRepository.save(account);
                System.out.println("  Created user account: " + name + " (" + code + ")");
            }
        } catch (Exception e) {
            System.err.println("  Failed to create user account " + name + ": " + e.getMessage());
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
                        ", User: " + (acc.getUserId() == null ? "SYSTEM" : acc.getUserId().substring(0, 8)) +
                        ", Balance: " + acc.getBalance());
            }
        } else {
            System.out.println("  No accounts found!");
        }
    }
}