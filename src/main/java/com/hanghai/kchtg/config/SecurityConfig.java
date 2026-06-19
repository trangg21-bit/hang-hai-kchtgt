package com.hanghai.kchtg.config;

import com.hanghai.kchtg.security.JwtAuthFilter;
import com.hanghai.kchtg.security.JwtProperties;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 6 configuration for the M-001 REST API.
 * <p>
 * Enables JWT-based stateless authentication.
 * CSRF is disabled (REST APIs are stateless).
 * The H2 console is open for local development ({@code /h2-console/**}).
 * {@code /api/auth/login} is the unauthenticated login endpoint.
 * All other {@code /api/**} endpoints require a valid JWT Bearer token.
 * </p>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // REST API — no CSRF needed
                .csrf(AbstractHttpConfigurer::disable)

                // Stateless sessions — no JSESSIONID
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Allow H2 console to render inside frames
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/point-objects/**").permitAll()
                        .requestMatchers("/api/line-objects/**").permitAll()
                        .requestMatchers("/api/polygon-objects/**").permitAll()
                        .requestMatchers("/api/map-layers/**").permitAll()
                        .requestMatchers("/api/search/**").permitAll()
                        .anyRequest().authenticated()
                )

                // Disable form/basic login — JWT only
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // Insert JWT filter before the standard authentication filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Provides a {@link UserDetailsService} that loads users from the
     * {@link UserRepository}. Required by Spring Security even for JWT-
     * based stateless setups (e.g. for {@code @PreAuthorize} evaluation).
     */
    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return username -> {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
            String role = user.getRole() != null ? user.getRole() : "ROLE_USER";
            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getUsername())
                    .password(user.getPassword())
                    .authorities(role)
                    .accountLocked(
                            user.getStatus() == com.hanghai.kchtg.user.entity.UserStatus.LOCKED)
                    .disabled(
                            user.getStatus() == com.hanghai.kchtg.user.entity.UserStatus.INACTIVE)
                    .build();
        };
    }
}
