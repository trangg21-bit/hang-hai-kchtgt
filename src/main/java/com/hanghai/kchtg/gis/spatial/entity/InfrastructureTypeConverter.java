package com.hanghai.kchtg.gis.spatial.entity;

import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InfrastructureTypeConverter implements AttributeConverter<InfrastructureType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(InfrastructureType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.ordinal();
    }

    @Override
    public InfrastructureType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (InfrastructureType type : InfrastructureType.values()) {
            if (type.ordinal() == dbData) {
                return type;
            }
        }
        return null;
    }
}
