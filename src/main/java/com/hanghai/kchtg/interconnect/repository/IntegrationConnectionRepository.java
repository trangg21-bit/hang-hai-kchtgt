package com.hanghai.kchtg.interconnect.repository;

import com.hanghai.kchtg.interconnect.entity.IntegrationConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IntegrationConnectionRepository
        extends JpaRepository<IntegrationConnection, UUID>,
        JpaSpecificationExecutor<IntegrationConnection> {

}
