// Danh mục 526 đơn vị vận hành & khai thác (DM_DON_VI_VH_KT)
export interface OperatingOrganizationItem {
  id: string;
  code: string;
  name: string;
  parentCode?: string | null;
}

export const DEFAULT_OPERATING_ORGANIZATIONS: OperatingOrganizationItem[] = [
  {
    "id": "6e26c587-0558-4a51-b700-07a70b4a7748",
    "code": "DVVH.000007",
    "name": "BQL Cảng cá Phan Thiết",
    "parentCode": null
  },
  {
    "id": "0c121e0f-f632-45f6-8f0a-8677ebef34dc",
    "code": "DVVH.000008",
    "name": "BQL. Dự án Nhiệt điện Vĩnh Tân",
    "parentCode": null
  },
  {
    "id": "77d7bfaf-93cf-4888-a211-19ed881e42a9",
    "code": "DVVH.000002",
    "name": "Ban Quản Lý Cảng Bến Đầm",
    "parentCode": null
  },
  {
    "id": "dad15149-75fe-45e3-bb03-29b9d42b1e18",
    "code": "DVVH.000005",
    "name": "Ban Quản Lý Dự Án Đầu Tư Xây Dựng Khu Vực Khu Kinh Tế Công Nghiệp Thành Phố Huế",
    "parentCode": null
  },
  {
    "id": "0d4edf33-1ef7-43dc-8daa-9c77f7507cd3",
    "code": "DVVH.000004",
    "name": "Ban Quản lý Cảng tỉnh Quảng Ngãi",
    "parentCode": null
  },
  {
    "id": "2d7c9f02-0ab9-4beb-a524-03335bd0d1d7",
    "code": "DVVH.000001",
    "name": "Ban Quản lý các Khu Kinh tế và Khu Công nghiệp tỉnh Quảng Nam",
    "parentCode": null
  },
  {
    "id": "73ef75e3-ca9f-4137-91eb-b17adfdc44f5",
    "code": "G17.72.05",
    "name": "Ban Quản lý dự án Bảo đảm an toàn hàng hải",
    "parentCode": null
  },
  {
    "id": "80423002-98a1-4bd3-a789-2f6c9281e8fb",
    "code": "DVVH.000003",
    "name": "Ban quản lý cảng Phú Quý",
    "parentCode": null
  },
  {
    "id": "8655f559-0f43-477b-9fc9-28278e530b0d",
    "code": "DVVH.000006",
    "name": "Ban quản lý khai thác các cảng cá thuộc Sở NN&PTNT tỉnh Ninh Thuận",
    "parentCode": null
  },
  {
    "id": "8e5deb4e-eb07-47a0-ac97-87169f186cad",
    "code": "DVVH.000375",
    "name": "Bảo đảm an toàn hàng hải Bắc Trung Bộ - Trạm QLBHHH Cửa Lò",
    "parentCode": null
  },
  {
    "id": "f009e7dc-3311-4517-9c6e-ff7878e7a8ed",
    "code": "DVVH.000376",
    "name": "Bảo đảm an toàn hàng hải Bắc Trung Bộ - Trạm QLBHHH Cửa Việt",
    "parentCode": null
  },
  {
    "id": "a1d83779-7a72-4e16-b3a7-be3ca8cd4eb7",
    "code": "DVVH.000377",
    "name": "Bảo đảm an toàn hàng hải Bắc Trung Bộ - Trạm QLBHHH Hải Thịnh",
    "parentCode": null
  },
  {
    "id": "d32215ee-b20b-441a-b999-cf360c5c236f",
    "code": "DVVH.000382",
    "name": "Bảo đảm an toàn hàng hải Bắc Trung Bộ - Trạm QLBHHH Vũng Áng",
    "parentCode": null
  },
  {
    "id": "56a7ca2b-d7bc-4168-8851-a281d386a941",
    "code": "DVVH.000381",
    "name": "Bảo đảm an toàn hàng hải Trung Bộ - Trạm quản lý BHLHH Đà Nẵng",
    "parentCode": null
  },
  {
    "id": "0802d0b9-5f54-45b3-8065-08f15035c5a2",
    "code": "DVVH.000374",
    "name": "Bảo đảm an toàn hàng hải Đông Bắc Bộ - Trạm QLL Bạch Đằng",
    "parentCode": null
  },
  {
    "id": "645a156c-8ae3-46b4-bfcf-aa13fdba9f1b",
    "code": "DVVH.000380",
    "name": "Bảo đảm an toàn hàng hải Đông Bắc Bộ - Trạm QLL Sông Cấm",
    "parentCode": null
  },
  {
    "id": "0fe3c8a1-82c1-4892-b6fc-259b1415a7c4",
    "code": "DVVH.000378",
    "name": "Bảo đảm an toàn hàng hải Đông Bắc Bộ - Trạm QLL kênh Hà Nam",
    "parentCode": null
  },
  {
    "id": "21bb0261-5195-46cb-824b-5c1800b6e608",
    "code": "DVVH.000379",
    "name": "Bảo đảm an toàn hàng hải Đông Bắc Bộ -Trạm QLL Lạch Huyện",
    "parentCode": null
  },
  {
    "id": "8c46b882-39ec-4641-b14c-0b42c7200b97",
    "code": "G17",
    "name": "Bộ xây dựng",
    "parentCode": null
  },
  {
    "id": "717d6283-c14e-4d51-81c1-11a3159c7405",
    "code": "G17.43.01",
    "name": "Chi cục Hàng hải và Đường thuỷ phía Bắc",
    "parentCode": null
  },
  {
    "id": "c136ece0-20ce-4508-9f0b-b1a1d81228a8",
    "code": "G17.43.02",
    "name": "Chi cục Hàng hải và Đường thuỷ phía Nam",
    "parentCode": null
  },
  {
    "id": "c9685555-4c60-481a-a943-2b9a2e286c84",
    "code": "DVVH.000016",
    "name": "Chi nhánh Công ty CP Vận tải và Cung ứng Xăng dầu - Xí nghiệp Dịch vụ Cảng Quỳnh Cư",
    "parentCode": null
  },
  {
    "id": "4d24035e-ff09-472c-b982-54b96ac9ed22",
    "code": "DVVH.000017",
    "name": "Chi nhánh Công ty CPTMXL&XK Miền Trung tại Hà Tĩnh",
    "parentCode": null
  },
  {
    "id": "5e29ac5f-e5b5-48fa-bb40-43a10e697c23",
    "code": "DVVH.000011",
    "name": "Chi nhánh Công ty Cổ phần Hóa dầu Quân Đội",
    "parentCode": null
  },
  {
    "id": "856c2df4-f37c-4f0a-b184-4906beddb2f3",
    "code": "DVVH.000014",
    "name": "Chi nhánh Công ty Cổ phần Xi măng Fico Tây Ninh – Trạm nghiền Hiệp Phước",
    "parentCode": null
  },
  {
    "id": "8e470f44-518f-46e1-8386-1c64691c75a7",
    "code": "DVVH.000015",
    "name": "Chi nhánh Công ty Cổ phần Xi măng Vicem Hà Tiên",
    "parentCode": null
  },
  {
    "id": "21075ace-1121-49c3-a470-2a6e68036876",
    "code": "DVVH.000013",
    "name": "Chi nhánh Công ty Cổ phần Xăng dầu Dầu khí PVOIL Miền Trung tại Huế",
    "parentCode": null
  },
  {
    "id": "3670dff0-25b8-463c-ba1b-0daaf40b95a2",
    "code": "DVVH.000012",
    "name": "Chi nhánh Công ty Cổ phần Xăng dầu Dầu khí PVOIL Miền Trung tại Đà Nẵng",
    "parentCode": null
  },
  {
    "id": "3bbe7036-7465-4ae8-ae86-70129955d204",
    "code": "DVVH.000018",
    "name": "Chi nhánh Công ty TNHH Calofic tại Hiệp Phước, TPHCM",
    "parentCode": null
  },
  {
    "id": "e7bc8cea-1231-4f76-9c7a-55d67239661d",
    "code": "DVVH.000019",
    "name": "Chi nhánh Công ty TNHH MTV Cảng Sài Gòn tại Bà Rịa-Vũng Tàu",
    "parentCode": null
  },
  {
    "id": "86b38c11-0ea0-41b2-a592-904079f70865",
    "code": "DVVH.000020",
    "name": "Chi nhánh Công ty TNHH MTV Dầu khí TP, HCM tại TP Cần Thơ",
    "parentCode": null
  },
  {
    "id": "680585d5-8c9a-4e36-a280-4889c8a7415d",
    "code": "DVVH.000021",
    "name": "Chi nhánh Công ty TNHH MTV Thủy sản Hạ Long - Cảng cá Hạ Long",
    "parentCode": null
  },
  {
    "id": "a7668d77-11b9-4066-96c5-0c8d8d369dfb",
    "code": "DVVH.000022",
    "name": "Chi nhánh Công ty TNHH Vận tải Hàng Công nghệ cao tại Hải Phòng",
    "parentCode": null
  },
  {
    "id": "56dc6b12-e57e-4d60-9e10-6062923f78c7",
    "code": "DVVH.000023",
    "name": "Chi nhánh Công ty Xi măng Chinfon – Nhà máy Nghiền Clinker Hiệp Phước",
    "parentCode": null
  },
  {
    "id": "739d0638-6197-4eba-b7f5-4d7fc8ce8a9c",
    "code": "DVVH.000024",
    "name": "Chi nhánh Công ty Xi măng Nghi Sơn tại Thành phố Hồ Chí Minh",
    "parentCode": null
  },
  {
    "id": "395c3078-95cc-42da-98d9-ca166372805f",
    "code": "DVVH.000026",
    "name": "Chi nhánh Phát điện Dầu khí – Tập đoàn Dầu khí Việt Nam",
    "parentCode": null
  },
  {
    "id": "5e3987f0-4c2a-4c30-9211-72289724f820",
    "code": "DVVH.000025",
    "name": "Chi nhánh Phát điện Đầu Khí - Tập đoàn Công nghiệp – Năng lượng Quốc gia Việt Nam",
    "parentCode": null
  },
  {
    "id": "c63ed911-f4e2-44dd-aee3-e25aa8dd5175",
    "code": "DVVH.000027",
    "name": "Chi nhánh Seaprodex Hải Phòng - Tổng Cty Thủy sản VN",
    "parentCode": null
  },
  {
    "id": "38a16dc1-d272-47f0-9269-eedae7c8df51",
    "code": "DVVH.000028",
    "name": "Chi nhánh Tân Cảng ĐBSCL",
    "parentCode": null
  },
  {
    "id": "2d646339-4a5b-4478-89f4-4d86c22bfc18",
    "code": "DVVH.000031",
    "name": "Chi nhánh Tổng Cty Thương mại Kỹ thuật và Đầu tư - Công ty CP Xí nghiệp Xăng dầu PETEC",
    "parentCode": null
  },
  {
    "id": "5e60c574-03ec-4a56-8266-697b4e3e4fa8",
    "code": "DVVH.000029",
    "name": "Chi nhánh Tổng công ty Cổ phần Dịch vụ Kỹ thuật Dầu khí Việt Nam - Công ty Dịch vụ Dầu khí Đà Nẵng",
    "parentCode": null
  },
  {
    "id": "a7ce802a-1a25-41ca-92c2-872b922175ff",
    "code": "DVVH.000030",
    "name": "Chi nhánh Tổng công ty Dầu Việt Nam - CTCP - Xí nghiệp Tổng kho Xăng dầu Nhà Bè",
    "parentCode": null
  },
  {
    "id": "190ab087-b600-454e-a04b-93369616f634",
    "code": "DVVH.000343",
    "name": "Cty CP Tập đoàn Phú Thành",
    "parentCode": null
  },
  {
    "id": "a297f166-a286-4d36-9f9c-0734678b5803",
    "code": "DVVH.000342",
    "name": "Cty CP Tập đoàn Đóng tàu Đại Dương",
    "parentCode": null
  },
  {
    "id": "58a9ea48-9915-425d-8e01-0f73409cc03e",
    "code": "DVVH.000341",
    "name": "Cty CP Tập đoàn Đầu tư Phát triển Trường An",
    "parentCode": null
  },
  {
    "id": "6accb189-d4bd-4bff-a4ec-03ed8351c0d6",
    "code": "DVVH.000340",
    "name": "Cty Cổ phần Cảng Quốc tế Nam Vân Phong",
    "parentCode": null
  },
  {
    "id": "8d5856ad-e076-40bb-b9d4-ae98041a66e1",
    "code": "DVVH.000344",
    "name": "Cty TNHH Cảng Cửa Lò",
    "parentCode": null
  },
  {
    "id": "24af8d8a-6194-49ae-9fbc-681f5550ae03",
    "code": "DVVH.000042",
    "name": "Công Ty Cổ Phần Cảng Chân Mây",
    "parentCode": null
  },
  {
    "id": "edafbb91-143c-4ca2-bec7-391f0bb289f1",
    "code": "DVVH.000044",
    "name": "Công Ty Cổ Phần Cảng Cửa Việt",
    "parentCode": null
  },
  {
    "id": "c4612fee-9b06-44f6-98b7-1e76ec57492b",
    "code": "DVVH.000062",
    "name": "Công Ty Cổ Phần Cảng Thuận An",
    "parentCode": null
  },
  {
    "id": "10805844-06f9-4870-a93e-9c97d18a7ad8",
    "code": "DVVH.000047",
    "name": "Công Ty Cổ phần Cảng Dịch vụ Dầu khí Tổng hợp Phú Mỹ",
    "parentCode": null
  },
  {
    "id": "c483e9fb-a0f5-46d0-9c16-c04afadf1b85",
    "code": "DVVH.000282",
    "name": "Công Ty TNHH MTV Hào Hưng Huế",
    "parentCode": null
  },
  {
    "id": "947798cb-449d-4e09-a6ed-cea22f498ac2",
    "code": "DVVH.000284",
    "name": "Công Ty TNHH MTV Hợp Thịnh",
    "parentCode": null
  },
  {
    "id": "0800a902-a36c-40d1-a030-01f8ceae38f1",
    "code": "DVVH.000290",
    "name": "Công Ty TNHH MTV Xăng Dầu Thủy Tân",
    "parentCode": null
  },
  {
    "id": "8fbe3589-7ee1-4420-9452-141832b6badc",
    "code": "DVVH.000300",
    "name": "Công Ty TNHH Premier Oil Vietnam",
    "parentCode": null
  },
  {
    "id": "6b7ff5c3-c59c-45a2-9ba9-6722919a745a",
    "code": "DVVH.000303",
    "name": "Công Ty TNHH Sản Xuất Và Kinh Doanh Phúc Thành",
    "parentCode": null
  },
  {
    "id": "6a918059-be43-4834-ab52-e84e17c18ae8",
    "code": "DVVH.000320",
    "name": "Công Ty TNHH VT Thủy Bộ Hải Hà",
    "parentCode": null
  },
  {
    "id": "ba8eb4e5-0c48-43bd-af6a-960a4d1ae1e9",
    "code": "DVVH.000032",
    "name": "Công ty Ana Marina",
    "parentCode": null
  },
  {
    "id": "6b65382c-b211-481a-a816-777e4746c562",
    "code": "G17.72.10",
    "name": "Công ty Bảo đảm an toàn hàng hải Biển Đông và Hải đảo",
    "parentCode": null
  },
  {
    "id": "d1494c9c-434c-4b5a-9829-620bd6642e3f",
    "code": "G17.72.03",
    "name": "Công ty Bảo đảm an toàn hàng hải Bắc Trung Bộ",
    "parentCode": null
  },
  {
    "id": "75bcdd6b-4b7b-463c-98fb-10d81867fbdb",
    "code": "G17.72.07",
    "name": "Công ty Bảo đảm an toàn hàng hải Nam Trung Bộ",
    "parentCode": null
  },
  {
    "id": "b817aa7f-f77a-47cf-8058-fd7d11024e22",
    "code": "G17.72.09",
    "name": "Công ty Bảo đảm an toàn hàng hải Tây Nam Bộ",
    "parentCode": null
  },
  {
    "id": "ce35fb26-c6f8-4c2d-b878-83179d6b3220",
    "code": "G17.72.01",
    "name": "Công ty Bảo đảm an toàn hàng hải Đông Bắc Bộ",
    "parentCode": null
  },
  {
    "id": "69ae6049-9443-4ae4-b9b9-f3e2003d48aa",
    "code": "G17.72.08",
    "name": "Công ty Bảo đảm an toàn hàng hải Đông Nam Bộ",
    "parentCode": null
  },
  {
    "id": "4886ebff-aac6-49a3-a8af-256b9930e2c0",
    "code": "DVVH.000131",
    "name": "Công ty CP 19-9",
    "parentCode": null
  },
  {
    "id": "b280535c-8855-46cb-bf7c-063964b80e82",
    "code": "DVVH.000132",
    "name": "Công ty CP Bê tông 620 Châu Thới",
    "parentCode": null
  },
  {
    "id": "d191034c-a2fc-4d50-b303-262dd421bde7",
    "code": "DVVH.000149",
    "name": "Công ty CP Công nghiệp Thủy Sản",
    "parentCode": null
  },
  {
    "id": "3b5c1a03-9ab7-4a49-a669-103a5db40301",
    "code": "DVVH.000150",
    "name": "Công ty CP Công nghiệp Thủy Sản Sài Gòn",
    "parentCode": null
  },
  {
    "id": "f7b0db9e-5177-49fb-98f1-03d42a44c206",
    "code": "DVVH.000148",
    "name": "Công ty CP Công nghiệp Tàu thủy và Vận tải Cần Thơ",
    "parentCode": null
  },
  {
    "id": "f59a7866-663b-4b02-8166-9b4b205e6ce3",
    "code": "DVVH.000133",
    "name": "Công ty CP Cảng Cần Thơ",
    "parentCode": null
  },
  {
    "id": "f2037889-7717-4ceb-a247-b67652f3aef3",
    "code": "DVVH.000134",
    "name": "Công ty CP Cảng Long An",
    "parentCode": null
  },
  {
    "id": "4e43c2ee-897b-4948-a8b0-94d523b7a540",
    "code": "DVVH.000135",
    "name": "Công ty CP Cảng Mipec",
    "parentCode": null
  },
  {
    "id": "047ceebd-49ee-489b-884c-2791ee4e6607",
    "code": "DVVH.000137",
    "name": "Công ty CP Cảng Nam Đình Vũ",
    "parentCode": null
  },
  {
    "id": "b566b4e4-ca68-4bc8-8657-44b89036cf20",
    "code": "DVVH.000138",
    "name": "Công ty CP Cảng Nghệ Tĩnh",
    "parentCode": null
  },
  {
    "id": "ae21f471-4092-4725-b532-2ebbde454ebd",
    "code": "DVVH.000136",
    "name": "Công ty CP Cảng Năm Căn",
    "parentCode": null
  },
  {
    "id": "ecef3ff1-9ccf-4b13-93c9-b308a5e23006",
    "code": "DVVH.000142",
    "name": "Công ty CP Cảng Quy Nhơn",
    "parentCode": null
  },
  {
    "id": "f107d6ce-dde1-4ad4-83e2-c2d615dbd647",
    "code": "DVVH.000139",
    "name": "Công ty CP Cảng Quốc tế Gemadept Dung Quất",
    "parentCode": null
  },
  {
    "id": "98d93ad4-1609-4db6-a227-94b68edc7e8e",
    "code": "DVVH.000141",
    "name": "Công ty CP Cảng Quốc tế Long Sơn",
    "parentCode": null
  },
  {
    "id": "9914d8f7-c843-4e70-8d8e-adf385624c13",
    "code": "DVVH.000140",
    "name": "Công ty CP Cảng Quốc tế Lào - Việt",
    "parentCode": null
  },
  {
    "id": "b4801b16-31f5-4250-ba7f-d36f21747dc5",
    "code": "DVVH.000143",
    "name": "Công ty CP Cảng Sài Gòn",
    "parentCode": null
  },
  {
    "id": "4f536928-e870-4ec9-a523-5f05053efbc5",
    "code": "DVVH.000144",
    "name": "Công ty CP Cảng Thanh Hóa",
    "parentCode": null
  },
  {
    "id": "bae37643-76e5-4bd2-9bd0-02526147df6a",
    "code": "DVVH.000145",
    "name": "Công ty CP Cảng Thị Nại",
    "parentCode": null
  },
  {
    "id": "976d7aaf-a44c-4dae-9f43-9662aff77be4",
    "code": "DVVH.000146",
    "name": "Công ty CP Cảng Tổng hợp Hòa Phát",
    "parentCode": null
  },
  {
    "id": "9716998c-f749-4426-ba7c-d5d63ec1e8a2",
    "code": "DVVH.000147",
    "name": "Công ty CP Cảng Vũng Rô",
    "parentCode": null
  },
  {
    "id": "8d3f513d-9a44-4092-8630-672116ebd357",
    "code": "DVVH.000158",
    "name": "Công ty CP DV VTB Hải Vân",
    "parentCode": null
  },
  {
    "id": "e8e8e99c-2d49-4d87-9e4f-84973783c995",
    "code": "DVVH.000159",
    "name": "Công ty CP DVDK Quảng Ngãi PTSC",
    "parentCode": null
  },
  {
    "id": "655d76b1-75bf-45c4-8452-a4fa13cf7de0",
    "code": "DVVH.000160",
    "name": "Công ty CP DVKT PTSC Thanh Hóa",
    "parentCode": null
  },
  {
    "id": "e1533d16-0367-4a49-90e6-4bc111e49002",
    "code": "DVVH.000161",
    "name": "Công ty CP DVKT PTSC Thanh Hóa; Công ty Cổ phần Đầu tư Khoáng sản Đại Dương; Công ty Cp Hóa Chất Gama Thanh Hóa",
    "parentCode": null
  },
  {
    "id": "271f321b-88f9-46e0-8fcb-c8d0424368c3",
    "code": "DVVH.000162",
    "name": "Công ty CP DVKT Tổng hợp PTSC Thanh Hóa",
    "parentCode": null
  },
  {
    "id": "28703d55-c24b-438e-bfa6-edd88607f822",
    "code": "DVVH.000152",
    "name": "Công ty CP Dầu khí Mê Kông",
    "parentCode": null
  },
  {
    "id": "264b6f7a-9055-4b00-920d-8dc854c22fca",
    "code": "DVVH.000153",
    "name": "Công ty CP Dầu khí V-GAS",
    "parentCode": null
  },
  {
    "id": "03da4b5c-0408-4975-b1f7-d5ad60dad7d8",
    "code": "DVVH.000151",
    "name": "Công ty CP Dầu khí Đồng Tháp",
    "parentCode": null
  },
  {
    "id": "35d984f9-85f1-413c-a459-f171968155dd",
    "code": "DVVH.000156",
    "name": "Công ty CP Dịch vụ Vận tải Sài Gòn",
    "parentCode": null
  },
  {
    "id": "9ceb0204-2830-4510-b2a6-8a4c1d1a855f",
    "code": "DVVH.000155",
    "name": "Công ty CP Dịch vụ biển Tân Cảng - Tổng công ty Tân Cảng Sài Gòn",
    "parentCode": null
  },
  {
    "id": "e071837a-bb82-4d3a-880b-30f847cb053f",
    "code": "DVVH.000163",
    "name": "Công ty CP Falcon Logistics",
    "parentCode": null
  },
  {
    "id": "469ca1d4-acc4-41ba-b942-4ed8d3538a79",
    "code": "DVVH.000164",
    "name": "Công ty CP Gemadept",
    "parentCode": null
  },
  {
    "id": "3d50f6da-9f68-489c-9d96-f17fc0e6e649",
    "code": "DVVH.000165",
    "name": "Công ty CP Hòa Bình Hàm Ninh",
    "parentCode": null
  },
  {
    "id": "843f1e75-b039-4590-9ede-108f0289dc44",
    "code": "DVVH.000166",
    "name": "Công ty CP Hóa Chất Gama Thanh Hóa",
    "parentCode": null
  },
  {
    "id": "25d8b963-ac5f-427e-b9e5-7d6519189913",
    "code": "DVVH.000167",
    "name": "Công ty CP Hưng Thái Holdings",
    "parentCode": null
  },
  {
    "id": "f6b45b3d-139f-4836-81f4-99318fc5ca40",
    "code": "DVVH.000168",
    "name": "Công ty CP Kho cảng Ngoại quan và Thương mại Dầu khí Nam Sông Hậu Gò Công",
    "parentCode": null
  },
  {
    "id": "7c66d26a-f04c-4736-b38f-a06f46d5e011",
    "code": "DVVH.000169",
    "name": "Công ty CP Kinh doanh Khí hóa lỏng Miền Nam – CN Miền Tây",
    "parentCode": null
  },
  {
    "id": "955ec060-f89a-457e-ba93-0d29b0807153",
    "code": "DVVH.000170",
    "name": "Công ty CP Lọc Hóa dầu Bình Sơn",
    "parentCode": null
  },
  {
    "id": "0b98ccd5-abe1-4e1b-b349-9ff74bb50850",
    "code": "DVVH.000171",
    "name": "Công ty CP Majestic Grace Speed Ship",
    "parentCode": null
  },
  {
    "id": "71d69646-a775-485d-b518-b78975a851dd",
    "code": "DVVH.000172",
    "name": "Công ty CP Nhà Rồng",
    "parentCode": null
  },
  {
    "id": "c35ff386-511f-4119-b20c-5051d17342df",
    "code": "DVVH.000178",
    "name": "Công ty CP Thép Hòa Phát Dung Quất",
    "parentCode": null
  },
  {
    "id": "0e757b09-8a4c-4314-834c-bb3fe1e9e2b7",
    "code": "DVVH.000179",
    "name": "Công ty CP Thương mại Dầu khí Thái Bình Dương",
    "parentCode": null
  },
  {
    "id": "854fd66a-6c87-4056-a1e3-13a1b94b0f78",
    "code": "DVVH.000180",
    "name": "Công ty CP Thương mại Dịch vụ Hàng hải Phú Mỹ",
    "parentCode": null
  },
  {
    "id": "a88131f1-474d-4df2-98ad-254f15a2a6bf",
    "code": "DVVH.000181",
    "name": "Công ty CP Thương mại và Vận chuyển Trường An",
    "parentCode": null
  },
  {
    "id": "535a9e4d-5f9d-4fef-a8fc-43aa38d6f886",
    "code": "DVVH.000177",
    "name": "Công ty CP Tàu cao tốc Superdong Kiên Giang - CN Sóc Trăng",
    "parentCode": null
  },
  {
    "id": "888a3913-4df0-40e3-83a5-e507341f5fac",
    "code": "DVVH.000174",
    "name": "Công ty CP Tân Cảng Cái Mép - Tổng Công ty Tân Cảng Sài Gòn",
    "parentCode": null
  },
  {
    "id": "1f8f16c5-84c2-4b4d-b62b-320cf92926b7",
    "code": "DVVH.000175",
    "name": "Công ty CP Tân Cảng Miền Trung",
    "parentCode": null
  },
  {
    "id": "3cae82af-bf22-4c52-89de-d876c2f8f097",
    "code": "DVVH.000173",
    "name": "Công ty CP Tấm lợp Vật liệu Xây dựng Đồng Nai",
    "parentCode": null
  },
  {
    "id": "2a6ad7b4-15d2-4ef6-8c1e-05f68f830f00",
    "code": "DVVH.000176",
    "name": "Công ty CP Tập đoàn Thiên Minh Đức",
    "parentCode": null
  },
  {
    "id": "cd6b1dde-ce3c-4468-9dc4-2662e5dd2b11",
    "code": "DVVH.000183",
    "name": "Công ty CP Vận tải Thủy Tân Cảng",
    "parentCode": null
  },
  {
    "id": "4d5eeb23-af2b-4b02-a752-bf6edf841938",
    "code": "DVVH.000184",
    "name": "Công ty CP Vận tải và Giao nhận Hải Long",
    "parentCode": null
  },
  {
    "id": "259365e4-ad1a-45e9-9010-2565b405790e",
    "code": "DVVH.000187",
    "name": "Công ty CP XM Sông Lam",
    "parentCode": null
  },
  {
    "id": "d38f0c0b-6957-4269-b5cb-dec2f4166788",
    "code": "DVVH.000186",
    "name": "Công ty CP Xăng dầu Dầu khí Vũng Áng",
    "parentCode": null
  },
  {
    "id": "f6c2b334-dafe-4e1a-bfde-ef12ebf9d26c",
    "code": "DVVH.000182",
    "name": "Công ty CP tư vấn đầu tư xây dựng công trình hàng hải Biển Đông",
    "parentCode": null
  },
  {
    "id": "9621c1b7-d75f-4aba-96ef-879b2c15d956",
    "code": "DVVH.000185",
    "name": "Công ty CP xăng dầu dầu khí Phú Yên (PVOIL)",
    "parentCode": null
  },
  {
    "id": "f9ee8441-2542-4d3c-a517-37af44f33503",
    "code": "DVVH.000157",
    "name": "Công ty CP Đóng tàu An Phú",
    "parentCode": null
  },
  {
    "id": "5376a4c7-da7f-474a-ad96-8e1ed088a533",
    "code": "DVVH.000154",
    "name": "Công ty CP Đầu tư Xây dựng và Kỹ thuật VNCN E&C",
    "parentCode": null
  },
  {
    "id": "43cae7a4-878c-43e0-ae13-837f69a1f7be",
    "code": "DVVH.000035",
    "name": "Công ty Chế biến Khí Vũng Tàu (PV Gas Vungtau)",
    "parentCode": null
  },
  {
    "id": "d5a0991d-aa13-4fb9-85cc-f68ee558e02c",
    "code": "DVVH.000033",
    "name": "Công ty Cảng Container Trung tâm Sài Gòn",
    "parentCode": null
  },
  {
    "id": "23ded153-eb95-456f-8ae4-49d788646057",
    "code": "DVVH.000034",
    "name": "Công ty Cảng Dịch vụ Dầu khí",
    "parentCode": null
  },
  {
    "id": "e3d66e05-62b9-4688-b4ea-6d29eb1c132f",
    "code": "DVVH.000036",
    "name": "Công ty Cổ phần Ana Marina Nha Trang",
    "parentCode": null
  },
  {
    "id": "955b054b-acb7-43a1-88c5-9360c7670429",
    "code": "DVVH.000037",
    "name": "Công ty Cổ phần Bảo Việt Phát",
    "parentCode": null
  },
  {
    "id": "994c5136-ab50-4fd5-b09f-714e5981a5da",
    "code": "DVVH.000069",
    "name": "Công ty Cổ phần Chế tạo Giàn khoan Dầu khí",
    "parentCode": null
  },
  {
    "id": "ef85f462-7add-4265-9151-01b150689e7a",
    "code": "DVVH.000071",
    "name": "Công ty Cổ phần Container Việt Nam",
    "parentCode": null
  },
  {
    "id": "839bd869-713f-4b9b-9dac-0cbd47fbf74a",
    "code": "DVVH.000072",
    "name": "Công ty Cổ phần Container Việt Nam (Viconship)",
    "parentCode": null
  },
  {
    "id": "97b2257e-0cb1-4e00-b648-dcb4e4dcfd26",
    "code": "DVVH.000070",
    "name": "Công ty Cổ phần Cơ khí Đóng tàu Nghệ An",
    "parentCode": null
  },
  {
    "id": "72194f7d-f18a-4085-9b70-94a24fd5d8d7",
    "code": "DVVH.000038",
    "name": "Công ty Cổ phần Cảng An Giang",
    "parentCode": null
  },
  {
    "id": "b9341308-1727-4ce3-b93b-e541423ea4cf",
    "code": "DVVH.000039",
    "name": "Công ty Cổ phần Cảng Bình Dương",
    "parentCode": null
  },
  {
    "id": "a436d9fe-cd17-45e0-b59f-f477d89da6de",
    "code": "DVVH.000041",
    "name": "Công ty Cổ phần Cảng Cam Ranh",
    "parentCode": null
  },
  {
    "id": "59a3367f-c15c-4692-a679-19770ce89654",
    "code": "DVVH.000040",
    "name": "Công ty Cổ phần Cảng Cái Mép Gemadept-Terminal Link",
    "parentCode": null
  },
  {
    "id": "bc9d501e-c48f-4c65-9998-720088e4c0c7",
    "code": "DVVH.000043",
    "name": "Công ty Cổ phần Cảng Cửa Cấm",
    "parentCode": null
  },
  {
    "id": "8d0c31de-1436-402b-ad60-05ffaff6dad0",
    "code": "DVVH.000046",
    "name": "Công ty Cổ phần Cảng Dịch vụ Dầu khí Đình Vũ",
    "parentCode": null
  },
  {
    "id": "d74f0045-1263-4340-9a03-3f374b0df172",
    "code": "DVVH.000051",
    "name": "Công ty Cổ phần Cảng Hải Phòng",
    "parentCode": null
  },
  {
    "id": "8d470ca5-e78b-46d3-ad5d-b77e9a37d2e3",
    "code": "DVVH.000052",
    "name": "Công ty Cổ phần Cảng Long Thành",
    "parentCode": null
  },
  {
    "id": "b7e80da6-6c76-4eb1-8ba7-4d4b3ffda5bd",
    "code": "DVVH.000053",
    "name": "Công ty Cổ phần Cảng Mỹ Tho",
    "parentCode": null
  },
  {
    "id": "fad2a9c3-dc80-49c4-b774-8e81e143efba",
    "code": "DVVH.000054",
    "name": "Công ty Cổ phần Cảng Nam Hải",
    "parentCode": null
  },
  {
    "id": "cea167ac-0fd5-4cd7-bdd3-4eaf9719c851",
    "code": "DVVH.000055",
    "name": "Công ty Cổ phần Cảng Nam Hải, Đình Vũ",
    "parentCode": null
  },
  {
    "id": "30cf83c9-ba28-4561-8fde-2a42f0ad3cc8",
    "code": "DVVH.000056",
    "name": "Công ty Cổ phần Cảng Quảng Bình",
    "parentCode": null
  },
  {
    "id": "b598a9f6-efb5-4719-a296-be05d0f6f06a",
    "code": "DVVH.000057",
    "name": "Công ty Cổ phần Cảng Quảng Ninh",
    "parentCode": null
  },
  {
    "id": "dbb617e6-ae42-4ff4-a187-9709a06cfcfd",
    "code": "DVVH.000058",
    "name": "Công ty Cổ phần Cảng Quốc tế Trung Nam Cà Ná",
    "parentCode": null
  },
  {
    "id": "f76fcf7d-1b6a-4c88-be0b-f8a8acd13036",
    "code": "DVVH.000059",
    "name": "Công ty Cổ phần Cảng Quốc tế Vĩnh Tân",
    "parentCode": null
  },
  {
    "id": "d0988596-d3da-47f2-b045-13204b3014fe",
    "code": "DVVH.000060",
    "name": "Công ty Cổ phần Cảng Sài Gòn - Hiệp Phước",
    "parentCode": null
  },
  {
    "id": "f0537bfa-d957-4af6-820c-d94b1fa0b052",
    "code": "DVVH.000061",
    "name": "Công ty Cổ phần Cảng Thạnh Phước",
    "parentCode": null
  },
  {
    "id": "19d44077-5237-4c4b-b066-3cc89a576f95",
    "code": "DVVH.000063",
    "name": "Công ty Cổ phần Cảng Tổng hợp Thị Vải",
    "parentCode": null
  },
  {
    "id": "5648e3f9-7692-4ba6-9ba1-435b8f978f3a",
    "code": "DVVH.000066",
    "name": "Công ty Cổ phần Cảng VIMC Đình Vũ",
    "parentCode": null
  },
  {
    "id": "f2006c96-b331-4378-9a20-21849f83e18a",
    "code": "DVVH.000064",
    "name": "Công ty Cổ phần Cảng Vàm Cỏ",
    "parentCode": null
  },
  {
    "id": "62ec8c60-c58c-4bf6-8c9c-b24c9ed9929c",
    "code": "DVVH.000067",
    "name": "Công ty Cổ phần Cảng Vĩnh Long",
    "parentCode": null
  },
  {
    "id": "1f2eafc3-a8ca-403d-9d9b-dc3eaa105d55",
    "code": "DVVH.000065",
    "name": "Công ty Cổ phần Cảng Vật Cách",
    "parentCode": null
  },
  {
    "id": "bf672447-ab86-45a3-a19b-ab959a87063f",
    "code": "DVVH.000068",
    "name": "Công ty Cổ phần Cảng Xanh VIP",
    "parentCode": null
  },
  {
    "id": "36ebb812-2c37-43c0-9e11-f43aae0a13f5",
    "code": "DVVH.000048",
    "name": "Công ty Cổ phần Cảng Đoạn Xá",
    "parentCode": null
  },
  {
    "id": "59adaa2d-9dd3-46be-88e8-75c651daa180",
    "code": "DVVH.000045",
    "name": "Công ty Cổ phần Cảng Đà Nẵng",
    "parentCode": null
  },
  {
    "id": "d1b58c00-f5df-4bf8-9b55-b451eac0924c",
    "code": "DVVH.000050",
    "name": "Công ty Cổ phần Cảng Đông Xuyên",
    "parentCode": null
  },
  {
    "id": "22bea7e7-db2a-43cf-8877-d725f824ea7d",
    "code": "DVVH.000049",
    "name": "Công ty Cổ phần Cảng Đồng Nai",
    "parentCode": null
  },
  {
    "id": "59dfc064-cad8-46c3-9599-a460744a75fa",
    "code": "DVVH.000073",
    "name": "Công ty Cổ phần DAP Vinachem",
    "parentCode": null
  },
  {
    "id": "874809ff-cc76-4a89-9384-d0499a9c56ed",
    "code": "DVVH.000074",
    "name": "Công ty Cổ phần Dầu khí Đầu tư Khai thác Cảng Phước An",
    "parentCode": null
  },
  {
    "id": "1c425f6c-9899-478f-8ed8-9d2a70ee12e5",
    "code": "DVVH.000083",
    "name": "Công ty Cổ phần Dịch vụ Vận tải Biển Hải Vân",
    "parentCode": null
  },
  {
    "id": "2458a16f-0c80-4412-a96e-480a19400600",
    "code": "DVVH.000084",
    "name": "Công ty Cổ phần Dịch vụ Xuất nhập khẩu Nông lâm sản và Phân bón Baria",
    "parentCode": null
  },
  {
    "id": "a3acdb16-f5fd-4efa-a221-0b7300f0e804",
    "code": "DVVH.000090",
    "name": "Công ty Cổ phần Hateco Logistics",
    "parentCode": null
  },
  {
    "id": "bb6ac8ab-417e-48ec-9ab9-997c302838db",
    "code": "DVVH.000089",
    "name": "Công ty Cổ phần Hàng hải Macs",
    "parentCode": null
  },
  {
    "id": "e7d52789-6038-4d51-acb2-fd8b42a20baa",
    "code": "DVVH.000091",
    "name": "Công ty Cổ phần Hóa dầu Vạn An",
    "parentCode": null
  },
  {
    "id": "b4fd00c6-6b47-402a-93fc-5fe6bf48cc05",
    "code": "DVVH.000088",
    "name": "Công ty Cổ phần Hải Phát",
    "parentCode": null
  },
  {
    "id": "97e6c83a-a8db-4248-a4d2-18a0b9d4c6aa",
    "code": "DVVH.000092",
    "name": "Công ty Cổ phần ICD Nam Đình Vũ",
    "parentCode": null
  },
  {
    "id": "cc6ba351-3408-4f71-a900-5ea86a854aa7",
    "code": "DVVH.000093",
    "name": "Công ty Cổ phần ICD Tân Cảng Long Bình",
    "parentCode": null
  },
  {
    "id": "b1efe341-62b8-46f3-9f2a-489a63e71e27",
    "code": "DVVH.000095",
    "name": "Công ty Cổ phần Khoáng sản và Đầu tư Khánh Hòa",
    "parentCode": null
  },
  {
    "id": "d397f42d-df04-4c9f-90b2-531395c6813d",
    "code": "DVVH.000094",
    "name": "Công ty Cổ phần Kết cấu Kim loại và Lắp máy Dầu khí",
    "parentCode": null
  },
  {
    "id": "90b5844b-5819-4e66-a3d6-5f401777ae00",
    "code": "DVVH.000097",
    "name": "Công ty Cổ phần Lisemco",
    "parentCode": null
  },
  {
    "id": "4456bed4-d427-4d0b-89b5-48d5ae814f79",
    "code": "DVVH.000098",
    "name": "Công ty Cổ phần Luyện thép Cao cấp Việt Nhật",
    "parentCode": null
  },
  {
    "id": "c73ffd70-a5c5-447d-b8f2-1fe0c61f7263",
    "code": "DVVH.000099",
    "name": "Công ty Cổ phần Muối Khánh Hòa",
    "parentCode": null
  },
  {
    "id": "55a0143f-9cae-4452-81ec-fc6b11d1a9cb",
    "code": "DVVH.000100",
    "name": "Công ty Cổ phần Muối Ninh Thuận",
    "parentCode": null
  },
  {
    "id": "967dc553-9ad5-4088-a26b-447489aaa462",
    "code": "DVVH.000101",
    "name": "Công ty Cổ phần Nhiệt điện Hải Phòng",
    "parentCode": null
  },
  {
    "id": "ffcbdef1-2633-466d-a167-956e5f1aa055",
    "code": "DVVH.000102",
    "name": "Công ty Cổ phần Nhiệt điện Thăng Long",
    "parentCode": null
  },
  {
    "id": "c5bbf4fa-1359-47b2-a6b1-a7186ae52436",
    "code": "DVVH.000103",
    "name": "Công ty Cổ phần Nosco - Shipyard",
    "parentCode": null
  },
  {
    "id": "47bc3845-b4ab-410e-9ae5-d6e96f70a40f",
    "code": "DVVH.000105",
    "name": "Công ty Cổ phần Phát triển Logistics Quang Minh",
    "parentCode": null
  },
  {
    "id": "621794ad-0740-4df3-ba21-9096982d66d9",
    "code": "DVVH.000104",
    "name": "Công ty Cổ phần Phân bón Miền Nam",
    "parentCode": null
  },
  {
    "id": "c3be0e81-504b-4f15-b3a4-7dd3808fa508",
    "code": "DVVH.000106",
    "name": "Công ty Cổ phần Phúc Lộc",
    "parentCode": null
  },
  {
    "id": "9049088c-d898-41e2-b3da-6c28fc5a727d",
    "code": "DVVH.000107",
    "name": "Công ty Cổ phần RAINBOW VIỆT NAM",
    "parentCode": null
  },
  {
    "id": "1b4de297-f21c-4b1c-a431-31e07e846628",
    "code": "DVVH.000108",
    "name": "Công ty Cổ phần S.S.V",
    "parentCode": null
  },
  {
    "id": "97bafb67-e03f-431f-a80b-b4905e09460b",
    "code": "DVVH.000118",
    "name": "Công ty Cổ phần TMĐT Dầu khí Nam Sông Hậu - Chi nhánh Cần Thơ",
    "parentCode": null
  },
  {
    "id": "36331a60-458c-4a67-a51c-d65fa1462991",
    "code": "DVVH.000112",
    "name": "Công ty Cổ phần Thanh Bình Phú Mỹ",
    "parentCode": null
  },
  {
    "id": "efa52c08-fa99-4c53-bf8c-bbfff86f34ac",
    "code": "G17.72.13",
    "name": "Công ty Cổ phần Thiết bị báo hiệu hàng hải miền Nam",
    "parentCode": null
  },
  {
    "id": "56d433ba-f3da-4487-be8d-e132141c9ffb",
    "code": "DVVH.000113",
    "name": "Công ty Cổ phần Thành Đạt",
    "parentCode": null
  },
  {
    "id": "f3cf395a-48d3-4001-87a0-2134a4fcb8d9",
    "code": "DVVH.000114",
    "name": "Công ty Cổ phần Thép Posco Yamato Vina",
    "parentCode": null
  },
  {
    "id": "6107e793-acff-4cbc-9a92-eda71fc9d822",
    "code": "DVVH.000115",
    "name": "Công ty Cổ phần Thương cảng Vũng Tàu",
    "parentCode": null
  },
  {
    "id": "34183107-33c4-4b04-a952-aaa09b0e8c90",
    "code": "DVVH.000117",
    "name": "Công ty Cổ phần Thương mại và Dịch vụ Hàng hải Đại Dương",
    "parentCode": null
  },
  {
    "id": "a84ea4d9-8282-428d-9d30-624f7c68c853",
    "code": "DVVH.000116",
    "name": "Công ty Cổ phần Thương mại Đầu tư Dầu khí Nam Sông Hậu",
    "parentCode": null
  },
  {
    "id": "fcc155d8-5400-4ffb-a453-00813e401e31",
    "code": "DVVH.000109",
    "name": "Công ty Cổ phần Tân Cảng - Đồng Văn Hà Nam",
    "parentCode": null
  },
  {
    "id": "9e4a7518-e21e-455e-8ed0-3b2cb66f0397",
    "code": "DVVH.000110",
    "name": "Công ty Cổ phần Tân Cảng Giao Long",
    "parentCode": null
  },
  {
    "id": "f4073ad6-c223-4348-a33b-243f360d9cd9",
    "code": "DVVH.000111",
    "name": "Công ty Cổ phần Tập đoàn Dương Đông",
    "parentCode": null
  },
  {
    "id": "dd0a379f-f694-4a9e-a760-4618a8289b07",
    "code": "DVVH.000121",
    "name": "Công ty Cổ phần VIMC Logistic",
    "parentCode": null
  },
  {
    "id": "b9a328b4-2703-48c8-a28a-986001d659bb",
    "code": "DVVH.000122",
    "name": "Công ty Cổ phần Vinpearl",
    "parentCode": null
  },
  {
    "id": "3035096f-53b8-47be-b5c8-d7da8af5ce2b",
    "code": "DVVH.000119",
    "name": "Công ty Cổ phần Vận tải và Thương mại Quốc tế (ITC)",
    "parentCode": null
  },
  {
    "id": "4218eb7b-2b02-4263-bbf2-952022dfdaf8",
    "code": "DVVH.000120",
    "name": "Công ty Cổ phần Vận tải và Xếp dỡ Hải An",
    "parentCode": null
  },
  {
    "id": "3fa27d50-4dfc-4b56-84b3-db3a242e2fe1",
    "code": "DVVH.000124",
    "name": "Công ty Cổ phần Xi măng Cẩm Phả",
    "parentCode": null
  },
  {
    "id": "cf14a686-3741-472f-bd7e-17c00981cf84",
    "code": "DVVH.000126",
    "name": "Công ty Cổ phần Xi măng Hà Tiên 1",
    "parentCode": null
  },
  {
    "id": "e6652fee-636e-4bf0-abe4-4c637aadd292",
    "code": "DVVH.000125",
    "name": "Công ty Cổ phần Xi măng Hạ Long",
    "parentCode": null
  },
  {
    "id": "ae17c7cc-d7a8-479c-bf6a-2d311c546506",
    "code": "DVVH.000128",
    "name": "Công ty Cổ phần Xi măng Thăng Long",
    "parentCode": null
  },
  {
    "id": "3eb1b029-a3b1-49a5-af8f-e96a52318d61",
    "code": "DVVH.000127",
    "name": "Công ty Cổ phần Xi măng Tây Đô",
    "parentCode": null
  },
  {
    "id": "3b99126e-4415-4120-b31a-36e4736ad7b3",
    "code": "DVVH.000129",
    "name": "Công ty Cổ phần Xi măng Vicem Hải Vân",
    "parentCode": null
  },
  {
    "id": "ff29ea79-d9d2-4aa9-ba3b-eed0e5137552",
    "code": "DVVH.000130",
    "name": "Công ty Cổ phần Xuân Thành Khánh Hòa",
    "parentCode": null
  },
  {
    "id": "359705bd-7577-406e-abd5-bfc09b3c37fb",
    "code": "DVVH.000123",
    "name": "Công ty Cổ phần Xăng dầu Dầu khí Cái Lân",
    "parentCode": null
  },
  {
    "id": "f3b10156-56a5-4690-be76-f502e39ace76",
    "code": "DVVH.000096",
    "name": "Công ty Cổ phần kinh doanh LPG Việt Nam",
    "parentCode": null
  },
  {
    "id": "0e7b0caa-9f7b-4649-9088-900bc6ef7ee3",
    "code": "DVVH.000086",
    "name": "Công ty Cổ phần Đóng tàu và Dịch vụ Dầu khí Vũng Tàu",
    "parentCode": null
  },
  {
    "id": "baf29345-4c55-47bc-891e-cb40c72ea057",
    "code": "DVVH.000075",
    "name": "Công ty Cổ phần Đầu Tư Bắc Kỳ",
    "parentCode": null
  },
  {
    "id": "ed5f9bf2-0159-4798-af03-8da9a7e3ad26",
    "code": "DVVH.000077",
    "name": "Công ty Cổ phần Đầu tư Khoáng sản Đại Dương",
    "parentCode": null
  },
  {
    "id": "04862f24-49fd-4edc-bbea-56eb4698f416",
    "code": "DVVH.000078",
    "name": "Công ty Cổ phần Đầu tư Long Thuận",
    "parentCode": null
  },
  {
    "id": "1ae407be-33f6-4da2-88aa-d9ecc453db4b",
    "code": "DVVH.000079",
    "name": "Công ty Cổ phần Đầu tư Phát triển 324",
    "parentCode": null
  },
  {
    "id": "813394e7-969d-4357-9d10-96a2497b129c",
    "code": "DVVH.000080",
    "name": "Công ty Cổ phần Đầu tư Thương mại & Vận tải Trường An",
    "parentCode": null
  },
  {
    "id": "7702edfd-e4f1-4103-93da-5d624961b3d1",
    "code": "DVVH.000082",
    "name": "Công ty Cổ phần Đầu tư Xây dựng Thái Hưng",
    "parentCode": null
  },
  {
    "id": "66edc163-a767-42a7-90f5-4778b6749933",
    "code": "DVVH.000081",
    "name": "Công ty Cổ phần Đầu tư và Phát triển Cảng Đình Vũ",
    "parentCode": null
  },
  {
    "id": "614331de-f458-4cda-bac8-a8129e340ffb",
    "code": "DVVH.000076",
    "name": "Công ty Cổ phần Đầu tư Địa ốc Tấn Trường Group",
    "parentCode": null
  },
  {
    "id": "0baca95d-85f4-4881-8af7-0b5377fdc3fd",
    "code": "DVVH.000085",
    "name": "Công ty Cổ phần đóng tàu Chu Lai",
    "parentCode": null
  },
  {
    "id": "465e6b08-4f43-4b94-a291-cf15d6a930ef",
    "code": "DVVH.000087",
    "name": "Công ty Cổ phần đường biển Mỹ Giang",
    "parentCode": null
  },
  {
    "id": "30c68d99-31ba-47b6-84aa-18a17a22c9ff",
    "code": "DVVH.000188",
    "name": "Công ty Dầu khí Nhật Việt (JVPC)",
    "parentCode": null
  },
  {
    "id": "57f1fd29-9758-43d7-b00b-a13e437ca28c",
    "code": "DVVH.000189",
    "name": "Công ty Dầu khí Quốc gia Hàn Quốc (KNOC)",
    "parentCode": null
  },
  {
    "id": "cea8498b-4c34-4765-acca-3325442bcffe",
    "code": "DVVH.000193",
    "name": "Công ty Kho vận và Cảng Cẩm Phả - Vinacomin",
    "parentCode": null
  },
  {
    "id": "f641e2e5-df34-460a-bf9b-848c9fe5f3f6",
    "code": "DVVH.000194",
    "name": "Công ty Liên doanh Bông Sen",
    "parentCode": null
  },
  {
    "id": "bc9d9ee4-2ad9-497d-b8d6-5269e3138afa",
    "code": "DVVH.000195",
    "name": "Công ty Liên doanh Dịch vụ Container Cảng Quốc tế Cảng Sài Gòn-SSA",
    "parentCode": null
  },
  {
    "id": "4344045f-b68c-42ea-ac51-3a50286b7b0a",
    "code": "DVVH.000198",
    "name": "Công ty Liên doanh Phát triển Tiếp vận Số 1",
    "parentCode": null
  },
  {
    "id": "03f60828-b193-430e-9fac-bbe8318a49cc",
    "code": "DVVH.000196",
    "name": "Công ty Liên doanh Điều hành Biển Đông",
    "parentCode": null
  },
  {
    "id": "85767117-e7f9-4000-be02-f6c21a6b7fd6",
    "code": "DVVH.000197",
    "name": "Công ty Liên doanh Điều hành Cửu Long",
    "parentCode": null
  },
  {
    "id": "30b11ada-4299-43a7-93f6-657f938137e2",
    "code": "DVVH.000199",
    "name": "Công ty Lương thực Sông Hậu",
    "parentCode": null
  },
  {
    "id": "31140f3a-aeb1-438b-9b6e-7f9d1bb8cd20",
    "code": "DVVH.000200",
    "name": "Công ty Nhiệt điện Cần Thơ",
    "parentCode": null
  },
  {
    "id": "ee127971-dced-4d08-acbd-2272277f7c33",
    "code": "DVVH.000201",
    "name": "Công ty Nhiệt điện Duyên Hải",
    "parentCode": null
  },
  {
    "id": "61d51068-e723-485e-b737-47eb70c74b94",
    "code": "DVVH.000202",
    "name": "Công ty Nhiệt điện Nghi Sơn",
    "parentCode": null
  },
  {
    "id": "24fba0fe-d7fe-44e9-94d4-92da4752836f",
    "code": "DVVH.000203",
    "name": "Công ty Nhiệt điện Vĩnh Tân",
    "parentCode": null
  },
  {
    "id": "f8ef837d-c343-45d1-bea2-99fb19e561be",
    "code": "DVVH.000204",
    "name": "Công ty Rosneft Việt Nam B.V",
    "parentCode": null
  },
  {
    "id": "684987fe-34ec-4ea2-9847-3336afcf972a",
    "code": "DVVH.000222",
    "name": "Công ty TNHH Công Nghiệp Long Sơn",
    "parentCode": null
  },
  {
    "id": "dba4e424-a332-4e2f-986e-c5dfbc1c7225",
    "code": "DVVH.000221",
    "name": "Công ty TNHH Công nghiệp FU-I",
    "parentCode": null
  },
  {
    "id": "981e3a41-1037-44d7-897b-739572dd4ad8",
    "code": "DVVH.000208",
    "name": "Công ty TNHH Cảng Container Quốc tế Hateco Hải Phòng",
    "parentCode": null
  },
  {
    "id": "23ebd2b6-4824-4707-affe-170bdebc3850",
    "code": "DVVH.000206",
    "name": "Công ty TNHH Cảng Công ten nơ Quốc tế Cái Lân",
    "parentCode": null
  },
  {
    "id": "5992eec1-65f6-4d5b-896b-9256b5df3539",
    "code": "DVVH.000207",
    "name": "Công ty TNHH Cảng Công-ten-nơ Quốc tế Tân Cảng Hải Phòng (HICT)",
    "parentCode": null
  },
  {
    "id": "2f35fe57-d991-419b-b542-351514c2c844",
    "code": "DVVH.000209",
    "name": "Công ty TNHH Cảng Hải An",
    "parentCode": null
  },
  {
    "id": "8d25d532-60c9-45fa-90d3-74e19ab5a495",
    "code": "DVVH.000210",
    "name": "Công ty TNHH Cảng Phước Long",
    "parentCode": null
  },
  {
    "id": "4c3b3dd1-3e6c-403d-9ef8-39639f6bcceb",
    "code": "DVVH.000211",
    "name": "Công ty TNHH Cảng Quốc tế Cái Mép",
    "parentCode": null
  },
  {
    "id": "4873755b-5f5f-4b88-b5c1-4c1e4d7a8c4d",
    "code": "DVVH.000212",
    "name": "Công ty TNHH Cảng Quốc tế Nghi Sơn",
    "parentCode": null
  },
  {
    "id": "0849eca7-88dc-4b9d-a0e1-12c19ecb5915",
    "code": "DVVH.000214",
    "name": "Công ty TNHH Cảng Quốc tế SP-PSA",
    "parentCode": null
  },
  {
    "id": "0fc37822-3e88-47b4-89ed-ffaf015a0978",
    "code": "DVVH.000213",
    "name": "Công ty TNHH Cảng Quốc tế Sài Gòn Việt Nam",
    "parentCode": null
  },
  {
    "id": "85fb368b-6fa9-48f1-85a9-314716add1e3",
    "code": "DVVH.000215",
    "name": "Công ty TNHH Cảng Quốc tế Thị Vải",
    "parentCode": null
  },
  {
    "id": "d17be2a6-1782-48e8-86f7-4d47cd60336b",
    "code": "DVVH.000216",
    "name": "Công ty TNHH Cảng Thương Chánh",
    "parentCode": null
  },
  {
    "id": "1df85d6f-667a-4e70-b600-684c64c1ac83",
    "code": "DVVH.000217",
    "name": "Công ty TNHH Cảng Tổng hợp Cái Mép",
    "parentCode": null
  },
  {
    "id": "ac074774-2cd9-4c36-a2ba-393ce309d209",
    "code": "DVVH.000219",
    "name": "Công ty TNHH Cảng Vân Phong",
    "parentCode": null
  },
  {
    "id": "16e966e9-e66f-487a-8081-7db66eb5638d",
    "code": "DVVH.000205",
    "name": "Công ty TNHH Cảng biển Quốc tế Chu Lai",
    "parentCode": null
  },
  {
    "id": "ccc4e0ec-cff1-4603-a989-8a18bbfbe2be",
    "code": "DVVH.000218",
    "name": "Công ty TNHH Cảng và Logistics Tân Chi",
    "parentCode": null
  },
  {
    "id": "a2c85bd8-9fdb-4160-8ed3-c270fd405e72",
    "code": "DVVH.000220",
    "name": "Công ty TNHH Cầu cảng EURO (Việt Nam)",
    "parentCode": null
  },
  {
    "id": "1a4fe767-74ec-48e2-b963-63dd40596a4a",
    "code": "DVVH.000223",
    "name": "Công ty TNHH Damen Sông Cấm",
    "parentCode": null
  },
  {
    "id": "d27b47ff-6901-4d80-b8a4-450b09e3700f",
    "code": "DVVH.000234",
    "name": "Công ty TNHH Doosan Enerbility Việt Nam",
    "parentCode": null
  },
  {
    "id": "7b6e7712-5c33-4b7e-b4d2-e57ccf4c6460",
    "code": "DVVH.000235",
    "name": "Công ty TNHH Dương Đông - Bình Thuận",
    "parentCode": null
  },
  {
    "id": "6a66c282-8dc6-46a4-8700-8ad8dcfe6115",
    "code": "DVVH.000225",
    "name": "Công ty TNHH Dầu khí Hải Linh Vũng Tàu",
    "parentCode": null
  },
  {
    "id": "f68a84f8-327c-4adc-a8b4-4c965e0d5792",
    "code": "DVVH.000224",
    "name": "Công ty TNHH Dầu khí Đài Hải",
    "parentCode": null
  },
  {
    "id": "3c54c9b4-c141-4065-bc5b-5ec2901e08dd",
    "code": "DVVH.000227",
    "name": "Công ty TNHH Dịch vụ Kỹ thuật Nghi Sơn",
    "parentCode": null
  },
  {
    "id": "ef2ac222-2131-4198-8e80-e0d2e8e987da",
    "code": "DVVH.000236",
    "name": "Công ty TNHH ELF GAZ Đà Nẵng",
    "parentCode": null
  },
  {
    "id": "4dece9f2-d66f-4dc5-bcd4-14c58b2ce484",
    "code": "DVVH.000237",
    "name": "Công ty TNHH FLAT",
    "parentCode": null
  },
  {
    "id": "dbd06887-69f6-4cdb-a4e7-b53648125773",
    "code": "DVVH.000238",
    "name": "Công ty TNHH Gang thép Hưng Nghiệp Formosa Hà Tĩnh",
    "parentCode": null
  },
  {
    "id": "1b6be87e-b65c-4979-9adc-98a0b5fdddd9",
    "code": "DVVH.000239",
    "name": "Công ty TNHH Giấy Lee & Man",
    "parentCode": null
  },
  {
    "id": "7fb5cc03-5775-40c4-b9b9-a000b33be557",
    "code": "DVVH.000244",
    "name": "Công ty TNHH Hoàng Nguyên",
    "parentCode": null
  },
  {
    "id": "4df92c47-cdab-4271-9581-5057043f5b89",
    "code": "DVVH.000245",
    "name": "Công ty TNHH Hyosung Việt Nam",
    "parentCode": null
  },
  {
    "id": "117e56ef-c9d3-4036-b8e7-39565e78c6a1",
    "code": "DVVH.000240",
    "name": "Công ty TNHH Hà Lộc",
    "parentCode": null
  },
  {
    "id": "2d70b07d-4643-4307-b681-727929bc4813",
    "code": "DVVH.000242",
    "name": "Công ty TNHH Hàng hải Sao Mai",
    "parentCode": null
  },
  {
    "id": "8acc3452-aeae-4480-954b-7d05bb4f4359",
    "code": "DVVH.000243",
    "name": "Công ty TNHH Hóa dầu Long Sơn",
    "parentCode": null
  },
  {
    "id": "cc68b77b-cfe6-4106-ab28-e0d4283b3b49",
    "code": "DVVH.000241",
    "name": "Công ty TNHH Hải Linh",
    "parentCode": null
  },
  {
    "id": "72202dbc-dfa0-4692-8c18-c4e227c3da95",
    "code": "DVVH.000246",
    "name": "Công ty TNHH Interflour Việt Nam",
    "parentCode": null
  },
  {
    "id": "c360c428-833f-444b-b046-18661894b5c8",
    "code": "DVVH.000247",
    "name": "Công ty TNHH Janakuasa Việt Nam",
    "parentCode": null
  },
  {
    "id": "1a03e26b-45b1-4853-ba6b-23f6fea84792",
    "code": "DVVH.000248",
    "name": "Công ty TNHH Khí hóa lỏng Thăng Long",
    "parentCode": null
  },
  {
    "id": "08fa2e59-ff72-412a-9d84-47d2bf625f23",
    "code": "DVVH.000249",
    "name": "Công ty TNHH Komipo Vân Phong Power Service",
    "parentCode": null
  },
  {
    "id": "38bb75fd-0d71-4142-a915-6643700747ec",
    "code": "DVVH.000250",
    "name": "Công ty TNHH Kỹ thuật CKHH Vina Offshore",
    "parentCode": null
  },
  {
    "id": "d6b75ab7-0a37-4a3b-a57d-818ddb1c0948",
    "code": "DVVH.000252",
    "name": "Công ty TNHH Liên doanh Kho Ngoại quan Xăng dầu Vân Phong",
    "parentCode": null
  },
  {
    "id": "8d97f5a7-d3ed-41e6-aa84-9e11fe98d439",
    "code": "DVVH.000254",
    "name": "Công ty TNHH Long Sơn",
    "parentCode": null
  },
  {
    "id": "e33ea6d9-55de-4b2e-a25f-2da222fa7448",
    "code": "DVVH.000251",
    "name": "Công ty TNHH Lê Quốc",
    "parentCode": null
  },
  {
    "id": "12f7b19e-256c-4e96-ba6a-fd0c66c57ff2",
    "code": "DVVH.000253",
    "name": "Công ty TNHH Lọc Hóa dầu Nghi Sơn",
    "parentCode": null
  },
  {
    "id": "89f15a06-19a0-40e5-9c25-c7b5ca860efd",
    "code": "DVVH.000256",
    "name": "Công ty TNHH MTV 128",
    "parentCode": null
  },
  {
    "id": "614ef1e1-869a-4584-868d-db4e52cb7612",
    "code": "DVVH.000257",
    "name": "Công ty TNHH MTV 189",
    "parentCode": null
  },
  {
    "id": "f56a0521-b5a9-43fb-803f-954a4b80e86c",
    "code": "DVVH.000261",
    "name": "Công ty TNHH MTV CNTT Diêm Điền",
    "parentCode": null
  },
  {
    "id": "2e687cbe-74d4-4d28-b0b9-c80edfd2fe5f",
    "code": "DVVH.000262",
    "name": "Công ty TNHH MTV Công nghiệp Tàu thủy Sài Gòn",
    "parentCode": null
  },
  {
    "id": "a6547a0a-5e8f-431e-9ae0-49011b0457bc",
    "code": "DVVH.000258",
    "name": "Công ty TNHH MTV Cảng Bến Nghé",
    "parentCode": null
  },
  {
    "id": "b328b92d-a938-4f24-974b-7257b6068ece",
    "code": "DVVH.000259",
    "name": "Công ty TNHH MTV Cảng Hoàng Diệu",
    "parentCode": null
  },
  {
    "id": "2bf9de52-3075-46a1-a19e-a11b4fb79fff",
    "code": "DVVH.000260",
    "name": "Công ty TNHH MTV Cảng Tân Cảng Cái Mép Thị Vải",
    "parentCode": null
  },
  {
    "id": "327817ee-1a2f-4d4f-a0ae-9c80dcbbe018",
    "code": "DVVH.000263",
    "name": "Công ty TNHH MTV Dầu Khí Hải Linh Hải Phòng",
    "parentCode": null
  },
  {
    "id": "9a6d05fc-090a-4985-93f3-724f8fd866dc",
    "code": "DVVH.000264",
    "name": "Công ty TNHH MTV Dầu khí Thành phố Hồ Chí Minh",
    "parentCode": null
  },
  {
    "id": "264dc979-44f9-4379-8473-14440ee738e2",
    "code": "DVVH.000265",
    "name": "Công ty TNHH MTV Dịch vụ Hàng hải Hậu Giang",
    "parentCode": null
  },
  {
    "id": "0faee25b-cbb0-46f4-86f8-7e188c870abe",
    "code": "G17.72.12",
    "name": "Công ty TNHH MTV Hoa tiêu hàng hải miền Nam",
    "parentCode": null
  },
  {
    "id": "0f18fd46-32c2-43ee-83b4-2b48fedd7844",
    "code": "G17.72.12.01",
    "name": "Công ty TNHH MTV Hoa tiêu hàng hải miền Nam - Chi nhánh Hoa tiêu 5",
    "parentCode": null
  },
  {
    "id": "e8612853-3474-4e9a-bc44-7f92db2d73e3",
    "code": "G17.72.12.02",
    "name": "Công ty TNHH MTV Hoa tiêu hàng hải miền Nam - Chi nhánh Hoa tiêu 7",
    "parentCode": null
  },
  {
    "id": "8d133f5c-5bbc-4fa3-9b60-2d7c33bb7cc6",
    "code": "G17.72.12.03",
    "name": "Công ty TNHH MTV Hoa tiêu hàng hải miền Nam - Chi nhánh Hoa tiêu 8",
    "parentCode": null
  },
  {
    "id": "980f31c4-7d81-4c8b-b055-c7f8f09bbdc2",
    "code": "G17.72.12.04",
    "name": "Công ty TNHH MTV Hoa tiêu hàng hải miền Nam - Chi nhánh Hoa tiêu 9",
    "parentCode": null
  },
  {
    "id": "19d075a6-7c18-4de9-8ef9-7f6d463c99c6",
    "code": "DVVH.000281",
    "name": "Công ty TNHH MTV Hàng hải Viễn Đông",
    "parentCode": null
  },
  {
    "id": "dd2b4d70-3fdb-4ef9-9594-1ca56ff312c1",
    "code": "DVVH.000283",
    "name": "Công ty TNHH MTV Hào Hưng Quảng Ngãi",
    "parentCode": null
  },
  {
    "id": "b3537de7-aa6a-4836-950e-51a9e2338423",
    "code": "DVVH.000279",
    "name": "Công ty TNHH MTV Hải Bình",
    "parentCode": null
  },
  {
    "id": "f02229c2-4fef-48f1-a9bd-b116269deca7",
    "code": "DVVH.000280",
    "name": "Công ty TNHH MTV Hải sản Trường Sa",
    "parentCode": null
  },
  {
    "id": "464e7abb-b045-4ac1-8e73-2fa8f95abf78",
    "code": "DVVH.000285",
    "name": "Công ty TNHH MTV Nhiệt điện Phú Mỹ-Tổng công ty Phát điện 3",
    "parentCode": null
  },
  {
    "id": "612dd487-fbbd-4a4c-a0c8-30f99d3b56ba",
    "code": "DVVH.000286",
    "name": "Công ty TNHH MTV PETROLIMEX CẦN THƠ",
    "parentCode": null
  },
  {
    "id": "32a7863e-eb5e-4b0b-943c-7bf565122bb2",
    "code": "G17.74",
    "name": "Công ty TNHH MTV Thông tin điện tử hàng hải Việt Nam (VISHIPEL)",
    "parentCode": null
  },
  {
    "id": "01c75b37-6925-4759-948a-5de8671a9a80",
    "code": "DVVH.000287",
    "name": "Công ty TNHH MTV Thương mại Dầu khí Đồng Tháp",
    "parentCode": null
  },
  {
    "id": "e5f4d886-c1c5-4db5-9259-42f11386c388",
    "code": "DVVH.000288",
    "name": "Công ty TNHH MTV Tổng công ty Tân Cảng Sài Gòn",
    "parentCode": null
  },
  {
    "id": "97bf2423-d3c0-4413-bbf0-1eb70ce47b5d",
    "code": "DVVH.000291",
    "name": "Công ty TNHH MTV Xi măng Cần Thơ – Hậu Giang",
    "parentCode": null
  },
  {
    "id": "80ad9876-8d46-4b6f-8426-1e0464238b82",
    "code": "DVVH.000292",
    "name": "Công ty TNHH MTV Xi măng Hạ Long",
    "parentCode": null
  },
  {
    "id": "b7cc0e05-e333-47f7-be0f-6002336320f5",
    "code": "DVVH.000289",
    "name": "Công ty TNHH MTV Xăng dầu Dầu khí Thanh Hóa",
    "parentCode": null
  },
  {
    "id": "5d94328c-f08d-4f44-bdf0-cead775bdbe9",
    "code": "DVVH.000267",
    "name": "Công ty TNHH MTV Đóng tàu 76",
    "parentCode": null
  },
  {
    "id": "b14822df-3b2f-4ccf-bcc9-86f6503bda8e",
    "code": "DVVH.000268",
    "name": "Công ty TNHH MTV Đóng tàu Bạch Đằng",
    "parentCode": null
  },
  {
    "id": "48ddf6f6-1136-4437-9322-ab4e9773bbae",
    "code": "DVVH.000269",
    "name": "Công ty TNHH MTV Đóng tàu Cam Ranh",
    "parentCode": null
  },
  {
    "id": "76c92562-2f19-4230-aa28-8bc0d2cf8905",
    "code": "DVVH.000270",
    "name": "Công ty TNHH MTV Đóng tàu Hạ Long",
    "parentCode": null
  },
  {
    "id": "53c71931-f120-47e5-9334-4dd1e3bb88e5",
    "code": "DVVH.000271",
    "name": "Công ty TNHH MTV Đóng tàu Nam Triệu",
    "parentCode": null
  },
  {
    "id": "42e0d92f-5955-47de-b759-b155e549f93c",
    "code": "DVVH.000272",
    "name": "Công ty TNHH MTV Đóng tàu Nha Trang",
    "parentCode": null
  },
  {
    "id": "26fb1c2e-b68e-44e3-92ef-693abb3c2e64",
    "code": "DVVH.000273",
    "name": "Công ty TNHH MTV Đóng tàu Phà Rừng",
    "parentCode": null
  },
  {
    "id": "e40bb250-53f4-4f98-9733-692fd0c3d06e",
    "code": "DVVH.000274",
    "name": "Công ty TNHH MTV Đóng tàu Thịnh Long",
    "parentCode": null
  },
  {
    "id": "b2037b5e-d891-45cb-84fe-c315b7fb6968",
    "code": "DVVH.000275",
    "name": "Công ty TNHH MTV Đóng tàu và Công nghiệp Cơ khí Dầu khí",
    "parentCode": null
  },
  {
    "id": "4796de86-240a-4ad5-8b7a-0e01dd6e69af",
    "code": "DVVH.000276",
    "name": "Công ty TNHH MTV Đóng tàu và Công nghiệp Hàng hải Sài Gòn",
    "parentCode": null
  },
  {
    "id": "9e919753-0d89-4863-ac58-0712f05e84a6",
    "code": "DVVH.000277",
    "name": "Công ty TNHH MTV Đóng và Sửa chữa Tàu Hải Sơn",
    "parentCode": null
  },
  {
    "id": "087a416a-3557-495f-859d-b55740e6268f",
    "code": "DVVH.000278",
    "name": "Công ty TNHH MTV Đóng và Sửa tàu Hải Minh",
    "parentCode": null
  },
  {
    "id": "8e0d70c6-d5db-4673-b6c3-f371cadb9b2e",
    "code": "DVVH.000266",
    "name": "Công ty TNHH MTV Đông Hải",
    "parentCode": null
  },
  {
    "id": "baea6f7f-e255-4f6c-88a5-e8b99166518e",
    "code": "DVVH.000255",
    "name": "Công ty TNHH Mặt Trời Hạ Long - Chi nhánh Cảng Tàu khách Quốc tế Hạ Long",
    "parentCode": null
  },
  {
    "id": "7327512a-467c-4d63-89ef-48d662324935",
    "code": "DVVH.000295",
    "name": "Công ty TNHH Nhiệt điện Vũng Áng II",
    "parentCode": null
  },
  {
    "id": "1b64ec9f-1987-42ed-a1bc-bc95e132b279",
    "code": "DVVH.000294",
    "name": "Công ty TNHH Nhà máy Tàu biển HYUNDAI - VINASHIN",
    "parentCode": null
  },
  {
    "id": "0ac40ff7-63e6-41b0-b581-c94561139bb9",
    "code": "DVVH.000293",
    "name": "Công ty TNHH Nhà máy sửa chữa và đóng tàu Sài Gòn",
    "parentCode": null
  },
  {
    "id": "da539fa4-1b81-4017-8b17-d1bd1d6724ed",
    "code": "DVVH.000297",
    "name": "Công ty TNHH Nhựa đường PUMA ENERGY VIỆT NAM",
    "parentCode": null
  },
  {
    "id": "0bfc4382-1c8c-4c89-aba6-282a2a105193",
    "code": "DVVH.000296",
    "name": "Công ty TNHH Nhựa đường Petrolimex; Tổng công ty Gas Petrolimex",
    "parentCode": null
  },
  {
    "id": "39abf710-b1e5-4c24-97ea-7b1a5dbbe5f7",
    "code": "DVVH.000299",
    "name": "Công ty TNHH POSCO Việt Nam",
    "parentCode": null
  },
  {
    "id": "82a27877-cad1-4509-b550-5519fa14bd1a",
    "code": "DVVH.000298",
    "name": "Công ty TNHH Phú Đông",
    "parentCode": null
  },
  {
    "id": "b254b41f-ce89-4cc4-a52d-04306663bc2d",
    "code": "DVVH.000305",
    "name": "Công ty TNHH SIAM CITY CEMENT (Việt Nam) - Chi nhánh Đồng Nai",
    "parentCode": null
  },
  {
    "id": "b8005019-058b-4889-b7bb-c2704a4e9f43",
    "code": "DVVH.000301",
    "name": "Công ty TNHH Saint - Gobain Việt Nam",
    "parentCode": null
  },
  {
    "id": "7182b6aa-19c5-49c6-9055-fefa68aaf455",
    "code": "DVVH.000306",
    "name": "Công ty TNHH Siam City Cement Việt Nam",
    "parentCode": null
  },
  {
    "id": "bceb33f8-688c-45cc-b49b-8f7790fd93f3",
    "code": "DVVH.000302",
    "name": "Công ty TNHH Sản xuất Thương mại Hưng Phát",
    "parentCode": null
  },
  {
    "id": "ecc680c3-a4c3-484b-b585-d3c9baeb9ded",
    "code": "DVVH.000304",
    "name": "Công ty TNHH Sản xuất và Thương mại Hoàng Thành",
    "parentCode": null
  },
  {
    "id": "94ac2a4d-30d4-429c-8713-a24f7c944ebd",
    "code": "DVVH.000310",
    "name": "Công ty TNHH TM Sản phẩm Hóa dầu Lâm Tài Chánh",
    "parentCode": null
  },
  {
    "id": "c02c2508-7eae-4a25-b400-cbb3ff0ddf96",
    "code": "DVVH.000311",
    "name": "Công ty TNHH TMDV Hoàng Hải Đăng",
    "parentCode": null
  },
  {
    "id": "0854998b-7ccc-41dd-a74c-44f86061afaf",
    "code": "DVVH.000308",
    "name": "Công ty TNHH Thương mại Dịch vụ Tự Long",
    "parentCode": null
  },
  {
    "id": "0b24f041-c929-4103-8fbc-ebb04505e021",
    "code": "DVVH.000309",
    "name": "Công ty TNHH Thương mại Nam Ninh",
    "parentCode": null
  },
  {
    "id": "8473ba19-b28c-4111-abba-9b3897fd2542",
    "code": "DVVH.000312",
    "name": "Công ty TNHH Total Gas Cần Thơ",
    "parentCode": null
  },
  {
    "id": "86b45a81-b78c-4a61-a814-9f4be69eaf73",
    "code": "DVVH.000313",
    "name": "Công ty TNHH Totalgaz Việt Nam",
    "parentCode": null
  },
  {
    "id": "6adcbd71-3aa3-414a-b566-6068cb6b0066",
    "code": "DVVH.000307",
    "name": "Công ty TNHH Tân Cảng Petro Cam Ranh",
    "parentCode": null
  },
  {
    "id": "9f14189f-87d4-49d9-b0d9-0db13b62c052",
    "code": "DVVH.000317",
    "name": "Công ty TNHH VEDAN Việt Nam",
    "parentCode": null
  },
  {
    "id": "a7241494-fabc-4eb1-a6a4-9c9c334726a5",
    "code": "DVVH.000319",
    "name": "Công ty TNHH VOPAK Việt Nam",
    "parentCode": null
  },
  {
    "id": "889a9b80-7abc-4556-8b20-b55adc87231d",
    "code": "DVVH.000321",
    "name": "Công ty TNHH VTTB Hải Hà",
    "parentCode": null
  },
  {
    "id": "c3970a35-3f8d-413f-b031-36441a5f916f",
    "code": "DVVH.000316",
    "name": "Công ty TNHH Vard Vũng Tàu",
    "parentCode": null
  },
  {
    "id": "3b291e55-9c73-494b-b666-6d99ee8164a9",
    "code": "DVVH.000318",
    "name": "Công ty TNHH Vĩnh Hưng Đồng Nai",
    "parentCode": null
  },
  {
    "id": "60acf4ab-8398-4ed3-a559-f4c5fb3bd619",
    "code": "DVVH.000322",
    "name": "Công ty TNHH Vũ Đình Ninh Bình",
    "parentCode": null
  },
  {
    "id": "b44e76b5-0c89-4395-b8e1-fdb1f66e6e1c",
    "code": "DVVH.000314",
    "name": "Công ty TNHH Vận tải Thủy bộ Hải Hà",
    "parentCode": null
  },
  {
    "id": "76c10545-feed-4acd-a0f8-f4166cd17a29",
    "code": "DVVH.000315",
    "name": "Công ty TNHH Vận tải Tiến Mạnh",
    "parentCode": null
  },
  {
    "id": "243a791d-6c8a-49e2-9cfb-ea04055dff75",
    "code": "DVVH.000323",
    "name": "Công ty TNHH Xây dựng Tổng hợp Thắng Lợi",
    "parentCode": null
  },
  {
    "id": "00f4b4e8-a7a9-47b1-86ed-9ba7d89e35d1",
    "code": "DVVH.000231",
    "name": "Công ty TNHH Điện Nghi Sơn 2",
    "parentCode": null
  },
  {
    "id": "20068acf-221a-47ea-a82c-b2f31f5a0eed",
    "code": "DVVH.000228",
    "name": "Công ty TNHH Điện lực Hiệp Phước",
    "parentCode": null
  },
  {
    "id": "bb6b8cd3-2d03-43b7-8bbc-28016dd80510",
    "code": "DVVH.000229",
    "name": "Công ty TNHH Điện lực Vân Phong",
    "parentCode": null
  },
  {
    "id": "288b5b35-86c9-446c-b82c-5dc0ec7b6341",
    "code": "DVVH.000230",
    "name": "Công ty TNHH Điện lực Vĩnh Tân 1",
    "parentCode": null
  },
  {
    "id": "fa71ca3b-88ee-4d5f-9a28-a64907eaa5fa",
    "code": "DVVH.000232",
    "name": "Công ty TNHH Đóng tàu HD Hyundai Việt Nam",
    "parentCode": null
  },
  {
    "id": "54218b96-8bcb-4773-bbe7-090ee7c0f2a4",
    "code": "DVVH.000233",
    "name": "Công ty TNHH Đóng tàu và Cơ khí Hàng hải Sài Gòn",
    "parentCode": null
  },
  {
    "id": "243c9484-4c57-4a20-97be-a07532b030d5",
    "code": "DVVH.000226",
    "name": "Công ty TNHH Đầu tư TMDV XNK Hoàng Minh",
    "parentCode": null
  },
  {
    "id": "c6a9140e-99dc-4b89-8376-eda5ea3dba99",
    "code": "DVVH.000324",
    "name": "Công ty Vận tải và Xếp dỡ Quảng Ninh",
    "parentCode": null
  },
  {
    "id": "3f4e550b-9abf-4817-b47f-05585029734f",
    "code": "DVVH.000338",
    "name": "Công ty Xi măng Long Sơn",
    "parentCode": null
  },
  {
    "id": "94a3e3e7-88bf-47b3-a414-8f2ea6932a55",
    "code": "DVVH.000339",
    "name": "Công ty Xi măng Nghi Sơn",
    "parentCode": null
  },
  {
    "id": "682481df-91ed-4415-b196-fe5bf8f91583",
    "code": "DVVH.000325",
    "name": "Công ty Xăng dầu B12",
    "parentCode": null
  },
  {
    "id": "94b38eb9-b2d5-4749-95b6-99d84d609d74",
    "code": "DVVH.000326",
    "name": "Công ty Xăng dầu Bà Rịa - Vũng Tàu",
    "parentCode": null
  },
  {
    "id": "0ce5717b-7fb7-483a-bc73-62ebd2f880c9",
    "code": "DVVH.000327",
    "name": "Công ty Xăng dầu Bà Rịa-Vũng Tàu",
    "parentCode": null
  },
  {
    "id": "f6777be8-a591-46cf-9224-586f1e08dd65",
    "code": "DVVH.000328",
    "name": "Công ty Xăng dầu Bình Định",
    "parentCode": null
  },
  {
    "id": "8ddae974-f20a-49ec-bc04-d6e23bb2dad0",
    "code": "DVVH.000329",
    "name": "Công ty Xăng dầu Khu vực II TNHH MTV",
    "parentCode": null
  },
  {
    "id": "b1c50b44-117c-4960-92c9-d183c2c7741f",
    "code": "DVVH.000330",
    "name": "Công ty Xăng dầu Khu vực III",
    "parentCode": null
  },
  {
    "id": "a59ca4cb-ad82-4b96-ad43-7807c28fc7d0",
    "code": "DVVH.000331",
    "name": "Công ty Xăng dầu Khu vực V",
    "parentCode": null
  },
  {
    "id": "6cc91d17-e597-4446-b0f4-49f8b803adb7",
    "code": "DVVH.000332",
    "name": "Công ty Xăng dầu Nghệ An",
    "parentCode": null
  },
  {
    "id": "30f970d5-3557-4838-a992-766b8f13a0fe",
    "code": "DVVH.000333",
    "name": "Công ty Xăng dầu Phú Khánh",
    "parentCode": null
  },
  {
    "id": "239f98aa-4485-4209-9fe3-713386faf008",
    "code": "DVVH.000334",
    "name": "Công ty Xăng dầu Quân đội Khu vực 1",
    "parentCode": null
  },
  {
    "id": "71571005-c51f-4415-a2b5-103dd4582529",
    "code": "DVVH.000336",
    "name": "Công ty Xăng dầu Quân đội Khu vực 3",
    "parentCode": null
  },
  {
    "id": "2deff7cc-fb14-4a08-827e-f0ac2abbd0be",
    "code": "DVVH.000335",
    "name": "Công ty Xăng dầu Quân đội khu vực 2",
    "parentCode": null
  },
  {
    "id": "09077123-e0ad-4e0c-936b-e4a03687da4e",
    "code": "DVVH.000337",
    "name": "Công ty Xăng dầu Quảng Bình",
    "parentCode": null
  },
  {
    "id": "a75696de-87a8-4901-bec2-b6e30bcc4b53",
    "code": "G17.72.14",
    "name": "Công ty cổ phần Cơ khí hàng hải miền Nam",
    "parentCode": null
  },
  {
    "id": "82f7924e-9661-4e6d-9087-9fcc7c43d4c0",
    "code": "G17.72.15",
    "name": "Công ty cổ phần Trục vớt cứu hộ Việt Nam",
    "parentCode": null
  },
  {
    "id": "b618a973-2287-4a85-9967-8689fdd5338a",
    "code": "DVVH.000191",
    "name": "Công ty Điều hành Hoàng Long",
    "parentCode": null
  },
  {
    "id": "2df33246-bc7d-44ed-9984-61c9f3801de0",
    "code": "DVVH.000192",
    "name": "Công ty Điều hành Thăm dò Dầu khí Trong nước (PVEP POC)",
    "parentCode": null
  },
  {
    "id": "681425c0-00a4-4a01-a617-4124623e4275",
    "code": "DVVH.000190",
    "name": "Công ty Điện lực Dầu khí Hà Tĩnh",
    "parentCode": null
  },
  {
    "id": "84f5129f-c1ec-4d84-a4e0-1a7c2753fa17",
    "code": "DVVH.000010",
    "name": "Cảng Dịch vụ Dầu khí Tổng hợp Quảng Bình",
    "parentCode": null
  },
  {
    "id": "1824c48f-07a7-4191-986e-00124bc89de7",
    "code": "DVVH.000009",
    "name": "Cảng cạn Tân Cảng Nhơn Trạch",
    "parentCode": null
  },
  {
    "id": "3ae7c93f-9a7e-4bb2-b527-14e74b490211",
    "code": "G17.43.08",
    "name": "Cảng vụ Hàng hải Hà Tĩnh",
    "parentCode": null
  },
  {
    "id": "25c6f9f4-99d8-4efe-a301-09d66117ff32",
    "code": "G17.43.11",
    "name": "Cảng vụ Hàng hải Quảng Nam",
    "parentCode": null
  },
  {
    "id": "f2aa4cbe-4eea-4207-9a60-8d3e1dd5a689",
    "code": "G17.43.11.01",
    "name": "Cảng vụ Hàng hải Quảng Nam - Đại diện Hội An",
    "parentCode": null
  },
  {
    "id": "4bcf5f9e-95fb-4948-a8f0-667bab6ee35f",
    "code": "G17.43.15",
    "name": "Cảng vụ hàng hải Bình Thuận",
    "parentCode": null
  },
  {
    "id": "c06bc8ed-6585-4040-991a-e9fcfc92da1b",
    "code": "G17.43.15.01",
    "name": "Cảng vụ hàng hải Bình Thuận - Đại diện Tuy Phong",
    "parentCode": null
  },
  {
    "id": "2b9669cc-7c55-4d77-9840-d8140ab39ffd",
    "code": "G17.43.19",
    "name": "Cảng vụ hàng hải Cần Thơ",
    "parentCode": null
  },
  {
    "id": "793a098a-7f6f-47fc-8cd5-00d59ce76b27",
    "code": "G17.43.19.03",
    "name": "Cảng vụ hàng hải Cần Thơ - Đại diện An Giang",
    "parentCode": null
  },
  {
    "id": "739a80a7-d70e-4026-bc53-590d208d219b",
    "code": "G17.43.19.02",
    "name": "Cảng vụ hàng hải Cần Thơ - Đại diện Hậu Giang",
    "parentCode": null
  },
  {
    "id": "460e7eb8-6dbf-45a7-91b5-e555e6eb75f9",
    "code": "G17.43.19.01",
    "name": "Cảng vụ hàng hải Cần Thơ - Đại diện Trà Vinh",
    "parentCode": null
  },
  {
    "id": "ab988c4a-98bc-46c6-9d44-fd7223191e2e",
    "code": "G17.43.08.01",
    "name": "Cảng vụ hàng hải Hà Tĩnh - Đại diện Cửa Gianh",
    "parentCode": null
  },
  {
    "id": "3744caf7-9729-4cc2-ba24-6e816a27c5dc",
    "code": "G17.43.08.02",
    "name": "Cảng vụ hàng hải Hà Tĩnh - Đại diện Hòn La",
    "parentCode": null
  },
  {
    "id": "005a3309-2fbb-449b-bcfa-d6d5be92175c",
    "code": "G17.43.08.03",
    "name": "Cảng vụ hàng hải Hà Tĩnh - Đại diện Lèn Bảng",
    "parentCode": null
  },
  {
    "id": "11cd4dc1-4218-49cc-a2c6-acaac1f38388",
    "code": "G17.43.04",
    "name": "Cảng vụ hàng hải Hải Phòng",
    "parentCode": null
  },
  {
    "id": "0fd5fdf6-9937-4faa-b407-da0cae3a80a7",
    "code": "G17.43.04.02",
    "name": "Cảng vụ hàng hải Hải Phòng - Đại diện Bạch Long Vỹ",
    "parentCode": null
  },
  {
    "id": "d82a1d54-b7ce-46ac-a9d4-07b34e01ca39",
    "code": "G17.43.04.01",
    "name": "Cảng vụ hàng hải Hải Phòng - Đại diện Cát Hải",
    "parentCode": null
  },
  {
    "id": "5044eb5b-3ed7-41da-989a-1d7d50756230",
    "code": "G17.43.04.03",
    "name": "Cảng vụ hàng hải Hải Phòng - Đại diện Phà Rừng",
    "parentCode": null
  },
  {
    "id": "02c1064f-ac6c-4560-8892-c7c4d4f6dcfb",
    "code": "G17.43.20",
    "name": "Cảng vụ hàng hải Kiên Giang",
    "parentCode": null
  },
  {
    "id": "6234c73b-74be-4f03-98e7-dc40ec5393d2",
    "code": "G17.43.20.06",
    "name": "Cảng vụ hàng hải Kiên Giang - Đại diện Bạc Liêu",
    "parentCode": null
  },
  {
    "id": "4d41839d-555b-4d39-bb01-e35f60e0f974",
    "code": "G17.43.20.04",
    "name": "Cảng vụ hàng hải Kiên Giang - Đại diện Cà Mau",
    "parentCode": null
  },
  {
    "id": "b0449bad-0082-4c10-8d2f-ef34aba55a7d",
    "code": "G17.43.20.01",
    "name": "Cảng vụ hàng hải Kiên Giang - Đại diện Hà Tiên",
    "parentCode": null
  },
  {
    "id": "b9877b8f-9d8c-4b1b-bf07-06c7cf2071d3",
    "code": "G17.43.20.02",
    "name": "Cảng vụ hàng hải Kiên Giang - Đại diện Hòn Chông",
    "parentCode": null
  },
  {
    "id": "f819d296-233b-46ba-ba0e-b4713e209aec",
    "code": "G17.43.20.03",
    "name": "Cảng vụ hàng hải Kiên Giang - Đại diện Phú Quốc",
    "parentCode": null
  },
  {
    "id": "7264db1f-884d-4488-a60c-4df33052c671",
    "code": "G17.43.20.05",
    "name": "Cảng vụ hàng hải Kiên Giang - Đại diện Rạch Giá",
    "parentCode": null
  },
  {
    "id": "c8f3edbb-87c5-4d18-ac68-9682a61362fc",
    "code": "G17.43.07",
    "name": "Cảng vụ hàng hải Nghệ An",
    "parentCode": null
  },
  {
    "id": "93c28290-9721-476b-ac63-b59c287b1637",
    "code": "G17.43.07.01",
    "name": "Cảng vụ hàng hải Nghệ An - Đại diện Cửa Lò",
    "parentCode": null
  },
  {
    "id": "12bc74b9-4c61-4380-9616-2b9de23c7ffd",
    "code": "G17.43.07.02",
    "name": "Cảng vụ hàng hải Nghệ An - Đại diện Thanh Chương",
    "parentCode": null
  },
  {
    "id": "bab9eaa7-0d6c-4330-97ca-ddfa89f96793",
    "code": "G17.43.14",
    "name": "Cảng vụ hàng hải Nha Trang",
    "parentCode": null
  },
  {
    "id": "ccbcd5c8-bf11-4f15-b4b5-91ede91f9993",
    "code": "G17.43.14.03",
    "name": "Cảng vụ hàng hải Nha Trang - Đại diện Cam Ranh",
    "parentCode": null
  },
  {
    "id": "26e45219-f07e-47da-9549-990da192a782",
    "code": "G17.43.14.02",
    "name": "Cảng vụ hàng hải Nha Trang - Đại diện Trường Sa",
    "parentCode": null
  },
  {
    "id": "841a525b-d2f3-4771-a268-ffb7013bda3f",
    "code": "G17.43.14.01",
    "name": "Cảng vụ hàng hải Nha Trang - Đại diện Vân Phong",
    "parentCode": null
  },
  {
    "id": "2c74c55f-1567-4ab2-8a97-3e716ec01e25",
    "code": "G17.43.13",
    "name": "Cảng vụ hàng hải Quy Nhơn",
    "parentCode": null
  },
  {
    "id": "7fb690c3-c7a6-4f09-8a2c-e52239b83530",
    "code": "G17.43.13.01",
    "name": "Cảng vụ hàng hải Quy Nhơn - Đại diện Vũng Rô",
    "parentCode": null
  },
  {
    "id": "ccfe6ec1-a7d9-44f7-b6ea-56b50694085e",
    "code": "G17.43.12",
    "name": "Cảng vụ hàng hải Quảng Ngãi",
    "parentCode": null
  },
  {
    "id": "e9b7605b-b0bf-4ab7-90b5-302154189442",
    "code": "G17.43.03",
    "name": "Cảng vụ hàng hải Quảng Ninh",
    "parentCode": null
  },
  {
    "id": "843bd998-9524-4802-aa62-2650687ca166",
    "code": "G17.43.03.02",
    "name": "Cảng vụ hàng hải Quảng Ninh - Đại diện Bắc Luân",
    "parentCode": null
  },
  {
    "id": "9fca2b0a-195a-4aee-8215-2e54f22a1035",
    "code": "G17.43.03.04",
    "name": "Cảng vụ hàng hải Quảng Ninh - Đại diện Cẩm Phả",
    "parentCode": null
  },
  {
    "id": "2dc118d5-6bcb-4528-ae67-f8b2af62e11c",
    "code": "G17.43.03.01",
    "name": "Cảng vụ hàng hải Quảng Ninh - Đại diện Móng Cái",
    "parentCode": null
  },
  {
    "id": "2cb6bd4c-1e55-48fb-8b67-da049166200d",
    "code": "G17.43.03.05",
    "name": "Cảng vụ hàng hải Quảng Ninh - Đại diện Quảng Yên",
    "parentCode": null
  },
  {
    "id": "8ce07f3c-2124-44e7-b427-ba1367cdd8d0",
    "code": "G17.43.03.03",
    "name": "Cảng vụ hàng hải Quảng Ninh - Đại diện Vân Đồn",
    "parentCode": null
  },
  {
    "id": "74d1d473-4ace-477f-8e91-0f7cd8de38d8",
    "code": "G17.43.30",
    "name": "Cảng vụ hàng hải Quảng Trị",
    "parentCode": null
  },
  {
    "id": "d58e55b5-461e-4f23-9c40-bcb89d3f2a96",
    "code": "G17.43.06",
    "name": "Cảng vụ hàng hải Thanh Hóa",
    "parentCode": null
  },
  {
    "id": "6bb5060c-9ed0-49f7-b6c9-70ae4096ef56",
    "code": "G17.43.06.01",
    "name": "Cảng vụ hàng hải Thanh Hóa - Đại diện Lệ Môn",
    "parentCode": null
  },
  {
    "id": "63b4250f-d43e-44a3-8db5-05deadad7bab",
    "code": "G17.43.18",
    "name": "Cảng vụ hàng hải Thành phố Hồ Chí Minh",
    "parentCode": null
  },
  {
    "id": "f49c0847-0fba-4956-8127-680f1beb5673",
    "code": "G17.43.18.02",
    "name": "Cảng vụ hàng hải Thành phố Hồ Chí Minh - Đại diện Cần Giờ",
    "parentCode": null
  },
  {
    "id": "0b206f5f-6af6-4f7a-957c-6425fbb91deb",
    "code": "G17.43.18.01",
    "name": "Cảng vụ hàng hải Thành phố Hồ Chí Minh - Đại diện Hiệp Phước",
    "parentCode": null
  },
  {
    "id": "945e8a49-5fd2-4b87-bee4-783d7e1d9a65",
    "code": "G17.43.18.03",
    "name": "Cảng vụ hàng hải Thành phố Hồ Chí Minh - Đại diện Long An",
    "parentCode": null
  },
  {
    "id": "2a953104-4a7d-4ee4-bf09-6fd9f2e061f1",
    "code": "G17.43.05",
    "name": "Cảng vụ hàng hải Thái Bình",
    "parentCode": null
  },
  {
    "id": "ca1d5151-e780-4eb5-b10d-28963fac5c60",
    "code": "G17.43.05.03",
    "name": "Cảng vụ hàng hải Thái Bình - Đại diện Nam Định",
    "parentCode": null
  },
  {
    "id": "90bb2e8b-3555-4e24-9cae-494af836a169",
    "code": "G17.43.05.01",
    "name": "Cảng vụ hàng hải Thái Bình - Đại diện Ninh Cơ",
    "parentCode": null
  },
  {
    "id": "ad55ef11-08a3-4702-abc9-d55a2088bc20",
    "code": "G17.43.05.02",
    "name": "Cảng vụ hàng hải Thái Bình - Đại diện Trà Lý",
    "parentCode": null
  },
  {
    "id": "d0c15150-697c-4ae0-aeb9-e524f17467cc",
    "code": "G17.43.09",
    "name": "Cảng vụ hàng hải Thừa Thiên Huế",
    "parentCode": null
  },
  {
    "id": "839279d8-8eb6-43cb-9571-56b76e7ef59e",
    "code": "G17.43.09.01",
    "name": "Cảng vụ hàng hải Thừa Thiên Huế - Đại diện Chân Mây",
    "parentCode": null
  },
  {
    "id": "5db66200-e793-453e-8ecb-41777e0c8e69",
    "code": "G17.43.09.02",
    "name": "Cảng vụ hàng hải Thừa Thiên Huế - Đại diện Cồn Cỏ",
    "parentCode": null
  },
  {
    "id": "77e7d970-5c15-4f41-8919-ddff62485970",
    "code": "G17.43.09.03",
    "name": "Cảng vụ hàng hải Thừa Thiên Huế - Đại diện Cửa Việt",
    "parentCode": null
  },
  {
    "id": "758247ca-0ca3-47dc-bc26-0a4cc7b9516d",
    "code": "G17.43.17",
    "name": "Cảng vụ hàng hải Vũng Tàu",
    "parentCode": null
  },
  {
    "id": "90033bd2-2a60-41b5-a1a5-8ea78c79d882",
    "code": "G17.43.17.02",
    "name": "Cảng vụ hàng hải Vũng Tàu - Đại diện Côn Đảo",
    "parentCode": null
  },
  {
    "id": "228d6688-b16b-4fea-968b-d716650766fe",
    "code": "G17.43.17.01",
    "name": "Cảng vụ hàng hải Vũng Tàu - Đại diện Phú Mỹ",
    "parentCode": null
  },
  {
    "id": "f512d1dc-ad10-4c57-a8f2-0cfdf8362596",
    "code": "G17.43.17.03",
    "name": "Cảng vụ hàng hải Vũng Tàu - Đại diện Thị Vải",
    "parentCode": null
  },
  {
    "id": "85805172-c4f2-4eb6-8583-6f94cc03e8bc",
    "code": "G17.43.10",
    "name": "Cảng vụ hàng hải Đà Nẵng",
    "parentCode": null
  },
  {
    "id": "8673d362-5520-449c-a637-e957d8de41e2",
    "code": "G17.43.10.01",
    "name": "Cảng vụ hàng hải Đà Nẵng - Đại diện Liên Chiểu",
    "parentCode": null
  },
  {
    "id": "e9dd069d-7143-4ccb-a485-8c4af7096244",
    "code": "G17.43.16",
    "name": "Cảng vụ hàng hải Đồng Nai",
    "parentCode": null
  },
  {
    "id": "c002529b-c7d4-4f10-b785-8c821fb1b4e7",
    "code": "G17.43.16.02",
    "name": "Cảng vụ hàng hải Đồng Nai - Đại diện Nhơn Trạch",
    "parentCode": null
  },
  {
    "id": "1c4aa1c5-9a40-41e6-8064-0f4ed53100d9",
    "code": "G17.43.16.01",
    "name": "Cảng vụ hàng hải Đồng Nai - Đại diện Phước Thái",
    "parentCode": null
  },
  {
    "id": "260b205c-80f9-4e17-b0c0-c779f56271ce",
    "code": "G17.43.21",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I",
    "parentCode": null
  },
  {
    "id": "b734635b-0ad0-4232-8400-80a1d6d7cd59",
    "code": "G17.43.21.03",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Bạch Đằng",
    "parentCode": null
  },
  {
    "id": "8691659d-2e91-430c-a545-f5b8938bb76c",
    "code": "G17.43.21.09",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Bắc Giang",
    "parentCode": null
  },
  {
    "id": "316647f7-bfbf-480e-90dc-0dde5b56f71d",
    "code": "G17.43.21.10",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Bắc Ninh",
    "parentCode": null
  },
  {
    "id": "909aa2f5-64c8-4339-a021-c39422ccbd7e",
    "code": "G17.43.21.13",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Cống Câu",
    "parentCode": null
  },
  {
    "id": "bca915bd-e651-42d3-8b84-874274c0bd1d",
    "code": "G17.43.21.05",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Hoàng Thạch",
    "parentCode": null
  },
  {
    "id": "0ffb6296-0851-413d-bf15-5bec5b754d28",
    "code": "G17.43.21.01",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Hải Phòng",
    "parentCode": null
  },
  {
    "id": "c7dbeeb3-d8b9-47fa-96ad-5812f42961fd",
    "code": "G17.43.21.06",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Kinh Môn",
    "parentCode": null
  },
  {
    "id": "2c7dd8a4-3005-4c0a-9ee3-cbe319e923a6",
    "code": "G17.43.21.02",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Minh Đức",
    "parentCode": null
  },
  {
    "id": "398f6ea1-b988-47a6-8921-534e0fe64bd0",
    "code": "G17.43.21.07",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Phúc Sơn",
    "parentCode": null
  },
  {
    "id": "55ddecb8-c452-4f1b-ad87-3f29a6f194ca",
    "code": "G17.43.21.12",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Phả Lại",
    "parentCode": null
  },
  {
    "id": "bbdb2336-917e-4bf1-acfb-a4006550c13d",
    "code": "G17.43.21.11",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Thái Nguyên",
    "parentCode": null
  },
  {
    "id": "203568dd-1aff-4b87-a090-c5cd85f366c1",
    "code": "G17.43.21.04",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Đá Bạc",
    "parentCode": null
  },
  {
    "id": "f4b83d54-0775-4e30-8dd2-a991c3b40391",
    "code": "G17.43.21.08",
    "name": "Cảng vụ Đường thủy nội địa Khu vực I - Đại diện Đông Bắc",
    "parentCode": null
  },
  {
    "id": "186b6b78-5129-4754-b66a-63cdf3daad69",
    "code": "G17.43.22",
    "name": "Cảng vụ Đường thủy nội địa Khu vực II",
    "parentCode": null
  },
  {
    "id": "14ef094d-824f-41f9-88cd-5bf67c33cf56",
    "code": "G17.43.22.04",
    "name": "Cảng vụ Đường thủy nội địa Khu vực II - Đại diện Hà Nam",
    "parentCode": null
  },
  {
    "id": "561ed37b-77b9-4200-9b4d-d600dec68463",
    "code": "G17.43.22.01",
    "name": "Cảng vụ Đường thủy nội địa Khu vực II - Đại diện Hà Nội",
    "parentCode": null
  },
  {
    "id": "bc5cee01-d8f9-4578-ac10-81a406632c96",
    "code": "G17.43.22.02",
    "name": "Cảng vụ Đường thủy nội địa Khu vực II - Đại diện Hòa Bình",
    "parentCode": null
  },
  {
    "id": "f0fc23d7-ee80-462a-b226-6fbae06bd875",
    "code": "G17.43.22.05",
    "name": "Cảng vụ Đường thủy nội địa Khu vực II - Đại diện Hưng Yên",
    "parentCode": null
  },
  {
    "id": "8dfba6f5-295e-4a77-80a0-4181707604be",
    "code": "G17.43.22.06",
    "name": "Cảng vụ Đường thủy nội địa Khu vực II - Đại diện Ninh Bình",
    "parentCode": null
  },
  {
    "id": "c0287f80-197f-486f-95b7-78d3890c45d3",
    "code": "G17.43.22.03",
    "name": "Cảng vụ Đường thủy nội địa Khu vực II - Đại diện Phú Thọ",
    "parentCode": null
  },
  {
    "id": "1d7d06cc-9396-4d9a-975e-f18f564729ea",
    "code": "G17.43.23",
    "name": "Cảng vụ Đường thủy nội địa Khu vực III",
    "parentCode": null
  },
  {
    "id": "b805a534-4099-4b56-b9f5-10e7545b2cc8",
    "code": "G17.43.23.01",
    "name": "Cảng vụ Đường thủy nội địa Khu vực III - Đại diện Bình Dương",
    "parentCode": null
  },
  {
    "id": "3a4f6724-4cf4-4349-bcd4-7a9e8b4d4911",
    "code": "G17.43.23.04",
    "name": "Cảng vụ Đường thủy nội địa Khu vực III - Đại diện Bến Lức",
    "parentCode": null
  },
  {
    "id": "c9ffe49a-2f35-4f4e-95a7-9a1cf2bf0dbc",
    "code": "G17.43.23.05",
    "name": "Cảng vụ Đường thủy nội địa Khu vực III - Đại diện Mộc Hóa",
    "parentCode": null
  },
  {
    "id": "04e90700-29dc-4c2b-bcdd-f6e3b7c8e6d1",
    "code": "G17.43.23.08",
    "name": "Cảng vụ Đường thủy nội địa Khu vực III - Đại diện Mỹ Tho",
    "parentCode": null
  },
  {
    "id": "5a4894ee-863f-4f48-b941-37be975f1032",
    "code": "G17.43.23.02",
    "name": "Cảng vụ Đường thủy nội địa Khu vực III - Đại diện Phú Long",
    "parentCode": null
  },
  {
    "id": "fd7cd73c-d93e-438a-aa2d-2997c31eb16a",
    "code": "G17.43.23.06",
    "name": "Cảng vụ Đường thủy nội địa Khu vực III - Đại diện Tiền Giang",
    "parentCode": null
  },
  {
    "id": "cf2cf20a-7fb0-47aa-ab65-2187c27a6f80",
    "code": "G17.43.23.03",
    "name": "Cảng vụ Đường thủy nội địa Khu vực III - Đại diện Tây Ninh",
    "parentCode": null
  },
  {
    "id": "dd3b0c6a-ce25-4dea-9252-fe83f697cf5b",
    "code": "G17.43.23.07",
    "name": "Cảng vụ Đường thủy nội địa Khu vực III - Đại diện Đồng Nai",
    "parentCode": null
  },
  {
    "id": "1a3279cc-d235-4350-8f0b-aebcf04a797d",
    "code": "G17.43.24",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV",
    "parentCode": null
  },
  {
    "id": "d2671285-3588-4860-b816-5717d61a1a32",
    "code": "G17.43.24.04",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV - Đại diện Bến Tre",
    "parentCode": null
  },
  {
    "id": "fc0e561a-bf01-44d0-b7bd-157c383db311",
    "code": "G17.43.24.08",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV - Đại diện Châu Phú",
    "parentCode": null
  },
  {
    "id": "f15634cc-fea4-4339-bb95-44816d01870c",
    "code": "G17.43.24.07",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV - Đại diện Long Xuyên",
    "parentCode": null
  },
  {
    "id": "507d7f75-abd9-4b6c-891a-4fa0b427a3ad",
    "code": "G17.43.24.10",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV - Đại diện Long Đức",
    "parentCode": null
  },
  {
    "id": "4a80a3e1-f1ce-413b-a924-37161dfb837c",
    "code": "G17.43.24.06",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV - Đại diện Sóc Trăng",
    "parentCode": null
  },
  {
    "id": "8f917c01-762b-4c64-aa3a-4671e7ff8508",
    "code": "G17.43.24.05",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV - Đại diện Thốt Nốt",
    "parentCode": null
  },
  {
    "id": "a8c7e913-a0cb-40f6-a108-55c5759e3452",
    "code": "G17.43.24.03",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV - Đại diện Vĩnh Long",
    "parentCode": null
  },
  {
    "id": "fd648b80-f6bf-49ce-83c0-55ed820f85c4",
    "code": "G17.43.24.01",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV - Đại diện Vĩnh Xương - Thường Phước",
    "parentCode": null
  },
  {
    "id": "835dc822-79d4-408a-b1bd-65cf3097bcf7",
    "code": "G17.43.24.09",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV - Đại diện Vị Thanh",
    "parentCode": null
  },
  {
    "id": "96b6c40b-5d46-4b80-a5a2-0332f84365c1",
    "code": "G17.43.24.02",
    "name": "Cảng vụ Đường thủy nội địa Khu vực IV - Đại điện Sa Đéc",
    "parentCode": null
  },
  {
    "id": "5e6668f2-21ec-4f79-b302-07a8fad07aa4",
    "code": "DVVH.000346",
    "name": "Cục Hậu cần Quân khu 7",
    "parentCode": null
  },
  {
    "id": "6b9ea8ed-d9b5-4b98-a5cd-0ecd5f06cec9",
    "code": "DVVH.000345",
    "name": "Cục Hậu cần – Quân khu 9",
    "parentCode": null
  },
  {
    "id": "3e768b95-1468-4e59-a0d4-2f116d713ef6",
    "code": "DVVH.000347",
    "name": "Cục Xăng dầu - Tổng Cục Hậu cần",
    "parentCode": null
  },
  {
    "id": "8bb55ccd-a1f4-4f03-b295-64a66ac8721b",
    "code": "G17.43",
    "name": "Cục hàng hải và đường thủy Việt Nam",
    "parentCode": null
  },
  {
    "id": "b03b41ff-3532-4b8a-b556-3f98a11bcbb3",
    "code": "DVVH.000348",
    "name": "Doanh nghiệp Tư nhân Thương mại Dịch vụ Sản xuất Hồng Mộc",
    "parentCode": null
  },
  {
    "id": "8179b40b-27ba-4e1d-8003-c044e6efc09a",
    "code": "DVVH.000350",
    "name": "Học viện Hải Quân",
    "parentCode": null
  },
  {
    "id": "0deb2ff3-3378-4885-8361-fd05e33b69af",
    "code": "DVVH.000351",
    "name": "ICD Tân Cảng Hải Phòng - Tổng Công ty Tân Cảng Sài Gòn",
    "parentCode": null
  },
  {
    "id": "9e2fd493-e798-4a84-a6ab-13736fdcab0c",
    "code": "DVVH.000352",
    "name": "ICD Tân Cảng Quế Võ - Tổng Công ty Tân Cảng Sài Gòn",
    "parentCode": null
  },
  {
    "id": "2e45ed2c-b836-449a-9b50-1f22e99b2f7e",
    "code": "DVVH.000353",
    "name": "Kho Xăng dầu Nghi Hương- Công ty Xăng dầu Nghệ An",
    "parentCode": null
  },
  {
    "id": "93a79165-70e1-4976-bdae-0abaa4fbdf54",
    "code": "DVVH.000354",
    "name": "Lọc Hóa dầu Nghi Sơn",
    "parentCode": null
  },
  {
    "id": "53a2b3c9-02ba-4169-9361-317a576a8c5c",
    "code": "DVVH.000357",
    "name": "Lữ Đoàn 783",
    "parentCode": null
  },
  {
    "id": "6d2bdc27-b2f5-4091-a157-3e69672fb0fa",
    "code": "DVVH.000355",
    "name": "Lữ đoàn 273 - Quân khu 3",
    "parentCode": null
  },
  {
    "id": "a39e83fe-fd76-4266-a70f-0138c95e67be",
    "code": "DVVH.000356",
    "name": "Lữ đoàn 653, Quân khu 3",
    "parentCode": null
  },
  {
    "id": "a463b06a-5c75-46a3-84d6-4147f89da6ba",
    "code": "DVVH.000358",
    "name": "Lữ đoàn Vận tải 654, Cục Hậu cần Quân khu 4",
    "parentCode": null
  },
  {
    "id": "ad26504c-51e4-475c-a0de-1808527ec56f",
    "code": "DVVH.000359",
    "name": "Nhà máy Nhiệt điện Vĩnh Tân 4",
    "parentCode": null
  },
  {
    "id": "13e71bcd-0e59-4c71-aa89-a713969ba7a8",
    "code": "DVVH.000360",
    "name": "Sở Văn hóa - Thể thao và Du lịch tỉnh Quảng Trị",
    "parentCode": null
  },
  {
    "id": "af5c0842-2e39-4472-83e3-9ca598bd7ec8",
    "code": "G17.43.25",
    "name": "Trung tâm Phối hợp tìm kiếm, cứu nạn hàng hải Việt Nam",
    "parentCode": null
  },
  {
    "id": "57764996-3585-4aba-a445-8f734dce3d8a",
    "code": "DVVH.000384",
    "name": "Trung tâm Quản lý Khai thác các Công trình Thủy sản Khánh Hòa",
    "parentCode": null
  },
  {
    "id": "143cee71-a854-4742-8f99-fad3fdb801ea",
    "code": "DVVH.000383",
    "name": "Trung tâm phối hợp tìm kiếm cứu nạn hàng hải khu vực III",
    "parentCode": null
  },
  {
    "id": "6e1bbcee-5f2a-4154-aaca-7ecaa5a3b009",
    "code": "DVVH.000385",
    "name": "Trung tâm ƯPSCTD Khu vực phía Nam",
    "parentCode": null
  },
  {
    "id": "457e764c-05f5-4318-a53c-7e4fbc86ff9f",
    "code": "DVVH.000386",
    "name": "Trung tâm ƯPSCTDMN",
    "parentCode": null
  },
  {
    "id": "be8a8f6e-75db-4b4a-9388-58764a051f3e",
    "code": "G17.43.28",
    "name": "Trường Cao đẳng GTVT đường Thủy I",
    "parentCode": null
  },
  {
    "id": "82910653-32b5-4c45-971b-8d994aaa5460",
    "code": "G17.43.29",
    "name": "Trường Cao đẳng GTVT đường Thủy II",
    "parentCode": null
  },
  {
    "id": "8d1b0ca5-a395-4179-9e9c-c73a0498d9fb",
    "code": "G17.43.26",
    "name": "Trường Cao đẳng Hàng hải I",
    "parentCode": null
  },
  {
    "id": "c7b565f7-3166-4e09-9894-1f74d349cf80",
    "code": "G17.43.27",
    "name": "Trường Cao đẳng Hàng hải II",
    "parentCode": null
  },
  {
    "id": "31e10c53-7e68-4f3c-99ae-4d4bf02b3292",
    "code": "DVVH.000387",
    "name": "Trường kỹ thuật nghiệp vụ Hàng Giang II",
    "parentCode": null
  },
  {
    "id": "03ed8e7d-6554-4bbf-86c5-fa7061f3141f",
    "code": "G17.43.123",
    "name": "Tên đơn vị",
    "parentCode": null
  },
  {
    "id": "74e78948-2b7f-4458-aa85-4b78a173c2b5",
    "code": "DVVH.000361",
    "name": "Tập đoàn Công nghiệp - Năng lượng Quốc gia Việt Nam",
    "parentCode": null
  },
  {
    "id": "5cda7411-1b07-4abe-9692-84a52fbd39b5",
    "code": "DVVH.000362",
    "name": "Tập đoàn Dầu khí Việt Nam - Người điều hành Dự án Lô 01/97&02/97",
    "parentCode": null
  },
  {
    "id": "4c96ccf2-a534-46f7-831b-ceae5e42e540",
    "code": "DVVH.000372",
    "name": "Tổng Cty Đầu Tư Xây Dựng & Thương mại Anh Phát",
    "parentCode": null
  },
  {
    "id": "22b45378-1b3f-4dc3-8dff-b925732e31a2",
    "code": "DVVH.000367",
    "name": "Tổng Công ty Sông Thu",
    "parentCode": null
  },
  {
    "id": "d6ee109f-f51f-479c-9fc8-b482e40bcbdf",
    "code": "DVVH.000363",
    "name": "Tổng công ty Ba Son",
    "parentCode": null
  },
  {
    "id": "ac7d2bc2-24dc-4c06-a74e-a2de69edf96d",
    "code": "G17.72",
    "name": "Tổng công ty Bảo đảm an toàn hàng hải Việt Nam",
    "parentCode": null
  },
  {
    "id": "185b6810-8a1b-4296-8ffb-18c4b0e142ba",
    "code": "DVVH.000364",
    "name": "Tổng công ty Công nghiệp Dầu thực vật Việt Nam - CTCP (Vocarimex)",
    "parentCode": null
  },
  {
    "id": "1111392d-5805-44d7-a1e7-70983c8259f4",
    "code": "DVVH.000365",
    "name": "Tổng công ty Dầu Việt Nam (PV Oil) - Xí nghiệp Tổng kho Xăng dầu Miền Đông",
    "parentCode": null
  },
  {
    "id": "a5346ede-bd8d-4253-b11a-98c26d631061",
    "code": "DVVH.000369",
    "name": "Tổng công ty Thăm dò Khai thác Dầu khí (PVEP)",
    "parentCode": null
  },
  {
    "id": "251d364c-bb9e-4f91-9591-4b85cafe3964",
    "code": "DVVH.000370",
    "name": "Tổng công ty Thương mại Kỹ thuật và Đầu tư - PETEC, XN Xăng dầu Petec Cái Mép",
    "parentCode": null
  },
  {
    "id": "f0d98600-cfc9-4110-a3aa-099519f153b1",
    "code": "DVVH.000371",
    "name": "Tổng công ty Thương mại Xuất nhập khẩu Thanh Lễ - CTCP",
    "parentCode": null
  },
  {
    "id": "9e9865e7-04fb-4f70-87fe-0bd0b3025b84",
    "code": "DVVH.000368",
    "name": "Tổng công ty Tân Cảng Sài Gòn",
    "parentCode": null
  },
  {
    "id": "8e88867e-de08-4ccc-a168-ee28403687ff",
    "code": "DVVH.000366",
    "name": "Tổng công ty Đường sông Miền Nam",
    "parentCode": null
  },
  {
    "id": "727eb5aa-135b-400f-88a1-215597d61b3d",
    "code": "DVVH.000373",
    "name": "Tổng kho Sản phẩm Dầu khí Đà Nẵng",
    "parentCode": null
  },
  {
    "id": "57d1a9b5-a513-412f-a62d-999466fc6eba",
    "code": "DVVH.000388",
    "name": "Văn Phòng Điều hành Idemitsu Gas Production (Vietnam) Co, Ltd",
    "parentCode": null
  },
  {
    "id": "811b4c5c-5118-4dda-8350-e66d75b67a97",
    "code": "DVVH.000390",
    "name": "Xí Nghiệp Dịch vụ Cảng và Cung ứng Vật tư Thiết bị, Liên doanh Dầu khí Việt - Nga Vietsovpetro",
    "parentCode": null
  },
  {
    "id": "83d47f64-b04b-4073-90db-42f069ed5cdc",
    "code": "DVVH.000389",
    "name": "Xí nghiệp Bến Xe Tàu Kiên Giang",
    "parentCode": null
  },
  {
    "id": "0f7ba3e7-e661-44c9-a85e-ca22d18a1036",
    "code": "G17.72.11",
    "name": "Xí nghiệp Khảo sát hàng hải miền Nam",
    "parentCode": null
  },
  {
    "id": "d5b386cd-9d59-4e54-bdd1-6215e646f28d",
    "code": "DVVH.000392",
    "name": "Xí nghiệp Petec Hòa Hiệp",
    "parentCode": null
  },
  {
    "id": "afd0dfa9-4900-4091-be56-0a82c5ad2a44",
    "code": "DVVH.000393",
    "name": "Xí nghiệp Xăng dầu Petec Hòa Hiệp Đà Nẵng-Tổng công ty Thương mại Kỹ thuật và Đầu tư-CTCP",
    "parentCode": null
  },
  {
    "id": "0a53b879-8bdb-4e85-952a-e54f0b9f47c0",
    "code": "DVVH.000394",
    "name": "Xí nghiệp Xếp dỡ Cảng Cửa Lò",
    "parentCode": null
  },
  {
    "id": "29509361-c9b6-49be-99f1-2b7b009a5d2e",
    "code": "DVVH.000391",
    "name": "Xí nghiệp khai thác dầu khí, Liên doanh Việt Nga-Vietsovpetro",
    "parentCode": null
  },
  {
    "id": "8ccac057-9c28-46cb-89b5-c3275aa09b7d",
    "code": "DVVH.000349",
    "name": "Đồng Sở Hữu: Công ty TNHH Nhựa và Hóa chất TPC VINA; Công ty TNHH TOTAL ENERGIES LPG VIET NAM; Công ty TNHH TOTAL ENERGIES MARKETING VIET NAM",
    "parentCode": null
  }
];
