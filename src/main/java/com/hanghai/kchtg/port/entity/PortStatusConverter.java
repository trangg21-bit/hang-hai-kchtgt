package com.hanghai.kchtg.port.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PortStatusConverter implements AttributeConverter<PortStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(PortStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public PortStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (PortStatus st : PortStatus.values()) {
            if (st.getValue() == dbData) {
                return st;
            }
        }
        throw new IllegalArgumentException("Giá trị trạng thái không hợp lệ trong cơ sở dữ liệu: " + dbData);
    }
}
