package com.hanghai.kchtg.user.repository;

import com.hanghai.kchtg.user.entity.SystemMenu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SystemMenuRepository extends JpaRepository<SystemMenu, String> {

    List<SystemMenu> findByAppCodeAndStatusAndHideMenuOrderByOrderNoAscMenuCodeAsc(
            String appCode, Integer status, Boolean hideMenu);
}
