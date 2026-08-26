package com.hanghai.kchtg.vtssystem.dto;

import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VtsZoneDto {
    private UUID id;
    private String code;
    private String name;
    private ConditionStatus conditionStatus;

    public static VtsZoneDto of(UUID id, String code, String name, ConditionStatus conditionStatus) {
        return new VtsZoneDto(id, code, name, conditionStatus);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private String code;
        private String name;
        private ConditionStatus conditionStatus;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder code(String code) {
            this.code = code;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder conditionStatus(ConditionStatus conditionStatus) {
            this.conditionStatus = conditionStatus;
            return this;
        }

        public VtsZoneDto build() {
            return new VtsZoneDto(id, code, name, conditionStatus);
        }
    }
}
