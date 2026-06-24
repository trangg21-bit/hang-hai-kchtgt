package com.hanghai.kchtg.gis.repository;

import com.hanghai.kchtg.gis.entity.S63Permit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface S63PermitRepository extends JpaRepository<S63Permit, UUID> {
    Optional<S63Permit> findByCellName(String cellName);
}
