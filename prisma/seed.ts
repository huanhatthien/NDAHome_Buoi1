import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

const sampleTransactions = [
  // --- THÁNG 9/2026 ---
  {
    title: "Thu tiền phòng P101 - Hợp đồng 1 năm",
    amount: 15000000,
    type: TransactionType.INCOME,
    category: "Tiền thuê phòng",
    date: "2026-09-05",
    note: "Khách cọc + trả 1 tháng đầu",
  },
  {
    title: "Thu tiền phòng P202 - Gia hạn hợp đồng",
    amount: 22000000,
    type: TransactionType.INCOME,
    category: "Tiền thuê phòng",
    date: "2026-09-10",
    note: "Chuyển khoản Vietcombank",
  },
  {
    title: "Thu tiền dịch vụ điện nước toà nhà NDA 1",
    amount: 24000000,
    type: TransactionType.INCOME,
    category: "Dịch vụ & Điện nước",
    date: "2026-09-15",
    note: "Tổng hợp các phòng",
  },
  {
    title: "Chi lương nhân viên quản lý & bảo vệ tháng 9",
    amount: 16500000,
    type: TransactionType.EXPENSE,
    category: "Lương nhân sự",
    date: "2026-09-28",
    note: "Chi tiền mặt cho ban quản lý",
  },

  // --- THÁNG 10/2026 ---
  {
    title: "Thu tiền phòng P301 + P302",
    amount: 32000000,
    type: TransactionType.INCOME,
    category: "Tiền thuê phòng",
    date: "2026-10-05",
    note: "Đã thu đủ đầu tháng",
  },
  {
    title: "Thu cọc giữ chân phòng Penthouse NDA 2",
    amount: 20000000,
    type: TransactionType.INCOME,
    category: "Cọc giữ chỗ",
    date: "2026-10-12",
    note: "Khách hẹn dọn vào ngày 20",
  },
  {
    title: "Thu phí dịch vụ gửi xe & wifi tháng 10",
    amount: 16000000,
    type: TransactionType.INCOME,
    category: "Dịch vụ & Điện nước",
    date: "2026-10-18",
    note: "Tổng hợp thanh toán qua QR",
  },
  {
    title: "Chi thuê văn phòng điều hành NDA HOME",
    amount: 15000000,
    type: TransactionType.EXPENSE,
    category: "Thuê mặt bằng",
    date: "2026-10-02",
    note: "Định kỳ hàng tháng",
  },
  {
    title: "Bảo dưỡng hệ thống PCCC & máy bơm nước",
    amount: 4200000,
    type: TransactionType.EXPENSE,
    category: "Bảo trì & Sửa chữa",
    date: "2026-10-22",
    note: "Bảo trì định kỳ quý",
  },

  // --- THÁNG 11/2026 ---
  {
    title: "Thu tiền thuê phòng P101, P102",
    amount: 14000000,
    type: TransactionType.INCOME,
    category: "Tiền thuê phòng",
    date: "2026-11-02",
    note: "Thanh toán tháng 11",
  },
  {
    title: "Thu tiền thuê phòng P201, P202",
    amount: 18500000,
    type: TransactionType.INCOME,
    category: "Tiền thuê phòng",
    date: "2026-11-05",
    note: "Thanh toán chuyển khoản",
  },
  {
    title: "Thu tiền dịch vụ điện nước tháng 11",
    amount: 8000000,
    type: TransactionType.INCOME,
    category: "Dịch vụ & Điện nước",
    date: "2026-11-10",
    note: "Thu đợt 1",
  },
  {
    title: "Thu cọc thuê phòng căn hộ dịch vụ NDA 3",
    amount: 42000000,
    type: TransactionType.INCOME,
    category: "Cọc giữ chỗ",
    date: "2026-11-15",
    note: "Khách VIP thuê dài hạn 2 năm",
  },
  {
    title: "Chi thuê văn phòng điều hành tháng 11",
    amount: 15000000,
    type: TransactionType.EXPENSE,
    category: "Thuê mặt bằng",
    date: "2026-11-01",
    note: "Chuyển khoản định kỳ",
  },
  {
    title: "Chi quảng cáo Facebook/Tiktok tìm khách thuê",
    amount: 5800000,
    type: TransactionType.EXPENSE,
    category: "Marketing",
    date: "2026-11-08",
    note: "Chiến dịch lấp đầy phòng trống",
  },
  {
    title: "Chi lương nhân sự & quản lý toà nhà tháng 11",
    amount: 24000000,
    type: TransactionType.EXPENSE,
    category: "Lương nhân sự",
    date: "2026-11-12",
    note: "Thanh toán kỳ 1",
  },
  {
    title: "Sửa chữa hệ thống máy lạnh phòng P301, P302",
    amount: 6500000,
    type: TransactionType.EXPENSE,
    category: "Bảo trì & Sửa chữa",
    date: "2026-11-16",
    note: "Thay lốc lạnh và bơm gas",
  },

  // --- THÁNG 12/2026 ---
  {
    title: "Thu tiền phòng P401 - Đóng trước quý 1",
    amount: 45000000,
    type: TransactionType.INCOME,
    category: "Tiền thuê phòng",
    date: "2026-12-01",
    note: "Khách thanh toán 3 tháng",
  },
  {
    title: "Chi bảo trì thang máy định kỳ cuối năm",
    amount: 8500000,
    type: TransactionType.EXPENSE,
    category: "Bảo trì & Sửa chữa",
    date: "2026-12-05",
    note: "Hợp đồng bảo trì thang máy Mitsubishi",
  },
];

async function main() {
  console.log("Đang nạp dữ liệu mẫu vào database...");

  // Xóa sạch dữ liệu cũ để tránh trùng lặp
  await prisma.transaction.deleteMany();

  // Nạp toàn bộ dữ liệu mẫu
  await prisma.transaction.createMany({
    data: sampleTransactions,
  });

  const count = await prisma.transaction.count();
  console.log(`=> Đã thêm thành công ${count} giao dịch mẫu vào database!`);
}

main()
  .catch((e) => {
    console.error("Lỗi khi nạp dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
