package com.fintrack.service;

import com.fintrack.model.Bill;
import com.fintrack.model.BillItem;
import com.fintrack.repository.BillRepository;
import com.fintrack.repository.BillItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;
    private final BillItemRepository billItemRepository;

    public List<Bill> getBillsByUser(String userId) {
        return billRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Bill getBillByIdAndUser(String id, String userId) {
        return billRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
    }

    @Transactional
    public Bill createBill(Bill bill, String userId) {
        bill.setId("bill-" + System.currentTimeMillis());
        bill.setUserId(userId);
        bill.setCreatedAt(LocalDateTime.now());
        Bill saved = billRepository.save(bill);

        if (bill.getLineItems() != null) {
            for (BillItem item : bill.getLineItems()) {
                item.setBillId(saved.getId());
                billItemRepository.save(item);
            }
        }

        return saved;
    }

    @Transactional
    public Bill updateBillStatus(String id, String status, String userId) {
        Bill bill = getBillByIdAndUser(id, userId);
        bill.setStatus(status);
        return billRepository.save(bill);
    }

    @Transactional
    public void deleteBill(String id, String userId) {
        Bill bill = getBillByIdAndUser(id, userId);
        billItemRepository.deleteByBillId(id);
        billRepository.delete(bill);
    }

    public long getPendingCount(String userId) {
        return billRepository.countByUserIdAndStatus(userId, "PENDING");
    }
}