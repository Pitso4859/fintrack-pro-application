package com.fintrack.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

@Data
public class ReportDTO {
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal netProfit;
    private BigDecimal outputVat;
    private BigDecimal inputVat;
    private BigDecimal netVatPayable;
    private Map<String, BigDecimal> revenueByCategory;
    private Map<String, BigDecimal> expensesByCategory;
}