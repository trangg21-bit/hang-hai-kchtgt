package com.hanghai.kchtg.fieldvisibility.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.SerializationConfig;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.BeanPropertyWriter;
import com.fasterxml.jackson.databind.ser.BeanSerializerModifier;
import com.hanghai.kchtg.fieldvisibility.FieldVisibilityContext;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import java.util.ArrayList;
import java.util.List;

/**
 * Global Jackson customization (M-1004): strips HIDE fields from every JSON
 * bean,
 * with NO per-DTO {@code @JsonFilter} annotations.
 * <p>
 * The filter consults the request-scoped {@link FieldVisibilityContext}
 * ThreadLocal
 * AT WRITE TIME (per field, per request thread) — never at
 * serializer-construction
 * time, which keeps it safe with Jackson's cached/shared serializer instances.
 * READONLY fields pass through untouched; when the ThreadLocal is empty the
 * filter
 * is a no-op (default ALLOW).
 * </p>
 */
@Configuration
public class FieldVisibilityJacksonConfig implements Jackson2ObjectMapperBuilderCustomizer {

    @Override
    public void customize(Jackson2ObjectMapperBuilder builder) {
        SimpleModule module = new SimpleModule("FieldVisibilityJacksonModule");
        module.setSerializerModifier(new FieldVisibilitySerializerModifier());
        module.addSerializer(java.math.BigDecimal.class, new com.fasterxml.jackson.databind.JsonSerializer<java.math.BigDecimal>() {
            @Override
            public void serialize(java.math.BigDecimal value, JsonGenerator gen, SerializerProvider serializers) throws java.io.IOException {
                if (value == null) {
                    gen.writeNull();
                } else {
                    java.math.BigDecimal stripped = value.stripTrailingZeros();
                    if (stripped.scale() < 0) {
                        stripped = stripped.setScale(0);
                    }
                    gen.writeString(stripped.toPlainString());
                }
            }
        });
        module.addDeserializer(java.time.LocalDate.class, new com.fasterxml.jackson.databind.JsonDeserializer<java.time.LocalDate>() {
            @Override
            public java.time.LocalDate deserialize(com.fasterxml.jackson.core.JsonParser p, com.fasterxml.jackson.databind.DeserializationContext ctxt) throws java.io.IOException {
                String text = p.getText();
                if (text == null || text.trim().isEmpty() || "null".equalsIgnoreCase(text.trim())) {
                    return null;
                }
                text = text.trim();
                try {
                    return java.time.LocalDate.parse(text);
                } catch (java.time.format.DateTimeParseException ignored) {}
                try {
                    return java.time.LocalDate.parse(text, java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                } catch (java.time.format.DateTimeParseException ignored) {}
                try {
                    return java.time.LocalDate.parse(text, java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                } catch (java.time.format.DateTimeParseException ignored) {}
                try {
                    return java.time.LocalDate.parse(text, java.time.format.DateTimeFormatter.ofPattern("yyyy/MM/dd"));
                } catch (java.time.format.DateTimeParseException ignored) {}
                if (text.length() >= 10) {
                    try {
                        return java.time.LocalDate.parse(text.substring(0, 10));
                    } catch (Exception ignored) {}
                }
                throw new IllegalArgumentException("Định dạng ngày không hợp lệ: '" + text + "' (hỗ trợ yyyy-MM-dd hoặc dd/MM/yyyy)");
            }
        });
        module.addDeserializer(java.time.LocalDateTime.class, new com.fasterxml.jackson.databind.JsonDeserializer<java.time.LocalDateTime>() {
            @Override
            public java.time.LocalDateTime deserialize(com.fasterxml.jackson.core.JsonParser p, com.fasterxml.jackson.databind.DeserializationContext ctxt) throws java.io.IOException {
                String text = p.getText();
                if (text == null || text.trim().isEmpty() || "null".equalsIgnoreCase(text.trim())) {
                    return null;
                }
                text = text.trim();
                try {
                    return java.time.LocalDateTime.parse(text);
                } catch (Exception ignored) {}
                try {
                    return java.time.LocalDateTime.parse(text, java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
                } catch (Exception ignored) {}
                try {
                    return java.time.LocalDate.parse(text).atStartOfDay();
                } catch (Exception ignored) {}
                try {
                    return java.time.LocalDate.parse(text, java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")).atStartOfDay();
                } catch (Exception ignored) {}
                return null;
            }
        });
        builder.modulesToInstall(module);
    }

    /**
     * Serializer modifier that wraps all BeanPropertyWriters to enforce write-time
     * visibility checks.
     */
    private static final class FieldVisibilitySerializerModifier extends BeanSerializerModifier {
        @Override
        public List<BeanPropertyWriter> changeProperties(SerializationConfig config,
                BeanDescription beanDesc,
                List<BeanPropertyWriter> beanProperties) {
            List<BeanPropertyWriter> modified = new ArrayList<>(beanProperties.size());
            for (BeanPropertyWriter writer : beanProperties) {
                modified.add(new FieldVisibilityPropertyWriter(writer));
            }
            return modified;
        }
    }

    /**
     * Stateless write-time property writer: skip the field when it is hidden for
     * this request.
     */
    private static final class FieldVisibilityPropertyWriter extends BeanPropertyWriter {
        public FieldVisibilityPropertyWriter(BeanPropertyWriter base) {
            super(base);
        }

        @Override
        public void serializeAsField(Object bean, JsonGenerator gen, SerializerProvider prov) throws Exception {
            if (FieldVisibilityContext.isHidden(getName())) {
                return; // HIDE — do not write the field
            }
            super.serializeAsField(bean, gen, prov);
        }
    }
}
