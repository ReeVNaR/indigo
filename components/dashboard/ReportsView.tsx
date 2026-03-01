"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    IndianRupee, TrendingUp, TrendingDown, Package, Users, Truck,
    CreditCard, Scissors, Calendar, AlertTriangle, CheckCircle2,
    Clock, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Download, Loader2
} from "lucide-react";
import * as XLSX from 'xlsx';
import { Order, Customer } from '@/lib/types';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

type DateRange = 'today' | 'week' | 'month' | '3months' | 'all';

interface ReportsViewProps {
    orders: Order[];
    customers: Customer[];
}

const COLORS = ['#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
const STATUS_COLORS: Record<string, string> = {
    'Received': '#94a3b8', 'Processing': '#f59e0b', 'Cutting': '#f97316',
    'Fitting': '#78716c', 'Ready': '#22c55e', 'Completed': '#3b82f6'
};
const PAYMENT_COLORS = { Unpaid: '#ef4444', Partial: '#f59e0b', Paid: '#22c55e' };

export default function ReportsView({ orders, customers }: ReportsViewProps) {
    const [dateRange, setDateRange] = useState<DateRange>('all');
    const [isExporting, setIsExporting] = useState(false);

    // --- Date filtering ---
    const filteredOrders = useMemo(() => {
        if (dateRange === 'all') return orders;
        const now = new Date(); now.setHours(23, 59, 59, 999);
        const start = new Date();
        if (dateRange === 'today') start.setHours(0, 0, 0, 0);
        else if (dateRange === 'week') start.setDate(start.getDate() - 7);
        else if (dateRange === 'month') start.setMonth(start.getMonth() - 1);
        else if (dateRange === '3months') start.setMonth(start.getMonth() - 3);
        start.setHours(0, 0, 0, 0);
        return orders.filter(o => {
            const d = new Date(o.orderDate || o.deliveryDate);
            return d >= start && d <= now;
        });
    }, [orders, dateRange]);

    // ========== 1. REVENUE ==========
    const revenue = useMemo(() => {
        const totalBilled = filteredOrders.reduce((s, o) => s + o.amount, 0);
        const totalCollected = filteredOrders.reduce((s, o) => {
            return s + (o.advancePaid || 0) + (o.payments || []).reduce((ps, p) => ps + p.amount, 0);
        }, 0);
        const outstanding = totalBilled - totalCollected;
        const avgOrder = filteredOrders.length ? totalBilled / filteredOrders.length : 0;

        // Daily earnings for chart (last 14 days)
        const dailyMap: Record<string, number> = {};
        for (let i = 13; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            dailyMap[d.toISOString().split('T')[0]] = 0;
        }
        orders.forEach(o => {
            const orderDay = o.orderDate?.split('T')[0];
            if (orderDay && dailyMap[orderDay] !== undefined) {
                dailyMap[orderDay] += (o.advancePaid || 0);
            }
            (o.payments || []).forEach(p => {
                const pDay = p.date.split('T')[0];
                if (dailyMap[pDay] !== undefined) dailyMap[pDay] += p.amount;
            });
        });
        const chartData = Object.entries(dailyMap).map(([date, amount]) => ({
            date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            amount
        }));
        return { totalBilled, totalCollected, outstanding, avgOrder, chartData };
    }, [filteredOrders, orders]);

    // ========== 2. ORDER ANALYTICS ==========
    const orderStats = useMemo(() => {
        const byStatus: Record<string, number> = {};
        filteredOrders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
        const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

        const completed = filteredOrders.filter(o => o.status === 'Completed').length;
        const completionRate = filteredOrders.length ? Math.round((completed / filteredOrders.length) * 100) : 0;

        const now = new Date(); now.setHours(0, 0, 0, 0);
        const overdue = filteredOrders.filter(o => new Date(o.deliveryDate) < now && o.status !== 'Completed').length;
        const urgent = filteredOrders.filter(o => o.isUrgent && o.status !== 'Completed').length;

        // Avg turnaround
        const completedOrders = filteredOrders.filter(o => o.status === 'Completed' && o.orderDate);
        let avgTurnaround = 0;
        if (completedOrders.length) {
            const totalDays = completedOrders.reduce((s, o) => {
                const diff = (new Date(o.deliveryDate).getTime() - new Date(o.orderDate!).getTime()) / (1000 * 60 * 60 * 24);
                return s + Math.max(0, diff);
            }, 0);
            avgTurnaround = Math.round(totalDays / completedOrders.length);
        }

        // Orders per day of week
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const byDay = new Array(7).fill(0);
        filteredOrders.forEach(o => {
            const d = new Date(o.orderDate || o.deliveryDate);
            byDay[d.getDay()]++;
        });
        const busiestDay = dayNames[byDay.indexOf(Math.max(...byDay))];

        return { statusData, completed, completionRate, overdue, urgent, avgTurnaround, busiestDay, total: filteredOrders.length };
    }, [filteredOrders]);

    // ========== 3. CUSTOMER INSIGHTS ==========
    const customerStats = useMemo(() => {
        // Compute real spend & order count from orders data (DB fields may be stale/zero)
        const enriched = customers.map(c => {
            const custOrders = orders.filter(o => o.customerName === c.name);
            const realSpent = custOrders.reduce((s, o) => s + o.amount, 0);
            const realCount = custOrders.length;
            return { ...c, totalSpent: realSpent || c.totalSpent, ordersCount: realCount || c.ordersCount };
        });

        const topBySpend = [...enriched].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
        const topByOrders = [...enriched].sort((a, b) => b.ordersCount - a.ordersCount).slice(0, 5);
        const repeatRate = enriched.length ? Math.round((enriched.filter(c => c.ordersCount > 1).length / enriched.length) * 100) : 0;
        const totalSpentAll = enriched.reduce((s, c) => s + c.totalSpent, 0);
        const avgLTV = enriched.length ? Math.round(totalSpentAll / enriched.length) : 0;

        // Customers with dues
        const withDues = enriched.map(c => {
            const custOrders = filteredOrders.filter(o => o.customerName === c.name);
            const billed = custOrders.reduce((s, o) => s + o.amount, 0);
            const paid = custOrders.reduce((s, o) => s + (o.advancePaid || 0) + (o.payments || []).reduce((ps, p) => ps + p.amount, 0), 0);
            return { ...c, due: billed - paid };
        }).filter(c => c.due > 0).sort((a, b) => b.due - a.due).slice(0, 5);

        return { topBySpend, topByOrders, repeatRate, avgLTV, withDues, total: customers.length };
    }, [customers, orders, filteredOrders]);

    // ========== 4. GARMENT BREAKDOWN ==========
    const garmentStats = useMemo(() => {
        const map: Record<string, { count: number; revenue: number }> = {};
        filteredOrders.forEach(o => {
            const types = o.clothType.split(',').map(s => s.trim());
            types.forEach(t => {
                if (!map[t]) map[t] = { count: 0, revenue: 0 };
                map[t].count++;
                map[t].revenue += o.amount / types.length;
            });
        });
        const data = Object.entries(map).map(([name, v]) => ({
            name, count: v.count, revenue: Math.round(v.revenue), avg: v.count ? Math.round(v.revenue / v.count) : 0
        })).sort((a, b) => b.count - a.count);
        return data;
    }, [filteredOrders]);

    // ========== 5. PAYMENT STATUS ==========
    const paymentStats = useMemo(() => {
        let unpaid = 0, partial = 0, paid = 0;
        const methodMap: Record<string, number> = { Cash: 0, Online: 0, Card: 0 };
        filteredOrders.forEach(o => {
            const totalPaid = (o.advancePaid || 0) + (o.payments || []).reduce((s, p) => s + p.amount, 0);
            if (totalPaid <= 0) unpaid++;
            else if (totalPaid >= o.amount) paid++;
            else partial++;
            (o.payments || []).forEach(p => { methodMap[p.method] = (methodMap[p.method] || 0) + p.amount; });
        });
        const collectionRate = filteredOrders.length ? Math.round(((paid + partial) / filteredOrders.length) * 100) : 0;
        const statusData = [
            { name: 'Unpaid', value: unpaid },
            { name: 'Partial', value: partial },
            { name: 'Paid', value: paid },
        ].filter(d => d.value > 0);
        const methodData = Object.entries(methodMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
        return { unpaid, partial, paid, collectionRate, statusData, methodData };
    }, [filteredOrders]);

    // ========== 6. CLOTH SOURCE ==========
    const clothSourceStats = useMemo(() => {
        let customerCloth = 0, shopCloth = 0, customerRev = 0, shopRev = 0;
        filteredOrders.forEach(o => {
            if (o.clothSource === 'Customer') { customerCloth++; customerRev += o.amount; }
            else { shopCloth++; shopRev += o.amount; }
        });
        return { customerCloth, shopCloth, customerRev, shopRev };
    }, [filteredOrders]);

    // ========== 7. DELIVERY PERFORMANCE ==========
    const deliveryStats = useMemo(() => {
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const todayStr = now.toISOString().split('T')[0];
        const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);

        const completed = filteredOrders.filter(o => o.status === 'Completed');
        const onTime = completed.filter(o => {
            const delivery = new Date(o.deliveryDate); delivery.setHours(0, 0, 0, 0);
            const order = new Date(o.orderDate || o.deliveryDate);
            return delivery >= order;
        }).length;
        const onTimeRate = completed.length ? Math.round((onTime / completed.length) * 100) : 100;

        const overdue = filteredOrders.filter(o => {
            const d = new Date(o.deliveryDate); d.setHours(0, 0, 0, 0);
            return d < now && o.status !== 'Completed';
        });
        const avgDelay = overdue.length ? Math.round(overdue.reduce((s, o) => {
            return s + (now.getTime() - new Date(o.deliveryDate).getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / overdue.length) : 0;

        const dueToday = orders.filter(o => o.deliveryDate?.split('T')[0] === todayStr && o.status !== 'Completed').length;
        const dueThisWeek = orders.filter(o => {
            const d = new Date(o.deliveryDate); d.setHours(0, 0, 0, 0);
            return d >= now && d <= nextWeek && o.status !== 'Completed';
        }).length;

        return { onTimeRate, overdueCount: overdue.length, avgDelay, dueToday, dueThisWeek };
    }, [filteredOrders, orders]);

    // ========== CUSTOM TOOLTIP ==========
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white border border-stone-200 rounded-lg shadow-lg px-3 py-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                <p className="text-sm font-black text-gray-900">₹{payload[0].value.toLocaleString()}</p>
            </div>
        );
    };

    // ========== RENDER HELPERS ==========
    const StatCard = ({ label, value, sub, icon: Icon, color = 'bg-stone-50 border-stone-200', iconColor = 'text-orange-500' }: any) => (
        <div className={`${color} border rounded-xl p-4 sm:p-5 transition-all hover:shadow-md group`}>
            <div className="flex items-start justify-between mb-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <div className="p-1.5 rounded-lg bg-white/80 border border-stone-100 group-hover:scale-110 transition-transform">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-gray-900 mb-0.5">{value}</p>
            {sub && <p className="text-[10px] font-bold text-gray-400">{sub}</p>}
        </div>
    );

    const SectionHeader = ({ icon: Icon, title, subtitle }: any) => (
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-100">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                <Icon className="w-4 h-4 text-orange-500" />
            </div>
            <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{title}</h3>
                {subtitle && <p className="text-[10px] font-medium text-gray-400">{subtitle}</p>}
            </div>
        </div>
    );

    // ========== EXCEL EXPORT ==========
    const exportToExcel = () => {
        setIsExporting(true);
        try {
            const wb = XLSX.utils.book_new();
            const dateLabel = dateRange === 'all' ? 'All Time' : dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : dateRange === 'month' ? 'This Month' : '3 Months';

            // --- Sheet 1: Orders Summary ---
            const ordersData = filteredOrders.map(o => {
                const totalPaid = (o.advancePaid || 0) + (o.payments || []).reduce((s, p) => s + p.amount, 0);
                const due = o.amount - totalPaid;
                return {
                    'Customer Name': o.customerName,
                    'Cloth Type': o.clothType,
                    'Order Date': o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN') : '-',
                    'Delivery Date': new Date(o.deliveryDate).toLocaleDateString('en-IN'),
                    'Amount (₹)': o.amount,
                    'Advance Paid (₹)': o.advancePaid || 0,
                    'Payments (₹)': (o.payments || []).reduce((s, p) => s + p.amount, 0),
                    'Total Paid (₹)': totalPaid,
                    'Due (₹)': due > 0 ? due : 0,
                    'Status': o.status,
                    'Payment Status': due <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
                    'Urgent': o.isUrgent ? 'Yes' : 'No',
                    'Cloth Source': o.clothSource || 'Shop',
                    'Quantity': o.quantity || 1,
                };
            });
            const wsOrders = XLSX.utils.json_to_sheet(ordersData);
            // Set column widths
            wsOrders['!cols'] = [
                { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
                { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
                { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 8 }
            ];
            XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders');

            // --- Sheet 2: Customer Analysis ---
            const customerData = customers.map(c => {
                const custOrders = orders.filter(o => o.customerName === c.name);
                const totalBilled = custOrders.reduce((s, o) => s + o.amount, 0);
                const totalPaid = custOrders.reduce((s, o) => s + (o.advancePaid || 0) + (o.payments || []).reduce((ps, p) => ps + p.amount, 0), 0);
                return {
                    'Customer Name': c.name,
                    'Phone': c.phone,
                    'Email': c.email,
                    'Address': c.address || '-',
                    'Total Orders': custOrders.length,
                    'Total Billed (₹)': totalBilled,
                    'Total Paid (₹)': totalPaid,
                    'Outstanding (₹)': Math.max(0, totalBilled - totalPaid),
                    'Last Order': c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN') : '-',
                    'Notes': c.notes || '-',
                };
            });
            const wsCustomers = XLSX.utils.json_to_sheet(customerData);
            wsCustomers['!cols'] = [
                { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 30 },
                { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 }
            ];
            XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers');

            // --- Sheet 3: Revenue Summary ---
            const revenueSummary = [
                { 'Metric': 'Total Billed', 'Value (₹)': revenue.totalBilled },
                { 'Metric': 'Total Collected', 'Value (₹)': revenue.totalCollected },
                { 'Metric': 'Outstanding Dues', 'Value (₹)': revenue.outstanding },
                { 'Metric': 'Average Order Value', 'Value (₹)': Math.round(revenue.avgOrder) },
                { 'Metric': 'Total Orders', 'Value (₹)': filteredOrders.length },
                { 'Metric': 'Completion Rate', 'Value (₹)': `${orderStats.completionRate}%` },
                { 'Metric': 'Collection Rate', 'Value (₹)': `${paymentStats.collectionRate}%` },
            ];
            const wsRevenue = XLSX.utils.json_to_sheet(revenueSummary);
            wsRevenue['!cols'] = [{ wch: 25 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, wsRevenue, 'Revenue Summary');

            // --- Sheet 4: Garment Breakdown ---
            const garmentData = garmentStats.map(g => ({
                'Garment Type': g.name,
                'Orders Count': g.count,
                'Total Revenue (₹)': g.revenue,
                'Avg per Order (₹)': g.avg,
            }));
            if (garmentData.length > 0) {
                const wsGarments = XLSX.utils.json_to_sheet(garmentData);
                wsGarments['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 16 }];
                XLSX.utils.book_append_sheet(wb, wsGarments, 'Garment Breakdown');
            }

            // --- Sheet 5: Payment Analysis ---
            const paymentData = filteredOrders.map(o => {
                const payments = o.payments || [];
                const totalPaid = (o.advancePaid || 0) + payments.reduce((s, p) => s + p.amount, 0);
                return {
                    'Customer': o.customerName,
                    'Cloth Type': o.clothType,
                    'Order Amount (₹)': o.amount,
                    'Advance (₹)': o.advancePaid || 0,
                    'Subsequent Payments (₹)': payments.reduce((s, p) => s + p.amount, 0),
                    'Total Paid (₹)': totalPaid,
                    'Balance Due (₹)': Math.max(0, o.amount - totalPaid),
                    'Payment Methods': payments.map(p => p.method).join(', ') || '-',
                    'Status': totalPaid >= o.amount ? 'Fully Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
                };
            });
            const wsPayments = XLSX.utils.json_to_sheet(paymentData);
            wsPayments['!cols'] = [
                { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 12 },
                { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 12 }
            ];
            XLSX.utils.book_append_sheet(wb, wsPayments, 'Payment Details');

            // --- Sheet 6: Delivery Performance ---
            const deliveryData = [
                { 'Metric': 'On-Time Delivery Rate', 'Value': `${deliveryStats.onTimeRate}%` },
                { 'Metric': 'Currently Overdue', 'Value': deliveryStats.overdueCount },
                { 'Metric': 'Average Delay (days)', 'Value': deliveryStats.avgDelay },
                { 'Metric': 'Due Today', 'Value': deliveryStats.dueToday },
                { 'Metric': 'Due This Week', 'Value': deliveryStats.dueThisWeek },
                { 'Metric': 'Busiest Day', 'Value': orderStats.busiestDay },
                { 'Metric': 'Avg Turnaround (days)', 'Value': orderStats.avgTurnaround },
            ];
            const wsDelivery = XLSX.utils.json_to_sheet(deliveryData);
            wsDelivery['!cols'] = [{ wch: 25 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, wsDelivery, 'Delivery Stats');

            // Generate filename with date
            const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
            XLSX.writeFile(wb, `Dadashri-Report-${dateLabel.replace(/ /g, '_')}-${today}.xlsx`);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export report. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">

            {/* Date Range Filter + Export */}
            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-stone-100 shadow-sm overflow-x-auto scrollbar-hide">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-2 shrink-0">Time Period</span>
                {([
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month' },
                    { id: '3months', label: '3 Months' },
                    { id: 'all', label: 'All Time' },
                ] as { id: DateRange; label: string }[]).map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setDateRange(opt.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${dateRange === opt.id
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-stone-50 text-gray-500 hover:bg-stone-100 border border-stone-200'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
                <div className="ml-auto pl-3 border-l border-stone-200 shrink-0">
                    <button
                        onClick={exportToExcel}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap bg-gradient-to-r from-orange-400 to-amber-600 hover:from-orange-500 hover:to-amber-700 text-white shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Download className="w-3.5 h-3.5" />
                        )}
                        {isExporting ? 'Exporting...' : 'Export Excel'}
                    </button>
                </div>
            </div>

            {/* ============ SECTION 1: REVENUE ============ */}
            <div className="space-y-4">
                <SectionHeader icon={IndianRupee} title="Revenue & Earnings" subtitle="Financial overview of your workshop" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard label="Total Billed" value={`₹${revenue.totalBilled.toLocaleString()}`} sub={`${filteredOrders.length} orders`} icon={IndianRupee} color="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100" iconColor="text-orange-600" />
                    <StatCard label="Total Collected" value={`₹${revenue.totalCollected.toLocaleString()}`} sub={`${revenue.totalBilled > 0 ? Math.round((revenue.totalCollected / revenue.totalBilled) * 100) : 0}% collected`} icon={CheckCircle2} color="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100" iconColor="text-emerald-600" />
                    <StatCard label="Outstanding Dues" value={`₹${revenue.outstanding.toLocaleString()}`} sub={revenue.outstanding > 0 ? 'Pending collection' : 'All settled!'} icon={AlertTriangle} color={revenue.outstanding > 0 ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-100' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100'} iconColor={revenue.outstanding > 0 ? 'text-red-500' : 'text-emerald-500'} />
                    <StatCard label="Avg Order Value" value={`₹${Math.round(revenue.avgOrder).toLocaleString()}`} sub="Per order" icon={TrendingUp} />
                </div>

                {/* Revenue Chart */}
                <Card className="border-stone-100 shadow-sm overflow-hidden">
                    <CardHeader className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                        <CardTitle className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Earnings Trend — Last 14 Days</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-6">
                        <div className="w-full h-[220px] sm:h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenue.chartData}>
                                    <defs>
                                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2.5} fill="url(#colorAmt)" dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ============ SECTION 2: ORDER ANALYTICS ============ */}
            <div className="space-y-4">
                <SectionHeader icon={Package} title="Order Analytics" subtitle="Workload patterns and bottlenecks" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard label="Total Orders" value={orderStats.total} sub={`${orderStats.completed} completed`} icon={Package} />
                    <StatCard label="Completion Rate" value={`${orderStats.completionRate}%`} sub={`${orderStats.completed} of ${orderStats.total}`} icon={CheckCircle2} color={orderStats.completionRate >= 70 ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100' : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100'} iconColor={orderStats.completionRate >= 70 ? 'text-emerald-600' : 'text-amber-600'} />
                    <StatCard label="Overdue" value={orderStats.overdue} sub={orderStats.overdue > 0 ? 'Need attention!' : 'All on track'} icon={AlertTriangle} color={orderStats.overdue > 0 ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-100' : 'bg-stone-50 border-stone-200'} iconColor={orderStats.overdue > 0 ? 'text-red-500' : 'text-gray-400'} />
                    <StatCard label="Avg Turnaround" value={`${orderStats.avgTurnaround} days`} sub={`Busiest: ${orderStats.busiestDay}`} icon={Clock} />
                </div>

                {/* Orders by Status Donut */}
                {orderStats.statusData.length > 0 && (
                    <Card className="border-stone-100 shadow-sm overflow-hidden">
                        <CardHeader className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                            <CardTitle className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Orders by Status</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="w-[200px] h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={orderStats.statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                                {orderStats.statusData.map((entry, i) => (
                                                    <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any, name: any) => [`${value} orders`, name]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {orderStats.statusData.map((entry, i) => (
                                        <div key={entry.name} className="flex items-center gap-2 bg-stone-50 px-3 py-2 rounded-lg border border-stone-100">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] || COLORS[i % COLORS.length] }} />
                                            <span className="text-[10px] font-bold text-gray-600 uppercase">{entry.name}</span>
                                            <span className="text-xs font-black text-gray-900">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ============ SECTION 3: CUSTOMER INSIGHTS ============ */}
            <div className="space-y-4">
                <SectionHeader icon={Users} title="Customer Insights" subtitle="Know your clientele" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard label="Total Customers" value={customerStats.total} icon={Users} />
                    <StatCard label="Repeat Rate" value={`${customerStats.repeatRate}%`} sub="Customers with 2+ orders" icon={ArrowUpRight} color="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100" iconColor="text-blue-600" />
                    <StatCard label="Avg Lifetime Value" value={`₹${customerStats.avgLTV.toLocaleString()}`} sub="Per customer" icon={TrendingUp} />
                    <StatCard label="With Dues" value={customerStats.withDues.length} sub={customerStats.withDues.length > 0 ? 'Pending payments' : 'All clear'} icon={CreditCard} color={customerStats.withDues.length > 0 ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100' : 'bg-stone-50 border-stone-200'} iconColor={customerStats.withDues.length > 0 ? 'text-amber-600' : 'text-gray-400'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top by Spend */}
                    <Card className="border-stone-100 shadow-sm">
                        <CardHeader className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
                            <CardTitle className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <span className="text-base">🏆</span> Top Customers by Spend
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y divide-stone-50">
                            {customerStats.topBySpend.map((c, i) => (
                                <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50/50 transition-colors">
                                    <span className={`text-xs font-black w-5 text-center ${i === 0 ? 'text-orange-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-300'}`}>
                                        {i + 1}
                                    </span>
                                    <Avatar className="w-8 h-8 border border-stone-200">
                                        <AvatarFallback className="bg-stone-100 text-stone-500 text-[10px] font-black">
                                            {c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 truncate uppercase">{c.name}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">{c.ordersCount} orders</p>
                                    </div>
                                    <span className="text-sm font-black text-gray-900">₹{c.totalSpent.toLocaleString()}</span>
                                </div>
                            ))}
                            {customerStats.topBySpend.length === 0 && (
                                <div className="px-5 py-8 text-center text-gray-400 text-xs font-medium">No customer data yet</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Defaulters */}
                    <Card className="border-stone-100 shadow-sm">
                        <CardHeader className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
                            <CardTitle className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <span className="text-base">⚠️</span> Outstanding Dues
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y divide-stone-50">
                            {customerStats.withDues.map((c, i) => (
                                <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50/50 transition-colors">
                                    <div className="w-5 flex justify-center">
                                        <AlertTriangle className={`w-3.5 h-3.5 ${c.due > 5000 ? 'text-red-500' : 'text-amber-500'}`} />
                                    </div>
                                    <Avatar className="w-8 h-8 border border-stone-200">
                                        <AvatarFallback className="bg-red-50 text-red-400 text-[10px] font-black">
                                            {c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 truncate uppercase">{c.name}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">{c.phone}</p>
                                    </div>
                                    <span className="text-sm font-black text-red-500">₹{c.due.toLocaleString()}</span>
                                </div>
                            ))}
                            {customerStats.withDues.length === 0 && (
                                <div className="px-5 py-8 text-center text-emerald-500 text-xs font-bold flex flex-col items-center gap-2">
                                    <CheckCircle2 className="w-6 h-6" />
                                    All payments settled!
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ============ SECTION 4: GARMENT BREAKDOWN ============ */}
            {garmentStats.length > 0 && (
                <div className="space-y-4">
                    <SectionHeader icon={Scissors} title="Garment Breakdown" subtitle="What types drive your business" />
                    <Card className="border-stone-100 shadow-sm overflow-hidden">
                        <CardContent className="p-4 pt-6">
                            <div className="w-full h-[250px] sm:h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={garmentStats} layout="vertical" margin={{ left: 0, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 800, fill: '#1e293b' }} tickLine={false} axisLine={false} width={60} />
                                        <Tooltip formatter={(value: any, name: any) => [name === 'count' ? `${value} orders` : `₹${Number(value).toLocaleString()}`, name === 'count' ? 'Orders' : 'Revenue']} />
                                        <Bar dataKey="count" fill="#f97316" radius={[0, 6, 6, 0]} barSize={18} name="Orders" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Garment stats table */}
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                {garmentStats.map((g, i) => (
                                    <div key={g.name} className="bg-stone-50 border border-stone-100 rounded-lg p-3 text-center">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{g.name}</p>
                                        <p className="text-lg font-black text-gray-900">{g.count}</p>
                                        <p className="text-[9px] font-bold text-gray-400">₹{g.revenue.toLocaleString()} rev</p>
                                        <p className="text-[8px] font-bold text-orange-500 mt-0.5">Avg ₹{g.avg.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ============ SECTION 5: PAYMENTS ============ */}
            <div className="space-y-4">
                <SectionHeader icon={CreditCard} title="Payment & Collections" subtitle="Track cash flow and outstanding debts" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard label="Collection Rate" value={`${paymentStats.collectionRate}%`} sub="Orders with payments" icon={TrendingUp} color={paymentStats.collectionRate >= 80 ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100' : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100'} iconColor={paymentStats.collectionRate >= 80 ? 'text-emerald-600' : 'text-amber-600'} />
                    <StatCard label="Fully Paid" value={paymentStats.paid} sub="Orders" icon={CheckCircle2} color="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100" iconColor="text-emerald-600" />
                    <StatCard label="Partially Paid" value={paymentStats.partial} sub="Orders" icon={Clock} color="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100" iconColor="text-amber-600" />
                    <StatCard label="Unpaid" value={paymentStats.unpaid} sub="Orders" icon={AlertTriangle} color={paymentStats.unpaid > 0 ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-100' : 'bg-stone-50 border-stone-200'} iconColor={paymentStats.unpaid > 0 ? 'text-red-500' : 'text-gray-400'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentStats.statusData.length > 0 && (
                        <Card className="border-stone-100 shadow-sm">
                            <CardHeader className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
                                <CardTitle className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Payment Status Split</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex items-center justify-center">
                                <div className="w-[200px] h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={paymentStats.statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                                {paymentStats.statusData.map((entry) => (
                                                    <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name as keyof typeof PAYMENT_COLORS] || '#94a3b8'} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any, name: any) => [`${value} orders`, name]} />
                                            <Legend formatter={(value) => <span className="text-[10px] font-bold text-gray-600 uppercase">{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {paymentStats.methodData.length > 0 && (
                        <Card className="border-stone-100 shadow-sm">
                            <CardHeader className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
                                <CardTitle className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Payment Method Split</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex items-center justify-center">
                                <div className="w-[200px] h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={paymentStats.methodData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                                {paymentStats.methodData.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString()}`, name]} />
                                            <Legend formatter={(value) => <span className="text-[10px] font-bold text-gray-600 uppercase">{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* ============ SECTION 6: CLOTH SOURCE ============ */}
            <div className="space-y-4">
                <SectionHeader icon={Scissors} title="Cloth Source Analysis" subtitle="Material sourcing patterns" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard label="Customer's Cloth" value={clothSourceStats.customerCloth} sub={`₹${clothSourceStats.customerRev.toLocaleString()} revenue`} icon={Users} color="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100" iconColor="text-blue-600" />
                    <StatCard label="Shop's Cloth" value={clothSourceStats.shopCloth} sub={`₹${clothSourceStats.shopRev.toLocaleString()} revenue`} icon={Package} color="bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100" iconColor="text-purple-600" />
                </div>
            </div>

            {/* ============ SECTION 7: DELIVERY ============ */}
            <div className="space-y-4">
                <SectionHeader icon={Truck} title="Delivery Performance" subtitle="Are orders being delivered on time?" />
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <StatCard label="On-Time Rate" value={`${deliveryStats.onTimeRate}%`} sub="Of completed orders" icon={CheckCircle2} color={deliveryStats.onTimeRate >= 80 ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100' : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-100'} iconColor={deliveryStats.onTimeRate >= 80 ? 'text-emerald-600' : 'text-red-500'} />
                    <StatCard label="Currently Overdue" value={deliveryStats.overdueCount} sub={deliveryStats.overdueCount > 0 ? 'Need attention' : 'All on track'} icon={AlertTriangle} color={deliveryStats.overdueCount > 0 ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-100' : 'bg-stone-50 border-stone-200'} iconColor={deliveryStats.overdueCount > 0 ? 'text-red-500' : 'text-gray-400'} />
                    <StatCard label="Avg Delay" value={`${deliveryStats.avgDelay} days`} sub="For late deliveries" icon={Clock} />
                    <StatCard label="Due Today" value={deliveryStats.dueToday} sub="Deliveries pending" icon={Calendar} color="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100" iconColor="text-orange-600" />
                    <StatCard label="Due This Week" value={deliveryStats.dueThisWeek} sub="Upcoming deliveries" icon={Truck} color="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100" iconColor="text-blue-600" />
                </div>
            </div>
        </div>
    );
}
