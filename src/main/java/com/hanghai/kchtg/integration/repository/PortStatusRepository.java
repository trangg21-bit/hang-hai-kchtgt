package com.hanghai.kchtg.integration.repository;

import com.hanghai.kchtg.integration.entity.PortStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface PortStatusRepository extends JpaRepository<PortStatus, UUID> {

    Optional<PortStatus> findByPortCode(String portCode);

    Page<PortStatus> findByOperationalStatus(String operationalStatus, Pageable pageable);
}