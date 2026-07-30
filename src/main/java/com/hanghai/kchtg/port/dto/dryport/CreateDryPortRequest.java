<<<<<<< HEAD
package com.hanghai.kchtg.port.dto.dryport;

import java.util.UUID;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data
public class CreateDryPortRequest {

    @NotBlank(message = "Mã cảng cạn không được để trống")
    @Size(max = 50)
    private String dryPortCode;

    @NotBlank(message = "Tên cảng cạn không được để trống")
    @Size(max = 255)
    private String dryPortName;

    @Size(max = 100)
    private String province;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal longitude;

    private BigDecimal area;

    private BigDecimal teuCapacity;
    private com.hanghai.kchtg.common.entity.OperationalStatus operationalStatus;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;

    @AssertTrue(message = "Vĩ độ và kinh độ phải được điền đồng thời")
    public boolean isGpsPaired() {
        return (latitude == null && longitude == null) || (latitude != null && longitude != null);
    }
}
=======
package com.hanghai.kchtg.port.dto.dryport;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateDryPortRequest {

    @NotBlank(message = "Mã cảng cạn không được để trống")
    @Size(max = 50)
    private String dryPortCode;

    @NotBlank(message = "Tên cảng cạn không được để trống")
    @Size(max = 255)
    private String dryPortName;

    private Integer provinceId;

    @DecimalMin(value = "-90", message = "Vĩ độ phải từ -90 đến 90")
    @DecimalMax(value = "90", message = "Vĩ độ phải từ -90 đến 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180", message = "Kinh độ phải từ -180 đến 180")
    @DecimalMax(value = "180", message = "Kinh độ phải từ -180 đến 180")
    private BigDecimal longitude;

    @DecimalMin(value = "0", inclusive = false, message = "Diện tích phải lớn hơn 0")
    private BigDecimal area;

    private BigDecimal teuCapacity;
    private OperationalStatus operationalStatus;
    private UUID mapSymbolId;
    private GisGeometryType geometryType;
    private String coordinates;

    @AssertTrue(message = "Vĩ độ và kinh độ phải được điền đồng thời")
    public boolean isGpsPaired() {
        return (latitude == null && longitude == null) || (latitude != null && longitude != null);
    }
}
>>>>>>> origin
