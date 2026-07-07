package com.hanghai.kchtg.cosuachua.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetResponse {

    private Long id;
    private String trangThai;
    private String quyetDinh;
    private String nguoiPheDuyet;
    private LocalDateTime ngayPheDuyet;
    private String lyDo;
}
