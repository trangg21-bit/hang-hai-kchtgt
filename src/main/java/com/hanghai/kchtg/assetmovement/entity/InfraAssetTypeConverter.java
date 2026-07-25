package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InfraAssetTypeConverter implements AttributeConverter<InfraAssetType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(InfraAssetType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public InfraAssetType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (InfraAssetType e : InfraAssetType.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("GiÃ¡ trá»‹ database khÃ´ng há»£p lá»‡ cho InfraAssetType: " + dbData);
    }
}
