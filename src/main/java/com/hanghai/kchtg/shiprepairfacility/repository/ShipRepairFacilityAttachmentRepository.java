package com.hanghai.kchtg.shiprepairfacility.repository;

import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairFacilityAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShipRepairFacilityAttachmentRepository extends JpaRepository<ShipRepairFacilityAttachment, UUID> {

    List<ShipRepairFacilityAttachment> findByShipRepairFacilityId(UUID shipRepairFacilityId);

    void deleteByShipRepairFacilityId(UUID shipRepairFacilityId);
}
