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
 * Increases maxHttpHeaderSize and maxHttpResponseHeaderSize to 64KB (65536)
 * to handle large HTTP response headers caused by JWT tokens in X-New-Token.
 */
@Configuration
public class TomcatConfig {

    private static final Logger log = LoggerFactory.getLogger(TomcatConfig.class);

    /** 64 KB — enough for JWT tokens with 300+ permissions */
    private static final int MAX_HTTP_HEADER_SIZE = 65536;

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatHeaderSizeCustomizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            ProtocolHandler handler = connector.getProtocolHandler();

            if (handler instanceof AbstractHttp11Protocol<?> protocol) {
                protocol.setMaxHttpHeaderSize(MAX_HTTP_HEADER_SIZE);
                protocol.setMaxHttpResponseHeaderSize(MAX_HTTP_HEADER_SIZE);
                protocol.setMaxHttpRequestHeaderSize(MAX_HTTP_HEADER_SIZE);
                log.info("Tomcat maxHttpHeaderSize and maxHttpResponseHeaderSize set to {} bytes via AbstractHttp11Protocol API",
                        MAX_HTTP_HEADER_SIZE);
            } else {
                log.warn("Tomcat protocol handler is not AbstractHttp11Protocol (got {}), falling back to connector properties",
                        handler.getClass().getName());
            }

            connector.setProperty("maxHttpHeaderSize", String.valueOf(MAX_HTTP_HEADER_SIZE));
            connector.setProperty("maxHttpResponseHeaderSize", String.valueOf(MAX_HTTP_HEADER_SIZE));
            connector.setProperty("maxHttpRequestHeaderSize", String.valueOf(MAX_HTTP_HEADER_SIZE));
            log.info("Tomcat connector maxHttpHeaderSize and maxHttpResponseHeaderSize properties set to {}", MAX_HTTP_HEADER_SIZE);
        });
    }
}
