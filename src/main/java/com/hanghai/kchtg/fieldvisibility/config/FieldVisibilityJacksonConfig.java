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
