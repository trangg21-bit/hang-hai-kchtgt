package com.hanghai.kchtg.gis.spatial.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class GisSpatialStatusConverter implements AttributeConverter<GisSpatialStatus, Integer> {
    @Override
    public Integer convertToDatabaseColumn(GisSpatialStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public GisSpatialStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (GisSpatialStatus status : GisSpatialStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for GisSpatialStatus: " + dbData);
    }
}
