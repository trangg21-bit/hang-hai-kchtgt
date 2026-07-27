package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ProcessingRecordStatusConverter implements AttributeConverter<ProcessingRecordStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(ProcessingRecordStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public ProcessingRecordStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (ProcessingRecordStatus e : ProcessingRecordStatus.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("Giá trị database không hợp lệ cho ProcessingRecordStatus: " + dbData);
    }
}
