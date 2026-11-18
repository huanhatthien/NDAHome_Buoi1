"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, Trash2, Database, Loader2 } from "lucide-react";

// Cấu trúc 1 tin nhắn
interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
}

// Câu hỏi mẫu để bấm nhanh
const QUICK_QUESTIONS = [
  "📊 Báo cáo tổng quan thu chi",
  "💰 Tổng thu tháng này là bao nhiêu?",
  "💸 Khoản chi nào lớn nhất?",
  "📋 Danh sách 5 giao dịch gần đây",
];

export default function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "bot",
      text: "Xin chào! Tôi là **Trợ lý Tài chính NDA HOME** 🤖.\n\nTôi sẵn sàng hỗ trợ bạn theo dõi doanh thu, kiểm soát chi phí vận hành và phân tích dòng tiền của hệ thống. Bạn cần xem báo cáo hoặc tra cứu khoản mục nào hôm nay?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Có tin nhắn mới thì tự cuộn xuống đáy
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Gửi câu hỏi lên API /api/chat
  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    // Hiện tin nhắn người dùng lên khung chat trước
    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Chặn timeout 15s nếu mạng treo
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const data = await res.json();

      // Thêm câu trả lời của AI vào danh sách
      const botMessage: Message = {
        id: messages.length + 2,
        role: "bot",
        text:
          data.reply ||
          "Tôi là Trợ lý Tài chính NDA HOME. Rất tiếc tôi chưa có thông tin về nội dung này, bạn vui lòng hỏi về thu chi hoặc báo cáo tài chính của hệ thống nhé!",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: unknown) {
      clearTimeout(timer);
      console.error("Lỗi gửi tin nhắn:", error);
      
      const isTimeout = error instanceof Error && error.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          id: messages.length + 2,
          role: "bot",
          text: isTimeout
            ? "⏱️ Đã quá 15 giây mà máy chủ chưa phản hồi. Bạn hãy bấm gửi lại thử nhé!"
            : "⚠️ Hiện tại kết nối đến AI đang bận hoặc gián đoạn. Bạn vui lòng thử lại sau giây lát nhé!",
        },
      ]);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  // Reset lại đoạn chat
  const handleClear = () => {
    setLoading(false);
    setMessages([
      {
        id: 1,
        role: "bot",
        text: "Cuộc trò chuyện đã được làm mới. Bạn cần tra cứu hoặc phân tích khoản thu chi nào của hệ thống?",
      },
    ]);
  };

  // Hiển thị chữ in đậm và gạch đầu dòng
  const formatText = (text: string) => {
    return text.split("\n").map((line, lineIndex) => {
      if (!line.trim()) return <div key={lineIndex} className="h-1.5" />;

      const isBullet = line.startsWith("* ") || line.startsWith("- ") || line.startsWith("• ");
      const cleanLine = isBullet ? line.replace(/^[*•-]\s*/, "") : line;

      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-white font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <p key={lineIndex} className={`text-sm leading-relaxed ${isBullet ? "pl-3 relative" : "my-0.5"}`}>
          {isBullet && <span className="absolute left-0 text-emerald-400">•</span>}
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Nút tròn góc phải mở chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-neutral-900" />
          </div>
          <span className="text-sm font-medium">Trợ lý NDA Home</span>
          <Sparkles className="w-4 h-4 text-amber-300" />
        </button>
      )}

      {/* Khung chatbox */}
      {isOpen && (
        <div className="flex flex-col w-[92vw] sm:w-[420px] h-[540px] max-h-[85vh] bg-[#121217] rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header thanh tiêu đề */}
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-neutral-100">AI Trợ Lý Tài Chính</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Database className="w-2.5 h-2.5" />
                    PostgreSQL
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">Powered by Google Gemini 3.1 Flash</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Xóa đoạn chat"
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vùng hiển thị tin nhắn */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0e0e12]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : "bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-bl-xs"
                  }`}
                >
                  {formatText(m.text)}
                </div>
              </div>
            ))}

            {/* Icon xoay xoay lúc chờ AI */}
            {loading && (
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-2xl rounded-bl-xs text-xs text-neutral-400 w-fit">
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>AI đang đọc database và suy nghĩ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Hàng câu hỏi gợi ý nhanh */}
          <div className="px-3 py-2 bg-neutral-900/60 border-t border-neutral-800 flex gap-1.5 overflow-x-auto">
            {QUICK_QUESTIONS.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSend(question)}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60 whitespace-nowrap transition-colors disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>

          {/* Ô gõ tin nhắn + nút gửi */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi tài chính..."
              disabled={loading}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
