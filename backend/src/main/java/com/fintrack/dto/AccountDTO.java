package com.fintrack.dto;

import com.fintrack.model.Account;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AccountDTO {
    private AccountDTO() {}

    public record CreateRequest(
            @NotBlank(message = "Code is required") @Size(max = 20) String code,
            @NotBlank(message = "Name is required") @Size(max = 255) String name,
            @NotNull(message = "Type is required") Account.AccountType type,
            @Size(max = 500) String description,
            Boolean vatApplicable,
            @Size(max = 3) String currency
    ) {}

    public record UpdateRequest(
            @Size(max = 255) String name,
            @Size(max = 500) String description,
            Boolean vatApplicable,
            Boolean isActive
    ) {}
}
