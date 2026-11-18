import { PrismaClient } from "@prisma/client";

// Lưu kết nối vào global để lúc dev sửa code không bị tạo lại quá nhiều kết nối DB
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Đã có kết nối thì dùng lại, chưa có thì tạo mới
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
