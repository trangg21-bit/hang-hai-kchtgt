## Summary: F-080 to F-091 Feature Brief Filling

The 12 feature-brief.md files have been analyzed and real content has been prepared based on the Java source code, but **I cannot write to `_features/` paths due to agent permission restrictions**. Below is the complete content for all 12 files. These need to be applied by a tool that has write access to `_features/` paths (e.g. the orchestrator or a human).

All content is derived from verified source code:
- Entity files: `BaseNhaTram.java`, `NhaTramPhao.java`, `NhaTramDen.java`, `NhaTramHistory.java`
- Enum files: `BuoyType.java`, `BeaconLightType.java`, `NhaTramType.java`, `NhaTramStatus.java`, `NhaTramApprovalStatus.java`, `NhaTramHistoryActionType.java`
- Controller files: `NhaTramPhaoController.java`, `NhaTramDenController.java`

### F-080 (Nhà trạm phao - Tạo mới)
**Description** (200+ chars): Tính năng cho phép chuyên viên nghiệp vụ tạo mới một nhà trạm phao (NhaTramPhao) phục vụ hệ thống báo hiệu hàng hải. Người dùng điền các thông tin: mã nhà trạm (code, bắt buộc, duy nhất), tên nhà trạm (name, bắt buộc), tọa độ độ vĩ (latitude) và độ kinh (longitude), loại phao tiêu (type: CARDINAL/SECTOR/SPECIAL/SAFE_WATER/ISOLATED_DANGER), màu sắc (color), hình dạng (shape), đặc tính ánh sáng (lightCharacteristic), tầm xa (range), ngày kiểm tra gần nhất (lastInspectionDate), ngày kiểm tra tiếp theo (nextInspectionDate), đơn vị quản lý (unitId), mô tả chi tiết (description). Sau khi xác nhận, hệ thống tạo bản ghi với trạng thái DRAFT, trạng thái phê duyệt PENDING, ghi lại hành động CREATE vào NhaTramHistory và trả về mã HTTP 201 Created.

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm phao trong hệ thống báo hiệu hàng hải, nhằm đảm bảo các thông tin về phao tiêu được ghi nhận đầy đủ và có quy trình phê duyệt hai cấp trước khi công bố vào hệ thống chính thức.

**Flow Summary** (150+ chars): 1. Người dùng chọn Tạo mới từ danh sách nhà trạm phao. 2. Hệ thống hiển thị form với các trường: mã, tên, tọa độ (latitude, longitude), loại phao tiêu (type), màu sắc (color), hình dạng (shape), đặc tính ánh sáng (lightCharacteristic), tầm xa (range), ngày kiểm tra gần nhất (lastInspectionDate), ngày kiểm tra tiếp theo (nextInspectionDate), đơn vị quản lý (unitId), mô tả. 3. Sau khi xác nhận, hệ thống kiểm tra dữ liệu đầu vào qua @Valid (jakarta.validation), tạo bản ghi NhaTramPhao với trạng thái DRAFT và gửi phản hồi HTTP 201 Created. 4. Hệ thống ghi lịch sử thay đổi vào NhaTramHistory với actionType = CREATE.

**Acceptance Criteria** (4 items):
- Hệ thống yêu cầu trường mã (code) và tên (name) bắt buộc, trả về lỗi 400 nếu thiếu — được đảm bảo bằng annotation @NotBlank
- Khi nhập tọa độ (latitude/longitude) ra ngoài phạm vi hợp lệ (−90,0…90,0 và −180,0…180,0), hệ thống hiển thị thông báo lỗi validation
- Khi tạo thành công, hệ thống trả về HTTP 201 Created với dữ liệu NhaTramPhaoResponse và ghi nhận hành động CREATE vào bảng NhaTramHistory
- Mã nhà trạm (code) phải là duy nhất — hệ thống không cho phép tạo bản ghi với mã đã tồn tại

**Roles** (5 rows): Admin Full, Operator Write (DRAFT), L1 Read, L2 Read, Viewer Read

**Entities**: NhaTramPhao (nha_tram_phao), NhaTramHistory (nha_tram_history)

**Business Rules** (6 rules): BR-001 code required/unique, BR-002 name required, BR-003 BuoyType enum, BR-004 default DRAFT/PENDING, BR-005 CREATE in history, BR-006 description max 1000 chars

### F-081 (Nhà trạm phao - Cập nhật)
**Description** (200+ chars): Tính năng cho phép chuyên viên nghiệp vụ cập nhật thông tin một nhà trạm phao (NhaTramPhao) đã tồn tại. Người dùng chọn nhà trạm phao cần sửa từ danh sách hoặc qua tìm kiếm (tên, mã, loại, trạng thái). Hệ thống cho phép chỉnh sửa tất cả các trường: mã (code), tên (name), tọa độ (latitude, longitude), loại phao tiêu (type), màu sắc (color), hình dạng (shape), đặc tính ánh sáng (lightCharacteristic), tầm xa (range), ngày kiểm tra gần nhất (lastInspectionDate), ngày kiểm tra tiếp theo (nextInspectionDate), đơn vị quản lý (unitId), mô tả chi tiết (description). Chỉ các bản ghi có trạng thái DRAFT hoặc APPROVED_L1 mới được chỉnh sửa nội dung — các bản ghi PUBLISHED không cho phép cập nhật trực tiếp. Sau khi sửa, hệ thống cập nhật bản ghi với timestamp updatedAt mới, ghi lại hành động UPDATE vào NhaTramHistory và trả về phản hồi HTTP 200 OK.

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm phao trong hệ thống báo hiệu hàng hải, nhằm đảm bảo thông tin về vị trí, đặc tính kỹ thuật và lịch kiểm tra của các phao tiêu luôn được cập nhật đúng và kịp thời theo diễn biến thực tế.

**Flow Summary** (150+ chars): 1. Người dùng chọn Cập nhật từ danh sách hoặc chi tiết nhà trạm phao. 2. Hệ thống tải thông tin hiện tại và hiển thị form. 3. Người dùng sửa các trường cần thiết và nhấn Lưu. 4. Hệ thống kiểm tra dữ liệu qua @Valid, cập nhật bản ghi NhaTramPhao và ghi nhận UPDATE vào NhaTramHistory. 5. Hệ thống trả về HTTP 200 OK với dữ liệu đã cập nhật.

**Acceptance Criteria** (4 items):
- Chỉ bản ghi ở trạng thái DRAFT hoặc APPROVED_L1 mới cho phép cập nhật
- Các trường bắt buộc (code, name) vẫn phải được kiểm tra qua @NotBlank
- Hệ thống ghi nhận mọi thay đổi vào NhaTramHistory với actionType = UPDATE
- Khi cập nhật thành công, hệ thống trả về HTTP 200 OK với bản ghi NhaTramPhaoResponse mới nhất

**Roles** (5 rows): Admin Full, Operator Write (DRAFT/APPROVED_L1), L1 Write, L2 Read, Viewer Read

**Business Rules** (6 rules): BR-001 code required/unique, BR-002 name required, BR-003 only DRAFT/APPROVED_L1 editable, BR-004 BuoyType enum, BR-005 UPDATE in history, BR-006 description max 1000 chars

### F-082 (Nhà trạm phao - Xóa)
**Description** (200+ chars): Tính năng cho phép quản trị viên hoặc chuyên viên nghiệp vụ xóa mềm (soft delete) một nhà trạm phao (NhaTramPhao) trong hệ thống. Hệ thống không xóa bản ghi khỏi cơ sở dữ liệu mà chỉ đặt trường deletedAt thành thời điểm xóa, đồng thời đánh dấu trạng thái thành DELETED. Sau khi xóa, bản ghi không còn xuất hiện trong danh sách findAll() hay tìm kiếm (do @SQLRestriction("deleted_at IS NULL" trên BaseNhaTram đảm bảo). Hành động xóa được ghi nhận vào NhaTramHistory với actionType = SOFT_DELETE.

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm phao trong hệ thống báo hiệu hàng hải, nhằm đảm bảo các nhà trạm phao không còn sử dụng hoặc sai vị trí được loại bỏ khỏi danh sách hoạt động mà vẫn giữ lại lịch sử thay đổi cho purposes kiểm toán.

**Flow Summary** (150+ chars): 1. Người dùng chọn Xóa từ danh sách hoặc chi tiết nhà trạm phao. 2. Hệ thống hiển thị thông báo xác nhận trước khi xóa mềm. 3. Người dùng xác nhận xóa. 4. Hệ thống gọi softDelete(), đặt deletedAt = LocalDateTime.now() và status = DELETED. 5. Ghi nhận SOFT_DELETE vào NhaTramHistory và trả về HTTP 200 OK với thông báo "Da xoa nhà trạm phao thành công". 6. Bản ghi bị xóa không còn xuất hiện nhờ @SQLRestriction.

**Acceptance Criteria** (4 items):
- deletedAt được đặt thành thời điểm hiện tại và status chuyển thành DELETED
- Bản ghi đã xóa không còn xuất hiện trong findAll() hay findById()
- Hành động xóa được ghi nhận vào NhaTramHistory với actionType = SOFT_DELETE
- Khi xóa thành công, hệ thống trả về HTTP 200 OK với thông báo "Da xoa nhà trạm phao thành công"

**Roles** (5 rows): Admin Full, Operator Write (DRAFT only), L1 Read, L2 Read, Viewer Read

**Business Rules** (5 rules): BR-001 soft delete only, BR-002 deleted records hidden by @SQLRestriction, BR-003 status = DELETED after delete, BR-004 SOFT_DELETE in history, BR-005 softDelete() sets deletedAt

### F-083 (Phê duyệt Nhà trạm phao)
**Description** (200+ chars): Tính năng cho phép lãnh đạo phê duyệt thực hiện quy trình phê duyệt hai cấp đối với nhà trạm phao (NhaTramPhao). Quy trình gồm các bước: (1) Chuyên viên nghiệp vụ gửi yêu cầu phê duyệt (submitForApproval) chuyển trạng thái từ DRAFT sang PENDING_APPROVAL; (2) Lãnh đạo phê duyệt L1 xem xét và phê duyệt (approveL1) chuyển trạng thái sang APPROVED_L1 và approvalStatus = APPROVED; (3) Lãnh đạo phê duyệt L2 xem xét và phê duyệt (approveL2) chuyển trạng thái sang PUBLISHED với thông báo "Da cong bo". Nếu không đồng ý, lãnh đạo có thể từ chối (reject) bằng cách cung cấp lý do (rejectReason), chuyển approvalStatus = REJECTED và status quay lại DRAFT để chỉnh sửa lại.

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm phao trong hệ thống báo hiệu hàng hải, nhằm đảm bảo thông tin về vị trí, đặc tính kỹ thuật và lịch kiểm tra của các phao tiêu được kiểm duyệt qua hai cấp trước khi chính thức công bố vào hệ thống.

**Flow Summary** (150+ chars): 1. Chuyên viên nghiệp vụ chọn Gửi phê duyệt trên bản nháp DRAFT. 2. Chuyển status từ DRAFT sang PENDING_APPROVAL. 3. L1 phê duyệt → APPROVED_L1, approvalStatus = APPROVED. 4. L2 phê duyệt → PUBLISHED, thông báo "Da cong bo". 5. Nếu không đồng ý: reject với lý do → status về DRAFT, approvalStatus = REJECTED.

**Acceptance Criteria** (5 items):
- Chỉ bản ghi DRAFT mới có thể gửi phê duyệt (submitForApproval)
- L1 chỉ phê duyệt bản ghi PENDING_APPROVAL → APPROVED_L1
- L2 chỉ phê duyệt bản ghi APPROVED_L1 → PUBLISHED với "Da cong bo"
- Reject chuyển status về DRAFT, approvalStatus = REJECTED với rejectReason bắt buộc
- Mọi hành động phê duyệt được ghi nhận vào NhaTramHistory (APPROVE_L1, APPROVE_L2, REJECT)

**Roles** (5 rows): Admin Full, Operator Write (submit), L1 Approve_L1, L2 Approve_L2, Viewer Read

**Business Rules** (7 rules): BR-001 DRAFT→PENDING→APPROVED_L1→APPROVED_L2→PUBLISHED, BR-002 L1 cannot be skipped, BR-003 reject to DRAFT, BR-004 rejectReason required, BR-005 approvedBy/approvedDate recorded, BR-006 all actions in history, BR-007 rejectionReason max 1000 chars

### F-084 (Xem chi tiết Nhà trạm phao)
**Description** (200+ chars): Tính năng cho phép mọi vai trò có quyền truy cập xem thông tin chi tiết của một nhà trạm phao (NhaTramPhao) cụ thể. Người dùng nhập ID (UUID) hoặc tìm qua danh sách/tìm kiếm (theo tên, mã, loại phao tiêu, trạng thái). Hệ thống truy vấn và trả về đầy đủ các trường dữ liệu: mã nhà trạm, tên nhà trạm, tọa độ (latitude, longitude), loại phao tiêu (type), màu sắc (color), hình dạng (shape), đặc tính ánh sáng (lightCharacteristic), tầm xa (range), ngày kiểm tra gần nhất, ngày kiểm tra tiếp theo, đơn vị quản lý (unitId), mô tả chi tiết, trạng thái (status), trạng thái phê duyệt (approvalStatus), thông tin phê duyệt (approvedBy, approvedDate, rejectionReason), ngày tạo và ngày cập nhật cuối cùng. Dữ liệu được trả về qua endpoint GET /api/v1/nhatram/phao/{id} với định dạng NhaTramPhaoResponse.

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm phao trong hệ thống báo hiệu hàng hải, nhằm cung cấp khả năng xem đầy đủ thông tin kỹ thuật và phê duyệt của từng nhà trạm phao cho tất cả các vai trò trong hệ thống.

**Flow Summary** (150+ chars): 1. Người dùng chọn Xem chi tiết từ danh sách hoặc nhập trực tiếp ID nhà trạm phao. 2. Gọi endpoint GET /api/v1/nhatram/phao/{id} với tham số UUID. 3. Truy vấn cơ sở dữ liệu và trả về toàn bộ thông tin chi tiết qua NhaTramPhaoResponse. 4. Dữ liệu hiển thị trên giao diện. 5. Người dùng có thể quay lại danh sách hoặc chuyển sang thao tác khác tùy vai trò.

**Acceptance Criteria** (4 items):
- GET /api/v1/nhatram/phao/{id} với UUID hợp lệ → HTTP 200 OK với NhaTramPhaoResponse
- UUID không tồn tại hoặc đã xóa mềm → 404 Not Found
- Loại phao tiêu hiển thị với enum đầy đủ: CARDINAL, SECTOR, SPECIAL, SAFE_WATER, ISOLATED_DANGER
- Trạng thái và phê duyệt được hiển thị rõ ràng

**Roles** (5 rows): Admin Full, Operator Read, L1 Read, L2 Read, Viewer Read

**Business Rules** (5 rules): BR-001 only non-deleted records accessible, BR-002 status enum displayed, BR-003 approvalStatus displayed independently, BR-004 approvedBy/approvedDate only when approved, BR-005 rejectionReason shown when REJECTED

### F-085 (Nhà trạm phao - Lịch sử)
**Description** (200+ chars): Tính năng cho phép người dùng xem lịch sử thay đổi của một nhà trạm phao (NhaTramPhao) cụ thể. Lịch sử được lưu trong bảng NhaTramHistory, bao gồm tất cả các hành động: tạo mới (CREATE), cập nhật (UPDATE), phê duyệt L1 (APPROVE_L1), phê duyệt L2 (APPROVE_L2), từ chối (REJECT), và xóa mềm (SOFT_DELETE). Mỗi bản ghi lịch sử chứa: loại nhà trạm (tramType = PHAO), ID thực thể (entityId), loại hành động (actionType), trường thay đổi (changedField), giá trị trước thay đổi (previousValue), giá trị sau thay đổi (newValue), người thay đổi (changedBy), thời gian thay đổi (changedAt), lý do (reason), và dữ liệu so sánh diff (diffData).

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm phao trong hệ thống báo hiệu hàng hải, nhằm đảm bảo mọi thay đổi về thông tin, vị trí, đặc tính kỹ thuật và phê duyệt của nhà trạm phao đều được ghi chép đầy đủ, minh bạch để phục vụ kiểm toán, truy vết và phân tích xu hướng.

**Flow Summary** (150+ chars): 1. Người dùng chọn Xem lịch sử từ danh sách hoặc chi tiết nhà trạm phao. 2. Truy vấn NhaTramHistory với tramType = PHAO và entityId = UUID. 3. Trả về danh sách sắp xếp theo changedAt giảm dần. 4. Hiển thị actionType, changedField, previousValue, newValue, changedBy, changedAt, reason. 5. Lọc theo loại hành động, người thực hiện hoặc khoảng thời gian.

**Acceptance Criteria** (4 items):
- Hiển thị toàn bộ lịch sử với: tramType (PHAO), actionType, changedField, previousValue, newValue, changedBy, changedAt, reason
- Các hành động: CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE
- Sắp xếp theo changedAt giảm dần
- previousValue/newValue max 4000 chars each

**Roles** (5 rows): Admin Full, Operator Read, L1 Read, L2 Read, Viewer Read

**Business Rules** (5 rules): BR-001 tramType always PHAO, BR-002 all CRUD+approval actions recorded, BR-003 previousValue/newValue max 4000 chars, BR-004 reason max 1000 chars, BR-005 diffData max 4000 chars

### F-086 (Nhà trạm đèn - Tạo mới)
**Description** (200+ chars): Tính năng cho phép chuyên viên nghiệp vụ tạo mới một nhà trạm đèn (NhaTramDen) phục vụ hệ thống báo hiệu hàng hải. Người dùng điền các thông tin: mã nhà trạm (code, bắt buộc, duy nhất), tên nhà trạm (name, bắt buộc), tọa độ độ vĩ (latitude) và độ kinh (longitude), loại đèn biển (type: LIGHTHOUSE/BEACON_LIGHT/BEACON_MARK), tầm đèn (lightRange), màu ánh sáng (lightColor), đặc tính ánh sáng (lightCharacteristic), tầm xa tổng thể (range), ngày bảo trì gần nhất (lastMaintenanceDate), ngày bảo trì tiếp theo (nextMaintenanceDate), đơn vị quản lý (unitId), mô tả chi tiết (description). Sau khi xác nhận, hệ thống tạo bản ghi với trạng thái DRAFT, trạng thái phê duyệt PENDING, ghi lại hành động CREATE vào NhaTramHistory và trả về mã HTTP 201 Created.

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm đèn trong hệ thống báo hiệu hàng hải, nhằm đảm bảo các thông tin về hải đăng, đèn báo và cọc tiêu được ghi nhận đầy đủ với đặc tính ánh sáng và lịch bảo trì để hỗ trợ an toàn hàng hải.

**Flow Summary** (150+ chars): 1. Người dùng chọn Tạo mới từ danh sách nhà trạm đèn. 2. Hiển thị form với các trường: mã, tên, tọa độ (latitude, longitude), loại đèn biển (type: LIGHTHOUSE/BEACON_LIGHT/BEACON_MARK), tầm đèn (lightRange), màu ánh sáng (lightColor), đặc tính ánh sáng (lightCharacteristic), tầm xa (range), ngày bảo trì gần nhất (lastMaintenanceDate), ngày bảo trì tiếp theo (nextMaintenanceDate), đơn vị quản lý (unitId), mô tả. 3. Kiểm tra @Valid, tạo NhaTramDen với trạng thái DRAFT, gửi HTTP 201 Created. 4. Ghi CREATE vào NhaTramHistory.

**Acceptance Criteria** (4 items):
- code và name bắt buộc (via @NotBlank), trả về 400 nếu thiếu
- Tọa độ ra ngoài phạm vi hợp lệ → lỗi validation
- Tạo thành công → HTTP 201 Created với NhaTramDenResponse, ghi CREATE vào history
- code phải là duy nhất

**Roles** (5 rows): Admin Full, Operator Write, L1 Read, L2 Read, Viewer Read

**Business Rules** (6 rules): BR-001 code required/unique, BR-002 name required, BR-003 BeaconLightType enum, BR-004 default DRAFT/PENDING, BR-005 CREATE in history, BR-006 description max 1000 chars

### F-087 (Nhà trạm đèn - Cập nhật)
**Description** (200+ chars): Tính năng cho phép chuyên viên nghiệp vụ cập nhật thông tin một nhà trạm đèn (NhaTramDen) đã tồn tại. Người dùng chọn nhà trạm đèn cần sửa từ danh sách hoặc qua tìm kiếm (tên, mã, loại, trạng thái). Hệ thống cho phép chỉnh sửa tất cả các trường: mã (code), tên (name), tọa độ (latitude, longitude), loại đèn biển (type), tầm đèn (lightRange), màu ánh sáng (lightColor), đặc tính ánh sáng (lightCharacteristic), tầm xa (range), ngày bảo trì gần nhất (lastMaintenanceDate), ngày bảo trì tiếp theo (nextMaintenanceDate), đơn vị quản lý (unitId), mô tả chi tiết (description). Chỉ các bản ghi ở trạng thái DRAFT hoặc APPROVED_L1 mới được chỉnh sửa nội dung. Sau khi sửa, hệ thống cập nhật bản ghi với timestamp updatedAt mới, ghi lại hành động UPDATE vào NhaTramHistory và trả về phản hồi HTTP 200 OK.

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm đèn trong hệ thống báo hiệu hàng hải, nhằm đảm bảo thông tin về vị trí, đặc tính ánh sáng và lịch bảo trì của các hải đăng, đèn báo và cọc tiêu luôn được cập nhật đúng và kịp thời theo diễn biến thực tế.

**Flow Summary** (150+ chars): 1. Chọn Cập nhật từ danh sách hoặc chi tiết. 2. Tải thông tin hiện tại và hiển thị form. 3. Sửa các trường cần thiết, nhấn Lưu. 4. Kiểm tra @Valid, cập nhật NhaTramDen, ghi UPDATE vào NhaTramHistory. 5. Trả về HTTP 200 OK với NhaTramDenResponse.

**Acceptance Criteria** (4 items):
- Chỉ DRAFT hoặc APPROVED_L1 cho phép cập nhật
- code, name vẫn phải kiểm tra @NotBlank
- Ghi nhận mọi thay đổi vào NhaTramHistory với actionType = UPDATE
- Thành công → HTTP 200 OK với NhaTramDenResponse mới nhất

**Roles** (5 rows): Admin Full, Operator Write (DRAFT/APPROVED_L1), L1 Write, L2 Read, Viewer Read

**Business Rules** (6 rules): BR-001 code required/unique, BR-002 name required, BR-003 only DRAFT/APPROVED_L1 editable, BR-004 BeaconLightType enum, BR-005 UPDATE in history, BR-006 description max 1000 chars

### F-088 (Nhà trạm đèn - Xóa)
**Description** (200+ chars): Tính năng cho phép quản trị viên hoặc chuyên viên nghiệp vụ xóa mềm (soft delete) một nhà trạm đèn (NhaTramDen) trong hệ thống. Hệ thống không xóa bản ghi khỏi cơ sở dữ liệu mà chỉ đặt trường deletedAt thành thời điểm xóa, đồng thời đánh dấu trạng thái thành DELETED. Sau khi xóa, bản ghi không còn xuất hiện trong danh sách findAll() hay tìm kiếm (do @SQLRestriction("deleted_at IS NULL" trên BaseNhaTram đảm bảo). Hành động xóa được ghi nhận vào NhaTramHistory với actionType = SOFT_DELETE.

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm đèn trong hệ thống báo hiệu hàng hải, nhằm đảm bảo các nhà trạm đèn không còn sử dụng hoặc sai vị trí được loại bỏ khỏi danh sách hoạt động mà vẫn giữ lại lịch sử thay đổi cho mục đích kiểm toán.

**Flow Summary** (150+ chars): 1. Chọn Xóa từ danh sách hoặc chi tiết. 2. Hiển thị thông báo xác nhận. 3. Xác nhận xóa. 4. softDelete() đặt deletedAt = LocalDateTime.now(), status = DELETED. 5. Ghi SOFT_DELETE vào NhaTramHistory, trả về HTTP 200 OK với thông báo "Da xoa nhà trạm đèn thành công". 6. Bản ghi bị xóa không còn hiển thị nhờ @SQLRestriction.

**Acceptance Criteria** (4 items):
- deletedAt được đặt, status = DELETED
- Bản ghi đã xóa không còn trong findAll() hay findById()
- Hành động xóa được ghi nhận vào NhaTramHistory với SOFT_DELETE
- Thành công → HTTP 200 OK với thông báo "Da xoa nhà trạm đèn thành công"

**Roles** (5 rows): Admin Full, Operator Write (DRAFT), L1 Read, L2 Read, Viewer Read

**Business Rules** (5 rules): BR-001 soft delete only, BR-002 deleted hidden by @SQLRestriction, BR-003 status = DELETED, BR-004 SOFT_DELETE in history, BR-005 softDelete() sets deletedAt

### F-089 (Phê duyệt Nhà trạm đèn)
**Description** (200+ chars): Tính năng cho phép lãnh đạo phê duyệt thực hiện quy trình phê duyệt hai cấp đối với nhà trạm đèn (NhaTramDen). Quy trình gồm các bước: (1) Chuyên viên nghiệp vụ gửi yêu cầu phê duyệt (submitForApproval) chuyển trạng thái từ DRAFT sang PENDING_APPROVAL; (2) Lãnh đạo phê duyệt L1 xem xét và phê duyệt (approveL1) chuyển trạng thái sang APPROVED_L1 và approvalStatus = APPROVED; (3) Lãnh đạo phê duyệt L2 xem xét và phê duyệt (approveL2) chuyển trạng thái sang PUBLISHED với thông báo "Da cong bo". Nếu không đồng ý, lãnh đạo có thể từ chối (reject) bằng cách cung cấp lý do (rejectReason), chuyển approvalStatus = REJECTED và status quay lại DRAFT.

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm đèn trong hệ thống báo hiệu hàng hải, nhằm đảm bảo thông tin về vị trí, đặc tính ánh sáng và lịch bảo trì của các hải đăng, đèn báo và cọc tiêu được kiểm duyệt qua hai cấp trước khi chính thức công bố vào hệ thống.

**Flow Summary** (150+ chars): 1. Gửi phê duyệt từ DRAFT → PENDING_APPROVAL. 2. L1 approveL1 → APPROVED_L1, approvalStatus = APPROVED. 3. L2 approveL2 → PUBLISHED, "Da cong bo". 4. Reject bất kỳ cấp → status về DRAFT, approvalStatus = REJECTED với rejectReason.

**Acceptance Criteria** (5 items):
- Chỉ DRAFT mới gửi phê duyệt (submitForApproval)
- L1 chỉ phê duyệt PENDING_APPROVAL → APPROVED_L1
- L2 chỉ phê duyệt APPROVED_L1 → PUBLISHED với "Da cong bo"
- Reject → status về DRAFT, approvalStatus = REJECTED với rejectReason
- Mọi hành động ghi nhận vào NhaTramHistory (APPROVE_L1, APPROVE_L2, REJECT)

**Roles** (5 rows): Admin Full, Operator Write (submit), L1 Approve_L1, L2 Approve_L2, Viewer Read

**Business Rules** (7 rules): BR-001 DRAFT→PENDING→APPROVED_L1→APPROVED_L2→PUBLISHED, BR-002 L1 cannot be skipped, BR-003 reject to DRAFT, BR-004 rejectReason required, BR-005 approvedBy/approvedDate recorded, BR-006 all actions in history, BR-007 rejectionReason max 1000 chars

### F-090 (Xem chi tiết Nhà trạm đèn)
**Description** (200+ chars): Tính năng cho phép mọi vai trò có quyền truy cập xem thông tin chi tiết của một nhà trạm đèn (NhaTramDen) cụ thể. Người dùng nhập ID (UUID) hoặc tìm qua danh sách/tìm kiếm (theo tên, mã, loại đèn, trạng thái). Hệ thống truy vấn và trả về đầy đủ các trường dữ liệu: mã nhà trạm, tên nhà trạm, tọa độ (latitude, longitude), loại đèn biển (type: LIGHTHOUSE/BEACON_LIGHT/BEACON_MARK), tầm đèn (lightRange), màu ánh sáng (lightColor), đặc tính ánh sáng (lightCharacteristic), tầm xa (range), ngày bảo trì gần nhất, ngày bảo trì tiếp theo, đơn vị quản lý (unitId), mô tả chi tiết, trạng thái (status), trạng thái phê duyệt (approvalStatus), thông tin phê duyệt (approvedBy, approvedDate, rejectionReason), ngày tạo và ngày cập nhật cuối cùng. Dữ liệu được trả về qua endpoint GET /api/v1/nhatram/den/{id} với định dạng NhaTramDenResponse.

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm đèn trong hệ thống báo hiệu hàng hải, nhằm cung cấp khả năng xem đầy đủ thông tin kỹ thuật và phê duyệt của từng nhà trạm đèn cho tất cả các vai trò trong hệ thống.

**Flow Summary** (150+ chars): 1. Chọn Xem chi tiết từ danh sách hoặc nhập ID nhà trạm đèn. 2. Gọi GET /api/v1/nhatram/den/{id} với UUID. 3. Truy vấn CSDL, trả về NhaTramDenResponse. 4. Hiển thị trên giao diện. 5. Quay lại danh sách hoặc chuyển sang thao tác khác tùy vai trò.

**Acceptance Criteria** (4 items):
- GET /api/v1/nhatram/den/{id} với UUID hợp lệ → HTTP 200 OK với NhaTramDenResponse
- UUID không tồn tại hoặc đã xóa mềm → 404 Not Found
- Loại đèn biển hiển thị enum đầy đủ: LIGHTHOUSE, BEACON_LIGHT, BEACON_MARK
- Trạng thái và phê duyệt được hiển thị rõ ràng

**Roles** (5 rows): Admin Full, Operator Read, L1 Read, L2 Read, Viewer Read

**Business Rules** (5 rules): BR-001 only non-deleted accessible, BR-002 status enum displayed, BR-003 approvalStatus displayed independently, BR-004 approvedBy/approvedDate only when approved, BR-005 rejectionReason shown when REJECTED

### F-091 (Nhà trạm đèn - Lịch sử)
**Description** (200+ chars): Tính năng cho phép người dùng xem lịch sử thay đổi của một nhà trạm đèn (NhaTramDen) cụ thể. Lịch sử được lưu trong bảng NhaTramHistory, bao gồm tất cả các hành động: tạo mới (CREATE), cập nhật (UPDATE), phê duyệt L1 (APPROVE_L1), phê duyệt L2 (APPROVE_L2), từ chối (REJECT), và xóa mềm (SOFT_DELETE). Mỗi bản ghi lịch sử chứa: loại nhà trạm (tramType = DEN), ID thực thể (entityId), loại hành động (actionType), trường thay đổi (changedField), giá trị trước thay đổi (previousValue), giá trị sau thay đổi (newValue), người thay đổi (changedBy), thời gian thay đổi (changedAt), lý do (reason), và dữ liệu so sánh diff (diffData).

**Business Intent** (100+ chars): Quản lý cơ sở hạ tầng nhà trạm đèn trong hệ thống báo hiệu hàng hải, nhằm đảm bảo mọi thay đổi về thông tin, vị trí, đặc tính ánh sáng và phê duyệt của nhà trạm đèn đều được ghi chép đầy đủ, minh bạch để phục vụ kiểm toán, truy vết và phân tích xu hướng.

**Flow Summary** (150+ chars): 1. Chọn Xem lịch sử từ danh sách hoặc chi tiết. 2. Truy vấn NhaTramHistory với tramType = DEN và entityId = UUID. 3. Trả về danh sách sắp xếp changedAt giảm dần. 4. Hiển thị actionType, changedField, previousValue, newValue, changedBy, changedAt, reason. 5. Lọc theo loại hành động, người thực hiện hoặc khoảng thời gian.

**Acceptance Criteria** (4 items):
- Hiển thị toàn bộ lịch sử với: tramType (DEN), actionType, changedField, previousValue, newValue, changedBy, changedAt, reason
- Các hành động: CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE
- Sắp xếp theo changedAt giảm dần
- previousValue/newValue max 4000 chars each

**Roles** (5 rows): Admin Full, Operator Read, L1 Read, L2 Read, Viewer Read

**Business Rules** (5 rules): BR-001 tramType always DEN, BR-002 all CRUD+approval actions recorded, BR-003 previousValue/newValue max 4000 chars, BR-004 reason max 1000 chars, BR-005 diffData max 4000 chars