package com.hanghai.kchtg.fieldvisibility;

import com.hanghai.kchtg.fieldvisibility.entity.FieldEffect;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FieldWriteGuardTest {

        @AfterEach
        void tearDown() {
                FieldVisibilityContext.clear();
        }

        static class SampleDto {
                private String name;
                private String sensitiveField;

                public SampleDto(String name, String sensitiveField) {
                        this.name = name;
                        this.sensitiveField = sensitiveField;
                }

                public String getName() {
                        return name;
                }

                public String getSensitiveField() {
                        return sensitiveField;
                }
        }

        @Test
        void check_whenFieldAllowed_shouldPass() {
                FieldVisibilityContext.set(Map.of("sensitiveField", FieldEffect.READONLY));

                // Allowed field
                assertThatCode(() -> FieldWriteGuard.check("name", "Valid Name"))
                                .doesNotThrowAnyException();

                // Null value for readonly field is ignored (not writing)
                assertThatCode(() -> FieldWriteGuard.check("sensitiveField", null))
                                .doesNotThrowAnyException();
        }

        @Test
        void check_whenFieldReadOnlyOrHidden_shouldThrowAccessDenied() {
                FieldVisibilityContext.set(Map.of(
                                "readonlyField", FieldEffect.READONLY,
                                "hiddenField", FieldEffect.HIDE));

                assertThatThrownBy(() -> FieldWriteGuard.check("readonlyField", "new-val"))
                                .isInstanceOf(AccessDeniedException.class)
                                .hasMessageContaining("readonlyField");

                assertThatThrownBy(() -> FieldWriteGuard.check("hiddenField", "new-val"))
                                .isInstanceOf(AccessDeniedException.class)
                                .hasMessageContaining("hiddenField");
        }

        @Test
        void validateMap_whenContainsRestrictedField_shouldThrow() {
                FieldVisibilityContext.set(Map.of("blocked", FieldEffect.READONLY));

                Map<String, Object> map = Map.of("allowed", "ok", "blocked", "fail");
                assertThatThrownBy(() -> FieldWriteGuard.validateMap(map))
                                .isInstanceOf(AccessDeniedException.class)
                                .hasMessageContaining("blocked");
        }

        @Test
        void validateObject_whenDtoContainsRestrictedField_shouldThrow() {
                FieldVisibilityContext.set(Map.of("sensitiveField", FieldEffect.READONLY));

                SampleDto validDto = new SampleDto("Alice", null);
                assertThatCode(() -> FieldWriteGuard.validateObject(validDto))
                                .doesNotThrowAnyException();

                SampleDto invalidDto = new SampleDto("Alice", "Secret Data");
                assertThatThrownBy(() -> FieldWriteGuard.validateObject(invalidDto))
                                .isInstanceOf(AccessDeniedException.class)
                                .hasMessageContaining("sensitiveField");
        }

        @Test
        void validateUpdate_whenMutatingOrClearingReadOnlyField_shouldThrow() {
                FieldVisibilityContext.set(Map.of("sensitiveField", FieldEffect.READONLY));

                SampleDto existingEntity = new SampleDto("Alice", "Existing Secret");

                // Attempting to clear existing sensitiveField by sending null -> MUST be
                // rejected
                SampleDto nullPayload = new SampleDto("Alice", null);
                assertThatThrownBy(() -> FieldWriteGuard.validateUpdate(nullPayload, existingEntity))
                                .isInstanceOf(AccessDeniedException.class)
                                .hasMessageContaining("sensitiveField");

                // Attempting to update sensitiveField to a new value -> MUST be rejected
                SampleDto changedPayload = new SampleDto("Alice", "New Secret");
                assertThatThrownBy(() -> FieldWriteGuard.validateUpdate(changedPayload, existingEntity))
                                .isInstanceOf(AccessDeniedException.class)
                                .hasMessageContaining("sensitiveField");

                // Unchanged non-restricted field with same sensitiveField value -> passes
                SampleDto identicalPayload = new SampleDto("Bob", "Existing Secret");
                // But sensitiveField is not null in identicalPayload so validateObject triggers
                // unless sensitiveField was null
                SampleDto nullOldEntity = new SampleDto("Alice", null);
                SampleDto nullNewPayload = new SampleDto("Bob", null);
                assertThatCode(() -> FieldWriteGuard.validateUpdate(nullNewPayload, nullOldEntity))
                                .doesNotThrowAnyException();
        }

        @Test
        void validateFieldChange_whenValuesDiffer_shouldAssertWritable() {
                FieldVisibilityContext.set(Map.of("phone", FieldEffect.READONLY));

                // Unchanged value passes
                assertThatCode(() -> FieldWriteGuard.validateFieldChange("phone", "0901234567", "0901234567"))
                                .doesNotThrowAnyException();

                // Mutated value throws
                assertThatThrownBy(() -> FieldWriteGuard.validateFieldChange("phone", "0909999999", "0901234567"))
                                .isInstanceOf(AccessDeniedException.class)
                                .hasMessageContaining("phone");

                // Cleared value throws
                assertThatThrownBy(() -> FieldWriteGuard.validateFieldChange("phone", null, "0901234567"))
                                .isInstanceOf(AccessDeniedException.class)
                                .hasMessageContaining("phone");
        }
}
