package com.fintrack.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintrack.model.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Gemini AI integration service.
 *
 * Capabilities:
 * 1. Financial analysis — summarise spending, identify trends, give advice
 * 2. Invoice OCR      — extract structured data from invoice images
 * 3. Account suggestions — recommend chart-of-account codes
 */
@Slf4j
@Service
public class GeminiAIService {

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final ObjectMapper objectMapper;

    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public GeminiAIService(
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.model:gemini-1.5-flash}") String model,
            @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models}") String baseUrl,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
        this.objectMapper = objectMapper;
    }

    // ----------------------------------------------------------------
    // 1. FINANCIAL ANALYSIS
    // ----------------------------------------------------------------

    public String analyzeFinances(List<Transaction> transactions, String userQuery) {
        if (!isConfigured()) {
            return buildFallbackAnalysis(transactions);
        }

        String context = buildTransactionContext(transactions);
        String prompt = """
                You are FinTrack Pro's AI financial advisor for a South African business.
                
                FINANCIAL DATA:
                %s
                
                USER QUESTION: %s
                
                Provide a concise, actionable financial insight in 3–5 sentences.
                Reference specific numbers from the data where relevant.
                Use South African Rand (ZAR/R) terminology.
                Focus on practical recommendations the business owner can act on immediately.
                """.formatted(context, userQuery);

        return callGemini(prompt);
    }

    // ----------------------------------------------------------------
    // 2. INVOICE OCR
    // ----------------------------------------------------------------

    public Map<String, Object> extractInvoiceData(String base64Image) {
        if (!isConfigured()) {
            return buildMockInvoiceData();
        }

        String imageData = stripDataUrlPrefix(base64Image);
        String prompt = """
                You are an expert invoice data extraction system for South African businesses.
                Analyse this invoice image and extract the following information.
                Return ONLY valid JSON (no markdown, no backticks), using this exact format:
                
                {
                    "supplierName": "string",
                    "invoiceNumber": "string",
                    "date": "YYYY-MM-DD",
                    "totalAmount": number,
                    "totalVat": number,
                    "vatRate": number,
                    "currency": "ZAR",
                    "lineItems": [
                        {
                            "description": "string",
                            "quantity": number,
                            "unitPrice": number,
                            "total": number,
                            "vatAmount": number
                        }
                    ]
                }
                
                Rules:
                - VAT rate in South Africa is 15%. If not visible, calculate accordingly.
                - If totalAmount is visible, use that exact value.
                - Currency defaults to ZAR unless clearly different.
                - Be precise with decimal places (2 decimal places).
                - If a field cannot be determined, use null.
                """;

        String response = callGeminiWithImage(prompt, imageData);

        try {
            // Strip any residual markdown fences
            String cleaned = response.replaceAll("```json", "")
                    .replaceAll("```", "").trim();
            JsonNode node = objectMapper.readTree(cleaned);
            return objectMapper.convertValue(node, Map.class);
        } catch (Exception e) {
            log.error("Failed to parse Gemini invoice response: {}", e.getMessage());
            return buildMockInvoiceData();
        }
    }

    // ----------------------------------------------------------------
    // 3. ACCOUNT SUGGESTIONS
    // ----------------------------------------------------------------

    public Map<String, Object> suggestAccountDetails(String accountName) {
        if (!isConfigured()) {
            return Map.of("type", "EXPENSE", "code", "6000", "vatApplicable", true);
        }

        String prompt = """
                You are an expert chartered accountant familiar with South African SARS requirements.
                
                Given this account name: "%s"
                
                Return ONLY valid JSON (no markdown):
                {
                    "type": "ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE",
                    "code": "suggested 4-digit account code",
                    "normalBalance": "DEBIT | CREDIT",
                    "vatApplicable": true | false,
                    "description": "brief description of this account"
                }
                """.formatted(accountName);

        String response = callGemini(prompt);
        try {
            String cleaned = response.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode node = objectMapper.readTree(cleaned);
            return objectMapper.convertValue(node, Map.class);
        } catch (Exception e) {
            log.error("Failed to parse account suggestion: {}", e.getMessage());
            return Map.of("type", "EXPENSE", "code", "6000", "vatApplicable", true);
        }
    }

    // ----------------------------------------------------------------
    // PRIVATE — HTTP CALLS
    // ----------------------------------------------------------------

    private String callGemini(String prompt) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", prompt))
                    )),
                    "generationConfig", Map.of(
                            "temperature", 0.3,
                            "maxOutputTokens", 1024
                    )
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/" + model + ":generateContent?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            return extractTextFromResponse(response.body());

        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            return "AI analysis is temporarily unavailable. Please try again later.";
        }
    }

    private String callGeminiWithImage(String prompt, String base64Image) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(
                                    Map.of("text", prompt),
                                    Map.of("inline_data", Map.of(
                                            "mime_type", "image/jpeg",
                                            "data", base64Image
                                    ))
                            )
                    )),
                    "generationConfig", Map.of(
                            "temperature", 0.1,
                            "maxOutputTokens", 2048
                    )
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/" + model + ":generateContent?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());

            return extractTextFromResponse(response.body());

        } catch (Exception e) {
            log.error("Gemini Vision API call failed: {}", e.getMessage());
            return "{}";
        }
    }

    private String extractTextFromResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            return root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text")
                    .asText("No response generated");
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            return "Unable to parse AI response";
        }
    }

    // ----------------------------------------------------------------
    // PRIVATE — HELPERS
    // ----------------------------------------------------------------

    private boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    private String stripDataUrlPrefix(String base64Image) {
        return base64Image.contains(",")
                ? base64Image.substring(base64Image.indexOf(",") + 1)
                : base64Image;
    }

    private String buildTransactionContext(List<Transaction> transactions) {
        if (transactions == null || transactions.isEmpty()) {
            return "No transactions available.";
        }

        var sb = new StringBuilder();
        double totalIncome = 0, totalExpenses = 0;

        for (Transaction t : transactions) {
            double amount = t.getAmount().doubleValue();
            if (t.getType() == Transaction.TransactionType.INVOICE) totalIncome += amount;
            else if (t.getType() == Transaction.TransactionType.EXPENSE) totalExpenses += amount;
            sb.append(String.format("- %s | %s | R%.2f | %s%n",
                    t.getTransactionDate(), t.getType(), amount, t.getDescription()));
        }

        return String.format("""
                Summary: %d transactions
                Total Income: R%.2f
                Total Expenses: R%.2f
                Net Profit: R%.2f
                
                Recent Transactions:
                %s
                """, transactions.size(), totalIncome, totalExpenses,
                totalIncome - totalExpenses, sb);
    }

    private String buildFallbackAnalysis(List<Transaction> transactions) {
        if (transactions == null || transactions.isEmpty()) {
            return "No transaction data available for analysis.";
        }
        double income = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.INVOICE)
                .mapToDouble(t -> t.getAmount().doubleValue()).sum();
        double expenses = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .mapToDouble(t -> t.getAmount().doubleValue()).sum();
        return String.format("Based on %d transactions: Total income R%.2f, expenses R%.2f, net R%.2f. "
                + "Configure your Gemini API key for detailed AI-powered insights.",
                transactions.size(), income, expenses, income - expenses);
    }

    private Map<String, Object> buildMockInvoiceData() {
        return Map.of(
                "supplierName", "Sample Supplier",
                "invoiceNumber", "INV-001",
                "date", "2025-01-01",
                "totalAmount", 1150.00,
                "totalVat", 150.00,
                "vatRate", 15,
                "currency", "ZAR",
                "lineItems", List.of(Map.of(
                        "description", "Office Supplies",
                        "quantity", 1,
                        "unitPrice", 1000.00,
                        "total", 1000.00,
                        "vatAmount", 150.00
                ))
        );
    }
}
