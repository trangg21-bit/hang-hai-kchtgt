package com.hanghai.kchtg.seaportthroughput.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Kết quả import Excel số liệu sản lượng cảng biển (F-301). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeaportThroughputImportResponse {

    private int importedRows;
}
