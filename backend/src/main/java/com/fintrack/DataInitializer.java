package com.fintrack;

import com.fintrack.model.Account;
import com.fintrack.model.User;
import com.fintrack.repository.AccountRepository;
import com.fintrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AccountRepository  accountRepository;
    private final UserRepository     userRepository;
    private final PasswordEncoder    passwordEncoder;   // BCrypt — same as AuthService

    @Override
    public void run(String... args) {
        try {
            log.info("=== DataInitializer Started ===");
            createSystemAccounts();
            createTestUser();
            log.info("=== Data Initialization Complete ===");
        } catch (Exception e) {
            log.error("Error during data initialization: {}", e.getMessage(), e);
        }
    }

    // ----------------------------------------------------------------
    // SYSTEM ACCOUNTS (userId = null — shared)
    // ----------------------------------------------------------------
    private void createSystemAccounts() {
        createSystemAccount("FNB Business Account", "1200", Account.AccountType.ASSET,     new BigDecimal("150000"));
        createSystemAccount("Trade Debtors",         "1100", Account.AccountType.ASSET,     new BigDecimal("25000"));
        createSystemAccount("Trade Creditors",        "2100", Account.AccountType.LIABILITY, BigDecimal.ZERO);
        createSystemAccount("SARS VAT Control",       "2200", Account.AccountType.LIABILITY, BigDecimal.ZERO);
        createSystemAccount("SARS PAYE Liability",    "2300", Account.AccountType.LIABILITY, BigDecimal.ZERO);
        createSystemAccount("SARS CIT Provision",     "2400", Account.AccountType.LIABILITY, BigDecimal.ZERO);
        createSystemAccount("Service Revenue",        "4000", Account.AccountType.REVENUE,   BigDecimal.ZERO);
        createSystemAccount("Operating Expenses",     "5100", Account.AccountType.EXPENSE,   BigDecimal.ZERO);
        createSystemAccount("Equity Capital",         "3000", Account.AccountType.EQUITY,    new BigDecimal("175000"));
    }

    private void createSystemAccount(String name, String code,
                                     Account.AccountType type, BigDecimal balance) {
        try {
            if (accountRepository.existsByCode(code)) return;

            Account account = Account.builder()
                    .id("sys-acc-" + code)
                    .name(name)
                    .code(code)
                    .type(type)
                    .balance(balance)
                    .normalBalance(type == Account.AccountType.ASSET
                            || type == Account.AccountType.EXPENSE
                            ? Account.NormalBalance.DEBIT
                            : Account.NormalBalance.CREDIT)
                    .userId(null)
                    .isActive(true)
                    .build();
            accountRepository.save(account);
            log.info("  Created system account: {} ({})", name, code);
        } catch (Exception e) {
            log.warn("  Skipped system account {}: {}", name, e.getMessage());
        }
    }

    // ----------------------------------------------------------------
    // TEST USER
    // ----------------------------------------------------------------
    private void createTestUser() {
        if (userRepository.existsByEmail("test@fintrack.pro")) return;

        User user = User.builder()
                .email("test@fintrack.pro")
                .passwordHash(passwordEncoder.encode("Test123!"))
                .firstName("Test")
                .lastName("User")
                .companyName("FinTrack Demo")
                .emailVerified(true)
                .role(User.UserRole.ADMIN)
                .defaultCurrency("ZAR")
                .build();

        user = userRepository.save(user);
        log.info("Test user created: test@fintrack.pro / Test123!");

        // Create user-specific accounts
        List<Account> existing = accountRepository.findAccountsByUserId(user.getId());
        if (existing.isEmpty()) {
            createUserAccount("Petty Cash",        "1010", Account.AccountType.ASSET,   BigDecimal.ZERO, user.getId());
            createUserAccount("Inventory",         "1300", Account.AccountType.ASSET,   BigDecimal.ZERO, user.getId());
            createUserAccount("Marketing Expense", "5200", Account.AccountType.EXPENSE, BigDecimal.ZERO, user.getId());
            createUserAccount("Salaries Expense",  "5300", Account.AccountType.EXPENSE, BigDecimal.ZERO, user.getId());
        }
    }

    private void createUserAccount(String name, String code,
                                   Account.AccountType type, BigDecimal balance, String userId) {
        try {
            if (accountRepository.existsByUserIdAndCode(userId, code)) return;

            Account account = Account.builder()
                    .id("acc-" + System.currentTimeMillis() + "-" + code)
                    .name(name)
                    .code(code)
                    .type(type)
                    .balance(balance)
                    .normalBalance(type == Account.AccountType.ASSET
                            || type == Account.AccountType.EXPENSE
                            ? Account.NormalBalance.DEBIT
                            : Account.NormalBalance.CREDIT)
                    .userId(userId)
                    .isActive(true)
                    .build();
            accountRepository.save(account);
            log.info("  Created user account: {} ({})", name, code);
        } catch (Exception e) {
            log.warn("  Skipped user account {}: {}", name, e.getMessage());
        }
    }
}
