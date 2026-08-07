package com.hanghai.kchtg.config;

import org.apache.coyote.http11.AbstractHttp11Protocol;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configure Tomcat connector limits.
 * Increases maxHttpHeaderSize to 2MB to handle large HTTP headers.
 */
@Configuration
public class TomcatConfig {

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatHeaderSizeCustomizer() {
        return factory -> factory.addConnectorCustomizers(connector -> {
            connector.setProperty("maxHttpHeaderSize", "2097152");
            if (connector.getProtocolHandler() instanceof AbstractHttp11Protocol<?> protocol) {
                protocol.setMaxHttpHeaderSize(2097152); // 2MB
            }
        });
    }

}


