package com.hanghai.kchtg.orgunit.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class OrgUnitRankConverter implements AttributeConverter<OrgUnitRank, Short> {

    @Override
    public Short convertToDatabaseColumn(OrgUnitRank attribute) {
        if (attribute == null) {
            return null;
        }
        return (short) attribute.ordinal();
    }

    @Override
    public OrgUnitRank convertToEntityAttribute(Short dbData) {
        if (dbData == null) {
            return null;
        }
        OrgUnitRank[] values = OrgUnitRank.values();
        if (dbData >= 0 && dbData < values.length) {
            return values[dbData];
        }
        return null;
    }
}
