package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.MaintenancePlanFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenancePlanFileRepository extends JpaRepository<MaintenancePlanFile, UUID> {

    List<MaintenancePlanFile> findByMaintenancePlanId(UUID maintenancePlanId);
}
