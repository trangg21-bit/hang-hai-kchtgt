package com.hanghai.kchtg.config;

import com.hanghai.kchtg.password.service.PasswordHashService;
import com.hanghai.kchtg.security.JwtAuthFilter;
import com.hanghai.kchtg.security.JwtProperties;
import com.hanghai.kchtg.security.PermissionMiddleware;
import com.hanghai.kchtg.security.filter.CookieRefreshTokenFilter;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.entity.UserStatus;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
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
@EnableMethodSecurity(prePostEnabled = true)
@EnableConfigurationProperties(JwtProperties.class)
@EnableCaching
@EnableScheduling
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CookieRefreshTokenFilter cookieRefreshTokenFilter;
    private final PermissionMiddleware permissionMiddleware;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          CookieRefreshTokenFilter cookieRefreshTokenFilter,
                          @Nullable PermissionMiddleware permissionMiddleware) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.cookieRefreshTokenFilter = cookieRefreshTokenFilter;
        this.permissionMiddleware = permissionMiddleware;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // =========================================================================
                .csrf(AbstractHttpConfigurer::disable)

                // =========================================================================
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Allow H2 console to render inside frames
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/password-policy").permitAll()
                        // Map data stays readable without a login so the public map keeps
                        // working, but only for reads. These controllers carry no
                        // @PreAuthorize of their own, so a blanket permitAll left create,
                        // update, delete — and even the L1/L2 approval endpoints — open to
                        // anonymous callers.
                        .requestMatchers(HttpMethod.GET, "/api/point-objects/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/line-objects/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/polygon-objects/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/map-layers/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/search/**").permitAll()
                        // Searching itself is a POST with a body, so it stays public;
                        // clearing the history is not.
                        .requestMatchers(HttpMethod.POST, "/api/search").permitAll()
                        .requestMatchers("/api/point-objects/**").authenticated()
                        .requestMatchers("/api/line-objects/**").authenticated()
                        .requestMatchers("/api/polygon-objects/**").authenticated()
                        .requestMatchers("/api/map-layers/**").authenticated()
                        .requestMatchers("/api/search/**").authenticated()
                        .requestMatchers("/api/v1/integration/share/**").permitAll()
                        // Registration and TOTP setup must be public so new users can register and first-time users can setup MFA
                        .requestMatchers("/api/register").permitAll()
                        .requestMatchers("/api/auth/register/**").permitAll()
                        .requestMatchers("/api/auth/totp/**").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().authenticated()
                )

                // Disable form/basic login - JWT only
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // Insert JWT filter before the standard authentication filter
                .addFilterBefore(cookieRefreshTokenFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        if (permissionMiddleware != null) {
            http.addFilterAfter(permissionMiddleware, JwtAuthFilter.class);
        }

        return http.build();
    }

    @Bean
    public FilterRegistrationBean<PermissionMiddleware> disablePermissionMiddlewareAutoRegistration(
            @Nullable PermissionMiddleware filter) {
        FilterRegistrationBean<PermissionMiddleware> registration = new FilterRegistrationBean<>();
        if (filter != null) {
            registration.setFilter(filter);
        }
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public PasswordEncoder passwordEncoder(PasswordHashService passwordHashService) {
        return new PasswordEncoder() {
            private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

            @Override
            public String encode(CharSequence rawPassword) {
                return bcrypt.encode(rawPassword);
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (rawPassword == null || encodedPassword == null) {
                    return false;
                }
                return passwordHashService.verify(rawPassword.toString(), encodedPassword);
            }
        };
    }

    /**
     * Provides a {@link UserDetailsService} that loads users from the
     * {@link UserRepository}. Required by Spring Security even for JWT-
     * based stateless setups (e.g. for {@code @PreAuthorize} evaluation).
     */
    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return username -> {
            User user = userRepository.findByUsernameWithRelations(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
            String role = user.getPrimaryRoleCode() != null ? user.getPrimaryRoleCode() : "ROLE_USER";
            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getUsername())
                    .password(user.getPassword())
                    .authorities(role)
                    .accountLocked(
                            user.getStatus() == UserStatus.LOCKED)
                    .disabled(
                            user.getStatus() == UserStatus.INACTIVE)
                    .build();
        };
    }

    @Bean
    public RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.fromHierarchy("ROLE_SUPER_ADMIN > ROLE_SYSTEM_ADMIN\nROLE_SYSTEM_ADMIN > ROLE_ADMIN\nROLE_ADMIN > ROLE_USER");
    }
}
