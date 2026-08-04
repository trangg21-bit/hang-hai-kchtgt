package com.hanghai.kchtg.common.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum AttachmentFileType {
    PDF(0, "PDF", "pdf", "application/pdf"),
    PNG(1, "PNG", "png", "image/png"),
    JPG(2, "JPG", "jpg", "jpeg", "image/jpeg", "image/jpg"),
    WEBP(3, "WEBP", "webp", "image/webp"),
    DOC(4, "DOC", "doc", "application/msword"),
    DOCX(5, "DOCX", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    XLS(6, "XLS", "xls", "application/vnd.ms-excel"),
    XLSX(7, "XLSX", "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    CAD(8, "CAD", "dwg", "dxf"),
    ZIP(9, "ZIP", "zip", "rar", "7z"),
    OTHER(10, "OTHER");

    private final int value;
    private final String code;
    private final String[] keywords;

    AttachmentFileType(int value, String code, String... keywords) {
        this.value = value;
        this.code = code;
        this.keywords = keywords;
    }

    @JsonValue
    public int getValue() {
        return value;
    }

    public String getCode() {
        return code;
    }

    @JsonCreator
    public static AttachmentFileType fromValue(Object input) {
        if (input == null) return OTHER;
        if (input instanceof Number) {
            int val = ((Number) input).intValue();
            for (AttachmentFileType t : values()) {
                if (t.value == val) return t;
            }
            return OTHER;
        }
        String str = input.toString().trim().toLowerCase();
        for (AttachmentFileType type : values()) {
            if (type.code.equalsIgnoreCase(str)) return type;
            for (String kw : type.keywords) {
                if (str.contains(kw)) return type;
            }
        }
        return OTHER;
    }
}
