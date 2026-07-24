package com.hanghai.kchtg.shiprepairfacility.repository;

import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairFacilityAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipRepairFacilityAttachmentRepository extends JpaRepository<ShipRepairFacilityAttachment, Long> {

    List<ShipRepairFacilityAttachment> findByShipRepairFacilityId(java.util.UUID shipRepairFacilityId);

    void deleteByShipRepairFacilityId(java.util.UUID shipRepairFacilityId);
}
