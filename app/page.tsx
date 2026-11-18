"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "./context/TransactionContext";
import { TransactionType } from "./types/transaction";
import { Plus, Search, X } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " ₫";

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

export default function DashboardPage() {
  const { transactions, addTransaction } = useTransactions();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [filterType, setFilterType] = useState<"ALL" | TransactionType>("ALL");
  const [chartMode, setChartMode] = useState<"month" | "day">("month");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("INCOME");
  const [category, setCategory] = useState(CATEGORIES.INCOME[0]);
  const [date, setDate] = useState("2026-11-18");

  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7))));
    return months.sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    return transactions.filter((t) => {
      if (selectedMonth !== "ALL" && !t.date.startsWith(selectedMonth)) return false;
      if (filterType !== "ALL" && t.type !== filterType) return false;
      if (
        kw &&
        !t.title.toLowerCase().includes(kw) &&
        !t.category.toLowerCase().includes(kw)
      ) {
        return false;
      }
      return true;
    });
  }, [transactions, selectedMonth, filterType, searchTerm]);

  const summary = useMemo(() => {
    const incomes = filteredTransactions.filter((t) => t.type === "INCOME");
    const expenses = filteredTransactions.filter((t) => t.type === "EXPENSE");
    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const profit = totalIncome - totalExpense;
    const margin = totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0;

    return {
      totalIncome,
      totalExpense,
      profit,
      margin,
      incomeCount: incomes.length,
      expenseCount: expenses.length,
    };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const map = new Map<string, { label: string; thu: number; chi: number }>();
    const sorted = [...filteredTransactions].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    for (const t of sorted) {
      const key = chartMode === "month" ? t.date.slice(0, 7) : t.date.slice(5);
      if (!map.has(key)) map.set(key, { label: key, thu: 0, chi: 0 });
      const item = map.get(key)!;
      if (t.type === "INCOME") item.thu += t.amount;
      else item.chi += t.amount;
    }
    return Array.from(map.values());
  }, [filteredTransactions, chartMode]);

  const categoryTop = useMemo(() => {
    const map = new Map<string, { name: string; total: number; type: TransactionType }>();
    for (const t of filteredTransactions) {
      const key = `${t.type}_${t.category}`;
      if (!map.has(key)) map.set(key, { name: t.category, total: 0, type: t.type });
      map.get(key)!.total += t.amount;
    }
    const arr = Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 6);
    const max = arr[0]?.total || 1;
    return arr.map((x) => ({ ...x, pct: Math.round((x.total / max) * 100) }));
  }, [filteredTransactions]);

  const recentList = useMemo(
    () =>
      [...filteredTransactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6),
    [filteredTransactions]
  );

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategory(CATEGORIES[nextType][0]);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || Number(amount) <= 0) return;
    addTransaction({
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date,
    });
    setTitle("");
    setAmount("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-100 tracking-tight">
              Tổng quan tài chính
            </h1>
            <p className="text-sm text-neutral-400 mt-0.5">
              Theo dõi dòng tiền, doanh thu và chi phí vận hành của NDAHOME.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-medium text-sm px-3.5 py-2 rounded-md transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm giao dịch
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo nội dung hoặc danh mục..."
              className="w-full bg-[#111113] border border-neutral-800 rounded-md pl-9 pr-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-yellow-400/80"
            />
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#111113] border border-neutral-800 rounded-md px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-yellow-400/80 cursor-pointer"
          >
            <option value="ALL">Tất cả các tháng</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          <div className="inline-flex bg-[#111113] border border-neutral-800 rounded-md p-0.5">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "INCOME", label: "Thu" },
              { id: "EXPENSE", label: "Chi" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as "ALL" | TransactionType)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  filterType === tab.id
                    ? "bg-neutral-800 text-yellow-400"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 bg-[#111113] border border-neutral-800 rounded-lg divide-y md:divide-y-0 md:divide-x divide-neutral-800">
        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Tổng khoản thu</span>
            <span>{summary.incomeCount} giao dịch</span>
          </div>
          <p className="text-2xl font-semibold text-emerald-400 mt-2 tabular-nums tracking-tight">
            {formatVND(summary.totalIncome)}
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Tổng khoản chi</span>
            <span>{summary.expenseCount} giao dịch</span>
          </div>
          <p className="text-2xl font-semibold text-rose-400 mt-2 tabular-nums tracking-tight">
            {formatVND(summary.totalExpense)}
          </p>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Thu – Chi</span>
          </div>
          <p className="text-2xl font-semibold text-yellow-400 mt-2 tabular-nums tracking-tight">
            {formatVND(summary.profit)}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#111113] border border-neutral-800 rounded-lg p-5">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                Dòng tiền Thu – Chi
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Xanh: Khoản thu · Vàng: Khoản chi
              </p>
            </div>
            <div className="inline-flex bg-[#0a0a0c] border border-neutral-800 rounded-md p-0.5">
              <button
                onClick={() => setChartMode("month")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  chartMode === "month"
                    ? "bg-neutral-800 text-yellow-400"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Theo tháng
              </button>
              <button
                onClick={() => setChartMode("day")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  chartMode === "day"
                    ? "bg-neutral-800 text-yellow-400"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Theo ngày
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222226" vertical={false} />
                <XAxis dataKey="label" stroke="#737373" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#737373"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    backgroundColor: "#111113",
                    borderColor: "#26262a",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#f5f5f5",
                  }}
                  formatter={(value) => formatVND(Number(value ?? 0))}
                />
                <Bar dataKey="thu" name="Khoản thu" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="chi" name="Khoản chi" fill="#facc15" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#111113] border border-neutral-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-neutral-100">
            Phân bổ theo danh mục
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5 mb-5">
            Top hạng mục phát sinh lớn nhất
          </p>
          <div className="space-y-4">
            {categoryTop.map((c) => (
              <div key={`${c.type}_${c.name}`}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-neutral-300">{c.name}</span>
                  <span
                    className={`font-medium tabular-nums ${
                      c.type === "INCOME" ? "text-emerald-400" : "text-yellow-400"
                    }`}
                  >
                    {formatVND(c.total)}
                  </span>
                </div>
                <div className="h-1.5 bg-neutral-900 rounded-sm overflow-hidden">
                  <div
                    className={`h-full ${
                      c.type === "INCOME" ? "bg-emerald-500" : "bg-yellow-400"
                    }`}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-100">
            Giao dịch gần đây
          </h2>
          <span className="text-xs text-neutral-500">
            {recentList.length} mục mới nhất
          </span>
        </div>

        <div className="border border-neutral-800 rounded-lg bg-[#111113] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-400 border-b border-neutral-800 bg-[#0d0d0f]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Ngày</th>
                  <th className="py-2.5 px-4 font-medium">Nội dung</th>
                  <th className="py-2.5 px-4 font-medium">Danh mục</th>
                  <th className="py-2.5 px-4 font-medium">Loại</th>
                  <th className="py-2.5 px-4 font-medium text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {recentList.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-900/60 transition-colors">
                    <td className="py-3 px-4 text-neutral-400 whitespace-nowrap font-mono text-xs">
                      {t.date}
                    </td>
                    <td className="py-3 px-4 text-neutral-100">{t.title}</td>
                    <td className="py-3 px-4 text-neutral-400 text-xs whitespace-nowrap">
                      {t.category}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-300">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            t.type === "INCOME" ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        {t.type === "INCOME" ? "Thu" : "Chi"}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-medium whitespace-nowrap tabular-nums ${
                        t.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {t.type === "INCOME" ? "+" : "-"}
                      {formatVND(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-neutral-800 rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-100">
                Ghi nhận giao dịch mới
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange("INCOME")}
                  className={`py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    type === "INCOME"
                      ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-400"
                      : "bg-[#0a0a0c] border-neutral-800 text-neutral-400"
                  }`}
                >
                  Khoản thu
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("EXPENSE")}
                  className={`py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    type === "EXPENSE"
                      ? "bg-rose-500/10 border-rose-500/60 text-rose-400"
                      : "bg-[#0a0a0c] border-neutral-800 text-neutral-400"
                  }`}
                >
                  Khoản chi
                </button>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Nội dung
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Thu đặt cọc nhà A01..."
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
                    placeholder="15000000"
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
                    className="w-full bg-[#0a0a0c] border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-yellow-400"
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
              <button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-neutral-950 font-medium text-sm py-2 rounded-md transition-colors cursor-pointer"
              >
                Lưu giao dịch
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}