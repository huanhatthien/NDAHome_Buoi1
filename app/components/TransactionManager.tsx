"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "../context/TransactionContext";
import { Transaction, TransactionType } from "../types/transaction";
import { Plus, Search, Pencil, Trash2, X, RotateCcw, FileSpreadsheet, Printer, Receipt } from "lucide-react";
import * as XLSX from "xlsx";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " ₫";

// Hàm chuyển đổi số tiền thành chữ tiếng Việt chuẩn cho phiếu thu/chi
function numberToVietnameseWords(n: number): string {
  if (n === 0) return "Không đồng";
  const units = ["", "nghìn", "triệu", "tỷ"];
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  function readGroup(num: number): string {
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;
    let res = "";
    if (h > 0) res += digits[h] + " trăm ";
    if (t > 1) {
      res += digits[t] + " mươi ";
      if (u === 1) res += "mốt";
      else if (u === 5) res += "lăm";
      else if (u > 0) res += digits[u];
    } else if (t === 1) {
      res += "mười ";
      if (u === 5) res += "lăm";
      else if (u > 0) res += digits[u];
    } else if (u > 0) {
      if (h > 0) res += "lẻ " + digits[u];
      else res += digits[u];
    }
    return res.trim();
  }

  const str = Math.floor(n).toString();
  const groups: number[] = [];
  for (let i = str.length; i > 0; i -= 3) {
    groups.push(parseInt(str.substring(Math.max(0, i - 3), i), 10));
  }

  let result = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0) {
      result += readGroup(groups[i]) + " " + units[i] + " ";
    }
  }

  result = result.trim() + " đồng chẵn.";
  return result.charAt(0).toUpperCase() + result.slice(1);
}

const CATEGORIES: Record<TransactionType, string[]> = {
  INCOME: [
    "Tiền thuê phòng",
    "Đặt cọc thuê nhà",
    "Phí dịch vụ",
    "Hoa hồng ký gửi",
    "Khác",
  ],
  EXPENSE: [
    "Bảo trì & Sửa chữa",
    "Điện nước & Internet",
    "Lương nhân sự",
    "Marketing & Đăng tin",
    "Vận hành văn phòng",
    "Khác",
  ],
};

interface Props {
  type: TransactionType;
}

export default function TransactionManager({ type }: Props) {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions();

  const isIncome = type === "INCOME";
  const pageTitle = isIncome ? "Khoản thu" : "Khoản chi";
  const pageDesc = isIncome
    ? "Danh sách tiền thuê, tiền cọc, phí dịch vụ và hoa hồng."
    : "Danh sách chi phí bảo trì, điện nước, nhân sự và vận hành.";

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [selectedBillItem, setSelectedBillItem] = useState<Transaction | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[type][0]);
  const [date, setDate] = useState("2026-11-18");
  const [note, setNote] = useState("");

  const typedTransactions = useMemo(
    () => transactions.filter((t) => t.type === type),
    [transactions, type]
  );

  const availableMonths = useMemo(() => {
    const months = Array.from(
      new Set(typedTransactions.map((t) => t.date.slice(0, 7)))
    );
    return months.sort((a, b) => b.localeCompare(a));
  }, [typedTransactions]);

  const filteredList = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return typedTransactions
      .filter((t) => {
        if (filterMonth !== "ALL" && !t.date.startsWith(filterMonth)) return false;
        if (filterDate && t.date.slice(0, 10) !== filterDate) return false;
        if (keyword) {
          const matchTitle = t.title.toLowerCase().includes(keyword);
          const matchCat = t.category.toLowerCase().includes(keyword);
          const matchNote = (t.note || "").toLowerCase().includes(keyword);
          if (!matchTitle && !matchCat && !matchNote) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [typedTransactions, searchTerm, filterMonth, filterDate]);

  const totalFilteredAmount = useMemo(
    () => filteredList.reduce((sum, t) => sum + t.amount, 0),
    [filteredList]
  );

  // Xuất danh sách phiếu thu/chi ra file Excel
  const exportExcelList = () => {
    if (filteredList.length === 0) {
      alert("Không có dữ liệu giao dịch nào để xuất!");
      return;
    }

    const sheetName = isIncome ? "Danh sach phieu thu" : "Danh sach phieu chi";
    const data = filteredList.map((item, index) => ({
      STT: index + 1,
      "Mã phiếu": (isIncome ? "PT-" : "PC-") + String(item.id).padStart(4, "0"),
      "Ngày lập": item.date,
      "Nội dung": item.title,
      "Danh mục": item.category,
      "Loại": isIncome ? "Thu" : "Chi",
      "Số tiền (VNĐ)": item.amount,
      "Ghi chú": item.note || "",
    }));

    data.push({
      STT: "" as unknown as number,
      "Mã phiếu": "TỔNG CỘNG",
      "Ngày lập": "",
      "Nội dung": "",
      "Danh mục": "",
      "Loại": "",
      "Số tiền (VNĐ)": totalFilteredAmount,
      "Ghi chú": "",
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileName = `NDAHOME_${isIncome ? "Phieu_Thu" : "Phieu_Chi"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Xuất file Excel phiếu thu / phiếu chi chuẩn theo Thông tư 200/2014/TT-BTC của Bộ Tài chính
  const exportSingleVoucher = (item: Transaction) => {
    const voucherCode = (isIncome ? "PT-" : "PC-") + String(item.id).padStart(4, "0");
    const voucherTitle = isIncome ? "PHIẾU THU" : "PHIẾU CHI";
    const voucherForm = isIncome ? "Mẫu số 01 - TT" : "Mẫu số 02 - TT";

    const voucherData = [
      ["ĐƠN VỊ:", "CÔNG TY TNHH BẤT ĐỘNG SẢN NDA HOME", "", "", voucherForm],
      ["ĐỊA CHỈ:", "TP. Hồ Chí Minh", "", "", "(Ban hành theo Thông tư số 200/2014/TT-BTC"],
      ["MÃ SỐ THUẾ:", "0318999999", "", "", "ngày 22/12/2014 của Bộ Tài chính)"],
      ["", "", "", "", `Quyển số: 01`],
      ["", "", "", "", `Số: ${voucherCode}`],
      ["", "", "", "", isIncome ? "Nợ: TK 111 (Tiền mặt)" : "Nợ: TK 642 (Chi phí quản lý)"],
      ["", "", "", "", isIncome ? "Có: TK 511 (Doanh thu bán hàng và CCDV)" : "Có: TK 111 (Tiền mặt)"],
      [""],
      ["", "", voucherTitle],
      ["", "", `Ngày ${item.date.slice(8, 10)} tháng ${item.date.slice(5, 7)} năm ${item.date.slice(0, 4)}`],
      [""],
      [isIncome ? "Họ và tên người nộp tiền:" : "Họ và tên người nhận tiền:", "Khách hàng / Đối tác hệ thống NDA HOME"],
      ["Địa chỉ:", "Hệ thống căn hộ & phòng trọ NDA HOME"],
      [isIncome ? "Lý do thu:" : "Lý do chi:", item.title],
      ["Danh mục phân loại:", item.category],
      ["Số tiền:", `${formatVND(item.amount)}`],
      ["(Viết bằng chữ):", numberToVietnameseWords(item.amount)],
      ["Kèm theo:", "01 chứng từ gốc."],
      [""],
      ["", "", "", "", `Ngày ${item.date.slice(8, 10)} tháng ${item.date.slice(5, 7)} năm ${item.date.slice(0, 4)}`],
      ["Giám đốc", "Kế toán trưởng", isIncome ? "Người nộp tiền" : "Người nhận tiền", "Người lập phiếu", "Thủ quỹ"],
      ["(Ký, họ tên, đóng dấu)", "(Ký, họ tên)", "(Ký, họ tên)", "(Ký, họ tên)", "(Ký, họ tên)"],
      [""],
      [""],
      [""],
      ["Đã nhận đủ số tiền (viết bằng chữ):", numberToVietnameseWords(item.amount)],
      ["+ Tỷ giá ngoại tệ (vàng bạc, đá quý):", "Không có"],
      ["+ Số tiền quy đổi:", `${formatVND(item.amount)}`],
      ["(Liên gửi ra ngoài phải đóng dấu)"],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(voucherData);
    XLSX.utils.book_append_sheet(wb, ws, isIncome ? "Phieu Thu" : "Phieu Chi");
    XLSX.writeFile(wb, `NDAHOME_${voucherCode}_${item.date}.xlsx`);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setTitle("");
    setAmount("");
    setCategory(CATEGORIES[type][0]);
    setDate("2026-11-18");
    setNote("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: Transaction) => {
    setEditingItem(item);
    setTitle(item.title);
    setAmount(String(item.amount));
    setCategory(item.category);
    setDate(item.date);
    setNote(item.note || "");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;

    if (editingItem) {
      updateTransaction({
        ...editingItem,
        title: title.trim(),
        amount: Number(amount),
        category,
        date,
        note: note.trim() || undefined,
      });
    } else {
      addTransaction({
        title: title.trim(),
        amount: Number(amount),
        type,
        category,
        date,
        note: note.trim() || undefined,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (item: Transaction) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${item.title}"?`)) {
      deleteTransaction(item.id);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterMonth("ALL");
    setFilterDate("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100 tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">{pageDesc}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportExcelList}
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-3.5 py-2 rounded-md transition-colors shrink-0 cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isIncome ? "Xuất Excel phiếu thu" : "Xuất Excel phiếu chi"}
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-medium text-sm px-3.5 py-2 rounded-md transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {isIncome ? "Thêm khoản thu" : "Thêm khoản chi"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm nội dung, danh mục, ghi chú..."
              className="w-full bg-[#111113] border border-neutral-800 rounded-md pl-9 pr-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-yellow-400/80"
            />
          </div>

          <select
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
              setFilterDate("");
            }}
            className="bg-[#111113] border border-neutral-800 rounded-md px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-yellow-400/80 cursor-pointer"
          >
            <option value="ALL">Tất cả các tháng</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              if (e.target.value) setFilterMonth("ALL");
            }}
            className="bg-[#111113] border border-neutral-800 rounded-md px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-yellow-400/80 [color-scheme:dark] cursor-pointer"
          />

          <button
            onClick={resetFilters}
            title="Đặt lại bộ lọc"
            className="px-2.5 py-1.5 rounded-md border border-neutral-800 bg-[#111113] text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm text-neutral-400 whitespace-nowrap">
          {filteredList.length} mục · Tổng:{" "}
          <span
            className={`font-semibold tabular-nums ${
              isIncome ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {formatVND(totalFilteredAmount)}
          </span>
        </div>
      </div>

      <div className="border border-neutral-800 rounded-lg bg-[#111113] overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-sm">
            Không có giao dịch nào khớp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-400 border-b border-neutral-800 bg-[#0d0d0f]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Ngày</th>
                  <th className="py-2.5 px-4 font-medium">Nội dung</th>
                  <th className="py-2.5 px-4 font-medium">Danh mục</th>
                  <th className="py-2.5 px-4 font-medium">Ghi chú</th>
                  <th className="py-2.5 px-4 font-medium text-right">Số tiền</th>
                  <th className="py-2.5 px-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-900/60 transition-colors">
                    <td className="py-3 px-4 text-neutral-400 whitespace-nowrap font-mono text-xs">
                      {item.date}
                    </td>
                    <td className="py-3 px-4 text-neutral-100 min-w-[200px]">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-neutral-400 text-xs whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 text-xs">
                      {item.note || "—"}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-medium whitespace-nowrap tabular-nums ${
                        isIncome ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatVND(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setSelectedBillItem(item)}
                          title={isIncome ? "Xem & In phiếu thu (Bill)" : "Xem & In phiếu chi (Bill)"}
                          className="p-1.5 rounded text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          title="Sửa"
                          className="p-1.5 rounded text-neutral-400 hover:text-yellow-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          title="Xóa"
                          className="p-1.5 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-neutral-800 rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-100">
                {editingItem
                  ? "Cập nhật giao dịch"
                  : isIncome
                  ? "Thêm khoản thu"
                  : "Thêm khoản chi"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Nội dung
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên giao dịch..."
                  className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Số tiền (VNĐ)
                  </label>
                  <input
                    required
                    type="number"
                    min="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Ngày
                  </label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-yellow-400 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Danh mục
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-yellow-400"
                >
                  {CATEGORIES[type].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Ghi chú (không bắt buộc)
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Phòng 302, Đợt 1..."
                  className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-medium text-sm py-2 rounded-md transition-colors cursor-pointer"
              >
                {editingItem ? "Lưu thay đổi" : "Thêm giao dịch"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XUẤT VÀ IN PHIẾU / BILL (CHUẨN THÔNG TƯ 200 - BỘ TÀI CHÍNH) */}
      {selectedBillItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#18181b] border border-neutral-700 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Thanh công cụ Modal trên cùng (Cố định, không bao giờ bị che) */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-neutral-900 border-b border-neutral-800 z-10">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-neutral-100">
                  {isIncome
                    ? "Phiếu Thu — Mẫu số 01-TT (Thông tư 200/2014/TT-BTC)"
                    : "Phiếu Chi — Mẫu số 02-TT (Thông tư 200/2014/TT-BTC)"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In phiếu / Lưu PDF
                </button>
                <button
                  onClick={() => exportSingleVoucher(selectedBillItem)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Tải Excel
                </button>
                <button
                  onClick={() => setSelectedBillItem(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-md transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vùng cuộn xem trước phiếu in (Cuộn độc lập, không tràn màn hình) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-950 flex justify-center">
              <div
                id="printable-voucher"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
                className="w-full max-w-2xl bg-white text-black p-8 sm:p-10 shadow-lg text-[13px] leading-relaxed border border-neutral-300 select-text"
              >
                {/* 1. Header: Đơn vị & Mẫu số theo Thông tư 200 */}
                <div className="grid grid-cols-2 gap-4 pb-3 mb-3 border-b border-black/20">
                  <div>
                    <p className="font-bold text-xs uppercase leading-tight">
                      CÔNG TY TNHH BẤT ĐỘNG SẢN NDA HOME
                    </p>
                    <p className="text-xs mt-0.5">
                      <span className="font-semibold">Địa chỉ:</span> TP. Hồ Chí Minh
                    </p>
                    <p className="text-xs">
                      <span className="font-semibold">Mã số thuế:</span> 0318999999
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">
                      {isIncome ? "Mẫu số 01 - TT" : "Mẫu số 02 - TT"}
                    </p>
                    <p className="italic text-[11px] leading-snug">
                      (Ban hành theo Thông tư số 200/2014/TT-BTC
                    </p>
                    <p className="italic text-[11px] leading-snug">
                      ngày 22/12/2014 của Bộ Tài chính)
                    </p>
                    <div className="mt-1 font-medium text-[12px]">
                      <p>Quyển số: 01</p>
                      <p>
                        Số: <span className="font-bold">{(isIncome ? "PT-" : "PC-") + String(selectedBillItem.id).padStart(4, "0")}</span>
                      </p>
                      <p>{isIncome ? "Nợ: TK 111 (Tiền mặt)" : "Nợ: TK 642 (Chi phí doanh nghiệp)"}</p>
                      <p>{isIncome ? "Có: TK 511 (Doanh thu bán hàng và CCDV)" : "Có: TK 111 (Tiền mặt)"}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Tiêu đề chính của phiếu */}
                <div className="text-center my-4">
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide">
                    {isIncome ? "PHIẾU THU" : "PHIẾU CHI"}
                  </h2>
                  <p className="italic text-xs sm:text-sm mt-1">
                    Ngày {selectedBillItem.date.slice(8, 10)} tháng {selectedBillItem.date.slice(5, 7)} năm {selectedBillItem.date.slice(0, 4)}
                  </p>
                </div>

                {/* 3. Thân phiếu: Dòng kẻ chấm chuẩn biểu mẫu hành chính kế toán */}
                <div className="space-y-2 text-[13px] my-5">
                  <div className="flex items-baseline">
                    <span className="font-medium shrink-0 pr-1">
                      {isIncome ? "Họ và tên người nộp tiền:" : "Họ và tên người nhận tiền:"}
                    </span>
                    <span className="flex-1 font-semibold border-b border-dotted border-black/60 pb-0.5">
                      Khách hàng / Đối tác hệ thống NDA HOME
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-medium shrink-0 pr-1">Địa chỉ:</span>
                    <span className="flex-1 border-b border-dotted border-black/60 pb-0.5">
                      Hệ thống căn hộ & phòng trọ NDA HOME
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-medium shrink-0 pr-1">
                      {isIncome ? "Lý do nộp:" : "Lý do chi:"}
                    </span>
                    <span className="flex-1 font-medium border-b border-dotted border-black/60 pb-0.5">
                      {selectedBillItem.title}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-medium shrink-0 pr-1">Danh mục phân loại:</span>
                    <span className="flex-1 border-b border-dotted border-black/60 pb-0.5">
                      {selectedBillItem.category}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-medium shrink-0 pr-1">Số tiền:</span>
                    <span className="flex-1 font-bold text-[15px] border-b border-dotted border-black/60 pb-0.5">
                      {formatVND(selectedBillItem.amount)}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-medium shrink-0 pr-1">(Viết bằng chữ):</span>
                    <span className="flex-1 italic font-medium border-b border-dotted border-black/60 pb-0.5">
                      {numberToVietnameseWords(selectedBillItem.amount)}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-medium shrink-0 pr-1">Kèm theo:</span>
                    <span className="flex-1 border-b border-dotted border-black/60 pb-0.5">
                      01 chứng từ gốc {selectedBillItem.note ? `(${selectedBillItem.note})` : ""}
                    </span>
                  </div>
                </div>

                {/* 4. Ngày tháng ký & 5 cột chữ ký pháp lý chuẩn Thông tư 200 */}
                <div className="text-right italic text-xs mb-2">
                  Ngày {selectedBillItem.date.slice(8, 10)} tháng {selectedBillItem.date.slice(5, 7)} năm {selectedBillItem.date.slice(0, 4)}
                </div>

                <div className="grid grid-cols-5 gap-1 text-center text-xs border-t border-black/20 pt-3">
                  <div>
                    <p className="font-bold">Giám đốc</p>
                    <p className="italic text-[10px] leading-tight text-neutral-600">(Ký, họ tên, đóng dấu)</p>
                    <div className="h-16" />
                  </div>
                  <div>
                    <p className="font-bold">Kế toán trưởng</p>
                    <p className="italic text-[10px] leading-tight text-neutral-600">(Ký, họ tên)</p>
                    <div className="h-16" />
                  </div>
                  <div>
                    <p className="font-bold">
                      {isIncome ? "Người nộp tiền" : "Người nhận tiền"}
                    </p>
                    <p className="italic text-[10px] leading-tight text-neutral-600">(Ký, họ tên)</p>
                    <div className="h-16" />
                  </div>
                  <div>
                    <p className="font-bold">Người lập phiếu</p>
                    <p className="italic text-[10px] leading-tight text-neutral-600">(Ký, họ tên)</p>
                    <div className="h-16" />
                  </div>
                  <div>
                    <p className="font-bold">Thủ quỹ</p>
                    <p className="italic text-[10px] leading-tight text-neutral-600">(Ký, họ tên)</p>
                    <div className="h-16" />
                  </div>
                </div>

                {/* 5. Dòng xác nhận thực nhận tiền theo chuẩn Thông tư 200 */}
                <div className="text-xs pt-3 border-t border-black/20 space-y-1">
                  <p>
                    <span className="font-medium">Đã nhận đủ số tiền (viết bằng chữ):</span>{" "}
                    <span className="italic font-semibold">{numberToVietnameseWords(selectedBillItem.amount)}</span>
                  </p>
                  <p className="text-neutral-600">
                    + Tỷ giá ngoại tệ (vàng bạc, đá quý): Không có
                  </p>
                  <p className="text-neutral-600">
                    + Số tiền quy đổi: {formatVND(selectedBillItem.amount)}
                  </p>
                  <p className="text-right italic text-[11px] text-neutral-500 mt-2">
                    (Liên gửi ra ngoài phải đóng dấu)
                  </p>
                </div>
              </div>
            </div>

            {/* Thanh công cụ dưới cùng (Cố định ở đáy modal, luôn bấm được) */}
            <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-neutral-900 border-t border-neutral-800 z-10 text-xs">
              <span className="text-neutral-400">
                Chuẩn biểu mẫu kế toán: <strong>{isIncome ? "Mẫu 01-TT" : "Mẫu 02-TT"} (TT 200/2014/TT-BTC)</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBillItem(null)}
                  className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => exportSingleVoucher(selectedBillItem)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Tải Excel
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In phiếu / Lưu PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}