package com.fintrack.config;

import org.springframework.context.annotation.Configuration;

/**
 * CORS is fully configured in SecurityConfig via CorsConfigurationSource.
 * This file is intentionally left as a placeholder — do not add a second
 * WebMvcConfigurer CORS mapping here as it would conflict with Spring Security.
 */
@Configuration
public class CorsConfig {
    // All CORS config lives in SecurityConfig.corsConfigurationSource()
}
