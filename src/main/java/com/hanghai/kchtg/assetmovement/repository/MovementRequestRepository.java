package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.MovementType;
import com.hanghai.kchtg.assetmovement.entity.RequestStatus;
import com.hanghai.kchtg.assetmovement.entity.MovementRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

@Repository
public interface MovementRequestRepository extends JpaRepository<MovementRequest, UUID> {

    List<MovementRequest> findByMovementType(MovementType movementType);

    Page<MovementRequest> findByMovementType(MovementType movementType, Pageable pageable);

    List<MovementRequest> findByStatus(RequestStatus status);

    Page<MovementRequest> findByStatus(RequestStatus status, Pageable pageable);

    Page<MovementRequest> findByMovementTypeAndStatus(MovementType movementType, RequestStatus status, Pageable pageable);

    List<MovementRequest> findByCreatorName(UUID creatorName);

    long countByStatusAndDeletedAtIsNull(RequestStatus status);
}
