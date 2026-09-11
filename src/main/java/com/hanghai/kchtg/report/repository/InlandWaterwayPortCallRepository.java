package com.hanghai.kchtg.report.repository;

import com.hanghai.kchtg.report.entity.InlandWaterwayPortCall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository cho {@link InlandWaterwayPortCall} (F-162 / BCDL_177).
 */
@Repository
public interface InlandWaterwayPortCallRepository
        extends JpaRepository<InlandWaterwayPortCall, UUID>, JpaSpecificationExecutor<InlandWaterwayPortCall> {
}
