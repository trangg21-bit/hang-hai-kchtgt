package com.hanghai.kchtg.luonghanghai.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class LuongHangHaiApprovalStatusConverter implements AttributeConverter<LuongHangHaiApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(LuongHangHaiApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public LuongHangHaiApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (LuongHangHaiApprovalStatus status : LuongHangHaiApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for LuongHangHaiApprovalStatus: " + dbData);
    }
}
