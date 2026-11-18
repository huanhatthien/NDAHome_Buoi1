import { Transaction } from "../types/transaction";

export const mockTransactions: Transaction[] = [
  { id: "1", title: "Thu tiền thuê căn hộ dịch vụ Bình Thạnh T11", amount: 42000000, type: "INCOME", category: "Tiền thuê phòng", date: "2026-11-02", note: "6 phòng" },
  { id: "2", title: "Chi sửa chữa hệ thống máy lạnh khu Gò Vấp", amount: 6500000, type: "EXPENSE", category: "Bảo trì & Sửa chữa", date: "2026-11-03", note: "Bảo dưỡng định kỳ" },
  { id: "3", title: "Thu đặt cọc phòng trọ Q7 - P.302", amount: 8000000, type: "INCOME", category: "Đặt cọc thuê nhà", date: "2026-11-05" },
  { id: "4", title: "Chi lương nhân sự vận hành & CSKH đợt 1", amount: 24000000, type: "EXPENSE", category: "Lương nhân sự", date: "2026-11-07" },
  { id: "5", title: "Thu phí dịch vụ & điện nước khu Tân Định", amount: 18500000, type: "INCOME", category: "Phí dịch vụ", date: "2026-11-10" },
  { id: "6", title: "Chi phí chạy quảng cáo & đăng tin phòng", amount: 5800000, type: "EXPENSE", category: "Marketing & Đăng tin", date: "2026-11-12" },
  { id: "7", title: "Chi tiền thuê văn phòng Mạc Đĩnh Chi T11", amount: 15000000, type: "EXPENSE", category: "Vận hành văn phòng", date: "2026-11-15" },
  { id: "8", title: "Thu hoa hồng ký gửi căn hộ Q2", amount: 14000000, type: "INCOME", category: "Hoa hồng ký gửi", date: "2026-11-18" },
  { id: "9", title: "Thu tiền thuê phòng toàn hệ thống T10", amount: 68000000, type: "INCOME", category: "Tiền thuê phòng", date: "2026-10-14" },
  { id: "10", title: "Chi điện nước & internet tháng 10", amount: 19200000, type: "EXPENSE", category: "Điện nước & Internet", date: "2026-10-20" },
  { id: "11", title: "Thu tiền thuê phòng toàn hệ thống T9", amount: 61000000, type: "INCOME", category: "Tiền thuê phòng", date: "2026-09-18" },
  { id: "12", title: "Chi bảo trì & sơn sửa phòng trống T9", amount: 16500000, type: "EXPENSE", category: "Bảo trì & Sửa chữa", date: "2026-09-25" },
];