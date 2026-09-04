package com.hanghai.kchtg.gis.spatial.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class GisGeometryTypeConverter implements AttributeConverter<GisGeometryType, Integer> {
    @Override
    public Integer convertToDatabaseColumn(GisGeometryType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public GisGeometryType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (GisGeometryType type : GisGeometryType.values()) {
            if (type.getValue() == dbData) {
                return type;
            }
        }
        // Fallback an toàn cho dữ liệu legacy hoặc 0-indexed ordinal (0 -> POINT)
        if (dbData == 0) {
            return GisGeometryType.POINT;
        }
        throw new IllegalArgumentException("Unknown database value for GisGeometryType: " + dbData);
    }
}
