import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

// Khởi tạo Gemini bằng key trong .env
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Lấy câu hỏi client gửi lên
    const body = await request.json();
    const userMessage = body.message || body.messages?.[body.messages.length - 1]?.content;

    if (!userMessage) {
      return NextResponse.json({ error: "Thiếu nội dung tin nhắn" }, { status: 400 });
    }

    // Kéo hết giao dịch từ DB lên cho AI đọc
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
    });

    // Lấy ngày hiện tại để AI biết mốc "hôm nay", "tháng này" là lúc nào
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const todayStr = `${now.getDate()}/${currentMonth}/${currentYear}`;

    // Prompt: nhồi data DB vào và đặt luật trả lời
    const prompt = `
Bạn là Trợ lý AI Quản lý Tài chính cho hệ thống NDA HOME.
Mốc thời gian hiện tại của hệ thống: Ngày ${todayStr} (Tháng ${currentMonth} năm ${currentYear}).
Khi người dùng hỏi "tháng này", hãy hiểu đó là Tháng ${currentMonth} năm ${currentYear}.

Dưới đây là TOÀN BỘ dữ liệu giao dịch thực tế được lấy trực tiếp từ Database PostgreSQL:
${JSON.stringify(transactions, null, 2)}

QUY TẮC TRẢ LỜI CỐT LÕI:
1. TRẢ LỜI TRỰC DIỆN NGAY CÂU ĐẦU TIÊN: Không chào hỏi dài dòng văn mẫu, không dạo đầu. Trả lời thẳng vào bản chất câu hỏi của người dùng.
2. ĐÍNH CHÍNH NẾU GIẢ ĐỊNH SAI: Nếu người dùng hỏi điều không xảy ra trong dữ liệu (ví dụ: hỏi "tháng nào lỗ nhất" nhưng thực tế không có tháng nào lỗ), hãy khẳng định ngay ở câu đầu: "Hiện tại hệ thống không có tháng nào bị lỗ, tất cả các tháng đều đạt lợi nhuận dương." Sau đó chỉ ra tháng có lợi nhuận thấp nhất và giải thích ngắn gọn nguyên nhân.
3. NGẮN GỌN, SÚC TÍCH: Tuyệt đối không liệt kê lại toàn bộ số liệu của tất cả các tháng hay viết phép tính cộng trừ rườm rà. Tóm tắt nguyên nhân trong 2-3 gạch đầu dòng rõ ràng.
4. ĐỊNH DẠNG SỐ TIỀN: Luôn in đậm số tiền kèm đơn vị ₫ (ví dụ: **24.000.000 ₫**).
5. KHI YÊU CẦU XUẤT HOẶC XEM CHI TIẾT TỪNG GIAO DỊCH:
Liệt kê từng giao dịch theo dạng danh sách dễ đọc (vừa vặn khung chat nhỏ):
• [Ngày] - [Nội dung giao dịch] | 🟢 Thu: **[Số tiền]** (hoặc 🔴 Chi: **[Số tiền]**) | [Danh mục]
Kèm theo 1 dòng tổng kết: Tổng thu, Tổng chi và Số dư cuối cùng.
6. CÂU HỎI NGOÀI PHẠM VI: Lịch sự từ chối ngắn gọn nếu câu hỏi không liên quan đến tài chính hay dữ liệu của NDA HOME (ví dụ: thời tiết, nấu ăn, chuyện phiếm...).

Câu hỏi của người dùng: "${userMessage}"
`;

    // Gọi model flash-lite cho tốc độ phản hồi nhanh
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    const reply = response.text || "AI chưa có câu trả lời.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Lỗi chat AI:", error);
    return NextResponse.json(
      { error: "Không kết nối được tới AI" },
      { status: 500 }
    );
  }
}
