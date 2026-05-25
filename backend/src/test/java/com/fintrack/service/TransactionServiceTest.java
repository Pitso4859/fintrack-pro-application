package com.fintrack.service;

import com.fintrack.dto.TransactionDTO;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.model.Transaction;
import com.fintrack.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TransactionService Unit Tests")
class TransactionServiceTest {

    @Mock  private TransactionRepository transactionRepository;
    @InjectMocks private TransactionService transactionService;

    private static final String USER_ID = "user-123";
    private static final String TX_ID   = "tx-456";

    @Nested
    @DisplayName("Create transaction")
    class Create {

        @Test
        @DisplayName("creates a transaction with VAT-exclusive amount")
        void createVatExclusive() {
            var request = new TransactionDTO.CreateRequest(
                    Transaction.TransactionType.EXPENSE,
                    BigDecimal.valueOf(1000.00),
                    null,
                    false,
                    "Office chairs",
                    null, null, null, null, null, "ZAR",
                    LocalDate.now(), null);

            var saved = Transaction.builder()
                    .id(TX_ID)
                    .userId(USER_ID)
                    .type(Transaction.TransactionType.EXPENSE)
                    .amount(BigDecimal.valueOf(1000.00))
                    .vatAmount(BigDecimal.valueOf(150.00))
                    .netAmount(BigDecimal.valueOf(850.00))
                    .build();

            when(transactionRepository.save(any())).thenReturn(saved);

            Transaction result = transactionService.create(USER_ID, request);

            assertThat(result.getId()).isEqualTo(TX_ID);
            verify(transactionRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("creates a transaction with VAT-inclusive amount")
        void createVatInclusive() {
            // R1150 VAT-inclusive → VAT = R150, net = R1000
            var request = new TransactionDTO.CreateRequest(
                    Transaction.TransactionType.EXPENSE,
                    BigDecimal.valueOf(1150.00),
                    null,
                    true,
                    "Laptop purchase",
                    null, null, null, null, null, "ZAR",
                    LocalDate.now(), null);

            when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

            Transaction result = transactionService.create(USER_ID, request);

            // VAT = 1150 * 15/115 = 150.00
            assertThat(result.getVatAmount()).isEqualByComparingTo("150.00");
            assertThat(result.getNetAmount()).isEqualByComparingTo("1000.00");
        }
    }

    @Nested
    @DisplayName("Delete transaction")
    class Delete {

        @Test
        @DisplayName("deletes a transaction owned by the user")
        void deleteOwnedTransaction() {
            Transaction tx = Transaction.builder().id(TX_ID).userId(USER_ID).build();
            when(transactionRepository.findById(TX_ID)).thenReturn(Optional.of(tx));

            transactionService.delete(USER_ID, TX_ID);

            verify(transactionRepository).delete(tx);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when transaction does not exist")
        void deleteNotFound() {
            when(transactionRepository.findById(TX_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> transactionService.delete(USER_ID, TX_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when transaction belongs to another user")
        void deleteNotOwned() {
            Transaction tx = Transaction.builder().id(TX_ID).userId("other-user").build();
            when(transactionRepository.findById(TX_ID)).thenReturn(Optional.of(tx));

            assertThatThrownBy(() -> transactionService.delete(USER_ID, TX_ID))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(transactionRepository, never()).delete(any());
        }
    }
}
