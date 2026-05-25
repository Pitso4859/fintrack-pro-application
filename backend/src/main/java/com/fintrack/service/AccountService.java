package com.fintrack.service;

import com.fintrack.dto.AccountDTO;
import com.fintrack.exception.AuthException;
import com.fintrack.exception.ResourceNotFoundException;
import com.fintrack.model.Account;
import com.fintrack.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;

    public List<Account> findAll(String userId) {
        return accountRepository.findByUserIdAndIsActiveTrueOrderByCodeAsc(userId);
    }

    public List<Account> findByType(String userId, Account.AccountType type) {
        return accountRepository.findByUserIdAndTypeOrderByCodeAsc(userId, type);
    }

    @Transactional
    public Account create(String userId, AccountDTO.CreateRequest req) {
        if (accountRepository.existsByUserIdAndCode(userId, req.code())) {
            throw new AuthException("An account with code '" + req.code() + "' already exists");
        }

        Account account = Account.builder()
                .userId(userId)
                .code(req.code())
                .name(req.name())
                .type(req.type())
                .description(req.description())
                .vatApplicable(req.vatApplicable() != null ? req.vatApplicable() : false)
                .currency(req.currency() != null ? req.currency() : "ZAR")
                .normalBalance(req.type() == Account.AccountType.ASSET
                        || req.type() == Account.AccountType.EXPENSE
                        ? Account.NormalBalance.DEBIT
                        : Account.NormalBalance.CREDIT)
                .build();

        return accountRepository.save(account);
    }

    @Transactional
    public Account update(String userId, String id, AccountDTO.UpdateRequest req) {
        Account account = getOwnedOrThrow(userId, id);
        if (req.name()         != null) account.setName(req.name());
        if (req.description()  != null) account.setDescription(req.description());
        if (req.vatApplicable() != null) account.setVatApplicable(req.vatApplicable());
        if (req.isActive()     != null) account.setIsActive(req.isActive());
        return accountRepository.save(account);
    }

    @Transactional
    public void delete(String userId, String id) {
        Account account = getOwnedOrThrow(userId, id);
        account.setIsActive(false);
        accountRepository.save(account);
    }

    private Account getOwnedOrThrow(String userId, String id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", id));
        if (!account.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("Account", id);
        }
        return account;
    }
}
