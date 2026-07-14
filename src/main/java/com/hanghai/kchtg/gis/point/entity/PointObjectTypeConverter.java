package com.hanghai.kchtg.gis.point.entity;

import com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PointObjectTypeConverter implements AttributeConverter<ObjectType, Integer> {
    @Override
    public Integer convertToDatabaseColumn(ObjectType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public ObjectType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (ObjectType type : ObjectType.values()) {
            if (type.getValue() == dbData) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown database value for PointObject.ObjectType: " + dbData);
    }
}
