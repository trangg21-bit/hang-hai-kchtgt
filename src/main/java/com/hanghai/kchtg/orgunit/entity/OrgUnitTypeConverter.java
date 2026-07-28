package com.hanghai.kchtg.orgunit.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class OrgUnitTypeConverter implements AttributeConverter<OrgUnitType, Short> {

    @Override
    public Short convertToDatabaseColumn(OrgUnitType attribute) {
        if (attribute == null) {
            return null;
        }
        return (short) attribute.ordinal();
    }

    @Override
    public OrgUnitType convertToEntityAttribute(Short dbData) {
        if (dbData == null) {
            return null;
        }
        OrgUnitType[] values = OrgUnitType.values();
        if (dbData >= 0 && dbData < values.length) {
            return values[dbData];
        }
        return null;
    }
}
