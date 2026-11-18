import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cập nhật giao dịch theo id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Tìm và cập nhật đúng bản ghi có id tương ứng
    const updated = await prisma.transaction.update({
      where: { id: Number(id) },
      data: {
        title: String(body.title),
        amount: Number(body.amount),
        type: body.type,
        category: String(body.category),
        date: String(body.date),
        note: body.note ? String(body.note) : null,
      },
    });

    return NextResponse.json({
      ...updated,
      id: String(updated.id),
      note: updated.note ?? undefined,
    });
  } catch (error) {
    console.error("Lỗi cập nhật giao dịch:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật giao dịch này" },
      { status: 500 }
    );
  }
}

// Xóa giao dịch theo id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Xóa khỏi DB
    await prisma.transaction.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi xóa giao dịch:", error);
    return NextResponse.json(
      { error: "Không thể xóa giao dịch này" },
      { status: 500 }
    );
  }
}
