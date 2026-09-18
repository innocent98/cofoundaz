export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amountMinor: number;
  currency: string;
  direction: 'in' | 'out';
  source: 'manual' | 'bank' | 'accounting';
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPriceMinor: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  totalMinor: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issuedOn: string;
  dueOn: string;
  autoRemind: boolean;
}

export interface Expense {
  id: string;
  vendor: string;
  category: string;
  date: string;
  amountMinor: number;
  currency: string;
  recurring: boolean;
  receiptAttached: boolean;
}

export interface Integration {
  id: string;
  name: string;
  status: "Connected" | "Not connected";
  description: string;
  initials: string;
}

export interface TableRowItem {
  item: string;
  m1: string;
  m2: string;
  m3: string;
  m4: string;
  m5: string;
  m6: string;
}

export const formatCurrency = (minorAmount: number, currency: string = "₦"): string => {
  const major = minorAmount / 100;
  return `${currency}${major.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

import { useState } from "react";

export function useFinanceApi() {
  const [runwayMonths] = useState<number>(5.2);
  const [monthlyBurnMinor] = useState<number>(335000000); // 3,350,000 * 100
  const [cashOnHandMinor] = useState<number>(2104200000); // 21,042,000 * 100
  const [monthlyRevenueMinor] = useState<number>(160000000); // 1,600,000 * 100

  const [transactions] = useState<Transaction[]>([
    { id: "1", date: "2026-03-10", description: "Stripe Payout", category: "Revenue", amountMinor: 45000000, currency: "₦", direction: "in", source: "stripe" as 'bank' },
    { id: "2", date: "2026-03-09", description: "AWS Cloud", category: "Infrastructure", amountMinor: 12050000, currency: "₦", direction: "out", source: "bank" },
    { id: "3", date: "2026-03-08", description: "Google Workspace", category: "", amountMinor: 4500000, currency: "₦", direction: "out", source: "bank" },
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: "1", number: "INV-2026-001", clientName: "Enterprise Partner 1", totalMinor: 60000000, status: 'paid', issuedOn: "2026-02-10", dueOn: "2026-03-10", autoRemind: false },
    { id: "2", number: "INV-2026-002", clientName: "Enterprise Partner 2", totalMinor: 120000000, status: 'sent', issuedOn: "2026-02-15", dueOn: "2026-03-15", autoRemind: true },
    { id: "3", number: "INV-2026-003", clientName: "Enterprise Partner 3", totalMinor: 180000000, status: 'overdue', issuedOn: "2026-01-20", dueOn: "2026-02-20", autoRemind: true },
  ]);

  const [expenses] = useState<Expense[]>([
    { id: "1", vendor: "AWS Cloud Services", category: "Infrastructure & SaaS", date: "Feb 15, 2026", amountMinor: 12050000, currency: "₦", recurring: true, receiptAttached: true },
    { id: "2", vendor: "Google Workspace", category: "Infrastructure & SaaS", date: "Feb 16, 2026", amountMinor: 24100000, currency: "₦", recurring: true, receiptAttached: false },
    { id: "3", vendor: "Office Lease", category: "Infrastructure & SaaS", date: "Feb 17, 2026", amountMinor: 36150000, currency: "₦", recurring: true, receiptAttached: true },
    { id: "4", vendor: "Notion Team", category: "Infrastructure & SaaS", date: "Feb 18, 2026", amountMinor: 48200000, currency: "₦", recurring: true, receiptAttached: false },
  ]);

  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: "quickbooks", name: "QuickBooks", status: "Not connected", description: "Not connected", initials: "QB" },
    { id: "xero", name: "Xero", status: "Not connected", description: "Not connected", initials: "X" },
    { id: "bank", name: "Bank connection", status: "Connected", description: "Connected as GTBank · synced 2h ago", initials: "🏦" },
    { id: "stripe", name: "Stripe", status: "Connected", description: "Connected as Kolo Ltd · synced 2h ago", initials: "S" },
  ]);

  const pnlData: TableRowItem[] = [
    { item: "Revenue", m1: "1,600", m2: "1,790", m3: "2,010", m4: "2,250", m5: "2,520", m6: "2,820" },
    { item: "COGS", m1: "320", m2: "358", m3: "402", m4: "450", m5: "504", m6: "564" },
    { item: "Gross profit", m1: "1,280", m2: "1,432", m3: "1,608", m4: "1,800", m5: "2,016", m6: "2,256" },
    { item: "Opex", m1: "4,900", m2: "4,950", m3: "5,010", m4: "5,080", m5: "5,160", m6: "5,250" },
    { item: "Net", m1: "-3,620", m2: "-3,518", m3: "-3,402", m4: "-3,280", m5: "-3,144", m6: "-2,994" },
  ];

  const cashFlowModelData: TableRowItem[] = [
    { item: "Opening", m1: "41,000", m2: "37,380", m3: "33,862", m4: "30,460", m5: "27,180", m6: "24,036" },
    { item: "Net burn", m1: "-3,620", m2: "-3,518", m3: "-3,402", m4: "-3,280", m5: "-3,144", m6: "-2,994" },
    { item: "Closing", m1: "37,380", m2: "33,862", m3: "30,460", m4: "27,180", m5: "24,036", m6: "21,042" },
  ];

  const balanceSheetData: TableRowItem[] = [
    { item: "Cash", m1: "37,380", m2: "33,862", m3: "30,460", m4: "27,180", m5: "24,036", m6: "21,042" },
    { item: "Receivables", m1: "1,200", m2: "1,340", m3: "1,510", m4: "1,690", m5: "1,890", m6: "2,110" },
    { item: "Total assets", m1: "38,580", m2: "35,202", m3: "31,970", m4: "28,870", m5: "25,926", m6: "23,152" },
  ];

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        const isConnected = item.status === "Connected";
        return {
          ...item,
          status: isConnected ? "Not connected" : "Connected",
          description: isConnected ? "Not connected" : `Connected as ${item.name} · synced just now`
        };
      }
      return item;
    }));
  };

  const markInvoicePaid = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv));
  };

  const toggleInvoiceAutoRemind = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, autoRemind: !inv.autoRemind } : inv));
  };

  return {
    runwayMonths,
    monthlyBurnMinor,
    cashOnHandMinor,
    monthlyRevenueMinor,
    transactions,
    invoices,
    expenses,
    integrations,
    pnlData,
    cashFlowModelData,
    balanceSheetData,
    toggleIntegration,
    markInvoicePaid,
    toggleInvoiceAutoRemind
  };
}
