# -*- coding: utf-8 -*-
"""
Script to generate:
1. docs/MA_TRAN_NUT_BAM_PHE_DUYET_KCHT.xlsx (Excel)
2. docs/MA_TRAN_NUT_BAM_PHE_DUYET_KCHT.docx (Word)
3. docs/MA_TRAN_NUT_BAM_PHE_DUYET_KCHT.html (HTML)
"""

import os
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "docs")
os.makedirs(DOCS_DIR, exist_ok=True)

# -------------------------------------------------------------
# DATA DEFINITIONS
# -------------------------------------------------------------

STATUS_DATA = [
    ("DRAFT", "0", "Lưu tạm", "Lưu nháp nội bộ trong đơn vị quản lý, chưa gửi vào quy trình phê duyệt", "#64748B", "#F1F5F9"),
    ("PENDING_APPROVAL", "2", "Chờ phê duyệt cấp Cảng vụ/Chi cục", "Đã gửi, đang chờ Lãnh đạo Cảng vụ/Chi cục xét duyệt (Vòng 1)", "#D97706", "#FEF3C7"),
    ("APPROVED_LEVEL1", "3", "Chờ phê duyệt cấp Cục", "Cảng vụ đã duyệt thông qua (hoặc Cục gửi duyệt), đang chờ Lãnh đạo Cục phê duyệt (Vòng 2)", "#0284C7", "#E0F2FE"),
    ("APPROVED", "5", "Đã phê duyệt", "Cục đã phê duyệt chính thức, hồ sơ có hiệu lực thi hành đầy đủ", "#16A34A", "#DCFCE7"),
    ("REJECTED_LEVEL1", "8", "Từ chối cấp Cảng vụ/Chi cục", "Bị Lãnh đạo Cảng vụ/Chi cục từ chối trả về (bắt buộc nhập lý do)", "#DC2626", "#FEE2E2"),
    ("REJECTED_LEVEL2", "9", "Từ chối cấp Cục", "Bị Lãnh đạo Cục từ chối trả về (bắt buộc nhập lý do)", "#DC2626", "#FEE2E2"),
    ("ARCHIVED", "7", "Đã xóa", "Đã xóa mềm / Lưu trữ lịch sử (không hiển thị trên danh sách chính, tra cứu tại tab Tất cả)", "#94A3B8", "#F8FAFC"),
]

CREATE_FORM_DATA = [
    ("Lưu tạm", "Nút Default (Viền xám, bo cong)", "Mọi cán bộ có quyền tạo (:create)", "Luôn hiển thị khi mở form tạo mới", "DRAFT (0) - Lưu tạm", "Lưu nháp nội bộ đơn vị quản lý, chưa đưa vào luồng phê duyệt"),
    ("Lưu và gửi phê duyệt", "Nút Primary (Xanh dương #0E6FD6)", "Mọi cán bộ có quyền tạo (:create)", "Luôn hiển thị khi mở form tạo mới", "• Cán bộ Cảng vụ: PENDING_APPROVAL (2) - Chờ phê duyệt cấp Cảng vụ/Chi cục\n• Lãnh đạo Cảng vụ (có C1) / Chuyên viên Cục: APPROVED_LEVEL1 (3) - Chờ phê duyệt cấp Cục", "Tạo hồ sơ và chuyển ngay vào luồng phê duyệt tương ứng với cấp quản lý"),
    ("Lưu và phê duyệt", "Nút Success (Xanh lá #1BAF7A)", "Chỉ Lãnh đạo Cục có quyền C2 (:approvec2)", "Tài khoản thuộc cấp Cục VÀ có quyền duyệt C2", "APPROVED (5) - Đã phê duyệt", "Tạo mới và phê duyệt ban hành chính thức ngay lập tức (hiệu lực ngay)"),
]

EDIT_FORM_DATA = [
    ("Lưu tạm", "Nút Default (Viền xám)", "• DRAFT (0) - Lưu tạm\n• REJECTED_LEVEL1 (8) - Từ chối cấp Cảng vụ/Chi cục\n• REJECTED_LEVEL2 (9) - Từ chối cấp Cục", "Cán bộ có quyền sửa (:update)", "DRAFT (0) - Lưu tạm", "Cập nhật thông tin sửa đổi và tiếp tục giữ ở trạng thái nháp nội bộ"),
    ("Lưu và gửi phê duyệt", "Nút Primary (Xanh dương #0E6FD6)", "• DRAFT (0) - Lưu tạm\n• REJECTED_LEVEL1 (8) - Từ chối cấp Cảng vụ/Chi cục\n• REJECTED_LEVEL2 (9) - Từ chối cấp Cục", "Cán bộ có quyền sửa (:update)", "• Cán bộ Cảng vụ: PENDING_APPROVAL (2) - Chờ phê duyệt cấp Cảng vụ/Chi cục\n• Lãnh đạo Cảng vụ (có C1) / Chuyên viên Cục: APPROVED_LEVEL1 (3) - Chờ phê duyệt cấp Cục", "Cập nhật dữ liệu sửa đổi và gửi lại lên cấp có thẩm quyền phê duyệt"),
    ("Lưu và phê duyệt", "Nút Success (Xanh lá #1BAF7A)", "• APPROVED (5) - Đã phê duyệt", "Chỉ Lãnh đạo Cục có quyền C2 (:approvec2)", "APPROVED (5) - Đã phê duyệt", "Cập nhật trực tiếp hồ sơ đang có hiệu lực (Quy tắc 12/T12), lưu vết lịch sử thay đổi"),
]

ROW_ACTION_DATA = [
    ("Xem chi tiết", "Mọi trạng thái", "Mọi người dùng có quyền truy cập màn hình", "Không đổi", "Mở Drawer Xem chi tiết ở chế độ chỉ đọc (View-only)"),
    ("Chỉnh sửa", "• DRAFT (0) - Lưu tạm\n• REJECTED_LEVEL1 (8) - Từ chối C1\n• REJECTED_LEVEL2 (9) - Từ chối C2\n• APPROVED (5) - Đã duyệt (chỉ cấp Cục)", "• Với DRAFT, REJECTED_...: Cần quyền :update\n• Với APPROVED: Cần quyền :approvec2 cấp Cục", "Tùy theo nút bấm trong Form Chỉnh sửa", "Mở Drawer Chỉnh sửa dữ liệu. Hồ sơ đang chờ duyệt (PENDING_APPROVAL, APPROVED_LEVEL1) hoặc đã xóa (ARCHIVED) sẽ bị khóa hoàn toàn"),
    ("Gửi phê duyệt", "• DRAFT (0) - Lưu tạm\n• REJECTED_LEVEL1 (8) - Từ chối C1\n• REJECTED_LEVEL2 (9) - Từ chối C2", "Có quyền :update", "• Cán bộ Cảng vụ: PENDING_APPROVAL (2) - Chờ phê duyệt cấp Cảng vụ/Chi cục\n• LĐ Cảng vụ (có C1) / Chuyên viên Cục: APPROVED_LEVEL1 (3) - Chờ phê duyệt cấp Cục", "Gửi duyệt nhanh ngay trên danh sách mà không cần mở form sửa"),
    ("Phê duyệt C1", "PENDING_APPROVAL (2) - Chờ phê duyệt cấp Cảng vụ/Chi cục", "Cán bộ cấp Cảng vụ có quyền :approvec1 VÀ không phải là người tạo/gửi (Quy tắc 4 mắt)", "APPROVED_LEVEL1 (3) - Chờ phê duyệt cấp Cục", "Hiển thị Popup xác nhận/nhập nội dung duyệt cấp Cảng vụ"),
    ("Từ chối C1", "PENDING_APPROVAL (2) - Chờ phê duyệt cấp Cảng vụ/Chi cục", "Cán bộ cấp Cảng vụ có quyền :approvec1 VÀ không phải là người tạo/gửi (Quy tắc 4 mắt)", "REJECTED_LEVEL1 (8) - Từ chối cấp Cảng vụ/Chi cục", "Hiển thị Popup BẮT BUỘC nhập lý do từ chối"),
    ("Phê duyệt C2", "APPROVED_LEVEL1 (3) - Chờ phê duyệt cấp Cục", "Cán bộ cấp Cục có quyền :approvec2", "APPROVED (5) - Đã phê duyệt", "Hiển thị Popup xác nhận/nhập nội dung phê duyệt cấp Cục"),
    ("Từ chối C2", "APPROVED_LEVEL1 (3) - Chờ phê duyệt cấp Cục", "Cán bộ cấp Cục có quyền :approvec2", "REJECTED_LEVEL2 (9) - Từ chối cấp Cục", "Hiển thị Popup BẮT BUỘC nhập lý do từ chối"),
    ("Xóa", "Chỉ DRAFT (0) - Lưu tạm", "Có quyền :delete", "ARCHIVED (7) - Đã xóa", "Hiển thị Modal Confirm cảnh báo xóa mềm. Tuyệt đối KHÔNG cho phép xóa hồ sơ APPROVED hay đang chờ duyệt"),
    ("Lịch sử", "Mọi trạng thái", "Mọi người dùng có quyền truy cập màn hình", "Không đổi", "Mở Drawer Lịch sử thay đổi (Audit Trail)"),
]

HEADER_DATA = [
    ("Thêm mới", "Nút Primary (Xanh dương #0E6FD6, bo tròn 999px)", "Người dùng có quyền :create", "Mở Drawer Tạo mới hồ sơ"),
    ("Xuất Excel", "Nút Default (Viền xám, bo tròn 999px)", "Người dùng có quyền :export", "Xuất file Excel danh sách theo bộ lọc và phạm vi DataScope của tài khoản"),
]

DETAIL_DATA = [
    ("Toggle Thông tin phê duyệt", "Khung thông tin mở rộng tại Tab Thông tin chung", "Hiển thị đầy đủ: Người gửi, ngày gửi; Người duyệt C1, ngày duyệt C1, nội dung/lý do; Người duyệt C2, ngày duyệt C2, nội dung/lý do. Giúp xem nhanh toàn bộ tiến trình."),
    ("Nút Lịch sử trên dòng", "Menu hành động dòng (Row Actions)", "Mở Drawer Lịch sử thay đổi (Audit Trail) truy vấn từ bảng infrastructure_history. Không tạo tab rời 'Thông tin log cập nhật' trong Drawer chi tiết."),
]

# -------------------------------------------------------------
# 1. GENERATE EXCEL FILE (.xlsx)
# -------------------------------------------------------------
def generate_excel():
    wb = openpyxl.Workbook()
    
    header_fill = PatternFill(start_color="0E4A86", end_color="0E4A86", fill_type="solid")
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    
    sub_header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    sub_header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    
    cell_font = Font(name="Segoe UI", size=10)
    bold_cell_font = Font(name="Segoe UI", size=10, bold=True)
    
    thin_border = Border(
        left=Side(style='thin', color='D0D7DE'),
        right=Side(style='thin', color='D0D7DE'),
        top=Side(style='thin', color='D0D7DE'),
        bottom=Side(style='thin', color='D0D7DE')
    )
    
    def style_sheet(ws, title, headers, data, col_widths=None):
        ws.title = title
        ws.views.sheetView[0].showGridLines = True
        
        # Title row
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(headers))
        title_cell = ws.cell(row=1, column=1, value=title.upper())
        title_cell.font = Font(name="Segoe UI", size=14, bold=True, color="0E4A86")
        title_cell.alignment = Alignment(horizontal="left", vertical="center")
        ws.row_dimensions[1].height = 35
        
        # Subtitle
        ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(headers))
        sub_cell = ws.cell(row=2, column=1, value="Quy chuẩn phê duyệt 2 cấp phân hệ KCHT Hàng hải (Tài liệu BA & Nghiệp vụ)")
        sub_cell.font = Font(name="Segoe UI", size=10, italic=True, color="64748B")
        ws.row_dimensions[2].height = 20
        
        # Header row
        ws.row_dimensions[4].height = 28
        for col_idx, h in enumerate(headers, 1):
            cell = ws.cell(row=4, column=col_idx, value=h)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = thin_border
            
        # Data rows
        for row_idx, row_data in enumerate(data, 5):
            ws.row_dimensions[row_idx].height = 42 if any("\n" in str(x) for x in row_data) else 26
            for col_idx, val in enumerate(row_data, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=val)
                cell.font = bold_cell_font if col_idx == 1 else cell_font
                cell.alignment = Alignment(
                    horizontal="center" if col_idx in [1, 2] and len(str(val)) < 15 else "left",
                    vertical="center",
                    wrap_text=True
                )
                cell.border = thin_border
                
                # Highlight alternating
                if row_idx % 2 == 1:
                    cell.fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
                    
        # Apply col widths
        if col_widths:
            for idx, w in enumerate(col_widths, 1):
                ws.column_dimensions[get_column_letter(idx)].width = w
        else:
            for col in ws.columns:
                max_len = max(len(str(cell.value or '')) for cell in col)
                col_letter = get_column_letter(col[0].column)
                ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 45)

    # 1. Sheet: 7 Trạng thái chuẩn
    ws1 = wb.active
    status_rows = [(r[0], r[1], r[2], r[3]) for r in STATUS_DATA]
    style_sheet(
        ws1, 
        "1. Danh mục 7 Trạng thái", 
        ["Mã Enum (Code)", "Mã số", "Tên tiếng Việt chuẩn", "Ý nghĩa & Phạm vi áp dụng"],
        status_rows,
        [22, 10, 32, 65]
    )

    # 2. Sheet: Form Tạo mới
    ws2 = wb.create_sheet()
    style_sheet(
        ws2,
        "2. Form Tạo mới",
        ["Tên nút bấm", "Kiểu dáng UI", "Đối tượng hiển thị", "Điều kiện hiển thị", "Trạng thái sau khi bấm (Kết quả)", "Ghi chú nghiệp vụ"],
        CREATE_FORM_DATA,
        [22, 28, 30, 28, 45, 45]
    )

    # 3. Sheet: Form Chỉnh sửa
    ws3 = wb.create_sheet()
    style_sheet(
        ws3,
        "3. Form Chỉnh sửa",
        ["Tên nút bấm", "Kiểu dáng UI", "Trạng thái bản ghi trước khi sửa", "Đối tượng hiển thị", "Trạng thái sau khi bấm (Kết quả)", "Ghi chú nghiệp vụ"],
        EDIT_FORM_DATA,
        [22, 26, 32, 28, 45, 45]
    )

    # 4. Sheet: Thao tác dòng (Row Actions)
    ws4 = wb.create_sheet()
    style_sheet(
        ws4,
        "4. Menu Thao tác dòng",
        ["Tên thao tác", "Trạng thái áp dụng", "Phân quyền & Điều kiện hiển thị", "Trạng thái kết quả sau khi thực hiện", "Hành vi & Giao diện"],
        ROW_ACTION_DATA,
        [18, 35, 40, 38, 48]
    )

    # 5. Sheet: Header & Chi tiết
    ws5 = wb.create_sheet()
    combined_other = [("Thanh công cụ: " + r[0], r[1], r[2], r[3]) for r in HEADER_DATA] + [("Chi tiết: " + r[0], "-", "-", r[1] + ": " + r[2]) for r in DETAIL_DATA]
    style_sheet(
        ws5,
        "5. Thanh công cụ & Xem chi tiết",
        ["Vị trí & Thành phần", "Kiểu dáng", "Điều kiện hiển thị", "Mô tả hành vi"],
        combined_other,
        [32, 35, 30, 60]
    )

    excel_path = os.path.join(DOCS_DIR, "MA_TRAN_NUT_BAM_PHE_DUYET_KCHT.xlsx")
    wb.save(excel_path)
    print("Saved Excel to:", excel_path)
    return excel_path


# -------------------------------------------------------------
# 2. GENERATE WORD FILE (.docx)
# -------------------------------------------------------------
def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def generate_word():
    doc = docx.Document()
    
    # Page Setup (Landscape A4 for wide tables)
    for section in doc.sections:
        section.top_margin = Inches(0.6)
        section.bottom_margin = Inches(0.6)
        section.left_margin = Inches(0.6)
        section.right_margin = Inches(0.6)
        # Landscape
        new_width, new_height = section.page_height, section.page_width
        section.page_width = new_width
        section.page_height = new_height

    # Document Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("TÀI LIỆU ĐẶC TẢ MA TRẬN NÚT BẤM VÀ QUY TRÌNH PHÊ DUYỆT 2 CẤP KCHT")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(16)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(14, 74, 134)

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_after = Pt(14)
    run_sub = p_sub.add_run("Tài liệu thống nhất giữa Đội ngũ Phát triển (Dev) và Đội ngũ Phân tích Nghiệp vụ (BA) - Hệ thống Quản lý KCHTGT Hàng hải")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(10)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(100, 116, 139)

    def add_table_section(title, headers, data, col_widths):
        p_sec = doc.add_paragraph()
        p_sec.paragraph_format.space_before = Pt(12)
        p_sec.paragraph_format.space_after = Pt(6)
        run_sec = p_sec.add_run(title)
        run_sec.font.name = "Arial"
        run_sec.font.size = Pt(12)
        run_sec.font.bold = True
        run_sec.font.color.rgb = RGBColor(14, 74, 134)

        table = doc.add_table(rows=len(data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        # Header Row
        hdr_cells = table.rows[0].cells
        for i, header_text in enumerate(headers):
            hdr_cells[i].text = header_text
            hdr_cells[i].width = Inches(col_widths[i])
            set_cell_background(hdr_cells[i], "0E4A86")
            set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            for run in p.runs:
                run.font.name = "Arial"
                run.font.size = Pt(9.5)
                run.font.bold = True
                run.font.color.rgb = RGBColor(255, 255, 255)

        # Data Rows
        for r_idx, row_values in enumerate(data):
            row_cells = table.rows[r_idx + 1].cells
            bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_values):
                row_cells[c_idx].text = str(val)
                row_cells[c_idx].width = Inches(col_widths[c_idx])
                set_cell_background(row_cells[c_idx], bg_color)
                set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=120, right=120)
                p = row_cells[c_idx].paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_idx == 0 and len(str(val)) < 20 else WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.name = "Arial"
                    run.font.size = Pt(9)
                    if c_idx == 0:
                        run.font.bold = True

    # 1. 7 Trạng thái
    add_table_section(
        "1. BẢNG ĐỐI CHIẾU 7 TRẠNG THÁI PHÊ DUYỆT CHUẨN (APPROVAL STATUS)",
        ["Mã Enum (Code)", "Mã số", "Tên tiếng Việt chuẩn", "Ý nghĩa & Phạm vi áp dụng"],
        [(r[0], r[1], r[2], r[3]) for r in STATUS_DATA],
        [1.8, 0.8, 2.7, 5.2]
    )

    # 2. Form Tạo mới
    add_table_section(
        "2. FORM TẠO MỚI (CREATE DRAWER FOOTER)",
        ["Tên nút bấm", "Kiểu dáng UI", "Đối tượng hiển thị", "Điều kiện hiển thị", "Trạng thái sau khi bấm (Kết quả)", "Ghi chú nghiệp vụ"],
        CREATE_FORM_DATA,
        [1.5, 1.8, 1.8, 1.6, 2.3, 1.5]
    )

    # 3. Form Chỉnh sửa
    add_table_section(
        "3. FORM CHỈNH SỬA (EDIT DRAWER FOOTER)",
        ["Tên nút bấm", "Kiểu dáng UI", "Trạng thái trước khi sửa", "Đối tượng hiển thị", "Trạng thái sau khi bấm (Kết quả)", "Ghi chú nghiệp vụ"],
        EDIT_FORM_DATA,
        [1.5, 1.5, 2.0, 1.7, 2.3, 1.5]
    )

    # 4. Thao tác dòng
    add_table_section(
        "4. MENU THAO TÁC DÒNG DANH SÁCH (ROW ACTIONS)",
        ["Tên thao tác", "Trạng thái áp dụng", "Phân quyền & Điều kiện hiển thị", "Trạng thái kết quả", "Hành vi & Giao diện"],
        ROW_ACTION_DATA,
        [1.4, 2.2, 2.4, 2.2, 2.3]
    )

    # 5. Header & Drawer
    doc.add_page_break()
    add_table_section(
        "5.1 THANH CÔNG CỤ ĐẦU TRANG DANH SÁCH (SCREEN HEADER)",
        ["Tên nút", "Kiểu dáng", "Điều kiện hiển thị", "Hành động thực hiện"],
        HEADER_DATA,
        [1.8, 2.5, 2.5, 3.7]
    )

    add_table_section(
        "5.2 CẤU TRÚC DRAWER XEM CHI TIẾT (DETAIL DRAWER)",
        ["Thành phần", "Vị trí bố trí", "Quy chuẩn hiển thị & Tương tác"],
        DETAIL_DATA,
        [2.2, 2.8, 5.5]
    )

    docx_path = os.path.join(DOCS_DIR, "MA_TRAN_NUT_BAM_PHE_DUYET_KCHT.docx")
    doc.save(docx_path)
    print("Saved Word to:", docx_path)
    return docx_path


# -------------------------------------------------------------
# 3. GENERATE STANDALONE HTML FILE (.html)
# -------------------------------------------------------------
def generate_html():
    html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ma trận nút bấm & Quy trình phê duyệt 2 cấp KCHT</title>
    <style>
        :root {
            --primary: #0E4A86;
            --primary-light: #EBF3FC;
            --text-main: #1E293B;
            --text-muted: #64748B;
            --border-color: #E2E8F0;
            --bg-page: #F8FAFC;
            --bg-card: #FFFFFF;
            
            --status-draft: #64748B;
            --status-pending: #D97706;
            --status-c1: #0284C7;
            --status-approved: #16A34A;
            --status-rejected: #DC2626;
            --status-archived: #94A3B8;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-page);
            color: var(--text-main);
            line-height: 1.5;
            padding: 24px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px 32px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }

        .header-title h1 {
            font-size: 22px;
            color: var(--primary);
            margin-bottom: 6px;
            font-weight: 700;
        }

        .header-title p {
            font-size: 14px;
            color: var(--text-muted);
        }

        .print-btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 999px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .print-btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .section-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            overflow: hidden;
        }

        .section-header {
            background: #F1F5F9;
            padding: 14px 24px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-header h2 {
            font-size: 16px;
            font-weight: 700;
            color: var(--primary);
        }

        .badge-pill {
            display: inline-block;
            padding: 3px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            line-height: 1.4;
            white-space: nowrap;
        }

        .badge-draft { background: #F1F5F9; color: #475569; border: 1px solid #CBD5E1; }
        .badge-pending { background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; }
        .badge-c1 { background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD; }
        .badge-approved { background: #DCFCE7; color: #15803D; border: 1px solid #BBF7D0; }
        .badge-rejected { background: #FEE2E2; color: #B91C1C; border: 1px solid #FECACA; }
        .badge-archived { background: #F8FAFC; color: #64748B; border: 1px solid #E2E8F0; }

        .btn-preview {
            display: inline-block;
            padding: 4px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
        }

        .btn-default { background: #FFFFFF; color: #334155; border: 1px solid #CBD5E1; }
        .btn-primary { background: #0E6FD6; color: #FFFFFF; border: 1px solid #0E6FD6; }
        .btn-success { background: #1BAF7A; color: #FFFFFF; border: 1px solid #1BAF7A; }

        .table-responsive {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: left;
        }

        th {
            background: #F8FAFC;
            color: #475569;
            font-weight: 700;
            padding: 12px 16px;
            border-bottom: 2px solid var(--border-color);
            white-space: nowrap;
        }

        td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
            vertical-align: top;
        }

        tr:nth-child(even) td {
            background-color: #FAFAFA;
        }

        tr:hover td {
            background-color: #F1F5F9;
        }

        .text-bold { font-weight: 600; color: #0F172A; }
        .text-muted { color: #64748B; font-size: 12px; }
        .notice-box {
            background: #EFF6FF;
            border-left: 4px solid #3B82F6;
            padding: 12px 18px;
            margin: 16px 20px;
            border-radius: 0 8px 8px 0;
            font-size: 13px;
            color: #1E40AF;
        }

        @media print {
            body { background: white; padding: 0; }
            .print-btn { display: none; }
            .section-card { box-shadow: none; page-break-inside: avoid; margin-bottom: 16px; }
            .header-card { box-shadow: none; border-bottom: 2px solid #0E4A86; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header-card">
            <div class="header-title">
                <h1>TÀI LIỆU MA TRẬN NÚT BẤM & QUY TRÌNH PHÊ DUYỆT 2 CẤP KCHT</h1>
                <p>Thống nhất giữa Phân tích Nghiệp vụ (BA) và Đội ngũ Kỹ thuật (Dev) | Cập nhật: 25/09/2026</p>
            </div>
            <div>
                <button class="print-btn" onclick="window.print()">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
                        <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
                    </svg>
                    In / Xuất PDF
                </button>
            </div>
        </div>

        <!-- 1. Danh mục 7 Trạng thái -->
        <div class="section-card">
            <div class="section-header">
                <h2>1. BẢNG ĐỐI CHIẾU 7 TRẠNG THÁI PHÊ DUYỆT CHUẨN (APPROVAL STATUS)</h2>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 180px;">Mã Enum (Code)</th>
                            <th style="width: 80px; text-align: center;">Mã số</th>
                            <th style="width: 260px;">Tên tiếng Việt hiển thị chuẩn</th>
                            <th>Ý nghĩa & Phạm vi áp dụng</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>DRAFT</code></td>
                            <td style="text-align: center;"><b>0</b></td>
                            <td><span class="badge-pill badge-draft">Lưu tạm</span></td>
                            <td>Lưu nháp nội bộ trong đơn vị quản lý, chưa gửi vào quy trình phê duyệt</td>
                        </tr>
                        <tr>
                            <td><code>PENDING_APPROVAL</code></td>
                            <td style="text-align: center;"><b>2</b></td>
                            <td><span class="badge-pill badge-pending">Chờ phê duyệt cấp Cảng vụ/Chi cục</span></td>
                            <td>Đã gửi, đang chờ Lãnh đạo Cảng vụ/Chi cục xét duyệt (Vòng 1)</td>
                        </tr>
                        <tr>
                            <td><code>APPROVED_LEVEL1</code></td>
                            <td style="text-align: center;"><b>3</b></td>
                            <td><span class="badge-pill badge-c1">Chờ phê duyệt cấp Cục</span></td>
                            <td>Cảng vụ đã duyệt thông qua (hoặc Cục gửi duyệt), đang chờ Lãnh đạo Cục phê duyệt (Vòng 2)</td>
                        </tr>
                        <tr>
                            <td><code>APPROVED</code></td>
                            <td style="text-align: center;"><b>5</b></td>
                            <td><span class="badge-pill badge-approved">Đã phê duyệt</span></td>
                            <td>Cục đã phê duyệt chính thức, hồ sơ có hiệu lực thi hành đầy đủ</td>
                        </tr>
                        <tr>
                            <td><code>REJECTED_LEVEL1</code></td>
                            <td style="text-align: center;"><b>8</b></td>
                            <td><span class="badge-pill badge-rejected">Từ chối cấp Cảng vụ/Chi cục</span></td>
                            <td>Bị Lãnh đạo Cảng vụ/Chi cục từ chối trả về (bắt buộc nhập lý do)</td>
                        </tr>
                        <tr>
                            <td><code>REJECTED_LEVEL2</code></td>
                            <td style="text-align: center;"><b>9</b></td>
                            <td><span class="badge-pill badge-rejected">Từ chối cấp Cục</span></td>
                            <td>Bị Lãnh đạo Cục từ chối trả về (bắt buộc nhập lý do)</td>
                        </tr>
                        <tr>
                            <td><code>ARCHIVED</code></td>
                            <td style="text-align: center;"><b>7</b></td>
                            <td><span class="badge-pill badge-archived">Đã xóa</span></td>
                            <td>Đã xóa mềm / Lưu trữ lịch sử (không hiển thị trên danh sách chính, tra cứu tại tab Tất cả)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 2. Form Tạo mới -->
        <div class="section-card">
            <div class="section-header">
                <h2>2. FORM TẠO MỚI (CREATE DRAWER FOOTER)</h2>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 170px;">Tên nút bấm</th>
                            <th style="width: 200px;">Kiểu dáng UI</th>
                            <th style="width: 240px;">Đối tượng hiển thị</th>
                            <th style="width: 220px;">Điều kiện hiển thị</th>
                            <th style="width: 280px;">Trạng thái sau khi bấm (Kết quả)</th>
                            <th>Ghi chú nghiệp vụ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="btn-preview btn-default">Lưu tạm</span></td>
                            <td>Nút Default (Viền xám, bo cong)</td>
                            <td>Mọi cán bộ có quyền tạo (<code>:create</code>)</td>
                            <td>Luôn hiển thị khi mở form tạo mới</td>
                            <td><span class="badge-pill badge-draft">DRAFT (0) - Lưu tạm</span></td>
                            <td>Lưu nháp nội bộ đơn vị quản lý, chưa đưa vào luồng phê duyệt</td>
                        </tr>
                        <tr>
                            <td><span class="btn-preview btn-primary">Lưu và gửi phê duyệt</span></td>
                            <td>Nút Primary (Xanh dương #0E6FD6)</td>
                            <td>Mọi cán bộ có quyền tạo (<code>:create</code>)</td>
                            <td>Luôn hiển thị khi mở form tạo mới</td>
                            <td>
                                <div>• <b>Cán bộ Cảng vụ:</b><br><span class="badge-pill badge-pending" style="margin: 2px 0 6px 0;">PENDING_APPROVAL (2) - Chờ phê duyệt cấp Cảng vụ/Chi cục</span></div>
                                <div>• <b>Lãnh đạo Cảng vụ (có C1) / Chuyên viên Cục:</b><br><span class="badge-pill badge-c1" style="margin: 2px 0;">APPROVED_LEVEL1 (3) - Chờ phê duyệt cấp Cục</span></div>
                            </td>
                            <td>Tạo hồ sơ và chuyển ngay vào luồng phê duyệt tương ứng với cấp quản lý</td>
                        </tr>
                        <tr>
                            <td><span class="btn-preview btn-success">Lưu và phê duyệt</span></td>
                            <td>Nút Success (Xanh lá #1BAF7A)</td>
                            <td><b>Chỉ Lãnh đạo Cục</b> có quyền C2 (<code>:approvec2</code>)</td>
                            <td>Tài khoản thuộc cấp Cục VÀ có quyền duyệt C2</td>
                            <td><span class="badge-pill badge-approved">APPROVED (5) - Đã phê duyệt</span></td>
                            <td>Tạo mới và phê duyệt ban hành chính thức ngay lập tức (hiệu lực ngay)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 3. Form Chỉnh sửa -->
        <div class="section-card">
            <div class="section-header">
                <h2>3. FORM CHỈNH SỬA (EDIT DRAWER FOOTER)</h2>
            </div>
            <div class="notice-box">
                <b>Nguyên tắc bảo vệ dữ liệu:</b> Hồ sơ đang ở trạng thái <b>Chờ phê duyệt</b> (<code>PENDING_APPROVAL</code>, <code>APPROVED_LEVEL1</code>) hoặc <b>Đã xóa</b> (<code>ARCHIVED</code>) sẽ bị khóa chỉnh sửa hoàn toàn để đảm bảo tính toàn vẹn hồ sơ.
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 170px;">Tên nút bấm</th>
                            <th style="width: 180px;">Kiểu dáng UI</th>
                            <th style="width: 250px;">Trạng thái trước khi sửa</th>
                            <th style="width: 220px;">Đối tượng hiển thị</th>
                            <th style="width: 280px;">Trạng thái sau khi bấm (Kết quả)</th>
                            <th>Ghi chú nghiệp vụ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="btn-preview btn-default">Lưu tạm</span></td>
                            <td>Nút Default (Viền xám)</td>
                            <td>
                                <span class="badge-pill badge-draft">DRAFT (0)</span><br>
                                <span class="badge-pill badge-rejected" style="margin: 2px 0;">REJECTED_LEVEL1 (8)</span><br>
                                <span class="badge-pill badge-rejected">REJECTED_LEVEL2 (9)</span>
                            </td>
                            <td>Cán bộ có quyền sửa (<code>:update</code>)</td>
                            <td><span class="badge-pill badge-draft">DRAFT (0) - Lưu tạm</span></td>
                            <td>Cập nhật thông tin sửa đổi và tiếp tục giữ ở trạng thái nháp nội bộ</td>
                        </tr>
                        <tr>
                            <td><span class="btn-preview btn-primary">Lưu và gửi phê duyệt</span></td>
                            <td>Nút Primary (Xanh dương #0E6FD6)</td>
                            <td>
                                <span class="badge-pill badge-draft">DRAFT (0)</span><br>
                                <span class="badge-pill badge-rejected" style="margin: 2px 0;">REJECTED_LEVEL1 (8)</span><br>
                                <span class="badge-pill badge-rejected">REJECTED_LEVEL2 (9)</span>
                            </td>
                            <td>Cán bộ có quyền sửa (<code>:update</code>)</td>
                            <td>
                                <div>• <b>Cán bộ Cảng vụ:</b><br><span class="badge-pill badge-pending" style="margin: 2px 0 6px 0;">PENDING_APPROVAL (2) - Chờ Cảng vụ duyệt</span></div>
                                <div>• <b>Lãnh đạo Cảng vụ (có C1) / Chuyên viên Cục:</b><br><span class="badge-pill badge-c1" style="margin: 2px 0;">APPROVED_LEVEL1 (3) - Chờ Cục duyệt</span></div>
                            </td>
                            <td>Cập nhật dữ liệu sửa đổi và gửi lại lên cấp có thẩm quyền phê duyệt</td>
                        </tr>
                        <tr>
                            <td><span class="btn-preview btn-success">Lưu và phê duyệt</span></td>
                            <td>Nút Success (Xanh lá #1BAF7A)</td>
                            <td><span class="badge-pill badge-approved">APPROVED (5) - Đã phê duyệt</span></td>
                            <td><b>Chỉ Lãnh đạo Cục</b> có quyền C2 (<code>:approvec2</code>)</td>
                            <td><span class="badge-pill badge-approved">APPROVED (5) - Đã phê duyệt</span></td>
                            <td>Cập nhật trực tiếp hồ sơ đang có hiệu lực (Quy tắc 12/T12), lưu vết lịch sử thay đổi</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 4. Thao tác dòng (Row Actions) -->
        <div class="section-card">
            <div class="section-header">
                <h2>4. MENU THAO TÁC DÒNG DANH SÁCH (ROW ACTIONS - DROPDOWN 3 CHẤM)</h2>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 140px;">Tên thao tác</th>
                            <th style="width: 240px;">Trạng thái áp dụng</th>
                            <th style="width: 270px;">Phân quyền & Điều kiện hiển thị</th>
                            <th style="width: 250px;">Trạng thái kết quả sau thực hiện</th>
                            <th>Hành vi & Giao diện</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="text-bold">Xem chi tiết</span></td>
                            <td>Mọi trạng thái</td>
                            <td>Mọi người dùng có quyền xem màn hình</td>
                            <td><i>Không đổi</i></td>
                            <td>Mở Drawer Xem chi tiết ở chế độ chỉ đọc (View-only)</td>
                        </tr>
                        <tr>
                            <td><span class="text-bold" style="color: #0E6FD6;">Chỉnh sửa</span></td>
                            <td>
                                <span class="badge-pill badge-draft">DRAFT (0)</span> 
                                <span class="badge-pill badge-rejected">REJECTED_1/2</span><br>
                                <span class="badge-pill badge-approved" style="margin-top: 4px;">APPROVED (5)</span> (chỉ cấp Cục)
                            </td>
                            <td>
                                • Với <code>DRAFT</code>, <code>REJECTED_...</code>: Cần quyền <code>:update</code><br>
                                • Với <code>APPROVED</code>: Cần quyền <code>:approvec2</code> cấp Cục
                            </td>
                            <td>Tùy theo nút bấm trong Form Chỉnh sửa</td>
                            <td>Mở Drawer Chỉnh sửa dữ liệu. Hồ sơ đang chờ duyệt hoặc đã xóa bị ẩn thao tác sửa</td>
                        </tr>
                        <tr>
                            <td><span class="text-bold" style="color: #0E6FD6;">Gửi phê duyệt</span></td>
                            <td>
                                <span class="badge-pill badge-draft">DRAFT (0)</span> 
                                <span class="badge-pill badge-rejected">REJECTED_LEVEL1</span>
                                <span class="badge-pill badge-rejected">REJECTED_LEVEL2</span>
                            </td>
                            <td>Có quyền <code>:update</code></td>
                            <td>
                                • Cán bộ Cảng vụ: $\rightarrow$ <span class="badge-pill badge-pending">PENDING_APPROVAL (2)</span><br>
                                • LĐ Cảng vụ / CV Cục: $\rightarrow$ <span class="badge-pill badge-c1">APPROVED_LEVEL1 (3)</span>
                            </td>
                            <td>Gửi duyệt nhanh ngay trên danh sách mà không cần mở form sửa</td>
                        </tr>
                        <tr>
                            <td><span class="text-bold" style="color: #16A34A;">Phê duyệt C1</span></td>
                            <td><span class="badge-pill badge-pending">PENDING_APPROVAL (2)</span><br><span class="text-muted">(Chờ phê duyệt cấp Cảng vụ/Chi cục)</span></td>
                            <td>Cán bộ cấp Cảng vụ có quyền <code>:approvec1</code> VÀ <b>không phải là người tạo/gửi</b> (Quy tắc 4 mắt)</td>
                            <td><span class="badge-pill badge-c1">APPROVED_LEVEL1 (3)</span><br><span class="text-muted">(Chờ phê duyệt cấp Cục)</span></td>
                            <td>Hiển thị Popup xác nhận/nhập nội dung duyệt cấp Cảng vụ</td>
                        </tr>
                        <tr>
                            <td><span class="text-bold" style="color: #DC2626;">Từ chối C1</span></td>
                            <td><span class="badge-pill badge-pending">PENDING_APPROVAL (2)</span><br><span class="text-muted">(Chờ phê duyệt cấp Cảng vụ/Chi cục)</span></td>
                            <td>Cán bộ cấp Cảng vụ có quyền <code>:approvec1</code> VÀ <b>không phải là người tạo/gửi</b></td>
                            <td><span class="badge-pill badge-rejected">REJECTED_LEVEL1 (8)</span><br><span class="text-muted">(Từ chối cấp Cảng vụ/Chi cục)</span></td>
                            <td>Hiển thị Popup <b>BẮT BUỘC nhập lý do từ chối</b></td>
                        </tr>
                        <tr>
                            <td><span class="text-bold" style="color: #16A34A;">Phê duyệt C2</span></td>
                            <td><span class="badge-pill badge-c1">APPROVED_LEVEL1 (3)</span><br><span class="text-muted">(Chờ phê duyệt cấp Cục)</span></td>
                            <td>Cán bộ cấp Cục có quyền <code>:approvec2</code></td>
                            <td><span class="badge-pill badge-approved">APPROVED (5)</span><br><span class="text-muted">(Đã phê duyệt chính thức)</span></td>
                            <td>Hiển thị Popup xác nhận/nhập nội dung phê duyệt cấp Cục</td>
                        </tr>
                        <tr>
                            <td><span class="text-bold" style="color: #DC2626;">Từ chối C2</span></td>
                            <td><span class="badge-pill badge-c1">APPROVED_LEVEL1 (3)</span><br><span class="text-muted">(Chờ phê duyệt cấp Cục)</span></td>
                            <td>Cán bộ cấp Cục có quyền <code>:approvec2</code></td>
                            <td><span class="badge-pill badge-rejected">REJECTED_LEVEL2 (9)</span><br><span class="text-muted">(Từ chối cấp Cục)</span></td>
                            <td>Hiển thị Popup <b>BẮT BUỘC nhập lý do từ chối</b></td>
                        </tr>
                        <tr>
                            <td><span class="text-bold" style="color: #DC2626;">Xóa</span></td>
                            <td><span class="badge-pill badge-draft">Chỉ DRAFT (0)</span><br><span class="text-muted">(Lưu tạm)</span></td>
                            <td>Có quyền <code>:delete</code></td>
                            <td><span class="badge-pill badge-archived">ARCHIVED (7)</span><br><span class="text-muted">(Đã xóa)</span></td>
                            <td>Hiển thị Modal Confirm cảnh báo xóa mềm. <b>Tuyệt đối KHÔNG cho phép xóa hồ sơ APPROVED hay đang chờ duyệt</b></td>
                        </tr>
                        <tr>
                            <td><span class="text-bold">Lịch sử</span></td>
                            <td>Mọi trạng thái</td>
                            <td>Mọi người dùng có quyền truy cập</td>
                            <td><i>Không đổi</i></td>
                            <td>Mở Drawer Lịch sử thay đổi (Audit Trail)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 5. Header & Drawer Chi tiết -->
        <div class="section-card">
            <div class="section-header">
                <h2>5. THANH CÔNG CỤ ĐẦU TRANG & DRAWER XEM CHI TIẾT</h2>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 250px;">Vị trí & Thành phần</th>
                            <th style="width: 280px;">Kiểu dáng & Trực quan</th>
                            <th style="width: 260px;">Điều kiện hiển thị</th>
                            <th>Mô tả hành vi & Quy chuẩn</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><b>Thêm mới</b><br><span class="text-muted">(ScreenHeader)</span></td>
                            <td><span class="btn-preview btn-primary">Thêm mới</span> (bo tròn 999px)</td>
                            <td>Người dùng có quyền <code>:create</code></td>
                            <td>Mở Drawer Tạo mới hồ sơ với form nhập liệu chuẩn</td>
                        </tr>
                        <tr>
                            <td><b>Xuất Excel</b><br><span class="text-muted">(ScreenHeader)</span></td>
                            <td><span class="btn-preview btn-default">Xuất Excel</span> (bo tròn 999px)</td>
                            <td>Người dùng có quyền <code>:export</code></td>
                            <td>Xuất file Excel dữ liệu theo bộ lọc tìm kiếm và phạm vi DataScope của tài khoản</td>
                        </tr>
                        <tr>
                            <td><b>Toggle Thông tin phê duyệt</b><br><span class="text-muted">(Tab Thông tin chung Drawer)</span></td>
                            <td>Khung mở rộng (Collapse / Card)</td>
                            <td>Hiển thị trong Drawer Xem chi tiết</td>
                            <td>Hiển thị đầy đủ thông tin: Người gửi, ngày gửi; Người duyệt C1, ngày duyệt C1, nội dung/lý do; Người duyệt C2, ngày duyệt C2, nội dung/lý do</td>
                        </tr>
                        <tr>
                            <td><b>Xem Lịch sử thay đổi</b><br><span class="text-muted">(Row Actions)</span></td>
                            <td>Drawer Lịch sử thay đổi riêng biệt</td>
                            <td>Mọi người dùng</td>
                            <td>Truy vấn từ bảng tập trung <code>infrastructure_history</code>. <b>Không tạo thêm tab rời "Thông tin log cập nhật"</b> trong Drawer chi tiết</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</body>
</html>
"""
    html_path = os.path.join(DOCS_DIR, "MA_TRAN_NUT_BAM_PHE_DUYET_KCHT.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print("Saved HTML to:", html_path)
    return html_path

if __name__ == "__main__":
    generate_excel()
    generate_word()
    generate_html()
    print("All 3 files generated successfully.")
