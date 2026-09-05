package com.hanghai.kchtg.document.entity;

/**
 * Nhóm quy hoạch bến cảng — fixed 2-value group (F-132).
 * Stored as ORDINAL INT in column {@code planning_group} (D7-FINAL).
 */
public enum PortPlanningGroup {

    SEAPORT("Cảng biển"),
    DRY_PORT("Cảng cạn");

    private final String label;

    PortPlanningGroup(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
