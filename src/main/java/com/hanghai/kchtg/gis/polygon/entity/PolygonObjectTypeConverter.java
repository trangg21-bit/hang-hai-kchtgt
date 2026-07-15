package com.hanghai.kchtg.gis.polygon.entity;

import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ObjectType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PolygonObjectTypeConverter implements AttributeConverter<ObjectType, Integer> {
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
        return ObjectType.OTHER;
    }
}
