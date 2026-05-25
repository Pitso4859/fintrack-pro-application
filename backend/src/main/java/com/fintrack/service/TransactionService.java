package com.fintrack.service;

import com.fintrack.dto.TransactionDTO;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.model.Transaction;
import com.fintrack.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private static final BigDecimal VAT_RATE = new BigDecimal("0.15");

    private final TransactionRepository transactionRepository;

    // ----------------------------------------------------------------
    // LIST / SEARCH
    // ----------------------------------------------------------------

    public Page<Transaction> findByFilters(String userId, TransactionDTO.FilterRequest filter) {
        PageRequest pageable = PageRequest.of(
                filter.page(), filter.size(),
                Sort.by(Sort.Direction.DESC, "transactionDate"));

        return transactionRepository.findByFilters(
                userId,
                filter.type(),
                filter.status(),
                filter.fromDate(),
                filter.toDate(),
                filter.search(),
                pageable);
    }

    public List<Transaction> findAllByUser(String userId) {
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(userId);
    }

    // ----------------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------------

    @Transactional
    public Transaction create(String userId, TransactionDTO.CreateRequest req) {
        BigDecimal amount    = req.amount();
        BigDecimal vatAmount = req.vatAmount() != null
                ? req.vatAmount()
                : calculateVat(amount, req.vatInclusive());
        BigDecimal netAmount = amount.subtract(vatAmount).setScale(2, RoundingMode.HALF_UP);

        Transaction tx = Transaction.builder()
                .userId(userId)
                .type(req.type())
                .amount(amount.setScale(2, RoundingMode.HALF_UP))
                .vatAmount(vatAmount.setScale(2, RoundingMode.HALF_UP))
                .netAmount(netAmount)
                .currency(req.currency() != null ? req.currency() : "ZAR")
                .description(req.description())
                .referenceNumber(req.referenceNumber())
                .supplierName(req.supplierName())
                .customerName(req.customerName())
                .accountId(req.accountId())
                .accountCode(req.accountCode())
                .transactionDate(req.transactionDate() != null ? req.transactionDate() : LocalDate.now())
                .status(Transaction.TransactionStatus.PENDING)
                .notes(req.notes())
                .build();

        Transaction saved = transactionRepository.save(tx);
        log.info("Transaction created: {} for user {}", saved.getId(), userId);
        return saved;
    }

    // ----------------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------------

    @Transactional
    public Transaction update(String userId, String txId, TransactionDTO.UpdateRequest req) {
        Transaction tx = getOwnedOrThrow(userId, txId);

        if (req.description() != null) tx.setDescription(req.description());
        if (req.amount() != null) {
            BigDecimal vatAmount = req.vatAmount() != null
                    ? req.vatAmount()
                    : calculateVat(req.amount(), false);
            tx.setAmount(req.amount().setScale(2, RoundingMode.HALF_UP));
            tx.setVatAmount(vatAmount.setScale(2, RoundingMode.HALF_UP));
            tx.setNetAmount(req.amount().subtract(vatAmount).setScale(2, RoundingMode.HALF_UP));
        }
        if (req.status() != null) tx.setStatus(req.status());
        if (req.notes() != null)  tx.setNotes(req.notes());
        if (req.transactionDate() != null) tx.setTransactionDate(req.transactionDate());

        return transactionRepository.save(tx);
    }

    // ----------------------------------------------------------------
    // DELETE
    // ----------------------------------------------------------------

    @Transactional
    public void delete(String userId, String txId) {
        Transaction tx = getOwnedOrThrow(userId, txId);
        transactionRepository.delete(tx);
        log.info("Transaction deleted: {} by user {}", txId, userId);
    }

    // ----------------------------------------------------------------
    // DASHBOARD SUMMARY
    // ----------------------------------------------------------------

    public TransactionDTO.DashboardSummary getDashboardSummary(String userId) {
        LocalDate now   = LocalDate.now();
        LocalDate start = now.withDayOfMonth(1);
        LocalDate end   = now.withDayOfMonth(now.lengthOfMonth());

        BigDecimal revenue  = nullSafe(transactionRepository.sumRevenueByPeriod(userId, start, end));
        BigDecimal expenses = nullSafe(transactionRepository.sumExpensesByPeriod(userId, start, end));
        BigDecimal vat      = nullSafe(transactionRepository.sumVatByPeriod(userId, start, end));
        BigDecimal profit   = revenue.subtract(expenses).setScale(2, RoundingMode.HALF_UP);

        return new TransactionDTO.DashboardSummary(revenue, expenses, profit, vat, start, end);
    }

    // ----------------------------------------------------------------
    // PRIVATE HELPERS
    // ----------------------------------------------------------------

    private Transaction getOwnedOrThrow(String userId, String txId) {
        Transaction tx = transactionRepository.findById(txId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", txId));
        if (!tx.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Transaction", txId);
        }
        return tx;
    }

    private BigDecimal calculateVat(BigDecimal amount, Boolean vatInclusive) {
        if (Boolean.TRUE.equals(vatInclusive)) {
            // Extract VAT from VAT-inclusive amount: VAT = amount * 15/115
            return amount.multiply(VAT_RATE)
                    .divide(BigDecimal.ONE.add(VAT_RATE), 2, RoundingMode.HALF_UP);
        }
        // Amount is ex-VAT, add 15%
        return amount.multiply(VAT_RATE).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
