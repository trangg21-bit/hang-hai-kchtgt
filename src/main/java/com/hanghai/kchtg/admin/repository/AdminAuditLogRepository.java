package com.hanghai.kchtg.admin.repository;

import com.hanghai.kchtg.admin.entity.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;
import java.util.UUID;
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, UUID>,
        JpaSpecificationExecutor<AdminAuditLog> {

    List<AdminAuditLog> findByAdminIdOrderByCreatedAtDesc(UUID adminId);

    List<AdminAuditLog> findAllByOrderByCreatedAtDesc();
}