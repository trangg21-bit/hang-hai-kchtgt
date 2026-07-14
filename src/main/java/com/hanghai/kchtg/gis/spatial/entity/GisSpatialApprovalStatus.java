package com.hanghai.kchtg.gis.spatial.entity;

import lombok.Getter;

@Getter
public enum GisSpatialApprovalStatus {
    PENDING(0, "Chờ duyệt"),
    APPROVED(1, "Đã duyệt"),
    REJECTED(2, "Từ chối");

    private final int value;
    private final String label;

    GisSpatialApprovalStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }
}
