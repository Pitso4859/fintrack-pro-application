package com.fintrack.service;

import com.fintrack.dto.ReportDTO;
import com.fintrack.model.Transaction;
import com.fintrack.repository.AccountRepository;
import com.fintrack.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public Map<String, Object> getDashboardData(String userId) {
        Map<String, Object> data = new HashMap<>();

        BigDecimal cashBalance = accountRepository.getTotalAssets(userId);
        BigDecimal totalRevenue = accountRepository.getTotalRevenue(userId);
        BigDecimal totalExpenses = accountRepository.getTotalExpenses(userId);
        BigDecimal netProfit = totalRevenue.subtract(totalExpenses);
        BigDecimal outputVat = transactionRepository.getTotalOutputVat(userId);
        BigDecimal inputVat = transactionRepository.getTotalInputVat(userId);
        BigDecimal vatLiability = outputVat.subtract(inputVat);

        data.put("cashBalance", cashBalance != null ? cashBalance : BigDecimal.ZERO);
        data.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        data.put("totalExpenses", totalExpenses != null ? totalExpenses : BigDecimal.ZERO);
        data.put("netProfit", netProfit);
        data.put("vatLiability", vatLiability != null ? vatLiability : BigDecimal.ZERO);

        // Add more dashboard data
        data.put("outputVat", outputVat != null ? outputVat : BigDecimal.ZERO);
        data.put("inputVat", inputVat != null ? inputVat : BigDecimal.ZERO);
        data.put("unclaimedVat", transactionRepository.getTotalUnclaimedVat(userId));

        return data;
    }

    public ReportDTO getProfitAndLoss(String userId, int year) {
        ReportDTO report = new ReportDTO();

        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = LocalDate.of(year, 12, 31);

        BigDecimal revenue = transactionRepository.getTotalRevenueExcludingVat(userId);
        BigDecimal expenses = transactionRepository.getTotalExpensesExcludingVat(userId);

        if (revenue == null) revenue = BigDecimal.ZERO;
        if (expenses == null) expenses = BigDecimal.ZERO;

        report.setTotalRevenue(revenue);
        report.setTotalExpenses(expenses);
        report.setNetProfit(revenue.subtract(expenses));

        // Get category breakdowns
        List<Object[]> revenueByCat = transactionRepository.getCategoryBreakdown("INVOICE", userId);
        Map<String, BigDecimal> revenueMap = new HashMap<>();
        if (revenueByCat != null) {
            for (Object[] row : revenueByCat) {
                revenueMap.put((String) row[0], (BigDecimal) row[1]);
            }
        }
        report.setRevenueByCategory(revenueMap);

        List<Object[]> expensesByCat = transactionRepository.getCategoryBreakdown("EXPENSE", userId);
        Map<String, BigDecimal> expensesMap = new HashMap<>();
        if (expensesByCat != null) {
            for (Object[] row : expensesByCat) {
                expensesMap.put((String) row[0], (BigDecimal) row[1]);
            }
        }
        report.setExpensesByCategory(expensesMap);

        // VAT calculations
        BigDecimal outputVat = transactionRepository.getTotalOutputVat(userId);
        BigDecimal inputVat = transactionRepository.getTotalInputVat(userId);

        report.setOutputVat(outputVat != null ? outputVat : BigDecimal.ZERO);
        report.setInputVat(inputVat != null ? inputVat : BigDecimal.ZERO);
        report.setNetVatPayable(report.getOutputVat().subtract(report.getInputVat()));

        return report;
    }

    public Map<String, Object> getBalanceSheet(String userId) {
        Map<String, Object> balanceSheet = new HashMap<>();

        BigDecimal assets = accountRepository.getTotalAssets(userId);
        BigDecimal liabilities = accountRepository.getTotalLiabilities(userId);
        BigDecimal revenue = accountRepository.getTotalRevenue(userId);
        BigDecimal expenses = accountRepository.getTotalExpenses(userId);

        balanceSheet.put("assets", assets != null ? assets : BigDecimal.ZERO);
        balanceSheet.put("liabilities", liabilities != null ? liabilities : BigDecimal.ZERO);

        BigDecimal equity = (revenue != null ? revenue : BigDecimal.ZERO)
                .subtract(expenses != null ? expenses : BigDecimal.ZERO);
        balanceSheet.put("equity", equity);

        BigDecimal totalLiabilitiesAndEquity = (liabilities != null ? liabilities : BigDecimal.ZERO).add(equity);
        balanceSheet.put("totalLiabilitiesAndEquity", totalLiabilitiesAndEquity);

        return balanceSheet;
    }

    public Map<String, Object> getVAT201Report(String userId, int quarter, int year) {
        Map<String, Object> report = new HashMap<>();

        // Calculate quarter dates
        LocalDate startDate = LocalDate.of(year, (quarter - 1) * 3 + 1, 1);
        LocalDate endDate = startDate.plusMonths(3).minusDays(1);

        // Get transactions for the quarter for this user
        List<Transaction> transactions = transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateAsc(userId, startDate, endDate);

        BigDecimal standardRateSales = BigDecimal.ZERO;
        BigDecimal outputVat = BigDecimal.ZERO;
        BigDecimal standardRatePurchases = BigDecimal.ZERO;
        BigDecimal inputVat = BigDecimal.ZERO;

        if (transactions != null) {
            for (Transaction tx : transactions) {
                if (tx == null) continue;

                if (Transaction.TransactionType.INVOICE.equals(tx.getType())) {
                    BigDecimal amountExclVat = tx.getAmount().subtract(tx.getVatAmount());
                    if (amountExclVat != null) {
                        standardRateSales = standardRateSales.add(amountExclVat);
                    }
                    if (tx.getVatAmount() != null) {
                        outputVat = outputVat.add(tx.getVatAmount());
                    }
                } else if (Transaction.TransactionType.EXPENSE.equals(tx.getType()) && tx.getVatAmount() != null && tx.getVatAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                    BigDecimal amountExclVat = tx.getAmount().subtract(tx.getVatAmount());
                    if (amountExclVat != null) {
                        standardRatePurchases = standardRatePurchases.add(amountExclVat);
                    }
                    if (tx.getVatAmount() != null) {
                        inputVat = inputVat.add(tx.getVatAmount());
                    }
                }
            }
        }

        report.put("period", "Q" + quarter + " " + year);
        report.put("standardRateSales", standardRateSales);
        report.put("outputVat", outputVat);
        report.put("standardRatePurchases", standardRatePurchases);
        report.put("inputVat", inputVat);
        report.put("netVatPayable", outputVat.subtract(inputVat));

        return report;
    }
}