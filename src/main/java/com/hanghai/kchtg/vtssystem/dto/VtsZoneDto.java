package com.hanghai.kchtg.vtssystem.dto;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
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
    private GisGeometryType geometryType;
    private String coordinates;
    private UUID spatialId;

    public static VtsZoneDto of(UUID id, String code, String name, ConditionStatus conditionStatus) {
        return new VtsZoneDto(id, code, name, conditionStatus, null, null, null);
    }

    public static VtsZoneDto of(UUID id, String code, String name, ConditionStatus conditionStatus, GisGeometryType geometryType, String coordinates) {
        return new VtsZoneDto(id, code, name, conditionStatus, geometryType, coordinates, null);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private String code;
        private String name;
        private ConditionStatus conditionStatus;
        private GisGeometryType geometryType;
        private String coordinates;
        private UUID spatialId;

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

        public Builder geometryType(GisGeometryType geometryType) {
            this.geometryType = geometryType;
            return this;
        }

        public Builder coordinates(String coordinates) {
            this.coordinates = coordinates;
            return this;
        }

        public Builder spatialId(UUID spatialId) {
            this.spatialId = spatialId;
            return this;
        }

        public VtsZoneDto build() {
            return new VtsZoneDto(id, code, name, conditionStatus, geometryType, coordinates, spatialId);
        }
    }
}
