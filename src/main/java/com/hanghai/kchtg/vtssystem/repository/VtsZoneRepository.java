package com.hanghai.kchtg.vtssystem.repository;

import com.hanghai.kchtg.vtssystem.entity.VtsZone;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VtsZoneRepository extends JpaRepository<VtsZone, UUID> {
    List<VtsZone> findByVtsSystemIdOrderByCreatedAtAsc(UUID vtsSystemId);
    Page<VtsZone> findByVtsSystemId(UUID vtsSystemId, Pageable pageable);
    Optional<VtsZone> findByIdAndVtsSystemId(UUID id, UUID vtsSystemId);
    boolean existsByVtsSystemIdAndCode(UUID vtsSystemId, String code);
    boolean existsByVtsSystemIdAndCodeAndIdNot(UUID vtsSystemId, String code, UUID id);
    long countByVtsSystemId(UUID vtsSystemId);
}
