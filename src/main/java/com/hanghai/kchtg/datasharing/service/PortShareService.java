package com.hanghai.kchtg.datasharing.service;

import com.hanghai.kchtg.datasharing.entity.ShareDataType;
import com.hanghai.kchtg.datasharing.entity.SharedData;
import com.hanghai.kchtg.datasharing.repository.SharedDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortShareService {
    private final SharedDataRepository repository;

    @Transactional(readOnly = true)
    public List<SharedData> getSharedPortData(String recipient) {
        return repository.findByDataType(ShareDataType.PORT)
            .stream().filter(d -> d.getSharedWith().equals(recipient)).toList();
    }

    @Transactional(readOnly = true)
    public List<SharedData> getSharedDockData(String recipient) {
        return repository.findByDataType(ShareDataType.DOCK)
            .stream().filter(d -> d.getSharedWith().equals(recipient)).toList();
    }
}
