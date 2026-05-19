package com.fintrack.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class DashboardDTO {
    private BigDecimal cashBalance;
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal netProfit;
    private BigDecimal vatLiability;
    private List<Map<String, Object>> recentTransactions;
    private Map<String, BigDecimal> chartData;
}