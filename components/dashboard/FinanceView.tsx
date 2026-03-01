"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    IndianRupee, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
    Plus, Trash2, Loader2, Calendar, Search, Filter, Download,
    ShoppingBag, Home, Zap, Users as UsersIcon, Truck, Scissors, CreditCard,
    X, ChevronDown, ChevronUp, Building2, Receipt
} from "lucide-react";
import { Order } from '@/lib/types';
import * as XLSX from 'xlsx';

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    notes?: string;
}

interface FinanceViewProps {
    orders: Order[];
}

const EXPENSE_CATEGORIES = [
    { id: 'rent', label: 'Rent', icon: Home, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' },
    { id: 'materials', label: 'Materials / Cloth', icon: Scissors, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' },
    { id: 'salary', label: 'Salary / Wages', icon: UsersIcon, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
    { id: 'utilities', label: 'Utilities (Electricity, Water)', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-100' },
    { id: 'transport', label: 'Transport / Delivery', icon: Truck, color: 'text-teal-500', bg: 'bg-teal-50 border-teal-100' },
    { id: 'equipment', label: 'Equipment / Machinery', icon: Building2, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
    { id: 'shop', label: 'Shop Supplies', icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-100' },
    { id: 'tax', label: 'Tax / GST', icon: Receipt, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
    { id: 'other', label: 'Other', icon: CreditCard, color: 'text-stone-500', bg: 'bg-stone-50 border-stone-200' },
];

type DateFilter = 'today' | 'week' | 'month' | '3months' | 'year' | 'all';
type TxnTypeFilter = 'all' | 'credit' | 'debit';

export default function FinanceView({ orders }: FinanceViewProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [txnTypeFilter, setTxnTypeFilter] = useState<TxnTypeFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

    // Expense form
    const [expenseForm, setExpenseForm] = useState({
        amount: '',
        category: 'materials',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Fetch expenses
    const fetchExpenses = useCallback(async () => {
        try {
            const res = await fetch('/api/expenses');
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

    const getCategoryLabel = (catId: string) => EXPENSE_CATEGORIES.find(c => c.id === catId)?.label || catId;

    // Build unified ledger from orders (credits) + expenses (debits)
    const allTransactions = useMemo(() => {
        const txns: Array<{
            id: string;
            date: string;
            type: 'credit' | 'debit';
            description: string;
            category: string;
            amount: number;
            reference?: string;
            source: 'order' | 'expense';
        }> = [];

        // Credits from orders — advance payments
        orders.forEach(o => {
            if (o.advancePaid && o.advancePaid > 0) {
                txns.push({
                    id: `adv-${o.id}`,
                    date: o.orderDate || o.deliveryDate,
                    type: 'credit',
                    description: `Advance — ${o.customerName} (${o.clothType})`,
                    category: 'Order Advance',
                    amount: o.advancePaid,
                    reference: o.id,
                    source: 'order',
                });
            }
            // Credits from subsequent payments
            (o.payments || []).forEach((p, idx) => {
                txns.push({
                    id: `pay-${o.id}-${idx}`,
                    date: p.date,
                    type: 'credit',
                    description: `Payment — ${o.customerName} (${o.clothType}) via ${p.method}`,
                    category: `Order Payment (${p.method})`,
                    amount: p.amount,
                    reference: o.id,
                    source: 'order',
                });
            });
        });

        // Debits from expenses
        expenses.forEach(e => {
            txns.push({
                id: e.id,
                date: e.date,
                type: 'debit',
                description: e.description,
                category: EXPENSE_CATEGORIES.find(c => c.id === e.category)?.label || e.category,
                amount: e.amount,
                source: 'expense',
            });
        });

        // Sort by date descending
        txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return txns;
    }, [orders, expenses]);

    // Filtered transactions
    const filteredTransactions = useMemo(() => {
        let txns = allTransactions;

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date(); now.setHours(23, 59, 59, 999);
            const start = new Date();
            if (dateFilter === 'today') start.setHours(0, 0, 0, 0);
            else if (dateFilter === 'week') start.setDate(start.getDate() - 7);
            else if (dateFilter === 'month') start.setMonth(start.getMonth() - 1);
            else if (dateFilter === '3months') start.setMonth(start.getMonth() - 3);
            else if (dateFilter === 'year') start.setFullYear(start.getFullYear() - 1);
            start.setHours(0, 0, 0, 0);
            txns = txns.filter(t => {
                const d = new Date(t.date);
                return d >= start && d <= now;
            });
        }

        // Type filter
        if (txnTypeFilter !== 'all') {
            txns = txns.filter(t => t.type === txnTypeFilter);
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            txns = txns.filter(t =>
                t.description.toLowerCase().includes(q) ||
                t.category.toLowerCase().includes(q)
            );
        }

        return txns;
    }, [allTransactions, dateFilter, txnTypeFilter, searchQuery]);

    // Summary stats
    const stats = useMemo(() => {
        const totalCredits = filteredTransactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
        const totalDebits = filteredTransactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
        const netBalance = totalCredits - totalDebits;
        const creditCount = filteredTransactions.filter(t => t.type === 'credit').length;
        const debitCount = filteredTransactions.filter(t => t.type === 'debit').length;
        return { totalCredits, totalDebits, netBalance, creditCount, debitCount };
    }, [filteredTransactions]);

    // Group by month
    const groupedByMonth = useMemo(() => {
        const groups: Record<string, typeof filteredTransactions> = {};
        filteredTransactions.forEach(t => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
        return groups;
    }, [filteredTransactions]);

    // Running balance
    const runningBalances = useMemo(() => {
        // Compute from oldest to newest
        const sorted = [...allTransactions].reverse();
        let balance = 0;
        const balanceMap: Record<string, number> = {};
        sorted.forEach(t => {
            balance += t.type === 'credit' ? t.amount : -t.amount;
            balanceMap[t.id] = balance;
        });
        return balanceMap;
    }, [allTransactions]);

    // Category-wise expense breakdown for filtered view
    const categoryBreakdown = useMemo(() => {
        const map: Record<string, number> = {};
        filteredTransactions.filter(t => t.type === 'debit').forEach(t => {
            map[t.category] = (map[t.category] || 0) + t.amount;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [filteredTransactions]);

    // Add expense
    const handleAddExpense = async () => {
        if (!expenseForm.amount) return;
        setIsSaving(true);
        try {
            const desc = expenseForm.notes?.trim()
                ? `${getCategoryLabel(expenseForm.category)} — ${expenseForm.notes.trim()}`
                : getCategoryLabel(expenseForm.category);
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...expenseForm, description: desc }),
            });
            if (res.ok) {
                const data = await res.json();
                setExpenses(prev => [data, ...prev]);
                setExpenseForm({ amount: '', category: 'materials', date: new Date().toISOString().split('T')[0], notes: '' });
                setIsAddModalOpen(false);
            }
        } catch (err) {
            console.error('Failed to add expense:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Delete expense
    const handleDeleteExpense = async (id: string) => {
        try {
            const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setExpenses(prev => prev.filter(e => e.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete expense:', err);
        }
    };

    // Export ledger to Excel
    const exportLedger = () => {
        const wb = XLSX.utils.book_new();
        const ledgerData = filteredTransactions.map(t => ({
            'Date': new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            'Description': t.description,
            'Category': t.category,
            'Type': t.type === 'credit' ? 'CREDIT' : 'DEBIT',
            'Credit (₹)': t.type === 'credit' ? t.amount : '',
            'Debit (₹)': t.type === 'debit' ? t.amount : '',
            'Balance (₹)': runningBalances[t.id] || 0,
        }));

        const ws = XLSX.utils.json_to_sheet(ledgerData);
        ws['!cols'] = [
            { wch: 16 }, { wch: 45 }, { wch: 25 }, { wch: 10 },
            { wch: 14 }, { wch: 14 }, { wch: 14 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Ledger');

        // Category summary
        const catData = categoryBreakdown.map(([cat, amt]) => ({
            'Category': cat,
            'Total Spent (₹)': amt,
        }));
        if (catData.length > 0) {
            const wsCat = XLSX.utils.json_to_sheet(catData);
            wsCat['!cols'] = [{ wch: 30 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, wsCat, 'Expense Categories');
        }

        const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
        XLSX.writeFile(wb, `Dadashri-Finance-${today}.xlsx`);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getMonthLabel = (key: string) => {
        const [y, m] = key.split('-');
        const d = new Date(Number(y), Number(m) - 1);
        return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Finance & Accounts</h2>
                    <p className="text-sm font-medium text-gray-500">Bank-style ledger — all income & expenses in one place</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportLedger}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all bg-stone-100 hover:bg-stone-200 text-gray-600 border border-stone-200"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/10"
                    >
                        <Plus className="w-4 h-4" />
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Income */}
                <Card className="border-emerald-100 overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Income</p>
                            <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                                <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-gray-900">₹{stats.totalCredits.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-emerald-500 mt-0.5">{stats.creditCount} transactions</p>
                    </CardContent>
                </Card>

                {/* Total Expenses */}
                <Card className="border-red-100 overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Expenses</p>
                            <div className="p-1.5 rounded-lg bg-red-50 border border-red-100">
                                <ArrowUpRight className="w-4 h-4 text-red-500" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-gray-900">₹{stats.totalDebits.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-red-500 mt-0.5">{stats.debitCount} transactions</p>
                    </CardContent>
                </Card>

                {/* Net Balance */}
                <Card className={`overflow-hidden group hover:shadow-md transition-shadow ${stats.netBalance >= 0 ? 'border-blue-100' : 'border-amber-100'}`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${stats.netBalance >= 0 ? 'bg-blue-400' : 'bg-amber-400'}`}></div>
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Balance</p>
                            <div className={`p-1.5 rounded-lg ${stats.netBalance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'} border`}>
                                <Wallet className={`w-4 h-4 ${stats.netBalance >= 0 ? 'text-blue-500' : 'text-amber-500'}`} />
                            </div>
                        </div>
                        <p className={`text-2xl font-black ${stats.netBalance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                            {stats.netBalance < 0 ? '−' : ''}₹{Math.abs(stats.netBalance).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{stats.netBalance >= 0 ? 'Profit' : 'Loss'} for period</p>
                    </CardContent>
                </Card>
            </div>

            {/* Category Breakdown Bar */}
            {categoryBreakdown.length > 0 && (
                <Card className="border-stone-100 shadow-sm overflow-hidden">
                    <CardHeader className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
                        <CardTitle className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Expense Breakdown by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {categoryBreakdown.map(([cat, amt]) => {
                                const catInfo = EXPENSE_CATEGORIES.find(c => c.label === cat);
                                const Icon = catInfo?.icon || CreditCard;
                                const pct = stats.totalDebits > 0 ? Math.round((amt / stats.totalDebits) * 100) : 0;
                                return (
                                    <div key={cat} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${catInfo?.bg || 'bg-stone-50 border-stone-200'}`}>
                                        <Icon className={`w-3.5 h-3.5 ${catInfo?.color || 'text-stone-500'}`} />
                                        <div>
                                            <p className="text-[9px] font-black text-gray-600 uppercase">{cat}</p>
                                            <p className="text-xs font-black text-gray-900">₹{amt.toLocaleString()} <span className="text-[9px] font-bold text-gray-400">({pct}%)</span></p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-2 shrink-0">Period</span>
                {([
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'Week' },
                    { id: 'month', label: 'Month' },
                    { id: '3months', label: '3M' },
                    { id: 'year', label: 'Year' },
                    { id: 'all', label: 'All' },
                ] as { id: DateFilter; label: string }[]).map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setDateFilter(opt.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${dateFilter === opt.id
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-stone-50 text-gray-500 hover:bg-stone-100 border border-stone-200'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}

                <div className="w-px h-6 bg-stone-200 mx-1 shrink-0 hidden sm:block"></div>

                {/* Type filter */}
                {([
                    { id: 'all', label: 'All', icon: null },
                    { id: 'credit', label: 'Credits', icon: ArrowDownRight },
                    { id: 'debit', label: 'Debits', icon: ArrowUpRight },
                ] as { id: TxnTypeFilter; label: string; icon: any }[]).map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setTxnTypeFilter(opt.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${txnTypeFilter === opt.id
                            ? opt.id === 'credit' ? 'bg-emerald-500 text-white shadow-md' : opt.id === 'debit' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-900 text-white shadow-md'
                            : 'bg-stone-50 text-gray-500 hover:bg-stone-100 border border-stone-200'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}

                {/* Search */}
                <div className="relative ml-auto shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search ledger..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 text-[11px] font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all w-40"
                    />
                </div>
            </div>

            {/* Ledger — Grouped by Month */}
            <div className="space-y-4">
                {Object.keys(groupedByMonth).length === 0 && (
                    <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-dashed border-stone-200">
                        <Wallet className="w-10 h-10 text-stone-200 mb-3" />
                        <p className="text-sm font-bold text-gray-400">No transactions found</p>
                        <p className="text-xs text-gray-300 mt-1">Add expenses to start tracking your finances</p>
                    </div>
                )}

                {Object.entries(groupedByMonth).map(([monthKey, transactions]) => {
                    const monthCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
                    const monthDebits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
                    const isExpanded = expandedMonth === null || expandedMonth === monthKey;

                    return (
                        <Card key={monthKey} className="border-stone-100 shadow-sm overflow-hidden">
                            {/* Month header */}
                            <button
                                onClick={() => setExpandedMonth(expandedMonth === monthKey ? null : monthKey)}
                                className="w-full px-5 py-3 bg-stone-50/80 border-b border-stone-100 flex items-center justify-between hover:bg-stone-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-orange-400" />
                                    <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{getMonthLabel(monthKey)}</span>
                                    <Badge variant="outline" className="text-[9px] font-bold text-gray-400 border-stone-200">{transactions.length} txns</Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-emerald-500">+₹{monthCredits.toLocaleString()}</span>
                                    <span className="text-[10px] font-black text-red-500">−₹{monthDebits.toLocaleString()}</span>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                            </button>

                            {/* Transactions */}
                            {isExpanded && (
                                <div className="divide-y divide-stone-50">
                                    {transactions.map(txn => {
                                        const catInfo = EXPENSE_CATEGORIES.find(c => c.label === txn.category);
                                        const Icon = txn.type === 'credit' ? ArrowDownRight : (catInfo?.icon || ArrowUpRight);

                                        return (
                                            <div key={txn.id} className="px-5 py-3 flex items-center gap-4 hover:bg-stone-50/30 transition-colors group">
                                                {/* Icon */}
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${txn.type === 'credit'
                                                    ? 'bg-emerald-50 border-emerald-100'
                                                    : catInfo?.bg || 'bg-red-50 border-red-100'
                                                    }`}>
                                                    <Icon className={`w-4 h-4 ${txn.type === 'credit' ? 'text-emerald-500' : catInfo?.color || 'text-red-500'}`} />
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 truncate">{txn.description}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-bold text-gray-400">{formatDate(txn.date)}</span>
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${txn.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                            {txn.category}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className="text-right shrink-0">
                                                    <p className={`text-sm font-black ${txn.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {txn.type === 'credit' ? '+' : '−'}₹{txn.amount.toLocaleString()}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-gray-300">Bal: ₹{(runningBalances[txn.id] || 0).toLocaleString()}</p>
                                                </div>

                                                {/* Delete (only for expenses) */}
                                                {txn.source === 'expense' && (
                                                    <button
                                                        onClick={() => handleDeleteExpense(txn.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all shrink-0"
                                                        title="Delete expense"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Add Expense Dialog */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-md bg-white border border-stone-200 shadow-xl rounded-lg p-0 overflow-hidden">
                    <DialogHeader className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                        <DialogTitle className="text-sm font-black text-gray-900 uppercase tracking-wider">
                            Record Expense
                        </DialogTitle>
                    </DialogHeader>
                    <div className="px-5 py-4 space-y-4">

                        {/* Amount + Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={expenseForm.amount}
                                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-orange-400 transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Date</label>
                                <input
                                    type="date"
                                    value={expenseForm.date}
                                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-orange-400 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Category</label>
                            <div className="grid grid-cols-3 gap-2">
                                {EXPENSE_CATEGORIES.map(cat => {
                                    const Icon = cat.icon;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setExpenseForm({ ...expenseForm, category: cat.id })}
                                            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border-2 text-[9px] font-bold uppercase tracking-wider transition-all ${expenseForm.category === cat.id
                                                ? 'bg-gray-900 text-white border-gray-900'
                                                : 'bg-stone-50 text-gray-500 border-stone-200 hover:border-stone-300'
                                                }`}
                                        >
                                            <Icon className="w-3 h-3" />
                                            {cat.label.split(' ')[0]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Notes (Optional)</label>
                            <textarea
                                placeholder="Additional details..."
                                value={expenseForm.notes}
                                onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                                className="w-full px-3 py-2 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-orange-400 transition-colors min-h-[50px] resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddModalOpen(false)}
                                className="py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-stone-200 hover:bg-stone-50 transition-colors"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddExpense}
                                disabled={isSaving || !expenseForm.amount}
                                className="py-2.5 text-[10px] font-black text-white bg-gray-900 uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Saving...</>
                                ) : (
                                    'Add Expense'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
