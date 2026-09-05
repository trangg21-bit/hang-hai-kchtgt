package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.OperationPlanFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OperationPlanFileRepository extends JpaRepository<OperationPlanFile, UUID> {

    List<OperationPlanFile> findByOperationPlanId(UUID operationPlanId);
}
