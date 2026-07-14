package com.hanghai.kchtg.gis.polygon.entity;

import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.Status;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PolygonStatusConverter implements AttributeConverter<Status, Integer> {
    @Override
    public Integer convertToDatabaseColumn(Status attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public Status convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (Status status : Status.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for PolygonObject.Status: " + dbData);
    }
}
