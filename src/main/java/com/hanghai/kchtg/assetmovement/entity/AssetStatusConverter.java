package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class AssetStatusConverter implements AttributeConverter<AssetStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(AssetStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public AssetStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (AssetStatus e : AssetStatus.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("Giá trị database không hợp lệ cho AssetStatus: " + dbData);
    }
}
