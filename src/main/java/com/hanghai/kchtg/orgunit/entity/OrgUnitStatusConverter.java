package com.hanghai.kchtg.orgunit.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class OrgUnitStatusConverter implements AttributeConverter<OrgUnitStatus, Short> {

    @Override
    public Short convertToDatabaseColumn(OrgUnitStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return (short) attribute.ordinal();
    }

    @Override
    public OrgUnitStatus convertToEntityAttribute(Short dbData) {
        if (dbData == null) {
            return null;
        }
        OrgUnitStatus[] values = OrgUnitStatus.values();
        if (dbData >= 0 && dbData < values.length) {
            return values[dbData];
        }
        return null;
    }
}
