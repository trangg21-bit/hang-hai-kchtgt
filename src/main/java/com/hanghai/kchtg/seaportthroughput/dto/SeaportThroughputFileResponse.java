package com.hanghai.kchtg.seaportthroughput.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** Response thông tin file đính kèm bản ghi sản lượng cảng biển. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeaportThroughputFileResponse {

    private UUID id;
    private UUID throughputId;
    private String fileName;
    private Long fileSize;
    private String fileType;
}
