package com.hanghai.kchtg.security.filter;

import com.hanghai.kchtg.security.config.CookieConfig;
import com.hanghai.kchtg.security.service.TokenService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter to extract, validate and authenticate refresh tokens stored in HTTP-Only cookies (F-24).
 */
@Component
public class CookieRefreshTokenFilter extends OncePerRequestFilter {

    private final TokenService tokenService;

    public CookieRefreshTokenFilter(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        if ("/api/auth/refresh".equals(request.getRequestURI()) && "POST".equalsIgnoreCase(request.getMethod())) {
            String refreshToken = null;
            if (request.getCookies() != null) {
                for (Cookie cookie : request.getCookies()) {
                    if (CookieConfig.REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                        refreshToken = cookie.getValue();
                        break;
                    }
                }
            }

            if (refreshToken != null && tokenService.isTokenValid(refreshToken)) {
                try {
                    Claims claims = tokenService.validateToken(refreshToken);
                    String username = claims.getSubject();
                    if (username != null) {
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                username, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        request.setAttribute("cookieRefreshToken", refreshToken);
                    }
                } catch (Exception e) {
                    // Ignore and let authentication fail downstream
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
