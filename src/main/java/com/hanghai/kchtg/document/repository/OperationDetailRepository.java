package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.OperationDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OperationDetailRepository extends JpaRepository<OperationDetail, UUID> {

    /** Find all detail records for a specific plan */
    List<OperationDetail> findByOperationPlanId(UUID operationPlanId);
}
