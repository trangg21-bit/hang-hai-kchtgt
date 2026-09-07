package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.MaintenancePlanWork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenancePlanWorkRepository extends JpaRepository<MaintenancePlanWork, UUID> {

    List<MaintenancePlanWork> findByMaintenancePlanId(UUID maintenancePlanId);
}
