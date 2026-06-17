package com.hanghai.kchtg.admin.dto;

import com.hanghai.kchtg.admin.entity.AdminRole;
import com.hanghai.kchtg.admin.entity.AdminStatus;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateAdminRequest {

    private AdminRole role;

    private List<String> modules;

    private AdminStatus status;
}
