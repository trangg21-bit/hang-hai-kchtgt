package com.hanghai.kchtg.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Read-only province catalogue used for display-consistent list sorting. */
@Entity
@Table(name = "provinces")
public class Province {

    @Id
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private Short sortOrder;

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Short getSortOrder() {
        return sortOrder;
    }
}
