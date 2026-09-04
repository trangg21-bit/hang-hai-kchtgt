package com.hanghai.kchtg.gis.spatial.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class GisSpatialObjectTypeConverter implements AttributeConverter<GisSpatialObjectType, Integer> {
    @Override
    public Integer convertToDatabaseColumn(GisSpatialObjectType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public GisSpatialObjectType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (GisSpatialObjectType type : GisSpatialObjectType.values()) {
            if (type.getValue() == dbData) {
                return type;
            }
        }
        for (GisSpatialObjectType type : GisSpatialObjectType.values()) {
            if (type.ordinal() == dbData) {
                return type;
            }
        }
        // Fallback an toàn cho dữ liệu legacy hoặc không xác định (tương tự PointObjectTypeConverter)
        return GisSpatialObjectType.POINT_OTHER;
    }
}
