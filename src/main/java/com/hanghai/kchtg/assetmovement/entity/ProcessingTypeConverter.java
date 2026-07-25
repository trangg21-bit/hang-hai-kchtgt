package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ProcessingTypeConverter implements AttributeConverter<ProcessingType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(ProcessingType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public ProcessingType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (ProcessingType e : ProcessingType.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("GiÃ¡ trá»‹ database khÃ´ng há»£p lá»‡ cho ProcessingType: " + dbData);
    }
}
