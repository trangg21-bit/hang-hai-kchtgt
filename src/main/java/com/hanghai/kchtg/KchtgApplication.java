package com.hanghai.kchtg;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class KchtgApplication {

    public static void main(String[] args) {
        SpringApplication.run(KchtgApplication.class, args);
    }
}
