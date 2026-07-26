package com.hanghai.kchtg.assetmovement.repository;

import java.util.UUID;

import com.hanghai.kchtg.assetmovement.entity.InventoryPlan;
import com.hanghai.kchtg.assetmovement.entity.InventoryType;
import com.hanghai.kchtg.assetmovement.entity.PlanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryPlanRepository extends JpaRepository<InventoryPlan, UUID> {

    List<InventoryPlan> findByStatus(PlanStatus status);

    List<InventoryPlan> findByInventoryType(InventoryType inventoryType);

    Page<InventoryPlan> findByStatus(PlanStatus status, Pageable pageable);

    long countByStatus(PlanStatus status);
}
