import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockTransactions } from "../../data/mockTransactions";

// Lấy danh sách giao dịch
export async function GET() {
  try {
    // Nếu DB chưa có gì thì tự đổ data mẫu vào
    const count = await prisma.transaction.count();
    if (count === 0) {
      await prisma.transaction.createMany({
        data: mockTransactions.map((t) => ({
          title: t.title,
          amount: t.amount,
          type: t.type,
          category: t.category,
          date: t.date,
          note: t.note,
        })),
      });
    }

    // Lấy hết giao dịch từ DB, ngày mới nhất lên đầu
    const rows = await prisma.transaction.findMany({
      orderBy: [{ date: "desc" }, { id: "desc" }],
    });

    // Ép id sang string để client dễ xài
    const formatted = rows.map((r) => ({
      ...r,
      id: String(r.id),
      note: r.note ?? undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Lỗi lấy danh sách giao dịch:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách giao dịch" },
      { status: 500 }
    );
  }
}

// Thêm giao dịch mới (thu hoặc chi)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Lưu vào bảng Transaction trong DB
    const created = await prisma.transaction.create({
      data: {
        title: String(body.title),
        amount: Number(body.amount),
        type: body.type, // 'INCOME' hoặc 'EXPENSE'
        category: String(body.category),
        date: String(body.date),
        note: body.note ? String(body.note) : null,
      },
    });

    return NextResponse.json(
      {
        ...created,
        id: String(created.id),
        note: created.note ?? undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi thêm giao dịch:", error);
    return NextResponse.json(
      { error: "Không thể thêm giao dịch mới" },
      { status: 500 }
    );
  }
}
