package com.hanghai.kchtg.luonghanghai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KetQuaTimKiemResponse {

    private List<LuongHangHaiResponse> results;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
