package com.hanghai.kchtg.cangben;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * Activates @PreAuthorize AOP processing in @WebMvcTest slices for the cangben package.
 *
 * @WebMvcTest does not load user @Configuration classes by default, so
 * @EnableMethodSecurity from SecurityConfig is absent. Importing this class
 * re-enables method security without pulling in SecurityConfig's heavy dependencies
 * (JwtAuthFilter, CookieRefreshTokenFilter, etc.).
 *
 * Used by: CangBienRbacSecurityTest via @Import(MethodSecurityTestConfig.class)
 */
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class MethodSecurityTestConfig {
}
