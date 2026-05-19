package com.fintrack.dto;

import lombok.Data;

@Data
public class AuthDTO {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String companyName;
    private String token;
    private String userId;
    private Boolean success;
    private String message;
}