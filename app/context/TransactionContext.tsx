"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Transaction } from "../types/transaction";

interface TransactionContextValue {
  transactions: Transaction[];
  addTransaction: (item: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (item: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTransactions(data);
      })
      .catch((err) => console.error("Lỗi tải dữ liệu:", err));
  }, []);

  const addTransaction = async (item: Omit<Transaction, "id">) => {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const created: Transaction = await res.json();
      setTransactions((prev) => [created, ...prev]);
    }
  };

  const updateTransaction = async (updated: Transaction) => {
    const res = await fetch(`/api/transactions/${updated.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const saved: Transaction = await res.json();
      setTransactions((prev) =>
        prev.map((t) => (t.id === saved.id ? saved : t))
      );
    }
  };

  const deleteTransaction = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <TransactionContext.Provider
      value={{ transactions, addTransaction, updateTransaction, deleteTransaction }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used inside TransactionProvider");
  return ctx;
}