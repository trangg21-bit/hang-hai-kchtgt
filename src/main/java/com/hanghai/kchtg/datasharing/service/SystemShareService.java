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
public class SystemShareService {
    private final SharedDataRepository repository;

    @Transactional(readOnly = true)
    public List<SharedData> getVssData(String recipient) {
        return repository.findByDataType(ShareDataType.VTS_SYSTEM)
            .stream().filter(d -> d.getSharedWith().equals(recipient)).toList();
    }

    @Transactional(readOnly = true)
    public List<SharedData> getAISData(String recipient) {
        return repository.findByDataType(ShareDataType.AIS_SYSTEM)
            .stream().filter(d -> d.getSharedWith().equals(recipient)).toList();
    }

    @Transactional(readOnly = true)
    public List<SharedData> getCCTVData(String recipient) {
        return repository.findByDataType(ShareDataType.CCTV_SYSTEM)
            .stream().filter(d -> d.getSharedWith().equals(recipient)).toList();
    }

    @Transactional(readOnly = true)
    public List<SharedData> getSCADData(String recipient) {
        return repository.findByDataType(ShareDataType.SCADA_SYSTEM)
            .stream().filter(d -> d.getSharedWith().equals(recipient)).toList();
    }
}
