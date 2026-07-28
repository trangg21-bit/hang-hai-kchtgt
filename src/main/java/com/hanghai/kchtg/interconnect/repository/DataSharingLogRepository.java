package com.hanghai.kchtg.interconnect.repository;

import com.hanghai.kchtg.interconnect.entity.DataSharingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DataSharingLogRepository
        extends JpaRepository<DataSharingLog, UUID> {
}
