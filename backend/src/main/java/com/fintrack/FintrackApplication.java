package com.fintrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FintrackApplication {

    public static void main(String[] args) {
        SpringApplication.run(FintrackApplication.class, args);

        System.out.println("=========================================");
        System.out.println("  FinTrack Pro Backend Started!");
        System.out.println("  Server: http://localhost:5000");
        System.out.println("=========================================");
    }

}
