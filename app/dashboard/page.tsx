"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Menu,
    LayoutDashboard,
    Users,
    ShoppingCart,
    BarChart3,
    Settings,
    Scissors,
    LogOut,
    Package,
    Truck,
    IndianRupee,
    Plus,
    X,
    MoreVertical,
    Trash2,
    Loader2,
    Search,
    CreditCard,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import NewCustomerForm from '@/components/dashboard/NewCustomerForm';
import NewOrderForm from '@/components/dashboard/NewOrderForm';
import ReportsView from '@/components/dashboard/ReportsView';
import { Order, Customer, OrderStatus } from '@/lib/types';

// --- Icons & Helpers ---
const SidebarIcon = ({ name, active }: { name: string; active?: boolean }) => {
    const className = `w-5 h-5 ${active ? "text-orange-500" : "text-gray-400 group-hover:text-gray-200"}`;
    switch (name) {
        case 'dashboard': return <LayoutDashboard className={className} />;
        case 'customers': return <Users className={className} />;
        case 'orders': return <ShoppingCart className={className} />;
        case 'reports': return <BarChart3 className={className} />;
        case 'settings': return <Settings className={className} />;
        case 'scissors': return <Scissors className={className} />;
        case 'logout': return <LogOut className={className} />;
        default: return null;
    }
};

const StatIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'users': return <Users className="w-6 h-6 text-amber-700" />;
        case 'orders': return <Package className="w-6 h-6 text-orange-600" />;
        case 'delivery': return <Truck className="w-6 h-6 text-orange-800" />;
        case 'money': return <IndianRupee className="w-6 h-6 text-yellow-700" />;
        default: return null;
    }
};

const ArrowRightIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 inline">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

// --- Sidebar Content ---
const SidebarContent = ({ activeTab, setActiveTab, onLogout, shopName, masterTailor }: { activeTab: string, setActiveTab: (id: string) => void, onLogout: () => void, shopName: string, masterTailor: string }) => {
    const shopNameParts = shopName.split(' ');
    const shopPrimaryName = shopNameParts[0] || 'Shop';
    const shopSecondaryName = shopNameParts.slice(1).join(' ') || '';

    return (
        <>
            {/* Selvedge Strip */}
            <div className="absolute right-0 top-0 bottom-0 h-full flex flex-row pointer-events-none">
                <div className="h-full w-[2px] bg-red-600/90 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                <div className="h-full w-[2px] bg-white opacity-80"></div>
                <div className="h-full w-[2px] bg-red-600/90 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
            </div>

            {/* Logo */}
            <div className="h-28 flex items-center px-4 border-b border-white/5 relative">
                <div className="w-14 h-14 rounded-full bg-[#131b2e] flex items-center justify-center mr-4 border border-amber-100/20 shadow-xl overflow-hidden shrink-0">
                    <img src="/Logo.png" alt={shopPrimaryName} className="w-full h-full object-contain scale-125" />
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-200 font-bold text-2xl leading-none tracking-tight">{shopPrimaryName}</span>
                    {shopSecondaryName && <span className="text-orange-400 text-[10px] font-bold uppercase tracking-[0.15em] mt-1">{shopSecondaryName}</span>}
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-6 space-y-1 px-3">
                {[
                    { name: 'Dashboard', id: 'dashboard' },
                    { name: 'Customers', id: 'customers' },
                    { name: 'Orders', id: 'orders' },
                    { name: 'Reports', id: 'reports' },
                    { name: 'Settings', id: 'settings' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors group ${activeTab === item.id ? 'bg-[#ffffff0d] text-white border-l-2 border-orange-500 translate-x-1 shadow-lg' : 'text-gray-400 hover:bg-[#ffffff05] hover:text-white'}`}
                    >
                        <span className="mr-3"><SidebarIcon name={item.id} active={activeTab === item.id} /></span>
                        {item.name}
                    </button>
                ))}
            </nav>

            {/* User */}
            <div className="p-4 mb-2 relative">
                <div className="flex items-center p-3 rounded-xl bg-[#00000033] border border-white/5 backdrop-blur-sm">
                    <Avatar className="w-10 h-10 border-2 border-orange-400/30">
                        <AvatarFallback className="bg-orange-200 text-orange-800 font-bold">{masterTailor ? masterTailor[0].toUpperCase() : 'M'}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{masterTailor}</p>
                        <p className="text-xs text-gray-400 truncate">Master Tailor</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onLogout} className="text-gray-400 hover:text-white hover:bg-white/10" title="Logout">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </>
    );
};

export default function Dashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [activeProfileTab, setActiveProfileTab] = useState<'measures' | 'history' | 'report'>('measures');
    const [editingMeasurementGarment, setEditingMeasurementGarment] = useState<'shirt' | 'pant' | 'kurta' | 'suit' | 'vest' | 'custom' | null>(null);
    const [editingCustomGarmentId, setEditingCustomGarmentId] = useState<string | null>(null);
    const [customGarmentName, setCustomGarmentName] = useState<string>('');
    const [customCategory, setCustomCategory] = useState<'top' | 'bottom'>('top');
    const [measurementForm, setMeasurementForm] = useState<any>({});
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
    const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
    const [editCustomerForm, setEditCustomerForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
    const [deliveryFilter, setDeliveryFilter] = useState<'All' | 'Today' | 'This Week' | 'Overdue'>('All');
    const [isRecordingPayment, setIsRecordingPayment] = useState(false);
    const [isAddingExtraField, setIsAddingExtraField] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online' | 'Card'>('Cash');

    const [settingsForm, setSettingsForm] = useState({
        shopName: 'Dadashri Designers',
        masterTailor: 'Dadashri',
        phone: '(555) 012-3456',
        currency: 'INR',
        notifications: true
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const currencySymbol = '₹';

    // -- Data Fetching --
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                // Fetch Orders
                const ordersRes = await fetch('/api/orders');
                if (!ordersRes.ok) throw new Error('Failed to fetch orders');
                const ordersData = await ordersRes.json();

                const formattedOrders: Order[] = (ordersData || []).map((order: any) => ({
                    ...order,
                    initial: order.customerName ? order.customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'XX',
                    amount: Number(order.amount)
                }));

                // Fetch Customers
                const customersRes = await fetch('/api/customers');
                if (!customersRes.ok) throw new Error('Failed to fetch customers');
                const customersData = await customersRes.json();

                setOrders(formattedOrders);
                setCustomers(customersData || []);
            } catch (error: any) {
                console.error('Data Fetch Error:', error);
                setFetchError(error.message || 'Failed to connect to the database. Please ensure MongoDB is running and your MONGODB_URI is set.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // -- Global Search and Filtered Orders --
    const filteredOrders = useMemo(() => {
        let result = orders;

        // Status Filter
        if (statusFilter !== 'All') {
            result = result.filter(o => o.status === statusFilter);
        }

        // Delivery Date Filter
        if (deliveryFilter !== 'All') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            result = result.filter(o => {
                const deliveryDate = new Date(o.deliveryDate);
                deliveryDate.setHours(0, 0, 0, 0);

                if (deliveryFilter === 'Today') {
                    return deliveryDate.getTime() === today.getTime();
                }
                if (deliveryFilter === 'Overdue') {
                    return deliveryDate < today && o.status !== 'Completed';
                }
                if (deliveryFilter === 'This Week') {
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);
                    return deliveryDate >= today && deliveryDate <= nextWeek;
                }
                return true;
            });
        }

        // Search Query
        if (globalSearchQuery) {
            const query = globalSearchQuery.toLowerCase();
            result = result.filter(o =>
                o.customerName.toLowerCase().includes(query) ||
                o.clothType.toLowerCase().includes(query) ||
                o.status.toLowerCase().includes(query)
            );
        }

        return result;
    }, [orders, globalSearchQuery, statusFilter, deliveryFilter]);

    const globalFilteredCustomers = useMemo(() => {
        if (!globalSearchQuery) return customers;
        const query = globalSearchQuery.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            c.phone.toLowerCase().includes(query)
        );
    }, [customers, globalSearchQuery]);

    // -- Derived Stats --
    const totalCustomers = useMemo(() => customers.length, [customers]);
    const activeOrdersCount = useMemo(() => orders.filter(o => o.status !== 'Completed').length, [orders]);
    const urgentOrdersCount = useMemo(() => orders.filter(o => o.isUrgent && o.status !== 'Completed').length, [orders]);
    const completedToday = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return orders.filter(o => o.status === 'Completed' && (o.orderDate?.split('T')[0] === todayStr)).length;
    }, [orders]);

    const dailyEarnings = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return orders.reduce((acc, order) => {
            const orderPayments = (order.payments || []).filter(p => p.date.split('T')[0] === todayStr);
            const todayPayments = orderPayments.reduce((sum, p) => sum + p.amount, 0);
            // Also count advance paid today if order was created today
            const advanceToday = (order.orderDate?.split('T')[0] === todayStr) ? (order.advancePaid || 0) : 0;
            return acc + todayPayments + advanceToday;
        }, 0);
    }, [orders]);

    const totalRevenue = useMemo(() => orders.reduce((acc, curr) => acc + curr.amount, 0), [orders]);
    const overdueCount = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return orders.filter(o => new Date(o.deliveryDate) < today && o.status !== 'Completed').length;
    }, [orders]);

    // -- Handlers --
    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSavingSettings(false);
        // Could add toast notification here
        alert("Settings saved successfully!");
    };

    const deleteOrder = async (id: string) => {
        try {
            const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete order');

            setOrders(orders.filter(o => o.id !== id));
            setOpenMenuId(null);
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Failed to delete order.');
        }
    };

    const updateStatus = async (id: string, newStatus: OrderStatus) => {
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update status');

            setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
            setOpenMenuId(null);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status.');
        }
    };

    const handleSaveCustomerProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomerId) return;
        try {
            const res = await fetch('/api/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedCustomerId,
                    name: editCustomerForm.name,
                    phone: editCustomerForm.phone,
                    email: editCustomerForm.email,
                    address: editCustomerForm.address,
                    notes: editCustomerForm.notes
                })
            });

            if (!res.ok) throw new Error('Failed to update customer');

            setCustomers(prev => prev.map(c =>
                c.id === selectedCustomerId ? { ...c, ...editCustomerForm } : c
            ));
            setIsEditCustomerModalOpen(false);
            alert("Customer profile updated successfully!");
        } catch (error) {
            console.error('Error updating customer:', error);
            alert('Failed to update customer profile.');
        }
    };

    const handleRecordPayment = async (orderId: string) => {
        if (!paymentAmount || isNaN(Number(paymentAmount))) return;

        try {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;

            const amount = Number(paymentAmount);
            const newPayment = {
                date: new Date().toISOString(),
                amount,
                method: paymentMethod
            };

            const updatedPayments = [...(order.payments || []), newPayment];
            const totalPaid = (order.advancePaid || 0) + updatedPayments.reduce((sum, p) => sum + p.amount, 0);
            const paymentStatus = totalPaid >= order.amount ? 'Paid' : 'Partial';

            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: orderId,
                    payments: updatedPayments,
                    paymentStatus
                })
            });

            if (!res.ok) throw new Error('Failed to record payment');

            setOrders(orders.map(o => o.id === orderId ? { ...o, payments: updatedPayments, paymentStatus } : o));
            setSelectedOrderForDetails(prev => prev ? { ...prev, payments: updatedPayments, paymentStatus } : null);
            setPaymentAmount('');
            setIsRecordingPayment(false);
            alert("Payment recorded successfully!");
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment.');
        }
    };

    const handleSaveMeasurements = async () => {
        if (!selectedCustomerId || !editingMeasurementGarment) return;
        try {
            const customer = customers.find(c => c.id === selectedCustomerId);
            if (!customer) return;

            const now = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            let updatedMeasurements = { ...(customer.measurements || {}) };

            if (editingMeasurementGarment === 'custom') {
                const customItems = [...(updatedMeasurements.customItems || [])];
                const newItem = {
                    id: editingCustomGarmentId || Math.random().toString(36).substr(2, 9),
                    name: customGarmentName || 'Custom Item',
                    category: customCategory,
                    measurements: { ...measurementForm },
                    lastUpdated: now
                };

                if (editingCustomGarmentId) {
                    const idx = customItems.findIndex(i => i.id === editingCustomGarmentId);
                    if (idx !== -1) customItems[idx] = newItem;
                    else customItems.push(newItem);
                } else {
                    customItems.push(newItem);
                }
                updatedMeasurements.customItems = customItems;
            } else {
                (updatedMeasurements as any)[editingMeasurementGarment] = {
                    ...measurementForm,
                    lastUpdated: now
                };
            }

            const historyEntry = {
                date: new Date().toISOString(),
                type: editingMeasurementGarment === 'custom' ? customGarmentName : editingMeasurementGarment,
                measurements: { ...measurementForm }
            };

            const updatedHistory = [
                historyEntry,
                ...(customer.measurementHistory || [])
            ].slice(0, 50);

            const res = await fetch('/api/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedCustomerId,
                    measurements: updatedMeasurements,
                    measurementHistory: updatedHistory as any
                })
            });

            if (!res.ok) throw new Error('Failed to save measurements');

            setCustomers(prev => prev.map(c =>
                c.id === selectedCustomerId ? { ...c, measurements: updatedMeasurements, measurementHistory: updatedHistory as any } : c
            ));
            setEditingMeasurementGarment(null);
            setEditingCustomGarmentId(null);
            setCustomGarmentName('');
            setMeasurementForm({});
        } catch (error) {
            console.error('Error saving measurements:', error);
            alert('Failed to save measurements.');
        }
    };

    const handleOrderCreated = (newOrder: Order, newCustomer?: Customer) => {
        setOrders([newOrder, ...orders]);
        if (newCustomer) {
            setCustomers([newCustomer, ...customers]);
        }
    };

    const handleCustomerCreated = (newCustomer: Customer) => {
        setCustomers([newCustomer, ...customers]);
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // -- Render Helpers --

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ready': return 'bg-emerald-100 text-emerald-700';
            case 'Cutting': return 'bg-amber-100 text-amber-700';
            case 'Fitting': return 'bg-stone-200 text-stone-600';
            case 'Completed': return 'bg-blue-100 text-blue-700';
            default: return 'bg-slate-200 text-slate-600';
        }
    };

    // -- Views --

    const OrdersTable = ({ data, limit }: { data: Order[], limit?: number }) => {
        const displayOrders = limit ? data.slice(0, limit) : data;

        return (
            <Card className="border-stone-100 overflow-hidden shadow-sm">
                <CardHeader className="px-6 py-5 border-b border-stone-100 flex flex-row items-center justify-between bg-stone-50/50 space-y-0">
                    <CardTitle className="font-bold text-gray-900 text-lg uppercase tracking-tight">
                        {limit ? 'Recent Orders' : 'All Orders'}
                    </CardTitle>
                    {limit && (
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')} className="text-orange-500 hover:text-orange-600 font-bold">
                            View All <ArrowRightIcon />
                        </Button>
                    )}
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-stone-50 text-[10px] tracking-wider font-bold">
                                <TableHead className="px-3 sm:px-6 py-4">Customer</TableHead>
                                <TableHead className="px-3 sm:px-6 py-4 hidden sm:table-cell">Cloth Type</TableHead>
                                <TableHead className="px-3 sm:px-6 py-4">Delivery</TableHead>
                                <TableHead className="px-3 sm:px-6 py-4">Amount</TableHead>
                                <TableHead className="px-3 sm:px-6 py-4">Status</TableHead>
                                <TableHead className="px-3 sm:px-6 py-4 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayOrders.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="px-6 py-8 text-center text-gray-400 font-medium border-none">No orders found.</TableCell></TableRow>
                            ) : displayOrders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-stone-50/50 transition-colors">
                                    <TableCell className="px-3 sm:px-6 py-4">
                                        <div className="flex items-center cursor-pointer group" onClick={() => setSelectedOrderForDetails(order)}>
                                            <Avatar className="w-8 h-8 rounded-full shrink-0 mr-3 group-hover:ring-2 ring-orange-400 transition-all">
                                                <AvatarFallback className={`text-[10px] font-bold transition-colors ${order.isUrgent ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500 group-hover:bg-amber-100 group-hover:text-amber-700'}`}>
                                                    {order.initial}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <span className="font-semibold text-gray-900 block text-xs sm:text-sm group-hover:text-orange-600 transition-colors">{order.customerName}</span>
                                                {order.isUrgent && <Badge variant="destructive" className="h-4 text-[8px] px-1 uppercase tracking-[0.1em] mt-0.5">Urgent</Badge>}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-gray-600 font-medium hidden sm:table-cell">{order.clothType}</TableCell>
                                    <TableCell className="px-6 py-4 text-gray-500 text-xs">{order.deliveryDate}</TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-xs sm:text-sm">{currencySymbol}{order.amount.toLocaleString()}</span>
                                            {(() => {
                                                const totalPaid = (order.advancePaid || 0) + (order.payments || []).reduce((sum, p) => sum + p.amount, 0);
                                                const due = order.amount - totalPaid;
                                                if (due <= 0) return <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Fully Paid</span>;
                                                if (totalPaid > 0) return <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">Partial (Due: ₹{due.toLocaleString()})</span>;
                                                return <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter">Unpaid</span>;
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-3 sm:px-6 py-4">
                                        <Badge variant="secondary" className={`${getStatusColor(order.status)} text-[9px] sm:text-[10px] uppercase tracking-wider`}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => updateStatus(order.id, 'Processing')}>Set Processing</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus(order.id, 'Cutting')}>Set Cutting</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus(order.id, 'Fitting')}>Set Fitting</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus(order.id, 'Ready')} className="text-emerald-600 font-medium">Mark Ready</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateStatus(order.id, 'Completed')} className="text-blue-600 font-bold">Mark Completed</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => deleteOrder(order.id)} className="text-red-600 font-bold">
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        );
    }

    const shopNameParts = settingsForm.shopName.split(' ');
    const shopPrimaryName = shopNameParts[0] || 'Shop';
    const shopSecondaryName = shopNameParts.slice(1).join(' ') || '';

    return (
        <div className="flex w-full min-h-screen font-sans bg-[#fdfbf7] relative">

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-denim z-40 flex items-center justify-between px-4 border-b border-white/10 shadow-lg">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[#131b2e] flex items-center justify-center mr-3 border border-amber-100/20 shadow-md">
                        <img src="/Logo.png" alt={shopPrimaryName} className="w-8 h-8 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-200 font-bold text-base leading-none tracking-tight">{shopPrimaryName}</span>
                        {shopSecondaryName && <span className="text-orange-400 text-[10px] font-bold uppercase tracking-[0.1em] mt-0.5">{shopSecondaryName}</span>}
                    </div>
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 bg-denim border-none w-64">
                        <SheetTitle className="sr-only">Menu</SheetTitle>
                        <SidebarContent
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onLogout={() => router.push('/')}
                            shopName={settingsForm.shopName}
                            masterTailor={settingsForm.masterTailor}
                        />
                    </SheetContent>
                </Sheet>
            </header>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 bg-denim flex-shrink-0 flex-col relative z-20 h-screen sticky top-0 overflow-hidden">
                <SidebarContent
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onLogout={() => router.push('/')}
                    shopName={settingsForm.shopName}
                    masterTailor={settingsForm.masterTailor}
                />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#fdfbf7] relative h-screen transition-all">
                {/* Texture Overlay */}
                <div className="absolute inset-0 z-0 card-texture pointer-events-none opacity-40"></div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    </div>
                ) : fetchError ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <Scissors className="w-8 h-8 rotate-45" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
                        <p className="text-gray-500 max-w-md mb-6">{fetchError}</p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6"
                        >
                            Retry Connection
                        </Button>
                    </div>
                ) : (
                    <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-32 pt-20 lg:pt-8">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase flex flex-col sm:block">
                                    {activeTab === 'dashboard' ? (
                                        <>
                                            <span className="block sm:inline">Workshop</span>
                                            <span className="sm:ml-1.5 focus:not-italic">Overview</span>
                                        </>
                                    ) : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                </h1>
                                <p className="text-gray-500 mt-1 font-medium">
                                    {activeTab === 'dashboard' ? `Welcome back, ${settingsForm.masterTailor}.` : `Manage your ${activeTab}.`}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-full sm:w-72">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search customers, stock..."
                                        value={globalSearchQuery}
                                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-stone-200 rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsNewCustomerModalOpen(true)}
                                    className="w-full sm:w-44 bg-white hover:bg-stone-50 text-gray-700 border border-stone-200 py-3 rounded-lg shadow-sm font-bold uppercase tracking-wide text-xs sm:text-sm flex items-center justify-center transform transition active:scale-95"
                                >
                                    <Plus className="w-5 h-5 mr-2 text-orange-500" />
                                    New Customer
                                </button>
                                <button
                                    onClick={() => setIsNewOrderModalOpen(true)}
                                    className="w-full sm:w-44 bg-gradient-to-r from-orange-400 to-amber-600 hover:from-orange-500 hover:to-amber-700 text-white py-3 rounded-lg shadow-lg shadow-orange-500/20 font-bold uppercase tracking-wide text-xs sm:text-sm flex items-center justify-center transform transition active:scale-95"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    New Order
                                </button>
                            </div>
                        </div>

                        {/* View: Dashboard */}
                        {activeTab === 'dashboard' && (
                            <>
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                                    {[
                                        { label: 'Total Orders', val: orders.length.toString(), sub: `+${orders.filter(o => o.orderDate?.split('T')[0] === new Date().toISOString().split('T')[0]).length}`, subText: 'new today', subColor: 'text-emerald-500 font-bold', iconType: 'orders' },
                                        { label: 'Active Orders', val: activeOrdersCount.toString(), sub: `! ${urgentOrdersCount} Urgent`, subText: 'pending', subColor: 'text-orange-500 font-bold', iconType: 'orders' },
                                        {
                                            label: "Today's Deliveries", val: completedToday.toString(), sub: '🕒 Pending', subText: orders.filter(o => {
                                                const today = new Date().toISOString().split('T')[0];
                                                return o.deliveryDate === today && o.status !== 'Completed';
                                            }).length.toString(), subColor: 'text-slate-500', iconType: 'delivery'
                                        },
                                        { label: 'Daily Earnings', val: `${currencySymbol}${dailyEarnings.toLocaleString()}`, sub: `Total ${currencySymbol}${totalRevenue.toLocaleString()}`, subText: '', subColor: 'text-emerald-500 font-bold', iconType: 'money' },
                                    ].map((stat, idx) => (
                                        <Card key={idx} className="relative overflow-hidden group hover:shadow-md transition-shadow border-stone-100 flex flex-col h-full">
                                            <div className="absolute left-0 top-2 bottom-2 w-[3px] border-l-2 border-dashed border-red-400 opacity-60"></div>
                                            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2 space-y-0">
                                                <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {stat.label}
                                                </CardTitle>
                                                <div className="p-1.5 rounded-full bg-stone-50 group-hover:bg-amber-50 transition-colors shrink-0">
                                                    <StatIcon type={stat.iconType} />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                                                <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-0.5">{stat.val}</div>
                                                <p className="text-[10px] sm:text-xs font-medium text-gray-500">
                                                    <span className={`${stat.subColor} mr-1`}>{stat.sub}</span> {stat.subText}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                <OrdersTable data={filteredOrders} limit={5} />
                            </>
                        )}

                        {/* View: Orders */}
                        {activeTab === 'orders' && (
                            <div className="space-y-6">
                                <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Order Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as any)}
                                            className="w-full px-3 py-2 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all select-none"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Received">Received</option>
                                            <option value="Cutting">Cutting</option>
                                            <option value="Fitting">Fitting</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Ready">Ready</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Delivery Timeframe</label>
                                        <select
                                            value={deliveryFilter}
                                            onChange={(e) => setDeliveryFilter(e.target.value as any)}
                                            className="w-full px-3 py-2 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                        >
                                            <option value="All">Any Time</option>
                                            <option value="Today">Due Today</option>
                                            <option value="This Week">Due This Week</option>
                                            <option value="Overdue">Overdue Orders</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end h-full pt-6">
                                        <Button
                                            variant="ghost"
                                            onClick={() => { setStatusFilter('All'); setDeliveryFilter('All'); setGlobalSearchQuery(''); }}
                                            className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-orange-500 transition-colors"
                                        >
                                            Reset Filters
                                        </Button>
                                    </div>
                                </div>
                                <OrdersTable data={filteredOrders} />
                            </div>
                        )}

                        {/* View: Customers (Plug) */}
                        {activeTab === 'customers' && (
                            <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-8 text-center text-gray-400">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <div className="text-left">
                                        <p className="text-lg font-bold text-gray-900 uppercase">Customer Directory</p>
                                        <p className="text-sm font-medium text-gray-500">Manage contacts, measurements, and history.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsNewCustomerModalOpen(true)}
                                        className="w-fit bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm flex items-center transition-colors shadow-md shadow-orange-500/10"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Customer
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left">
                                    {globalFilteredCustomers.length === 0 ? (
                                        <div className="col-span-full py-12 text-center text-gray-400 font-medium bg-stone-50 rounded-xl border border-dashed border-stone-200">
                                            No customers found matching your search.
                                        </div>
                                    ) : (
                                        globalFilteredCustomers.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => {
                                                    setSelectedCustomerId(c.id);
                                                    setActiveTab('customer_profile');
                                                }}
                                                className="p-4 border border-stone-100 rounded-lg hover:bg-gray-50 bg-white cursor-pointer transition-colors group relative"
                                            >
                                                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </div>
                                                <h4 className="font-bold text-gray-900 uppercase text-sm tracking-tight">{c.name}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{c.phone}</p>
                                                {(() => {
                                                    const custOrders = orders.filter(o => o.customerName === c.name);
                                                    const realSpent = custOrders.reduce((s, o) => s + o.amount, 0);
                                                    return (
                                                        <div className="mt-3 text-[10px] flex justify-between items-center bg-stone-50 p-2 rounded border border-stone-100/50">
                                                            <span className="font-bold text-gray-500 uppercase">{custOrders.length || c.ordersCount} Total Orders</span>
                                                            <span className="text-orange-600 font-black">₹{(realSpent || c.totalSpent).toLocaleString()} spent</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* View: Customer Profile */}
                        {activeTab === 'customer_profile' && selectedCustomerId && (
                            <div className="space-y-6">
                                {(() => {
                                    const customer = customers.find(c => c.id === selectedCustomerId);
                                    if (!customer) return null;

                                    return (
                                        <>
                                            {/* Profile Header */}
                                            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
                                                        <span className="text-2xl font-black text-stone-400 uppercase">
                                                            {customer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{customer.name}</h2>
                                                            <Badge variant="outline" className="text-[10px] font-bold text-gray-500 border-stone-200">CUSTOMER</Badge>
                                                            <button
                                                                title="Edit Customer Details"
                                                                onClick={() => {
                                                                    setEditCustomerForm({
                                                                        name: customer.name,
                                                                        phone: customer.phone,
                                                                        email: customer.email,
                                                                        address: customer.address || '',
                                                                        notes: customer.notes || ''
                                                                    });
                                                                    setIsEditCustomerModalOpen(true);
                                                                }}
                                                                className="ml-2 w-7 h-7 rounded-md bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 transition-colors shadow-sm"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{customer.phone}</p>
                                                                <span className="text-[10px] text-gray-300">|</span>
                                                                <p className="text-[10px] font-bold text-gray-400">{customer.email}</p>
                                                            </div>
                                                            {customer.address && (
                                                                <p className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                                                                    <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                                    {customer.address}
                                                                </p>
                                                            )}
                                                            {customer.notes && (
                                                                <div className="mt-1 p-2 bg-amber-50/50 rounded border border-amber-100/50 max-w-md">
                                                                    <p className="text-[10px] italic text-amber-700 leading-relaxed"><span className="font-black not-italic text-[8px] uppercase tracking-tighter mr-1">Note:</span>{customer.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setActiveTab('customers')}
                                                        className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                                                    >
                                                        Back to List
                                                    </Button>
                                                    <Button
                                                        onClick={() => setIsNewOrderModalOpen(true)}
                                                        className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-6"
                                                    >
                                                        New Order
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Profile Tabs Content */}
                                            <div className="flex flex-col gap-6">
                                                <div className="flex border-b border-stone-200 gap-8">
                                                    {[
                                                        { id: 'measures', label: 'Measurements' },
                                                        { id: 'history', label: 'Order History' }
                                                    ].map(tab => (
                                                        <button
                                                            key={tab.id}
                                                            onClick={() => setActiveProfileTab(tab.id as any)}
                                                            className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeProfileTab === tab.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                                        >
                                                            {tab.label}
                                                            {activeProfileTab === tab.id && (
                                                                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-orange-500"></div>
                                                            )}
                                                        </button>
                                                    ))}
                                                    {/* Report Tab */}
                                                    <button
                                                        onClick={() => setActiveProfileTab('report')}
                                                        className={`pb-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeProfileTab === 'report' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >
                                                        Customer Report
                                                        {activeProfileTab === 'report' && (
                                                            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-orange-500"></div>
                                                        )}
                                                    </button>
                                                </div>

                                                {activeProfileTab === 'measures' && (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        {/* Garment Measurement Cards */}
                                                        {[
                                                            {
                                                                type: 'shirt',
                                                                label: 'Shirt',
                                                                fields: ['length', 'chest', 'waist', 'shoulder', 'sleeve', 'neck', 'cuff'],
                                                                data: customer.measurements?.shirt
                                                            },
                                                            {
                                                                type: 'pant',
                                                                label: 'Pant',
                                                                fields: ['length', 'waist', 'hip', 'thigh', 'knee', 'bottom'],
                                                                data: customer.measurements?.pant
                                                            },
                                                            {
                                                                type: 'kurta',
                                                                label: 'Kurta',
                                                                fields: ['length', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'neck'],
                                                                data: customer.measurements?.kurta
                                                            },
                                                            {
                                                                type: 'suit',
                                                                label: 'Suit / Coat',
                                                                fields: ['length', 'chest', 'waist', 'shoulder', 'sleeve', 'neck'],
                                                                data: customer.measurements?.suit
                                                            },
                                                            {
                                                                type: 'vest',
                                                                label: 'Vest / Waistcoat',
                                                                fields: ['length', 'chest', 'waist'],
                                                                data: customer.measurements?.vest
                                                            },
                                                            ...(customer.measurements?.customItems || []).map(item => ({
                                                                type: 'custom' as any,
                                                                customId: item.id,
                                                                label: item.name,
                                                                fields: (item.category === 'bottom') ? ['length', 'waist', 'hip', 'thigh', 'knee', 'bottom'] : ['length', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'neck'],
                                                                data: item.measurements,
                                                                category: item.category,
                                                                lastUpdated: item.lastUpdated
                                                            }))
                                                        ].map((garment: any, idx) => (
                                                            <Card key={garment.customId || garment.type} className="border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
                                                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{garment.label}</span>
                                                                    {garment.data ? (
                                                                        <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Saved</span>
                                                                    ) : (
                                                                        <span className="text-[9px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Pending</span>
                                                                    )}
                                                                </div>
                                                                <CardContent className="p-4">
                                                                    <div className="space-y-1.5 min-h-[160px]">
                                                                        {garment.fields.map((field: string) => (
                                                                            <div key={field} className="flex justify-between border-b border-stone-100/50 pb-1 last:border-none">
                                                                                <span className="text-[10px] font-bold text-gray-400 capitalize">{field}</span>
                                                                                <span className="text-xs font-black text-gray-700">{garment.data?.[field] || '—'}&quot;</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
                                                                        <span className="text-[8px] font-bold text-gray-300 uppercase">
                                                                            {garment.lastUpdated ? `Updated: ${garment.lastUpdated}` : garment.data?.lastUpdated ? `Updated: ${garment.data.lastUpdated}` : 'No updates'}
                                                                        </span>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setEditingMeasurementGarment(garment.type as any);
                                                                                setEditingCustomGarmentId(garment.customId || null);
                                                                                setCustomGarmentName(garment.customId ? garment.label : '');
                                                                                setCustomCategory(garment.category || 'top');
                                                                                setMeasurementForm(garment.data || {});
                                                                            }}
                                                                            className="h-7 px-3 text-[10px] font-black uppercase tracking-widest border-stone-200 hover:bg-stone-50"
                                                                        >
                                                                            Edit
                                                                        </Button>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}

                                                        {/* Add Custom Button Card */}
                                                        <Card
                                                            onClick={() => {
                                                                setEditingMeasurementGarment('custom');
                                                                setEditingCustomGarmentId(null);
                                                                setCustomGarmentName('');
                                                                setCustomCategory('top');
                                                                setMeasurementForm({});
                                                            }}
                                                            className="border-2 border-dashed border-stone-200 bg-stone-50/30 flex flex-col items-center justify-center min-h-[250px] cursor-pointer hover:bg-stone-50 hover:border-orange-200 transition-all group"
                                                        >
                                                            <div className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 group-hover:text-orange-500 group-hover:border-orange-200 transition-all shadow-sm">
                                                                <Plus className="w-6 h-6" />
                                                            </div>
                                                            <span className="mt-3 text-[10px] font-black text-stone-400 uppercase tracking-widest group-hover:text-orange-600">Add Custom Garment</span>
                                                        </Card>
                                                    </div>
                                                )}

                                                {activeProfileTab === 'history' && (() => {
                                                    const customerOrders = orders.filter(o => o.customerName === customer.name);
                                                    return (
                                                        <div className="space-y-6">
                                                            {customerOrders.length === 0 ? (
                                                                <div className="py-12 text-center text-gray-400 font-medium bg-stone-50 rounded-xl border border-dashed border-stone-200 text-sm">
                                                                    No orders found for this customer.
                                                                </div>
                                                            ) : (
                                                                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                                                                    <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                                                                        <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                                                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Order History</span>
                                                                    </div>
                                                                    <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-stone-50/50 border-b border-stone-100">
                                                                        <div className="col-span-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</div>
                                                                        <div className="col-span-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Garment</div>
                                                                        <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Delivery</div>
                                                                        <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</div>
                                                                        <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Status</div>
                                                                    </div>
                                                                    {customerOrders.map((o: Order) => (
                                                                        <div key={o.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-stone-50 last:border-none hover:bg-stone-50/50 transition-colors">
                                                                            <div className="col-span-3 text-[10px] font-bold text-gray-400">{o.orderDate || '—'}</div>
                                                                            <div className="col-span-3 text-[10px] font-black text-gray-700 uppercase">{o.clothType || '—'}</div>
                                                                            <div className="col-span-2 text-[10px] font-bold text-gray-500">{o.deliveryDate}</div>
                                                                            <div className="col-span-2 text-xs font-black text-gray-900 text-right">₹{o.amount.toLocaleString()}</div>
                                                                            <div className="col-span-2 text-right">
                                                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${o.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                                                    o.status === 'Ready' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                                                        'bg-amber-50 text-amber-600 border border-amber-100'
                                                                                    }`}>{o.status}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {customer.measurementHistory && customer.measurementHistory.length > 0 && (
                                                                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                                                                    <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                                                                        <Scissors className="w-3.5 h-3.5 text-gray-400" />
                                                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Measurement Updates</span>
                                                                    </div>
                                                                    {customer.measurementHistory.map((h: any, i: number) => (
                                                                        <div key={i} className="px-4 py-3 border-b border-stone-50 last:border-none hover:bg-stone-50/50 transition-colors">
                                                                            <div className="flex justify-between items-center mb-1">
                                                                                <span className="text-[10px] font-black text-gray-700 uppercase tracking-tight">{h.type} Updated</span>
                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                                                {Object.entries(h.measurements).map(([key, val]) => (
                                                                                    <span key={key} className="text-[9px] font-medium text-gray-500">
                                                                                        <span className="capitalize">{key}:</span> <span className="font-bold text-gray-700 font-sans">{val as string}&quot;</span>
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {activeProfileTab === 'report' && (() => {
                                                    const customerOrders = orders.filter(o => o.customerName === customer.name);
                                                    const totalSpent = customerOrders.reduce((s, o) => s + o.amount, 0);
                                                    const totalPaid = customerOrders.reduce((s, o) => {
                                                        const paid = (o.advancePaid || 0) + (o.payments || []).reduce((ps: number, p: any) => ps + p.amount, 0);
                                                        return s + paid;
                                                    }, 0);
                                                    const totalDue = totalSpent - totalPaid;
                                                    const completedOrders = customerOrders.filter(o => o.status === 'Completed');
                                                    const activeOrders = customerOrders.filter(o => o.status !== 'Completed');
                                                    const today = new Date();
                                                    const overdueOrders = customerOrders.filter(o => o.status !== 'Completed' && new Date(o.deliveryDate) < today);
                                                    const garmentTypes = [...new Set(customerOrders.flatMap(o => o.clothType.split(', ').map(s => s.trim())))];
                                                    const hasMeasurements = ['shirt', 'pant', 'kurta', 'suit', 'vest'].filter(g => (customer.measurements as any)?.[g]);
                                                    const firstOrder = customerOrders.slice().sort((a, b) => new Date(a.orderDate || '').getTime() - new Date(b.orderDate || '').getTime())[0];
                                                    const lastOrder = customerOrders.slice().sort((a, b) => new Date(b.orderDate || '').getTime() - new Date(a.orderDate || '').getTime())[0];

                                                    return (
                                                        <div className="space-y-6">

                                                            {/* Stats Row */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                {[
                                                                    { label: 'Total Orders', value: customerOrders.length, sub: `${completedOrders.length} completed`, color: 'bg-stone-50 border-stone-200' },
                                                                    { label: 'Total Billed', value: `₹${totalSpent.toLocaleString()}`, sub: `₹${totalPaid.toLocaleString()} received`, color: 'bg-emerald-50/50 border-emerald-100' },
                                                                    { label: 'Amount Due', value: `₹${totalDue.toLocaleString()}`, sub: totalDue > 0 ? 'Outstanding balance' : 'Fully settled', color: totalDue > 0 ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100' },
                                                                    { label: 'Active Orders', value: activeOrders.length, sub: overdueOrders.length > 0 ? `${overdueOrders.length} overdue` : 'All on track', color: overdueOrders.length > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-stone-50 border-stone-200' },
                                                                ].map((stat, i) => (
                                                                    <div key={i} className={`${stat.color} border rounded-xl p-4`}>
                                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
                                                                        <p className="text-xl font-black text-gray-900">{stat.value}</p>
                                                                        <p className="text-[9px] font-bold text-gray-400 mt-1">{stat.sub}</p>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Contact & Info */}
                                                            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                                                                <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                                                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Contact Information</span>
                                                                </div>
                                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {[
                                                                        { label: 'Full Name', value: customer.name },
                                                                        { label: 'Phone', value: customer.phone || '—' },
                                                                        { label: 'Email', value: customer.email || '—' },
                                                                        { label: 'Address', value: customer.address || '—' },
                                                                        { label: 'First Order', value: firstOrder ? (firstOrder.orderDate || firstOrder.deliveryDate) : '—' },
                                                                        { label: 'Last Order', value: lastOrder ? (lastOrder.orderDate || lastOrder.deliveryDate) : '—' },
                                                                        { label: 'Garment Types Used', value: garmentTypes.length > 0 ? garmentTypes.join(', ') : '—' },
                                                                        { label: 'Measurements Saved', value: hasMeasurements.length > 0 ? hasMeasurements.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ') : 'None' },
                                                                    ].map((row, i) => (
                                                                        <div key={i} className="flex flex-col gap-0.5">
                                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{row.label}</span>
                                                                            <span className="text-xs font-bold text-gray-800">{row.value}</span>
                                                                        </div>
                                                                    ))}
                                                                    {customer.notes && (
                                                                        <div className="md:col-span-2 flex flex-col gap-0.5">
                                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Notes</span>
                                                                            <span className="text-xs font-medium text-amber-700 italic bg-amber-50 px-3 py-2 rounded border border-amber-100">{customer.notes}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Orders Table */}
                                                            {customerOrders.length > 0 && (
                                                                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                                                                    <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                                                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">All Orders</span>
                                                                        <span className="text-[9px] font-bold text-gray-400">{customerOrders.length} orders</span>
                                                                    </div>
                                                                    <div className="divide-y divide-stone-50">
                                                                        {customerOrders.map((o: Order) => {
                                                                            const paid = (o.advancePaid || 0) + (o.payments || []).reduce((s: number, p: any) => s + p.amount, 0);
                                                                            const due = o.amount - paid;
                                                                            return (
                                                                                <div key={o.id} className="px-4 py-3 flex items-center justify-between hover:bg-stone-50/50 transition-colors gap-4">
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                                            <span className="text-[10px] font-black text-gray-900 uppercase">{o.clothType}</span>
                                                                                            {o.isUrgent && <span className="text-[8px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase">Urgent</span>}
                                                                                        </div>
                                                                                        <div className="flex items-center gap-3 mt-0.5">
                                                                                            <span className="text-[9px] text-gray-400">{o.orderDate || '—'}</span>
                                                                                            <span className="text-[9px] text-gray-400">→ {o.deliveryDate}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right shrink-0 space-y-0.5">
                                                                                        <div className="text-xs font-black text-gray-900">₹{o.amount.toLocaleString()}</div>
                                                                                        {due > 0 ? (
                                                                                            <div className="text-[9px] font-bold text-red-500">Due: ₹{due.toLocaleString()}</div>
                                                                                        ) : (
                                                                                            <div className="text-[9px] font-bold text-emerald-500">Paid ✓</div>
                                                                                        )}
                                                                                    </div>
                                                                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded border shrink-0 ${o.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                                        o.status === 'Ready' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                                            'bg-amber-50 text-amber-600 border-amber-100'
                                                                                        }`}>{o.status}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Measurements Summary */}
                                                            {hasMeasurements.length > 0 && (
                                                                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                                                                    <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                                                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Saved Measurements</span>
                                                                    </div>
                                                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {hasMeasurements.map(garment => {
                                                                            const data = (customer.measurements as any)[garment];
                                                                            return (
                                                                                <div key={garment} className="border border-stone-100 rounded-lg p-3">
                                                                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{garment}</p>
                                                                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                                                        {Object.entries(data).filter(([k]) => k !== 'lastUpdated').map(([key, val]) => (
                                                                                            <span key={key} className="text-[10px] text-gray-600">
                                                                                                <span className="capitalize text-gray-400">{key}: </span>
                                                                                                <span className="font-black text-gray-800">{val as string}&quot;</span>
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                        </div>
                                                    );
                                                })()}

                                            </div >
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {/* View: Settings */}
                        {activeTab === 'settings' && (
                            <div className="max-w-6xl mx-auto">
                                <form onSubmit={handleSaveSettings} className="flex flex-col md:flex-row gap-6 items-stretch">
                                    {/* Left Side: Logo */}
                                    <div className="w-full md:w-1/2">
                                        <div className="bg-white rounded-xl shadow-sm border border-stone-100 relative overflow-hidden flex flex-col items-center justify-center p-8 text-center h-full">
                                            <div className="w-40 h-40 rounded-full bg-[#131b2e] flex items-center justify-center border-4 border-amber-100/20 shadow-xl overflow-hidden mb-6">
                                                <img src="/Logo.png" alt="Dadashri" className="w-24 h-24 object-contain" />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{settingsForm.shopName}</h3>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">EST. 2024</p>
                                        </div>
                                    </div>

                                    {/* Right Side: Workshop Profile */}
                                    <div className="w-full md:w-1/2 flex flex-col h-full gap-6">
                                        <div className="flex flex-col justify-between h-full space-y-6">
                                            {/* Workshop Details Card */}
                                            <div className="bg-white rounded-xl shadow-sm border border-stone-100 relative overflow-hidden flex-1">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                                                <div className="p-8">
                                                    <div className="flex items-center mb-8">
                                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mr-4">
                                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Workshop Profile</h3>
                                                            <p className="text-sm text-gray-500 font-medium">Manage your shop identity and contact details.</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Shop Name</label>
                                                            <input type="text" value={settingsForm.shopName} onChange={e => setSettingsForm({ ...settingsForm, shopName: e.target.value })} className="w-full px-4 py-3 border border-stone-200 text-[13px] rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-900 font-bold transition-all bg-stone-50 focus:bg-white" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Master Tailor</label>
                                                            <input type="text" value={settingsForm.masterTailor} onChange={e => setSettingsForm({ ...settingsForm, masterTailor: e.target.value })} className="w-full px-4 py-3 border border-stone-200 text-[13px] rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-900 font-bold transition-all bg-stone-50 focus:bg-white" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                                                            <input type="tel" value={settingsForm.phone} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} className="w-full px-4 py-3 border border-stone-200 text-[13px] rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-900 font-bold transition-all bg-stone-50 focus:bg-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Save Bar */}
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={isSavingSettings}
                                                    className="bg-gray-900 text-white px-8 py-3.5 rounded-lg shadow-lg hover:bg-black font-black uppercase tracking-widest text-[11px] flex items-center transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                                                >
                                                    {isSavingSettings ? (
                                                        <>
                                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        'Save Changes'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* View: Reports */}
                        {activeTab === 'reports' && (
                            <ReportsView orders={orders} customers={customers} />
                        )}

                        {/* Footer */}
                        <div className="text-center pt-8 pb-4">
                            <p className="text-gray-300 text-xs font-medium">© 2024 Indigo Denim & Copper. Craftsman Dashboard v1.0</p>
                        </div>

                    </div>
                )
                }
            </main >

            {/* New Customer Dialog */}
            < NewCustomerForm
                isOpen={isNewCustomerModalOpen}
                onOpenChange={setIsNewCustomerModalOpen}
                onCustomerCreated={handleCustomerCreated}
            />

            {/* New Order Dialog */}
            < NewOrderForm
                isOpen={isNewOrderModalOpen}
                onOpenChange={setIsNewOrderModalOpen}
                onOrderCreated={handleOrderCreated}
                customers={customers}
                orders={orders}
            />

            {/* Order Details & Measurements Dialog */}
            < Dialog open={!!selectedOrderForDetails} onOpenChange={(open) => !open && setSelectedOrderForDetails(null)}>
                <DialogContent showCloseButton={false} className="sm:max-w-3xl bg-white p-0 overflow-hidden border-none shadow-2xl rounded-xl">
                    <DialogTitle className="sr-only">Order Details</DialogTitle>
                    <div className="flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center z-20">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[#131b2e] flex items-center justify-center text-white shadow-md">
                                    <Package className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#131b2e] uppercase tracking-tight leading-none">Order Information</h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedOrderForDetails(null)}
                                className="p-1.5 hover:bg-slate-200 rounded-full transition-colors focus:ring-2 focus:ring-orange-500/20 outline-none"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 hover:text-slate-600">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                            {selectedOrderForDetails && (() => {
                                const customer = customers.find(c => c.name === selectedOrderForDetails.customerName);
                                const garments = selectedOrderForDetails.clothType.split(', ').map(s => s.trim().toLowerCase());

                                return (
                                    <div className="space-y-8">
                                        {/* Order Info Panel - Enhanced */}
                                        <div className="bg-white border-2 border-stone-100 rounded-2xl overflow-hidden shadow-sm flex flex-col group">
                                            {/* Top Section: Customer & Profile */}
                                            <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-stone-50/50 to-white border-b border-stone-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-[#131b2e] flex items-center justify-center border-2 border-white shadow-xl rotate-[-2deg] group-hover:rotate-0 transition-transform duration-500">
                                                        <span className="text-2xl font-black text-white uppercase italic">
                                                            {selectedOrderForDetails.initial}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 group/name">
                                                            <button
                                                                onClick={() => {
                                                                    if (customer) {
                                                                        setActiveTab('customer_profile');
                                                                        setSelectedCustomerId(customer.id);
                                                                        setSelectedOrderForDetails(null);
                                                                    }
                                                                }}
                                                                className="hover:text-orange-500 transition-colors text-left flex items-center gap-2"
                                                                title="Go to Customer Profile"
                                                            >
                                                                {selectedOrderForDetails.customerName}
                                                                <ArrowRightIcon />
                                                            </button>
                                                            {selectedOrderForDetails.isUrgent && (
                                                                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                                                            )}
                                                        </h2>
                                                        <div className="flex flex-wrap gap-2 mt-1.5 focus-within:ring-2">
                                                            <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-stone-200 bg-white">
                                                                {selectedOrderForDetails.clothType}
                                                            </Badge>
                                                            {selectedOrderForDetails.isUrgent && (
                                                                <Badge className="text-[10px] bg-red-500 text-white border-none font-bold uppercase tracking-widest px-2">
                                                                    Priority
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-left sm:text-right w-full sm:w-auto">
                                                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] block mb-1">Order Valuation</span>
                                                    <span className="text-3xl font-black text-[#131b2e] tabular-nums">₹{selectedOrderForDetails.amount.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-stone-100 divide-x divide-stone-100">
                                                <div className="p-4 bg-white/50">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3 text-orange-400" />
                                                        Order Date
                                                    </p>
                                                    <p className="text-xs font-bold text-gray-900">{selectedOrderForDetails.orderDate ? new Date(selectedOrderForDetails.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                                                </div>
                                                <div className="p-4 bg-white/50">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <Truck className="w-3 h-3 text-orange-500" />
                                                        Delivery
                                                    </p>
                                                    <p className="text-xs font-bold text-orange-600 uppercase italic">{selectedOrderForDetails.deliveryDate}</p>
                                                </div>
                                                <div className="p-4 bg-white/50">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <ShoppingCart className="w-3 h-3 text-amber-500" />
                                                        Quantity
                                                    </p>
                                                    <p className="text-xs font-bold text-gray-900">
                                                        {selectedOrderForDetails.quantity || 1} {(selectedOrderForDetails.quantity || 1) > 1 ? 'Pieces' : 'Piece'}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-white/50">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                        <Package className="w-3 h-3 text-slate-400" />
                                                        Cloth Source
                                                    </p>
                                                    <p className="text-xs font-bold text-gray-900">{selectedOrderForDetails.clothSource || 'Customer'}</p>
                                                </div>
                                            </div>

                                            {/* Status Bar */}
                                            <div className="px-6 py-3 bg-stone-50 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Job Status</span>
                                                    <Badge className={`${getStatusColor(selectedOrderForDetails.status)} text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 border-none shadow-sm`}>
                                                        {selectedOrderForDetails.status}
                                                    </Badge>
                                                </div>
                                                <div className="hidden sm:flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ID: #{selectedOrderForDetails.id.substring(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Measurments */}
                                        {customer && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 border-t border-slate-100 pt-8">
                                                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                                    <h3 className="text-xs font-black text-[#131b2e] uppercase tracking-widest flex items-center gap-2">
                                                        <Scissors className="w-4 h-4 text-orange-500" />
                                                        Client Measurements
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{customer.phone}</span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                                    {(['shirt', 'pant', 'kurta', 'suit', 'vest'] as const).map((type) => {
                                                        const data = customer.measurements?.[type] as any;
                                                        const isOrdered = garments.includes(type);
                                                        if (!isOrdered && !data) return null;

                                                        const fields = type === 'shirt' ? ['length', 'chest', 'waist', 'shoulder', 'sleeve', 'neck', 'cuff'] :
                                                            type === 'pant' ? ['length', 'waist', 'hip', 'thigh', 'knee', 'bottom'] :
                                                                type === 'kurta' ? ['length', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'neck'] :
                                                                    type === 'suit' ? ['length', 'chest', 'waist', 'shoulder', 'sleeve', 'neck'] :
                                                                        type === 'vest' ? ['length', 'chest', 'waist'] : [];

                                                        return (
                                                            <div key={type} className={`relative bg-white border-2 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${isOrdered ? 'border-[#131b2e]' : 'border-stone-100 opacity-80'}`}>
                                                                <div className={`px-4 py-3 border-b flex justify-between items-center ${isOrdered ? 'bg-slate-50 border-stone-200' : 'bg-stone-50 border-stone-100'}`}>
                                                                    <span className={`text-[11px] font-black uppercase tracking-widest ${isOrdered ? 'text-[#131b2e]' : 'text-slate-500'}`}>{type}</span>
                                                                    {data && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingMeasurementGarment(type as any);
                                                                                setMeasurementForm(data || {});
                                                                                setSelectedCustomerId(customer.id);
                                                                            }}
                                                                            className="text-[9px] font-black text-orange-500 uppercase hover:text-orange-600 transition-colors"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="p-4 bg-white">
                                                                    {data ? (
                                                                        <div className="space-y-1.5 h-auto min-h-[140px]">
                                                                            {fields.map((field) => (
                                                                                <div key={field} className="flex justify-between border-b border-stone-100 pb-1.5 last:border-none focus-within:bg-orange-50 transition-colors rounded px-1 -mx-1">
                                                                                    <span className="text-[10px] font-bold text-slate-500 capitalize">{field}</span>
                                                                                    <span className="text-xs font-black text-slate-800">{data[field] || '—'}&quot;</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-[140px] flex flex-col items-center justify-center text-center space-y-3">
                                                                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-relaxed">Required<br />Needs Update</span>
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setEditingMeasurementGarment(type as any);
                                                                                    setMeasurementForm({});
                                                                                    setSelectedCustomerId(customer.id);
                                                                                }}
                                                                                className="h-7 text-[9px] font-black uppercase tracking-widest bg-[#131b2e] hover:bg-black text-white px-4 rounded-lg shadow-sm"
                                                                            >
                                                                                Add Measurements
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Tracking Panel */}
                                        <div className="space-y-4 pt-8 border-t border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black text-[#131b2e] uppercase tracking-widest flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-emerald-500" />
                                                    Payment Tracking
                                                </h3>
                                                <div className="flex gap-2">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${(selectedOrderForDetails.paymentStatus === 'Paid') ? 'text-emerald-700 bg-emerald-50' :
                                                        (selectedOrderForDetails.paymentStatus === 'Partial') ? 'text-blue-700 bg-blue-50' : 'text-slate-500 bg-slate-50'
                                                        }`}>
                                                        Status: {selectedOrderForDetails.paymentStatus || 'Unpaid'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                                                <div className="space-y-4">
                                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Total Amount</span>
                                                            <span className="text-lg font-black text-slate-900">₹{selectedOrderForDetails.amount.toLocaleString()}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Remaining Due</span>
                                                            {(() => {
                                                                const totalPaid = (selectedOrderForDetails.advancePaid || 0) + (selectedOrderForDetails.payments || []).reduce((sum, p) => sum + p.amount, 0);
                                                                const due = selectedOrderForDetails.amount - totalPaid;
                                                                return (
                                                                    <span className={`text-lg font-black ${due > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                        ₹{Math.max(0, due).toLocaleString()}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment History</span>
                                                        <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                                                            <div className="flex justify-between items-center py-2 px-3 bg-white border border-stone-100 rounded-lg">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-slate-700 uppercase">Advance Payment</p>
                                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Initial Deposit</p>
                                                                </div>
                                                                <span className="text-xs font-black text-slate-600">₹{selectedOrderForDetails.advancePaid?.toLocaleString()}</span>
                                                            </div>
                                                            {(selectedOrderForDetails.payments || []).map((p, i) => (
                                                                <div key={i} className="flex justify-between items-center py-2 px-3 bg-white border border-stone-100 rounded-lg">
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-slate-700 uppercase">Collection ({p.method})</p>
                                                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{new Date(p.date).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <span className="text-xs font-black text-slate-600">₹{p.amount.toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-stone-50/50 rounded-2xl p-5 border-2 border-dashed border-stone-200 flex flex-col justify-center min-h-[180px]">
                                                    {!isRecordingPayment ? (
                                                        <div className="text-center space-y-3">
                                                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto">
                                                                <Plus className="w-4 h-4 text-orange-500" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-black text-[#131b2e] uppercase tracking-wider">Record Collection</p>
                                                                <p className="text-[9px] font-medium text-gray-500">Collect partial or full balance</p>
                                                            </div>
                                                            <Button
                                                                onClick={() => setIsRecordingPayment(true)}
                                                                disabled={selectedOrderForDetails.paymentStatus === 'Paid'}
                                                                className="w-full bg-[#131b2e] hover:bg-[#1c2a5e] text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-[#131b2e]/10"
                                                            >
                                                                {selectedOrderForDetails.paymentStatus === 'Paid' ? 'Paid in Full' : 'Collect Payment'}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Collection</span>
                                                                <button onClick={() => setIsRecordingPayment(false)} className="text-[10px] font-bold text-red-500 uppercase">Cancel</button>
                                                            </div>
                                                            <input
                                                                autoFocus
                                                                type="number"
                                                                placeholder="Amount"
                                                                value={paymentAmount}
                                                                onChange={e => setPaymentAmount(e.target.value)}
                                                                className="w-full px-4 py-3 text-sm font-black text-[#131b2e] bg-white border-2 border-stone-100 rounded-xl outline-none focus:border-orange-500"
                                                            />
                                                            <div className="flex gap-2">
                                                                {(['Cash', 'Online', 'Card'] as const).map(m => (
                                                                    <button
                                                                        key={m}
                                                                        onClick={() => setPaymentMethod(m)}
                                                                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg border-2 transition-all ${paymentMethod === m ? 'bg-[#131b2e] text-white border-[#131b2e]' : 'bg-white text-slate-500 border-stone-100'
                                                                            }`}
                                                                    >
                                                                        {m}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <Button
                                                                onClick={() => handleRecordPayment(selectedOrderForDetails.id)}
                                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest py-4 rounded-xl"
                                                            >
                                                                Confirm Collection
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Edit Customer Dialog */}
            < Dialog open={isEditCustomerModalOpen} onOpenChange={setIsEditCustomerModalOpen} >
                <DialogContent showCloseButton={true} className="sm:max-w-md bg-white border border-stone-200 p-0 overflow-hidden shadow-2xl rounded-xl">
                    <DialogHeader className="px-5 py-4 border-b border-stone-100 bg-stone-50/50">
                        <DialogTitle className="text-sm font-black text-gray-900 uppercase tracking-wider">
                            Edit Customer Profile
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveCustomerProfile} className="px-5 py-4 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                            <input
                                required
                                value={editCustomerForm.name}
                                onChange={e => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                                className="w-full px-3 py-2 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-orange-400 transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                            <input
                                type="tel"
                                value={editCustomerForm.phone}
                                onChange={e => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                                className="w-full px-3 py-2 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-orange-400 transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                            <input
                                type="email"
                                value={editCustomerForm.email}
                                onChange={e => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                                className="w-full px-3 py-2 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-orange-400 transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Address</label>
                            <textarea
                                value={editCustomerForm.address}
                                onChange={e => setEditCustomerForm({ ...editCustomerForm, address: e.target.value })}
                                className="w-full px-3 py-2 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-orange-400 transition-colors min-h-[60px]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Notes</label>
                            <textarea
                                value={editCustomerForm.notes}
                                onChange={e => setEditCustomerForm({ ...editCustomerForm, notes: e.target.value })}
                                className="w-full px-3 py-2 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-orange-400 transition-colors min-h-[40px]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditCustomerModalOpen(false)} className="py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-stone-200 hover:bg-stone-50 transition-colors">Cancel</Button>
                            <Button type="submit" className="py-2.5 text-[10px] font-black text-white bg-gray-900 uppercase tracking-widest hover:bg-black transition-colors">Save Changes</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog >

            {/* Measurement Edit Dialog */}
            <Dialog open={!!editingMeasurementGarment} onOpenChange={(open) => { if (!open) { setEditingMeasurementGarment(null); setEditingCustomGarmentId(null); setCustomGarmentName(''); setMeasurementForm({}); } }}>
                <DialogContent className="sm:max-w-sm bg-white border border-stone-200 shadow-xl rounded-lg p-0 overflow-hidden">
                    <DialogHeader className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
                        <DialogTitle className="text-sm font-black text-gray-900 uppercase tracking-wider">
                            {editingMeasurementGarment === 'custom'
                                ? (customGarmentName || 'New Custom Garment')
                                : `${editingMeasurementGarment?.charAt(0).toUpperCase()}${editingMeasurementGarment?.slice(1)}`} Measurements
                        </DialogTitle>
                    </DialogHeader>
                    <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {editingMeasurementGarment === 'custom' && (
                            <div className="space-y-4 pb-4 border-b border-stone-100">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Garment Name</label>
                                    <input
                                        type="text"
                                        value={customGarmentName}
                                        onChange={e => setCustomGarmentName(e.target.value)}
                                        placeholder="e.g. Sherwani, Safari"
                                        className="w-full px-3 py-2 text-sm font-bold text-gray-900 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-orange-400 transition-colors"
                                    />
                                </div>
                                <div className="flex bg-stone-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setCustomCategory('top')}
                                        className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${customCategory === 'top' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        Upper Body
                                    </button>
                                    <button
                                        onClick={() => setCustomCategory('bottom')}
                                        className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${customCategory === 'bottom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                                    >
                                        Lower Body
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            {(() => {
                                const baseFields = (editingMeasurementGarment === 'shirt' ? ['length', 'chest', 'waist', 'shoulder', 'sleeve', 'neck', 'cuff'] :
                                    editingMeasurementGarment === 'pant' ? ['length', 'waist', 'hip', 'thigh', 'knee', 'bottom'] :
                                        editingMeasurementGarment === 'kurta' ? ['length', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'neck'] :
                                            editingMeasurementGarment === 'suit' ? ['length', 'chest', 'waist', 'shoulder', 'sleeve', 'neck'] :
                                                editingMeasurementGarment === 'vest' ? ['length', 'chest', 'waist'] :
                                                    editingMeasurementGarment === 'custom' ? (customCategory === 'top' ? ['length', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'neck'] : ['length', 'waist', 'hip', 'thigh', 'knee', 'bottom']) : []);

                                const extraFields = Object.keys(measurementForm).filter(k => k !== 'lastUpdated' && !baseFields.includes(k));
                                const allFields = [...baseFields, ...extraFields];

                                return allFields.map(field => (
                                    <div key={field} className="flex items-center justify-between border-b border-stone-100 pb-2 last:border-none">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase w-32 capitalize">{field}</label>
                                        <div className="flex items-center gap-2 group">
                                            <input
                                                type="number"
                                                step="0.5"
                                                value={measurementForm[field] || ''}
                                                onChange={e => setMeasurementForm((prev: any) => ({ ...prev, [field]: e.target.value }))}
                                                placeholder="0"
                                                className="w-16 text-right text-xs font-black text-gray-900 bg-stone-50 border border-stone-200 rounded px-2 py-1 outline-none focus:border-gray-400"
                                            />
                                            <span className="text-[10px] font-bold text-gray-400">&quot;</span>
                                            {extraFields.includes(field) && (
                                                <button
                                                    onClick={() => {
                                                        const newForm = { ...measurementForm };
                                                        delete newForm[field];
                                                        setMeasurementForm(newForm);
                                                    }}
                                                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Add Extra Field UI */}
                        <div className="pt-2">
                            {isAddingExtraField ? (
                                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Point name (e.g. Collar)"
                                        value={newFieldName}
                                        onChange={e => setNewFieldName(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && newFieldName.trim()) {
                                                setMeasurementForm((p: any) => ({ ...p, [newFieldName.trim().toLowerCase()]: '' }));
                                                setNewFieldName('');
                                                setIsAddingExtraField(false);
                                            }
                                        }}
                                        className="flex-1 px-3 py-1.5 text-xs font-bold bg-stone-50 border border-stone-200 rounded outline-none focus:border-gray-400"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            if (newFieldName.trim()) {
                                                setMeasurementForm((p: any) => ({ ...p, [newFieldName.trim().toLowerCase()]: '' }));
                                                setNewFieldName('');
                                                setIsAddingExtraField(false);
                                            }
                                        }}
                                        className="h-8 bg-gray-900 text-white text-[10px] font-black uppercase"
                                    >Add</Button>
                                    <button
                                        onClick={() => { setIsAddingExtraField(false); setNewFieldName(''); }}
                                        className="p-2 text-gray-400"
                                    ><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingExtraField(true)}
                                    className="w-full py-2 border border-dashed border-stone-200 rounded text-[9px] font-black text-gray-400 uppercase tracking-widest hover:border-gray-400 hover:text-gray-600 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Plus className="w-3 h-3" /> Add Extra Point
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 border-t border-stone-100">
                        <button type="button"
                            onClick={() => { setEditingMeasurementGarment(null); setMeasurementForm({}); setIsAddingExtraField(false); setNewFieldName(''); }}
                            className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-stone-50 transition-colors border-r border-stone-100"
                        >Cancel</button>
                        <button type="button"
                            onClick={handleSaveMeasurements}
                            className="py-3 text-[10px] font-black text-white bg-gray-900 uppercase tracking-widest hover:bg-black transition-colors"
                        >Save</button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
