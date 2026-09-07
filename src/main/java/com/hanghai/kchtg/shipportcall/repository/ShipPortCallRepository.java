package com.hanghai.kchtg.shipportcall.repository;

import com.hanghai.kchtg.shipportcall.entity.ShipPortCall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for {@link ShipPortCall} (F-300). List filters run through
 * {@link JpaSpecificationExecutor} — the service composes Specifications per design plan §6.
 */
@Repository
public interface ShipPortCallRepository
        extends JpaRepository<ShipPortCall, UUID>, JpaSpecificationExecutor<ShipPortCall> {
}
