package com.hanghai.kchtg.vtssystem.repository;

import com.hanghai.kchtg.vtssystem.entity.VtsZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VtsZoneRepository extends JpaRepository<VtsZone, UUID> {
    List<VtsZone> findByVtsSystemIdOrderByCreatedAtAsc(UUID vtsSystemId);
}
