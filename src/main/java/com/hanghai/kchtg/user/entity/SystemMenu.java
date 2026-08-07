package com.hanghai.kchtg.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.EqualsAndHashCode;

/**
 * Danh mục chức năng/menu theo mô hình AUTH_MENU của dự án gốc hh.csdl.
 * Menu code là mã chức năng giao diện, tách biệt với permission API resource:action.
 */
@Entity
@Table(name = "system_menus", indexes = {
        @Index(name = "idx_system_menus_tree", columnList = "app_code,parent_code,status,hide_menu,order_no")
})
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(of = "menuCode")
public class SystemMenu {

    @Id
    @Column(name = "menu_code", length = 100, nullable = false)
    private String menuCode;

    @Column(name = "app_code", length = 100, nullable = false)
    private String appCode;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(length = 500)
    private String url;

    @Column(name = "parent_code", length = 100, nullable = false)
    private String parentCode;

    @Column(nullable = false)
    private Integer status;

    @Column(name = "order_no", nullable = false)
    private Integer orderNo;

    @Column(nullable = false)
    private Integer type;

    @Column(name = "level_used", nullable = false)
    private Integer levelUsed;

    @Column(name = "level_menu", nullable = false)
    private Integer levelMenu;

    @Column(name = "hide_menu", nullable = false)
    private Boolean hideMenu;
}
