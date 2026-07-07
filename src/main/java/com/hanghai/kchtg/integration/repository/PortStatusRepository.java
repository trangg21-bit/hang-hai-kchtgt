package com.hanghai.kchtg.integration.repository;

import com.hanghai.kchtg.integration.entity.PortStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;
public interface PortStatusRepository extends JpaRepository<PortStatus, UUID> {

    Optional<PortStatus> findByPortCode(String portCode);

    @Query(value = "SELECT COUNT(*) FROM kchtgt_port_status WHERE port_code = :portCode", nativeQuery = true)
    long countByPortCodeIncludingDeleted(@Param("portCode") String portCode);

    Page<PortStatus> findByOperationalStatus(String operationalStatus, Pageable pageable);
}