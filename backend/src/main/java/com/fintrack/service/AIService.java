package com.fintrack.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.model.Account;
import com.fintrack.model.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.*;

@Slf4j
@Service
public class AIService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    public String analyzeFinances(List<Transaction> transactions, List<Account> accounts, String query) {
        // Calculate metrics from actual data
        double totalRevenue = 0;
        double totalExpenses = 0;
        double totalAssets = 0;
        double totalLiabilities = 0;

        for (Account acc : accounts) {
            double balance = acc.getBalance() != null ? acc.getBalance().doubleValue() : 0;
            if ("Revenue".equals(acc.getType())) totalRevenue += balance;
            else if ("Expense".equals(acc.getType())) totalExpenses += balance;
            else if ("Asset".equals(acc.getType())) totalAssets += balance;
            else if ("Liability".equals(acc.getType())) totalLiabilities += balance;
        }

        double netProfit = totalRevenue - totalExpenses;
        double profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        // VAT calculations
        double outputVat = 0;
        double inputVat = 0;
        for (Transaction tx : transactions) {
            double vat = tx.getVatAmount() != null ? tx.getVatAmount().doubleValue() : 0;
            if ("INVOICE".equals(tx.getType())) outputVat += vat;
            else if ("EXPENSE".equals(tx.getType()) && Boolean.TRUE.equals(tx.getIsVatClaimed())) inputVat += vat;
        }

        double netVat = outputVat - inputVat;

        String lowerQuery = (query != null ? query.toLowerCase() : "");

        if (lowerQuery.contains("tax")) {
            return String.format("""
                📋 **TAX OPTIMIZATION ANALYSIS**
                
                **Current VAT Position**
                • Output VAT Collected: R%.2f
                • Input VAT Claimable: R%.2f  
                • Net VAT %s: R%.2f
                
                **Recommendations:**
                1. Review all expense transactions for unclaimed VAT
                2. Ensure valid tax invoices for all claimed VAT
                3. File VAT201 returns by the 25th of each month
                """, outputVat, inputVat, netVat >= 0 ? "PAYABLE" : "REFUNDABLE", Math.abs(netVat));
        }

        if (lowerQuery.contains("burn")) {
            double monthlyAvg = totalExpenses / Math.max(1, transactions.size() > 0 ? 12 : 1);
            return String.format("""
                🔥 **BURN RATE FORECAST**
                
                **Current Metrics**
                • Monthly Expenses: R%.2f
                • Annual Expenses: R%.2f
                
                **Recommendations:**
                1. Monitor cash flow weekly
                2. Build 3-6 months reserve
                3. Review fixed costs
                """, monthlyAvg, totalExpenses);
        }

        if (lowerQuery.contains("unusual")) {
            return """
                🔍 **UNUSUAL TRANSACTIONS ANALYSIS**
                
                **Review Required For:**
                • Transactions > R10,000
                • Weekend transactions
                • Transactions to new suppliers
                
                **Recommendations:**
                1. Implement approval for large transactions
                2. Regular reconciliation
                3. Set up alerts for suspicious activity
                """;
        }

        // Full audit response
        return String.format("""
            📊 **FINANCIAL HEALTH ASSESSMENT**
            
            **Executive Summary**
            Your financial position shows %s performance with a net profit of R%.2f
            
            **Key Metrics**
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            • Revenue: R%.2f
            • Expenses: R%.2f
            • Net Profit: R%.2f
            • Profit Margin: %.1f%%
            • Assets: R%.2f
            • Liabilities: R%.2f
            
            **VAT Position**
            • Net VAT: R%.2f
            
            **Recommendations**
            1. Review expenses for cost optimization
            2. Ensure timely VAT submissions
            3. Prepare for provisional tax payments
            4. Regular financial reviews recommended
            
            ---
            *Powered by FinTrack Pro AI*
            """,
                netProfit >= 0 ? "POSITIVE" : "NEGATIVE",
                Math.abs(netProfit),
                totalRevenue, totalExpenses, netProfit, profitMargin,
                totalAssets, totalLiabilities,
                Math.abs(netVat)
        );
    }

    public Map<String, Object> suggestAccountDetails(String accountName) {
        Map<String, Object> suggestion = new HashMap<>();
        suggestion.put("code", generateAccountCode(accountName));
        suggestion.put("type", determineAccountType(accountName));
        suggestion.put("reasoning", "Based on standard SA accounting practices for '" + accountName + "'");
        return suggestion;
    }

    private String generateAccountCode(String accountName) {
        String lower = accountName.toLowerCase();
        if (lower.contains("bank") || lower.contains("cash")) return "1200";
        if (lower.contains("debtor")) return "1100";
        if (lower.contains("revenue") || lower.contains("sales")) return "4000";
        if (lower.contains("expense") || lower.contains("cost")) return "5100";
        if (lower.contains("vat") || lower.contains("tax")) return "2200";
        if (lower.contains("equity") || lower.contains("capital")) return "3000";
        if (lower.contains("creditor")) return "2100";
        return "5000";
    }

    private String determineAccountType(String accountName) {
        String lower = accountName.toLowerCase();
        if (lower.contains("bank") || lower.contains("cash")) return "Asset";
        if (lower.contains("debtor")) return "Asset";
        if (lower.contains("revenue") || lower.contains("sales")) return "Revenue";
        if (lower.contains("expense") || lower.contains("cost")) return "Expense";
        if (lower.contains("vat") || lower.contains("tax") || lower.contains("creditor")) return "Liability";
        if (lower.contains("equity") || lower.contains("capital")) return "Equity";
        return "Expense";
    }
}