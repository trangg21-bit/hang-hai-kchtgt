package com.hanghai.kchtg.config;

import org.apache.coyote.ProtocolHandler;
import org.apache.coyote.http11.AbstractHttp11Protocol;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configure Tomcat connector limits.
 * Increases maxHttpHeaderSize to 32KB (32768) to handle large HTTP headers
 * caused by JWT tokens that carry extensive permission lists.
 *
 * <p>Uses three strategies in order of reliability:
 * <ol>
 *   <li>{@code protocol.setMaxHttpHeaderSize()} — the programmatic API</li>
 *   <li>{@code connector.setProperty("maxHttpHeaderSize", ...)} — the legacy string property</li>
 *   <li>Spring Boot's {@code server.tomcat.max-http-header-size} — application property</li>
 * </ol>
 */
@Configuration
public class TomcatConfig {

    private static final Logger log = LoggerFactory.getLogger(TomcatConfig.class);

    /** 32 KB — enough for JWT tokens with ~200 permissions */
    private static final int MAX_HTTP_HEADER_SIZE = 32768;

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatHeaderSizeCustomizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            ProtocolHandler handler = connector.getProtocolHandler();

            // Strategy 1: Programmatic API on the protocol handler
            if (handler instanceof AbstractHttp11Protocol<?> protocol) {
                protocol.setMaxHttpHeaderSize(MAX_HTTP_HEADER_SIZE);
                log.info("Tomcat maxHttpHeaderSize set to {} bytes via AbstractHttp11Protocol API",
                        protocol.getMaxHttpHeaderSize());
            } else {
                log.warn("Tomcat protocol handler is not AbstractHttp11Protocol (got {}), "
                        + "falling back to connector property", handler.getClass().getName());
            }

            // Strategy 2: Legacy connector property (works across Tomcat versions)
            connector.setProperty("maxHttpHeaderSize", String.valueOf(MAX_HTTP_HEADER_SIZE));
            log.info("Tomcat connector maxHttpHeaderSize property set to {}", MAX_HTTP_HEADER_SIZE);
        });
    }

}


