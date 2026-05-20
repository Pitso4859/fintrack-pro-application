package com.fintrack.service;

import com.fintrack.model.Account;
import com.fintrack.model.Transaction;
import com.fintrack.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.DecimalFormat;
import java.time.Duration;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    private final TransactionRepository transactionRepository;

    @Value("${gemini.api.key:}")
    private String apiKey;

    private static final DecimalFormat DF = new DecimalFormat("#,##0.00");
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(60))
            .build();

    // ============================================================
    // INVOICE EXTRACTION METHODS
    // ============================================================

    /**
     * Extract invoice data using Gemini Vision API
     */
    public Map<String, Object> extractInvoiceData(String base64Image) {
        Map<String, Object> result = new HashMap<>();

        if (apiKey == null || apiKey.isEmpty()) {
            log.error("Gemini API key not configured");
            result.put("error", "API key not configured");
            return result;
        }

        try {
            // Remove data URL prefix if present
            String imageData = base64Image;
            if (base64Image.contains(",")) {
                imageData = base64Image.substring(base64Image.indexOf(",") + 1);
            }

            String prompt = """
                You are an expert invoice data extraction system. Analyze this invoice image and extract the following information.
                Return ONLY valid JSON, no other text. Use this exact format:
                
                {
                    "supplierName": "the name of the supplier/company",
                    "invoiceNumber": "the invoice number",
                    "date": "invoice date in YYYY-MM-DD format",
                    "totalAmount": number (total amount due including tax),
                    "totalVat": number (VAT/tax amount, if not visible calculate approximately 15%% of total),
                    "currency": "3-letter currency code (ZAR, USD, EUR, etc.)",
                    "lineItems": [
                        {
                            "description": "item description",
                            "quantity": number,
                            "unitPrice": number,
                            "total": number,
                            "vatAmount": number
                        }
                    ]
                }
                
                Rules:
                - Extract numbers exactly as they appear
                - If quantity is not shown, assume 1
                - If unit price is not shown, calculate from total/quantity
                - If totalAmount is visible, use that exact value
                - If currency symbol is $, use USD; if R or Rand, use ZAR; if €, use EUR
                - Be precise with decimal places (2 decimals)
                """;

            String requestBody = String.format("""
                {
                    "contents": [{
                        "parts": [
                            {"text": "%s"},
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": "%s"
                                }
                            }
                        ]
                    }],
                    "generationConfig": {
                        "temperature": 0.1,
                        "topP": 0.95,
                        "topK": 40,
                        "maxOutputTokens": 8192
                    }
                }
                """, escapeJson(prompt), imageData);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(90))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            log.info("Calling Gemini Vision API for invoice extraction...");
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String responseBody = response.body();
                log.info("Gemini API response received");
                return parseGeminiResponse(responseBody);
            } else {
                log.error("Gemini API error: {} - {}", response.statusCode(), response.body());
                result.put("error", "Gemini API error: " + response.statusCode());
                return result;
            }

        } catch (Exception e) {
            log.error("Error calling Gemini Vision API: {}", e.getMessage(), e);
            result.put("error", "Failed to process invoice: " + e.getMessage());
            return result;
        }
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private Map<String, Object> parseGeminiResponse(String responseBody) {
        Map<String, Object> result = new HashMap<>();

        try {
            String jsonStr = extractJsonFromResponse(responseBody);

            if (jsonStr == null || jsonStr.isEmpty()) {
                log.error("Could not extract JSON from response");
                return getDefaultInvoiceData();
            }

            log.info("Extracted JSON: {}", jsonStr);

            result.put("supplierName", extractStringValue(jsonStr, "supplierName"));
            result.put("invoiceNumber", extractStringValue(jsonStr, "invoiceNumber"));
            result.put("date", extractStringValue(jsonStr, "date"));
            result.put("totalAmount", extractDoubleValue(jsonStr, "totalAmount"));
            result.put("totalVat", extractDoubleValue(jsonStr, "totalVat"));
            result.put("currency", extractStringValue(jsonStr, "currency"));
            result.put("lineItems", extractLineItems(jsonStr));
            result.put("depositRequired", 0);

            // Validate and set defaults
            if (result.get("supplierName") == null || result.get("supplierName").toString().isEmpty()) {
                result.put("supplierName", "Unknown Supplier");
            }
            if (result.get("invoiceNumber") == null || result.get("invoiceNumber").toString().isEmpty()) {
                result.put("invoiceNumber", "INV-" + System.currentTimeMillis());
            }
            if (result.get("date") == null || result.get("date").toString().isEmpty()) {
                result.put("date", LocalDate.now().toString());
            }
            if ((double) result.get("totalAmount") <= 0) {
                result.put("totalAmount", calculateTotalFromLineItems((List<Map<String, Object>>) result.get("lineItems")));
            }
            if (result.get("currency") == null || result.get("currency").toString().isEmpty()) {
                result.put("currency", "ZAR");
            }

            // Calculate VAT if not provided
            double totalAmount = (double) result.get("totalAmount");
            double totalVat = (double) result.get("totalVat");
            if (totalVat == 0 && totalAmount > 0) {
                totalVat = totalAmount * 0.15 / 1.15;
                result.put("totalVat", Math.round(totalVat * 100) / 100.0);
            }

            return result;

        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage(), e);
            return getDefaultInvoiceData();
        }
    }

    private String extractJsonFromResponse(String responseBody) {
        Pattern codeBlockPattern = Pattern.compile("```json\\s*(\\{.*?\\})\\s*```", Pattern.DOTALL);
        Matcher codeBlockMatcher = codeBlockPattern.matcher(responseBody);
        if (codeBlockMatcher.find()) {
            return codeBlockMatcher.group(1);
        }

        Pattern jsonPattern = Pattern.compile("\\{(?:[^{}]|(?:\\{(?:[^{}]|\\{[^{}]*\\})*\\}))*\\}", Pattern.DOTALL);
        Matcher jsonMatcher = jsonPattern.matcher(responseBody);
        if (jsonMatcher.find()) {
            return jsonMatcher.group();
        }

        return null;
    }

    private String extractStringValue(String json, String key) {
        Pattern pattern = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            String value = matcher.group(1);
            return value != null && !value.isEmpty() ? value : null;
        }
        return null;
    }

    private double extractDoubleValue(String json, String key) {
        Pattern pattern = Pattern.compile("\"" + key + "\"\\s*:\\s*(\\d+\\.?\\d*)");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            try {
                return Double.parseDouble(matcher.group(1));
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }

    private List<Map<String, Object>> extractLineItems(String json) {
        List<Map<String, Object>> items = new ArrayList<>();

        Pattern arrayPattern = Pattern.compile("\"lineItems\"\\s*:\\s*\\[(.*?)\\]", Pattern.DOTALL);
        Matcher arrayMatcher = arrayPattern.matcher(json);

        if (arrayMatcher.find()) {
            String itemsJson = arrayMatcher.group(1);
            Pattern itemPattern = Pattern.compile("\\{[^{}]*\\}");
            Matcher itemMatcher = itemPattern.matcher(itemsJson);

            while (itemMatcher.find()) {
                String itemJson = itemMatcher.group();
                Map<String, Object> item = new HashMap<>();

                String description = extractStringValue(itemJson, "description");
                item.put("description", description != null ? description : "");

                double quantity = extractDoubleValue(itemJson, "quantity");
                item.put("quantity", quantity > 0 ? quantity : 1);

                double unitPrice = extractDoubleValue(itemJson, "unitPrice");
                item.put("unitPrice", unitPrice);

                double total = extractDoubleValue(itemJson, "total");
                item.put("total", total);

                double vatAmount = extractDoubleValue(itemJson, "vatAmount");
                item.put("vatAmount", vatAmount);

                if (total == 0 && quantity > 0 && unitPrice > 0) {
                    total = quantity * unitPrice;
                    item.put("total", total);
                }

                items.add(item);
            }
        }

        if (items.isEmpty()) {
            double totalAmount = extractDoubleValue(json, "totalAmount");
            if (totalAmount > 0) {
                Map<String, Object> defaultItem = new HashMap<>();
                defaultItem.put("description", "Invoice Total");
                defaultItem.put("quantity", 1);
                defaultItem.put("unitPrice", totalAmount);
                defaultItem.put("total", totalAmount);
                defaultItem.put("vatAmount", extractDoubleValue(json, "totalVat"));
                items.add(defaultItem);
            }
        }

        return items;
    }

    private double calculateTotalFromLineItems(List<Map<String, Object>> lineItems) {
        double total = 0;
        for (Map<String, Object> item : lineItems) {
            Object totalObj = item.get("total");
            if (totalObj instanceof Number) {
                total += ((Number) totalObj).doubleValue();
            }
        }
        return total;
    }

    private Map<String, Object> getDefaultInvoiceData() {
        Map<String, Object> result = new HashMap<>();
        result.put("supplierName", "Unknown Supplier");
        result.put("invoiceNumber", "INV-" + System.currentTimeMillis());
        result.put("date", LocalDate.now().toString());
        result.put("totalAmount", 0.00);
        result.put("totalVat", 0.00);
        result.put("currency", "ZAR");
        result.put("depositRequired", 0);
        result.put("lineItems", new ArrayList<>());
        result.put("error", "Could not extract data, please enter manually");
        return result;
    }

    // ============================================================
    // FINANCIAL ANALYSIS METHODS
    // ============================================================

    public String analyzeFinances(List<Transaction> transactions, List<Account> accounts, String query) {
        // Calculate metrics from actual data
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal totalAssets = BigDecimal.ZERO;
        BigDecimal totalLiabilities = BigDecimal.ZERO;
        BigDecimal totalEquity = BigDecimal.ZERO;

        for (Account acc : accounts) {
            BigDecimal balance = acc.getBalance() != null ? acc.getBalance() : BigDecimal.ZERO;
            String type = acc.getType();

            if ("Revenue".equalsIgnoreCase(type)) {
                totalRevenue = totalRevenue.add(balance);
            } else if ("Expense".equalsIgnoreCase(type)) {
                totalExpenses = totalExpenses.add(balance);
            } else if ("Asset".equalsIgnoreCase(type)) {
                totalAssets = totalAssets.add(balance);
            } else if ("Liability".equalsIgnoreCase(type)) {
                totalLiabilities = totalLiabilities.add(balance);
            } else if ("Equity".equalsIgnoreCase(type)) {
                totalEquity = totalEquity.add(balance);
            }
        }

        BigDecimal netProfit = totalRevenue.subtract(totalExpenses);
        BigDecimal workingCapital = totalAssets.subtract(totalLiabilities);

        double profitMargin = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? netProfit.divide(totalRevenue, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).doubleValue()
                : 0;

        // VAT calculations from transactions
        BigDecimal outputVat = BigDecimal.ZERO;
        BigDecimal inputVat = BigDecimal.ZERO;
        BigDecimal unclaimedVat = BigDecimal.ZERO;

        for (Transaction tx : transactions) {
            BigDecimal vat = tx.getVatAmount() != null ? tx.getVatAmount() : BigDecimal.ZERO;
            if ("INVOICE".equals(tx.getType())) {
                outputVat = outputVat.add(vat);
            } else if ("EXPENSE".equals(tx.getType())) {
                if (Boolean.TRUE.equals(tx.getIsVatClaimed())) {
                    inputVat = inputVat.add(vat);
                } else if (vat.compareTo(BigDecimal.ZERO) > 0) {
                    unclaimedVat = unclaimedVat.add(vat);
                }
            }
        }

        BigDecimal netVat = outputVat.subtract(inputVat);
        String vatStatus = netVat.compareTo(BigDecimal.ZERO) >= 0 ? "PAYABLE" : "REFUNDABLE";

        // Calculate monthly burn rate
        Set<String> monthsWithTransactions = new HashSet<>();
        for (Transaction tx : transactions) {
            if (tx.getTransactionDate() != null) {
                monthsWithTransactions.add(tx.getTransactionDate().getYear() + "-" + tx.getTransactionDate().getMonthValue());
            }
        }
        int monthsToUse = Math.max(monthsWithTransactions.size(), 1);
        BigDecimal monthlyBurn = totalExpenses.divide(new BigDecimal(monthsToUse), 2, RoundingMode.HALF_UP);
        BigDecimal runwayMonths = monthlyBurn.compareTo(BigDecimal.ZERO) > 0 && totalAssets.compareTo(BigDecimal.ZERO) > 0
                ? totalAssets.divide(monthlyBurn, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        String lowerQuery = (query != null ? query.toLowerCase() : "");

        // Handle specific queries
        if (lowerQuery.contains("tax") || lowerQuery.contains("vat")) {
            return String.format("""
                **TAX OPTIMIZATION ANALYSIS**
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                
                **CURRENT VAT POSITION**
                
                • Output VAT Collected: **R%s**
                • Input VAT Claimable: **R%s**
                • Unclaimed VAT Available: **R%s**
                • Net VAT %s: **R%s**
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                
                **RECOMMENDATIONS**
                
                1. Review all expense transactions for unclaimed VAT opportunities
                2. Ensure valid tax invoices are obtained for all claimed VAT
                3. File VAT201 returns by the 25th of each month to avoid penalties
                4. Maintain digital copies of all tax invoices for minimum 5 years
                5. Consider appointing a tax practitioner for complex VAT matters
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                """,
                    formatCurrency(outputVat),
                    formatCurrency(inputVat),
                    formatCurrency(unclaimedVat),
                    vatStatus,
                    formatCurrency(Math.abs(netVat.doubleValue())));
        }

        if (lowerQuery.contains("burn") || lowerQuery.contains("runway") || lowerQuery.contains("forecast")) {
            return String.format("""
                **BURN RATE AND RUNWAY FORECAST**
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                
                **CURRENT METRICS**
                
                • Monthly Operating Expenses: **R%s**
                • Annual Operating Expenses: **R%s**
                • Estimated Runway: **%s months**
                
                **FINANCIAL POSITION**
                
                • Total Assets: **R%s**
                • Total Liabilities: **R%s**
                • Working Capital: **R%s**
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                
                **RECOMMENDATIONS**
                
                1. Monitor cash flow weekly and establish automated alerts
                2. Maintain 3-6 months of operating reserves
                3. Review fixed costs quarterly for potential reduction opportunities
                4. Consider invoice financing if runway falls below 3 months
                5. Develop a contingency plan for revenue shortfalls
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                """,
                    formatCurrency(monthlyBurn),
                    formatCurrency(totalExpenses),
                    formatCurrency(runwayMonths),
                    formatCurrency(totalAssets),
                    formatCurrency(totalLiabilities),
                    formatCurrency(workingCapital));
        }

        if (lowerQuery.contains("unusual") || lowerQuery.contains("suspicious") || lowerQuery.contains("anomaly")) {
            return String.format("""
                **UNUSUAL TRANSACTIONS ANALYSIS**
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                
                **REVIEW REQUIREMENTS**
                
                • Transactions exceeding R10,000 (high-value threshold)
                • Weekend and after-hours transactions
                • Transactions involving new or unverified suppliers
                • Round-number transactions (R5,000, R10,000, R50,000)
                • Duplicate invoice numbers or amounts
                
                **INTERNAL CONTROL RECOMMENDATIONS**
                
                1. Implement dual approval for all transactions exceeding R10,000
                2. Perform weekly bank statement reconciliation
                3. Configure automated alerts for suspicious activity patterns
                4. Conduct monthly surprise audits on high-risk accounts
                5. Enforce separation of duties for payment processing
                
                **RED FLAG INDICATORS**
                
                • Frequent transactions just below approval thresholds
                • Multiple payments to same vendor from different accounts
                • Invoices with missing or incomplete vendor details
                • Payments made to personal accounts
                • Unexplained adjustments or reversals
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                """);
        }

        if (lowerQuery.contains("profit") || lowerQuery.contains("margin") || lowerQuery.contains("income")) {
            return String.format("""
                **PROFITABILITY ANALYSIS**
                
                ═══════════════════════════════════════════════════════════════
                
                **INCOME STATEMENT SUMMARY**
                
                ───────────────────────────────────────────────────────────────
                
                Revenue: **R%s**
                Expenses: **R%s**
                Net Profit: **R%s**
                Profit Margin: **%.1f%%**
                
                ───────────────────────────────────────────────────────────────
                
                **REVENUE SOURCES**
                %s
                
                **EXPENSE CATEGORIES**
                %s
                
                **INDUSTRY BENCHMARKING**
                
                Your Margin: **%.1f%%**
                SME Average: 15-25%%
                Top Performers: 30%%+
                
                ═══════════════════════════════════════════════════════════════
                
                **ACTION ITEMS**
                
                1. Review pricing strategy and adjust if margin below 20%%
                2. Negotiate better payment terms with suppliers
                3. Automate manual processes to reduce operating costs
                4. Explore value-added services to increase revenue
                5. Conduct competitive analysis for market positioning
                
                ═══════════════════════════════════════════════════════════════
                """,
                    formatCurrency(totalRevenue),
                    formatCurrency(totalExpenses),
                    formatCurrency(netProfit),
                    profitMargin,
                    getRevenueBreakdown(transactions),
                    getExpenseBreakdown(transactions),
                    profitMargin);
        }

        if (lowerQuery.contains("cash") || lowerQuery.contains("flow")) {
            return String.format("""
                **CASH FLOW ANALYSIS**
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                
                **CASH POSITION**
                
                • Total Assets: **R%s**
                • Total Liabilities: **R%s**
                • Working Capital: **R%s**
                • Current Ratio: **%.2f**
                
                **CASH FLOW PROJECTIONS**
                
                • Monthly Burn Rate: **R%s**
                • Estimated Runway: **%s months**
                • Monthly Revenue Average: **R%s**
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                
                **RECOMMENDATIONS**
                
                1. Accelerate accounts receivable collection (30-60 day terms)
                2. Negotiate extended payment terms with suppliers
                3. Establish a line of credit for working capital needs
                4. Review inventory levels and optimize turnover
                5. Implement cash flow forecasting on weekly basis
                
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                """,
                    formatCurrency(totalAssets),
                    formatCurrency(totalLiabilities),
                    formatCurrency(workingCapital),
                    totalLiabilities.compareTo(BigDecimal.ZERO) > 0
                            ? totalAssets.divide(totalLiabilities, 2, RoundingMode.HALF_UP).doubleValue()
                            : 0,
                    formatCurrency(monthlyBurn),
                    formatCurrency(runwayMonths),
                    formatCurrency(totalRevenue.divide(new BigDecimal(monthsToUse), 2, RoundingMode.HALF_UP)));
        }

        // Full comprehensive audit response
        return String.format("""
            **FINANCIAL HEALTH ASSESSMENT**
            
            Prepared: %s
            
            ═══════════════════════════════════════════════════════════════
            
            **EXECUTIVE SUMMARY**
            
            Your financial position shows **%s** performance with a net profit of **R%s**.
            The business has a profit margin of **%.1f%%** and estimated runway of **%s months**.
            
            ═══════════════════════════════════════════════════════════════
            
            **KEY METRICS**
            
            ───────────────────────────────────────────────────────────────
            
            Revenue: **R%s**
            Expenses: **R%s**
            Net Profit: **R%s**
            Profit Margin: **%.1f%%**
            Total Assets: **R%s**
            Total Liabilities: **R%s**
            Working Capital: **R%s**
            
            ───────────────────────────────────────────────────────────────
            
            **VAT ANALYSIS**
            
            Output VAT Collected: **R%s**
            Input VAT Claimed: **R%s**
            Unclaimed VAT Available: **R%s**
            Net VAT %s: **R%s**
            
            ───────────────────────────────────────────────────────────────
            
            **STRATEGIC RECOMMENDATIONS**
            
            1. Optimize expense structure to improve profit margin
            2. Ensure timely VAT submissions (monthly by 25th)
            3. Prepare for provisional tax payments (February and August)
            4. Schedule quarterly financial review meetings
            5. Implement asset depreciation for tax benefits
            6. Consider tax-deductible retirement contributions
            
            **NEXT STEPS**
            
            • Generate detailed expense report by category
            • Review Chart of Accounts structure for optimization
            • Set up automated bank feed integration
            • Schedule monthly financial health assessment
            • Prepare year-end tax planning strategy
            
            ═══════════════════════════════════════════════════════════════
            Generated by FinTrack Pro AI Audit System
            """,
                LocalDate.now().toString(),
                netProfit.compareTo(BigDecimal.ZERO) >= 0 ? "POSITIVE" : "NEGATIVE",
                formatCurrency(Math.abs(netProfit.doubleValue())),
                profitMargin,
                formatCurrency(runwayMonths),
                formatCurrency(totalRevenue),
                formatCurrency(totalExpenses),
                formatCurrency(netProfit),
                profitMargin,
                formatCurrency(totalAssets),
                formatCurrency(totalLiabilities),
                formatCurrency(workingCapital),
                formatCurrency(outputVat),
                formatCurrency(inputVat),
                formatCurrency(unclaimedVat),
                vatStatus,
                formatCurrency(Math.abs(netVat.doubleValue())));
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0.00";
        DecimalFormat df = new DecimalFormat("#,##0.00");
        return df.format(amount);
    }

    private String formatCurrency(double amount) {
        DecimalFormat df = new DecimalFormat("#,##0.00");
        return df.format(amount);
    }

    private String getRevenueBreakdown(List<Transaction> transactions) {
        Map<String, BigDecimal> revenueByCategory = new HashMap<>();
        for (Transaction tx : transactions) {
            if (tx != null && "INVOICE".equals(tx.getType())) {
                String cat = tx.getCategory() != null ? tx.getCategory() : "Uncategorized";
                BigDecimal amount = tx.getAmount() != null ? tx.getAmount().subtract(tx.getVatAmount()) : BigDecimal.ZERO;
                revenueByCategory.merge(cat, amount, BigDecimal::add);
            }
        }
        if (revenueByCategory.isEmpty()) return "No revenue data available";

        List<Map.Entry<String, BigDecimal>> sorted = new ArrayList<>(revenueByCategory.entrySet());
        sorted.sort((a, b) -> b.getValue().compareTo(a.getValue()));

        StringBuilder sb = new StringBuilder();
        int limit = Math.min(5, sorted.size());
        for (int i = 0; i < limit; i++) {
            sb.append(String.format("\n• %s: **R%s**",
                    sorted.get(i).getKey(),
                    formatCurrency(sorted.get(i).getValue())));
        }
        if (sorted.size() > limit) {
            sb.append(String.format("\n• Plus %d additional categories", sorted.size() - limit));
        }
        return sb.toString();
    }

    private String getExpenseBreakdown(List<Transaction> transactions) {
        Map<String, BigDecimal> expenseByCategory = new HashMap<>();
        for (Transaction tx : transactions) {
            if (tx != null && "EXPENSE".equals(tx.getType())) {
                String cat = tx.getCategory() != null ? tx.getCategory() : "Uncategorized";
                BigDecimal amount = tx.getAmount() != null ? tx.getAmount().subtract(tx.getVatAmount()) : BigDecimal.ZERO;
                expenseByCategory.merge(cat, amount, BigDecimal::add);
            }
        }
        if (expenseByCategory.isEmpty()) return "No expense data available";

        List<Map.Entry<String, BigDecimal>> sorted = new ArrayList<>(expenseByCategory.entrySet());
        sorted.sort((a, b) -> b.getValue().compareTo(a.getValue()));

        StringBuilder sb = new StringBuilder();
        int limit = Math.min(5, sorted.size());
        for (int i = 0; i < limit; i++) {
            sb.append(String.format("\n• %s: **R%s**",
                    sorted.get(i).getKey(),
                    formatCurrency(sorted.get(i).getValue())));
        }
        if (sorted.size() > limit) {
            sb.append(String.format("\n• Plus %d additional categories", sorted.size() - limit));
        }
        return sb.toString();
    }

    // ============================================================
    // ACCOUNT SUGGESTION METHODS
    // ============================================================

    public Map<String, Object> suggestAccountDetails(String accountName) {
        Map<String, Object> suggestion = new HashMap<>();
        suggestion.put("code", generateAccountCode(accountName));
        suggestion.put("type", determineAccountType(accountName));
        suggestion.put("reasoning", "Based on standard SA accounting practices for '" + accountName + "', the recommended code is " +
                generateAccountCode(accountName) + " with type " + determineAccountType(accountName));
        return suggestion;
    }

    private String generateAccountCode(String accountName) {
        String lower = accountName.toLowerCase();
        if (lower.contains("bank") || lower.contains("cash") || lower.contains("fnb") || lower.contains("current")) {
            return "1200";
        }
        if (lower.contains("debtor") || lower.contains("receivable")) {
            return "1100";
        }
        if (lower.contains("revenue") || lower.contains("sales") || lower.contains("income") || lower.contains("service")) {
            return "4000";
        }
        if (lower.contains("expense") || lower.contains("cost") || lower.contains("operating") || lower.contains("supplies")) {
            return "5100";
        }
        if (lower.contains("vat") || lower.contains("tax") || lower.contains("sars")) {
            return "2200";
        }
        if (lower.contains("equity") || lower.contains("capital") || lower.contains("owner") || lower.contains("retained")) {
            return "3000";
        }
        if (lower.contains("creditor") || lower.contains("payable")) {
            return "2100";
        }
        return "5000";
    }

    private String determineAccountType(String accountName) {
        String lower = accountName.toLowerCase();
        if (lower.contains("bank") || lower.contains("cash") || lower.contains("debtor") || lower.contains("receivable") || lower.contains("inventory")) {
            return "Asset";
        }
        if (lower.contains("creditor") || lower.contains("payable") || lower.contains("vat") || lower.contains("tax") || lower.contains("sars")) {
            return "Liability";
        }
        if (lower.contains("revenue") || lower.contains("sales") || lower.contains("income") || lower.contains("service")) {
            return "Revenue";
        }
        if (lower.contains("expense") || lower.contains("cost") || lower.contains("operating") || lower.contains("supplies")) {
            return "Expense";
        }
        if (lower.contains("equity") || lower.contains("capital") || lower.contains("owner")) {
            return "Equity";
        }
        return "Expense";
    }
}