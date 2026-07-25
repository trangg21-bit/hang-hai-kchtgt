package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InventoryTypeConverter implements AttributeConverter<InventoryType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(InventoryType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public InventoryType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (InventoryType e : InventoryType.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("GiÃ¡ trá»‹ database khÃ´ng há»£p lá»‡ cho InventoryType: " + dbData);
    }
}
