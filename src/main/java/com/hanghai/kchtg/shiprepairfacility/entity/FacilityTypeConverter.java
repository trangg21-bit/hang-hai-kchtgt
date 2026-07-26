package com.hanghai.kchtg.shiprepairfacility.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class FacilityTypeConverter implements AttributeConverter<FacilityType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(FacilityType attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public FacilityType convertToEntityAttribute(Integer dbData) {
        return dbData == null ? null : FacilityType.fromValue(dbData);
    }
}
