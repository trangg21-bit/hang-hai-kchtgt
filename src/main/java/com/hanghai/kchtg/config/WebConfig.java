package com.hanghai.kchtg.config;

import com.hanghai.kchtg.accesslog.interceptor.AccessLogInterceptor;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC Configuration to register the AccessLogInterceptor and Custom Formatters.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AccessLogInterceptor accessLogInterceptor;

    public WebConfig(AccessLogInterceptor accessLogInterceptor) {
        this.accessLogInterceptor = accessLogInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(accessLogInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/access-logs/**", "/api/logs/**");
    }

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new Converter<String, ApprovalStatus>() {
            @Override
            public ApprovalStatus convert(String source) {
                if (source == null || source.isBlank()) return null;
                return ApprovalStatus.fromString(source);
            }
        });
    }
}