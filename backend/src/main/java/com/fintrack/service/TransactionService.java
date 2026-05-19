package com.fintrack.service;

import com.fintrack.model.Account;
import com.fintrack.model.Transaction;
import com.fintrack.repository.AccountRepository;
import com.fintrack.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public List<Transaction> getTransactionsByUser(String userId) {
        return transactionRepository.findAllTransactionsOrderByDateDesc();
    }

    public Transaction getTransactionByIdAndUser(String id, String userId) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    @Transactional
    public Transaction createTransaction(Transaction transaction, String userId) {
        System.out.println("=== TransactionService Debug ===");
        System.out.println("Creating transaction: " + transaction.getDescription());
        System.out.println("From Account ID: " + transaction.getFromAccountId());
        System.out.println("To Account ID: " + transaction.getToAccountId());
        System.out.println("Amount: " + transaction.getAmount());

        transaction.setId("tx-" + System.currentTimeMillis());
        transaction.setUserId(userId);
        transaction.setCreatedAt(LocalDateTime.now());

        // Validate and update account balances
        if (transaction.getFromAccountId() != null && !transaction.getFromAccountId().isEmpty()) {
            Account fromAccount = accountRepository.findById(transaction.getFromAccountId()).orElse(null);
            if (fromAccount == null) {
                String error = "From account not found: " + transaction.getFromAccountId();
                System.err.println(error);
                throw new RuntimeException(error);
            }
            System.out.println("From account found: " + fromAccount.getCode() + " - " + fromAccount.getName());
            System.out.println("From account current balance: " + fromAccount.getBalance());

            // Update balance (credit - subtract)
            BigDecimal newBalance = fromAccount.getBalance().subtract(transaction.getAmount());
            fromAccount.setBalance(newBalance);
            accountRepository.save(fromAccount);
            System.out.println("Updated from account balance to: " + newBalance);
        }

        if (transaction.getToAccountId() != null && !transaction.getToAccountId().isEmpty()) {
            Account toAccount = accountRepository.findById(transaction.getToAccountId()).orElse(null);
            if (toAccount == null) {
                String error = "To account not found: " + transaction.getToAccountId();
                System.err.println(error);
                throw new RuntimeException(error);
            }
            System.out.println("To account found: " + toAccount.getCode() + " - " + toAccount.getName());
            System.out.println("To account current balance: " + toAccount.getBalance());

            // Update balance (debit - add)
            BigDecimal newBalance = toAccount.getBalance().add(transaction.getAmount());
            toAccount.setBalance(newBalance);
            accountRepository.save(toAccount);
            System.out.println("Updated to account balance to: " + newBalance);
        }

        Transaction saved = transactionRepository.save(transaction);
        System.out.println("Transaction saved successfully with ID: " + saved.getId());

        return saved;
    }

    @Transactional
    public Transaction updateTransactionVatClaim(String id, Boolean isVatClaimed, String userId) {
        Transaction transaction = getTransactionByIdAndUser(id, userId);
        transaction.setIsVatClaimed(isVatClaimed);
        return transactionRepository.save(transaction);
    }

    public void deleteTransaction(String id, String userId) {
        Transaction transaction = getTransactionByIdAndUser(id, userId);
        reverseAccountBalances(transaction);
        transactionRepository.delete(transaction);
    }

    private void reverseAccountBalances(Transaction transaction) {
        if (transaction.getFromAccountId() != null && !transaction.getFromAccountId().isEmpty()) {
            Account fromAccount = accountRepository.findById(transaction.getFromAccountId()).orElse(null);
            if (fromAccount != null) {
                fromAccount.setBalance(fromAccount.getBalance().add(transaction.getAmount()));
                accountRepository.save(fromAccount);
            }
        }

        if (transaction.getToAccountId() != null && !transaction.getToAccountId().isEmpty()) {
            Account toAccount = accountRepository.findById(transaction.getToAccountId()).orElse(null);
            if (toAccount != null) {
                toAccount.setBalance(toAccount.getBalance().subtract(transaction.getAmount()));
                accountRepository.save(toAccount);
            }
        }
    }
}