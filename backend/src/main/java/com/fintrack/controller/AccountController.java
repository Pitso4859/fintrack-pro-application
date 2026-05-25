package com.fintrack.controller;

import com.fintrack.dto.AccountDTO;
import com.fintrack.model.Account;
import com.fintrack.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Accounts", description = "Chart of accounts management")
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    @Operation(summary = "List all active accounts for the current user")
    public ResponseEntity<List<Account>> list(
            @AuthenticationPrincipal String userId,
            @RequestParam(required = false) Account.AccountType type) {
        if (type != null) {
            return ResponseEntity.ok(accountService.findByType(userId, type));
        }
        return ResponseEntity.ok(accountService.findAll(userId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new account")
    public ResponseEntity<Account> create(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody AccountDTO.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountService.create(userId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an account")
    public ResponseEntity<Account> update(
            @AuthenticationPrincipal String userId,
            @PathVariable String id,
            @Valid @RequestBody AccountDTO.UpdateRequest request) {
        return ResponseEntity.ok(accountService.update(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Deactivate an account (soft delete)")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal String userId,
            @PathVariable String id) {
        accountService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
