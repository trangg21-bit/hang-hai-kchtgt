package com.hanghai.kchtg.gis.spatial.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class GisSpatialApprovalStatusConverter implements AttributeConverter<GisSpatialApprovalStatus, Integer> {
    @Override
    public Integer convertToDatabaseColumn(GisSpatialApprovalStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public GisSpatialApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (GisSpatialApprovalStatus status : GisSpatialApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for GisSpatialApprovalStatus: " + dbData);
    }
}
