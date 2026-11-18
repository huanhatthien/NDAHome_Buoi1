"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useTransactions } from "../context/TransactionContext";
import { TransactionType } from "../types/transaction";
import { Download } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " ₫";

const CHART_COLORS = [
  "#facc15",
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#a855f7",
  "#f43f5e",
];

type ExportScope = "ALL" | "MONTH" | "QUARTER" | "YEAR";

interface PieItem {
  name: string;
  value: number;
  share: number;
}

const getQuarterKey = (dateStr: string) => {
  const year = dateStr.slice(0, 4);
  const month = Number(dateStr.slice(5, 7));
  const q = Math.ceil(month / 3);
  return `${year}-Q${q}`;
};

export default function BaoCaoPage() {
  const { transactions } = useTransactions();

  const [scope, setScope] = useState<ExportScope>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  // Danh sách các kỳ (tháng / quý / năm) có trong dữ liệu
  const availablePeriods = useMemo(() => {
    if (scope === "ALL") return [];
    const set = new Set<string>();
    for (const t of transactions) {
      if (scope === "MONTH") set.add(t.date.slice(0, 7));
      else if (scope === "QUARTER") set.add(getQuarterKey(t.date));
      else if (scope === "YEAR") set.add(t.date.slice(0, 4));
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions, scope]);

  const handleScopeChange = (nextScope: ExportScope) => {
    setScope(nextScope);
    if (nextScope === "ALL") {
      setSelectedPeriod("");
      return;
    }
    const set = new Set<string>();
    for (const t of transactions) {
      if (nextScope === "MONTH") set.add(t.date.slice(0, 7));
      else if (nextScope === "QUARTER") set.add(getQuarterKey(t.date));
      else if (nextScope === "YEAR") set.add(t.date.slice(0, 4));
    }
    const sorted = Array.from(set).sort((a, b) => b.localeCompare(a));
    setSelectedPeriod(sorted[0] || "");
  };

  // Lọc giao dịch theo kỳ đang chọn
  const scopedTransactions = useMemo(() => {
    if (scope === "ALL" || !selectedPeriod) return transactions;
    return transactions.filter((t) => {
      if (scope === "MONTH") return t.date.startsWith(selectedPeriod);
      if (scope === "QUARTER") return getQuarterKey(t.date) === selectedPeriod;
      if (scope === "YEAR") return t.date.startsWith(selectedPeriod);
      return true;
    });
  }, [transactions, scope, selectedPeriod]);

  const buildCategoryPie = (type: TransactionType): PieItem[] => {
    const map = new Map<string, number>();
    let total = 0;
    for (const t of scopedTransactions) {
      if (t.type !== type) continue;
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
      total += t.amount;
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        share: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const incomeByCategory = useMemo(
    () => buildCategoryPie("INCOME"),
    [scopedTransactions]
  );
  const expenseByCategory = useMemo(
    () => buildCategoryPie("EXPENSE"),
    [scopedTransactions]
  );

  const monthlyReport = useMemo(() => {
    const map = new Map<
      string,
      { month: string; thu: number; chi: number; count: number }
    >();
    for (const t of scopedTransactions) {
      const month = t.date.slice(0, 7);
      if (!map.has(month)) {
        map.set(month, { month, thu: 0, chi: 0, count: 0 });
      }
      const row = map.get(month)!;
      row.count += 1;
      if (t.type === "INCOME") row.thu += t.amount;
      else row.chi += t.amount;
    }
    return Array.from(map.values())
      .sort((a, b) => b.month.localeCompare(a.month))
      .map((r) => ({
        ...r,
        profit: r.thu - r.chi,
      }));
  }, [scopedTransactions]);

  const handleExportExcel = () => {
    const summarySheetData = monthlyReport.map((r) => ({
      Tháng: r.month,
      "Số giao dịch": r.count,
      "Tổng thu (VNĐ)": r.thu,
      "Tổng chi (VNĐ)": r.chi,
      "Lợi nhuận (VNĐ)": r.profit,
    }));

    const detailSheetData = [...scopedTransactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((t) => ({
        Ngày: t.date,
        "Nội dung": t.title,
        "Danh mục": t.category,
        Loại: t.type === "INCOME" ? "Khoản thu" : "Khoản chi",
        "Số tiền (VNĐ)": t.amount,
        "Ghi chú": t.note || "",
      }));

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
    const wsDetail = XLSX.utils.json_to_sheet(detailSheetData);

    XLSX.utils.book_append_sheet(wb, wsSummary, "Tong hop");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Chi tiet giao dich");

    const suffix = scope === "ALL" || !selectedPeriod ? "Tat_Ca" : selectedPeriod;
    XLSX.writeFile(wb, `NDAHOME_Bao_Cao_${suffix}.xlsx`);
  };

  const renderPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    if (
      cx === undefined ||
      cy === undefined ||
      midAngle === undefined ||
      innerRadius === undefined ||
      outerRadius === undefined ||
      percent === undefined
    ) {
      return null;
    }
    const pct = percent <= 1 ? Math.round(percent * 100) : Math.round(percent);
    if (pct < 5) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#09090b"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={700}
      >
        {`${pct}%`}
      </text>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header + Chọn kỳ báo cáo + Nút Xuất Excel */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100 tracking-tight">
            Báo cáo tài chính
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Cơ cấu nguồn thu, chi phí theo danh mục và xuất báo cáo Excel theo kỳ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={scope}
            onChange={(e) => handleScopeChange(e.target.value as ExportScope)}
            className="bg-[#111113] border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-yellow-400/80 cursor-pointer"
          >
            <option value="ALL">Tất cả thời gian</option>
            <option value="MONTH">Theo tháng</option>
            <option value="QUARTER">Theo quý</option>
            <option value="YEAR">Theo năm</option>
          </select>

          {scope !== "ALL" && availablePeriods.length > 0 && (
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-[#111113] border border-neutral-800 rounded-md px-3 py-2 text-sm text-yellow-400 font-medium focus:outline-none focus:border-yellow-400/80 cursor-pointer"
            >
              {availablePeriods.map((p) => (
                <option key={p} value={p} className="text-neutral-200">
                  {scope === "MONTH"
                    ? `Tháng ${p}`
                    : scope === "QUARTER"
                    ? `Quý ${p}`
                    : `Năm ${p}`}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleExportExcel}
            disabled={scopedTransactions.length === 0}
            className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-neutral-950 font-medium text-sm px-4 py-2 rounded-md transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Xuất Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* 2 Biểu đồ tròn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111113] border border-neutral-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-neutral-100">
            Cơ cấu Khoản thu
          </h2>
          {incomeByCategory.length === 0 ? (
            <p className="text-xs text-neutral-500 py-16 text-center">
              Không có khoản thu trong kỳ đã chọn.
            </p>
          ) : (
            <>
              <div className="h-60 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={96}
                      stroke="#111113"
                      strokeWidth={2}
                      labelLine={false}
                      label={renderPieLabel}
                    >
                      {incomeByCategory.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111113",
                        borderColor: "#26262a",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#f5f5f5",
                      }}
                      formatter={(value) => formatVND(Number(value ?? 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
                {incomeByCategory.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                      <span className="text-neutral-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-neutral-200">{formatVND(item.value)}</span>
                      <span className="w-9 text-right text-yellow-400 font-medium">
                        {item.share}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-[#111113] border border-neutral-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-neutral-100">
            Cơ cấu Khoản chi
          </h2>
          {expenseByCategory.length === 0 ? (
            <p className="text-xs text-neutral-500 py-16 text-center">
              Không có khoản chi trong kỳ đã chọn.
            </p>
          ) : (
            <>
              <div className="h-60 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={96}
                      stroke="#111113"
                      strokeWidth={2}
                      labelLine={false}
                      label={renderPieLabel}
                    >
                      {expenseByCategory.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111113",
                        borderColor: "#26262a",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#f5f5f5",
                      }}
                      formatter={(value) => formatVND(Number(value ?? 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
                {expenseByCategory.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                      <span className="text-neutral-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-neutral-200">{formatVND(item.value)}</span>
                      <span className="w-9 text-right text-yellow-400 font-medium">
                        {item.share}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bảng tổng hợp theo tháng */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-100">
          Tổng hợp theo tháng
        </h2>
        <div className="border border-neutral-800 rounded-lg bg-[#111113] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-400 border-b border-neutral-800 bg-[#0d0d0f]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Tháng</th>
                  <th className="py-2.5 px-4 font-medium text-right">Giao dịch</th>
                  <th className="py-2.5 px-4 font-medium text-right">Tổng thu</th>
                  <th className="py-2.5 px-4 font-medium text-right">Tổng chi</th>
                  <th className="py-2.5 px-4 font-medium text-right">Lợi nhuận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {monthlyReport.map((row) => (
                  <tr key={row.month} className="hover:bg-neutral-900/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-neutral-100">
                      Tháng {row.month}
                    </td>
                    <td className="py-3 px-4 text-right text-neutral-400 tabular-nums">
                      {row.count}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-400 tabular-nums">
                      {formatVND(row.thu)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-rose-400 tabular-nums">
                      {formatVND(row.chi)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-yellow-400 tabular-nums">
                      {formatVND(row.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}