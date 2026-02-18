"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// --- Types ---
type OrderStatus = 'Processing' | 'Ready' | 'Cutting' | 'Fitting' | 'Completed';

interface Order {
    id: string;
    customerName: string;
    initial: string;
    clothType: string;
    deliveryDate: string;
    amount: number;
    status: OrderStatus;
    isUrgent?: boolean;
    quantity?: number;
    orderDate?: string;
    advancePaid?: number;
    clothSource?: 'Customer' | 'Shop';
}

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    ordersCount: number;
    totalSpent: number;
    lastOrderDate: string;
}

// --- Icons ---
const SidebarIcon = ({ name, active }: { name: string; active?: boolean }) => {
    const colorClass = active ? "text-[#d97706]" : "text-gray-400 group-hover:text-gray-200";
    switch (name) {
        case 'dashboard': return <svg className={`${colorClass} w-5 h-5`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
        case 'customers': return <svg className={`${colorClass} w-5 h-5`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
        case 'orders': return <svg className={`${colorClass} w-5 h-5`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
        case 'reports': return <svg className={`${colorClass} w-5 h-5`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
        case 'settings': return <svg className={`${colorClass} w-5 h-5`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
        case 'scissors': return <svg className="w-5 h-5" fill="none" width="24" height="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>;
        case 'logout': return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
        default: return null;
    }
};

const StatIcon = ({ type }: { type: string }) => {
    let bg = "bg-orange-100";
    let text = "text-orange-600";
    let Icon = null;

    if (type === 'users') {
        bg = "bg-amber-100"; text = "text-amber-700";
        Icon = <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
    } else if (type === 'orders') {
        bg = "bg-orange-100"; text = "text-orange-600";
        Icon = <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>;
    } else if (type === 'delivery') {
        bg = "bg-orange-50"; text = "text-orange-800";
        Icon = <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-1" /></svg>;
    } else if (type === 'money') {
        bg = "bg-yellow-100"; text = "text-yellow-700";
        Icon = <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    }

    return (
        <div className={`p-3 rounded-full ${bg} ${text}`}>
            {Icon}
        </div>
    );
};

const ArrowRightIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 inline">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

// --- Default Data ---
const initialOrders: Order[] = [];

const initialCustomers: Customer[] = [];

export default function Dashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // -- Data Fetching --
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (ordersError) throw ordersError;

                const formattedOrders: Order[] = (ordersData || []).map(order => ({
                    id: order.id,
                    customerName: order.customer_name,
                    initial: order.customer_name ? order.customer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'XX',
                    clothType: order.cloth_type,
                    deliveryDate: order.delivery_date,
                    amount: Number(order.amount),
                    status: order.status as OrderStatus,
                    isUrgent: order.is_urgent
                }));

                const { data: customersData, error: customersError } = await supabase.from('customers').select('*');

                if (customersError) {
                    console.error('Error fetching customers:', customersError);
                }

                setOrders(formattedOrders);
                setCustomers(customersData || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // -- New Order Form State --
    const [newOrderForm, setNewOrderForm] = useState({
        customerName: '',
        clothType: '',
        quantity: 1,
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        amount: '',
        advancePaid: '',
        status: 'Received',
        isUrgent: false,
        clothSource: 'Customer', // Default to Customer
        customerId: null as string | null // Track selected customer ID
    });

    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

    // Filter customers based on search
    const filteredCustomers = useMemo(() => {
        if (!customerSearchQuery) return [];
        return customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()));
    }, [customers, customerSearchQuery]);

    const selectCustomer = (customer: Customer) => {
        setNewOrderForm(prev => ({ ...prev, customerName: customer.name, customerId: customer.id }));
        setCustomerSearchQuery(customer.name);
        setShowCustomerSuggestions(false);
    };

    // -- New Customer Form State --
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
    const [newCustomerForm, setNewCustomerForm] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Derived Balance
    const remainingBalance = useMemo(() => {
        const total = parseFloat(newOrderForm.amount) || 0;
        const advance = parseFloat(newOrderForm.advancePaid) || 0;
        return Math.max(0, total - advance);
    }, [newOrderForm.amount, newOrderForm.advancePaid]);

    const [settingsForm, setSettingsForm] = useState({
        shopName: 'Indigo Denim & Copper',
        masterTailor: 'John Doe',
        phone: '(555) 012-3456',
        currency: 'INR',
        notifications: true
    });

    const currencySymbol = '₹';

    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // -- Derived Stats --
    const totalCustomers = useMemo(() => customers.length, [customers]);
    const activeOrdersCount = useMemo(() => orders.filter(o => o.status !== 'Completed').length, [orders]);
    const urgentOrdersCount = useMemo(() => orders.filter(o => o.isUrgent && o.status !== 'Completed').length, [orders]);
    const completedToday = useMemo(() => orders.filter(o => o.status === 'Completed').length, [orders]);
    const totalRevenue = useMemo(() => orders.reduce((acc, curr) => acc + curr.amount, 0), [orders]);
    const overdueCount = useMemo(() => orders.filter(o => new Date(o.deliveryDate) < new Date() && o.status !== 'Completed').length, [orders]);

    // -- Handlers --

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const newOrderPayload = {
                customer_name: newOrderForm.customerName,
                cloth_type: newOrderForm.clothType,
                quantity: newOrderForm.quantity,
                order_date: newOrderForm.orderDate,
                delivery_date: newOrderForm.deliveryDate,
                amount: parseFloat(newOrderForm.amount) || 0,
                advance_paid: parseFloat(newOrderForm.advancePaid) || 0,
                status: newOrderForm.status,
                is_urgent: newOrderForm.isUrgent,
                cloth_source: newOrderForm.clothSource
            };

            const { data, error } = await supabase
                .from('orders')
                .insert([newOrderPayload])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                // If we have a selected customer, update their stats (optional but good)
                // For now, we just refresh the local state

                const initials = data.customer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                const newOrder: Order = {
                    id: data.id,
                    customerName: data.customer_name,
                    initial: initials || 'XX',
                    clothType: data.cloth_type,
                    deliveryDate: data.delivery_date,
                    amount: data.amount,
                    status: data.status as OrderStatus,
                    isUrgent: data.is_urgent,
                    quantity: data.quantity,
                    orderDate: data.order_date,
                    advancePaid: data.advance_paid,
                    clothSource: data.cloth_source
                };
                setOrders([newOrder, ...orders]);
                setIsNewOrderModalOpen(false);
                setNewOrderForm({
                    customerName: '',
                    clothType: '',
                    quantity: 1,
                    orderDate: new Date().toISOString().split('T')[0],
                    deliveryDate: '',
                    amount: '',
                    advancePaid: '',
                    status: 'Received',
                    isUrgent: false,
                    clothSource: 'Customer',
                    customerId: null
                });
                setCustomerSearchQuery('');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Failed to create order. Please try again.');
        }
    };

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('customers')
                .insert([{
                    name: newCustomerForm.name,
                    email: newCustomerForm.email,
                    phone: newCustomerForm.phone
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newCustomer: Customer = {
                    id: data.id,
                    name: data.name,
                    email: data.email || '',
                    phone: data.phone || '',
                    ordersCount: 0,
                    totalSpent: 0,
                    lastOrderDate: ''
                };
                setCustomers([newCustomer, ...customers]);
                setIsNewCustomerModalOpen(false);
                setNewCustomerForm({ name: '', email: '', phone: '' });
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Failed to create customer.');
        }
    };

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
            const { error } = await supabase.from('orders').delete().eq('id', id);
            if (error) throw error;

            setOrders(orders.filter(o => o.id !== id));
            setOpenMenuId(null);
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Failed to delete order.');
        }
    };

    const updateStatus = async (id: string, newStatus: OrderStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
            setOpenMenuId(null);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status.');
        }
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

    const OrdersTable = ({ limit }: { limit?: number }) => {
        const displayOrders = limit ? orders.slice(0, limit) : orders;

        return (
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <h3 className="font-bold text-gray-900 text-lg">{limit ? 'Recent Orders' : 'All Orders'}</h3>
                    {limit && (
                        <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center">
                            View All <ArrowRightIcon />
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-stone-50 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                                <th className="px-6 py-4">Customer Name</th>
                                <th className="px-6 py-4">Cloth Type</th>
                                <th className="px-6 py-4">Delivery Date</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {displayOrders.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No orders found.</td></tr>
                            ) : displayOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center text-xs font-bold mr-3 ${order.isUrgent ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {order.initial}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-900 block">{order.customerName}</span>
                                                {order.isUrgent && <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Urgent</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">{order.clothType}</td>
                                    <td className="px-6 py-4 text-gray-500">{order.deliveryDate}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{currencySymbol}{order.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === order.id ? null : order.id); }}
                                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                        </button>

                                        {/* Action Dropdown */}
                                        {openMenuId === order.id && (
                                            <div className="absolute right-8 top-8 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                <div className="py-1">
                                                    <button onClick={() => updateStatus(order.id, 'Processing')} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">Set Processing</button>
                                                    <button onClick={() => updateStatus(order.id, 'Cutting')} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">Set Cutting</button>
                                                    <button onClick={() => updateStatus(order.id, 'Fitting')} className="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">Set Fitting</button>
                                                    <button onClick={() => updateStatus(order.id, 'Ready')} className="block w-full text-left px-4 py-2 text-xs text-emerald-600 hover:bg-emerald-50 font-medium">Mark Ready</button>
                                                    <button onClick={() => updateStatus(order.id, 'Completed')} className="block w-full text-left px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 font-bold">Mark Completed</button>
                                                    <div className="border-t border-gray-100 my-1"></div>
                                                    <button onClick={() => deleteOrder(order.id)} className="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-bold flex items-center">
                                                        <span className="mr-2"><TrashIcon /></span> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full min-h-screen font-sans bg-[#fdfbf7]">

            {/* Sidebar */}
            <aside className="w-64 bg-denim flex-shrink-0 flex flex-col relative z-20 h-screen sticky top-0">
                {/* Selvedge Strip */}
                <div className="absolute right-0 top-0 bottom-0 h-full flex flex-row">
                    <div className="h-full w-[2px] bg-red-600/90 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                    <div className="h-full w-[2px] bg-white opacity-80"></div>
                    <div className="h-full w-[2px] bg-red-600/90 shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
                </div>

                {/* Logo */}
                <div className="h-24 flex items-center px-6 border-b border-white/5 relative">
                    <div className="w-10 h-10 rounded-lg bg-[#2a303c] flex items-center justify-center mr-3 border border-gray-600 shadow-inner">
                        <span className="text-orange-500"><SidebarIcon name="scissors" /></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-lg leading-tight tracking-tight">Indigo Denim</span>
                        <span className="text-gray-400 text-[10px] uppercase tracking-widest">Management</span>
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
                <div className="p-4 mb-2">
                    <div className="flex items-center p-3 rounded-xl bg-[#00000033] border border-white/5 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-800 font-bold border-2 border-orange-400/30">
                            JD
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">John Doe</p>
                            <p className="text-xs text-gray-400 truncate">Master Tailor</p>
                        </div>
                        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white hover:bg-white/10 p-1 rounded transition-colors" title="Logout">
                            <SidebarIcon name="logout" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#fdfbf7] relative h-screen">
                {/* Texture Overlay */}
                <div className="absolute inset-0 z-0 card-texture pointer-events-none opacity-40"></div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-8 pb-32">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
                                    {activeTab === 'dashboard' ? 'Workshop Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                </h1>
                                <p className="text-gray-500 mt-1 font-medium">
                                    {activeTab === 'dashboard' ? 'Welcome back, Master Tailor.' : `Manage your ${activeTab}.`}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsNewOrderModalOpen(true)}
                                className="bg-gradient-to-r from-orange-400 to-amber-600 hover:from-orange-500 hover:to-amber-700 text-white px-6 py-3 rounded-lg shadow-lg shadow-orange-500/20 font-bold uppercase tracking-wide text-sm flex items-center transform transition active:scale-95"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                New Order
                            </button>
                        </div>

                        {/* View: Dashboard */}
                        {activeTab === 'dashboard' && (
                            <>
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Total Customers', val: totalCustomers.toLocaleString(), sub: '+12%', subText: 'from last month', subColor: 'text-emerald-500', iconType: 'users' },
                                        { label: 'Active Orders', val: activeOrdersCount.toString(), sub: `! ${urgentOrdersCount} Urgent`, subText: 'orders pending', subColor: 'text-orange-500 font-bold', iconType: 'orders' },
                                        { label: "Today's Deliveries", val: completedToday.toString(), sub: '🕒 3 Completed', subText: '', subColor: 'text-slate-500', iconType: 'delivery' },
                                        { label: 'Total Revenue', val: `${currencySymbol}${totalRevenue.toLocaleString()}`, sub: `⚠ ${overdueCount} Overdue`, subText: 'payments', subColor: 'text-red-500 font-bold', iconType: 'money' },
                                    ].map((stat, idx) => (
                                        <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-stone-100 flex justify-between items-start relative overflow-hidden group hover:shadow-md transition-shadow">
                                            <div className="absolute left-0 top-3 bottom-3 w-[4px] border-l-2 border-dashed border-red-400"></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                                <h3 className="text-3xl font-black text-gray-900 mb-2">{stat.val}</h3>
                                                <p className="text-xs font-medium text-gray-500">
                                                    <span className={`${stat.subColor} mr-1`}>{stat.sub}</span> {stat.subText}
                                                </p>
                                            </div>
                                            <StatIcon type={stat.iconType} />
                                        </div>
                                    ))}
                                </div>

                                <OrdersTable limit={5} />
                            </>
                        )}

                        {/* View: Orders */}
                        {activeTab === 'orders' && (
                            <OrdersTable />
                        )}

                        {/* View: Customers (Plug) */}
                        {activeTab === 'customers' && (
                            <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-8 text-center text-gray-400">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">Customer Directory</p>
                                        <p className="text-sm">Manage contacts, measurements, and history.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsNewCustomerModalOpen(true)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Add Customer
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left">
                                    {customers.map(c => (
                                        <div key={c.id} className="p-4 border rounded-lg hover:bg-gray-50">
                                            <h4 className="font-bold text-gray-900">{c.name}</h4>
                                            <p className="text-xs text-gray-500">{c.email} • {c.phone}</p>
                                            <div className="mt-2 text-xs flex justify-between">
                                                <span>{c.ordersCount} Orders</span>
                                                <span className="text-orange-600 font-bold">{currencySymbol}{c.totalSpent} Spent</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* View: Settings */}
                        {activeTab === 'settings' && (
                            <div className="max-w-4xl mx-auto">
                                <form onSubmit={handleSaveSettings} className="space-y-6">
                                    {/* Workshop Details Card */}
                                    <div className="bg-white rounded-xl shadow-sm border border-stone-100 relative overflow-hidden">
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

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Shop Name</label>
                                                    <input type="text" value={settingsForm.shopName} onChange={e => setSettingsForm({ ...settingsForm, shopName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-900 font-medium transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Master Tailor</label>
                                                    <input type="text" value={settingsForm.masterTailor} onChange={e => setSettingsForm({ ...settingsForm, masterTailor: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-900 font-medium transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                                                    <input type="tel" value={settingsForm.phone} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-900 font-medium transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preferences Card */}
                                    <div className="bg-white rounded-xl shadow-sm border border-stone-100 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-stone-400"></div>
                                        <div className="p-8">
                                            <div className="flex items-center mb-8">
                                                <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-stone-600 mr-4">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">System Preferences</h3>
                                                    <p className="text-sm text-gray-500 font-medium">Customize your dashboard experience.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSettingsForm({ ...settingsForm, notifications: !settingsForm.notifications })}>
                                                    <div className="flex items-center">
                                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settingsForm.notifications ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${settingsForm.notifications ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <p className="text-sm font-bold text-gray-900">Email Notifications</p>
                                                            <p className="text-xs text-gray-500">Receive updates about new orders and urgent deadlines.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Currency selection removed */}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Save Bar */}
                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSavingSettings}
                                            className="bg-gray-900 text-white px-8 py-3 rounded-lg shadow-lg hover:bg-black font-bold uppercase tracking-wide text-sm flex items-center transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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
                                </form>
                            </div>
                        )}

                        {/* View: Reports (Placeholder) */}
                        {activeTab === 'reports' && (
                            <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl">
                                <div className="text-center">
                                    <p className="text-gray-400 font-bold text-xl uppercase mb-2">Work in Progress</p>
                                    <p className="text-gray-400 text-sm">This section is currently under construction.</p>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="text-center pt-8 pb-4">
                            <p className="text-gray-300 text-xs font-medium">© 2024 Indigo Denim & Copper. Craftsman Dashboard v1.0</p>
                        </div>

                    </div>
                )}
            </main>

            {/* New Customer Modal */}
            {isNewCustomerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#fffdf9] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-white/50 relative animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-orange-100/50 bg-white/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Add Customer</h2>
                                    <p className="text-slate-500 text-sm mt-1">Add a new client to your directory.</p>
                                </div>
                                <button onClick={() => setIsNewCustomerModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            <form onSubmit={handleCreateCustomer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCustomerForm.name}
                                        onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                        placeholder="e.g. Jane Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={newCustomerForm.phone}
                                        onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                        placeholder="e.g. (555) 000-0000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={newCustomerForm.email}
                                        onChange={e => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                                        placeholder="e.g. jane@example.com"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewCustomerModalOpen(false)}
                                        className="px-5 py-2.5 text-slate-500 font-bold text-sm bg-white border border-stone-200 rounded-lg hover:bg-stone-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-lg shadow-lg shadow-orange-500/20"
                                    >
                                        Save Customer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* New Order Modal */}
            {isNewOrderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#fffdf9] rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-white/50 relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-orange-100/50 bg-white/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">New Order</h2>
                                    <p className="text-slate-500 text-sm mt-1">Create a new tailoring request for customer.</p>
                                </div>
                                <button onClick={() => setIsNewOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Form Content */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
                            <form id="new-order-form" onSubmit={handleCreateOrder}>
                                {/* Customer Selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest pb-2 border-b border-orange-100/50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        Customer Information
                                    </div>
                                    <div className="bg-white rounded-xl border border-stone-200 p-1.5 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-orange-100 relative">
                                        <input
                                            type="text"
                                            required
                                            value={customerSearchQuery}
                                            onChange={e => {
                                                setCustomerSearchQuery(e.target.value);
                                                setNewOrderForm({ ...newOrderForm, customerName: e.target.value, customerId: null });
                                                setShowCustomerSuggestions(true);
                                            }}
                                            onFocus={() => setShowCustomerSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                                            className="w-full px-4 py-3 bg-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400"
                                            placeholder="Search existing customer or type new name..."
                                            autoComplete="off"
                                        />
                                        {/* Autocomplete Dropdown */}
                                        {showCustomerSuggestions && filteredCustomers.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                                {filteredCustomers.map(c => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => selectCustomer(c)}
                                                        className="px-4 py-2 hover:bg-orange-50 cursor-pointer text-sm text-slate-700 font-medium flex justify-between group"
                                                    >
                                                        <span>{c.name}</span>
                                                        <span className="text-slate-400 text-xs group-hover:text-orange-500">{c.phone}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Item Details */}
                                <div className="pt-2 space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest pb-2 border-b border-orange-100/50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 011 12V7a4 4 0 014-4z" /></svg>
                                        Item Details
                                    </div>
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cloth Type</label>
                                            <div className="relative">
                                                <select
                                                    value={newOrderForm.clothType}
                                                    onChange={e => setNewOrderForm({ ...newOrderForm, clothType: e.target.value })}
                                                    className="w-full appearance-none bg-white border border-stone-200 text-slate-800 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-3 pr-8 shadow-sm"
                                                >
                                                    <option value="" disabled>Select cloth type</option>
                                                    <option value="Premium Italian Wool">Premium Italian Wool</option>
                                                    <option value="Egyptian Cotton">Egyptian Cotton</option>
                                                    <option value="Linen Blend">Linen Blend</option>
                                                    <option value="Silk">Silk</option>
                                                    <option value="Denim">Denim</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={newOrderForm.quantity}
                                                    onChange={e => setNewOrderForm({ ...newOrderForm, quantity: parseInt(e.target.value) || 1 })}
                                                    className="bg-white border border-stone-200 text-slate-800 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-3 shadow-sm"
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-sm font-medium">
                                                    pcs
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cloth Source */}
                                <div className="pt-2 space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest pb-2 border-b border-orange-100/50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        Cloth Source
                                    </div>
                                    <div className="flex bg-stone-100 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setNewOrderForm({ ...newOrderForm, clothSource: 'Customer' })}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newOrderForm.clothSource === 'Customer' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Customer's Cloth
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewOrderForm({ ...newOrderForm, clothSource: 'Shop' })}
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newOrderForm.clothSource === 'Shop' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Shop's Cloth
                                        </button>
                                    </div>
                                </div>

                                {/* Schedule */}
                                <div className="pt-2 space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest pb-2 border-b border-orange-100/50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        Schedule
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Order Date</label>
                                            <input
                                                type="date"
                                                value={newOrderForm.orderDate}
                                                onChange={e => setNewOrderForm({ ...newOrderForm, orderDate: e.target.value })}
                                                className="bg-white border border-stone-200 text-slate-800 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-3 shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={newOrderForm.deliveryDate}
                                                onChange={e => setNewOrderForm({ ...newOrderForm, deliveryDate: e.target.value })}
                                                className="bg-white border border-stone-200 text-slate-800 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-3 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment & Status */}
                                <div className="pt-2 space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest pb-2 border-b border-orange-100/50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Payment & Status
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 pb-2">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Amount</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-medium">
                                                    ₹
                                                </div>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    value={newOrderForm.amount}
                                                    onChange={e => setNewOrderForm({ ...newOrderForm, amount: e.target.value })}
                                                    className="bg-white border border-stone-200 text-slate-800 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-3 pl-7 shadow-sm placeholder:text-slate-300"
                                                    placeholder="0.00"
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-xs font-medium">
                                                    {settingsForm.currency}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Advance Paid</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-medium">
                                                    ₹
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={newOrderForm.advancePaid}
                                                    onChange={e => setNewOrderForm({ ...newOrderForm, advancePaid: e.target.value })}
                                                    className="bg-white border border-stone-200 text-slate-800 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-3 pl-7 shadow-sm placeholder:text-slate-300"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Remaining Balance</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-medium">
                                                    ₹
                                                </div>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={remainingBalance.toFixed(2)}
                                                    className="bg-orange-50 border border-orange-100 text-slate-800 text-sm rounded-lg block w-full p-3 pl-7 shadow-sm font-bold opacity-80 cursor-not-allowed"
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-orange-400">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Initial Status</label>
                                            <div className="relative">
                                                <select
                                                    value={newOrderForm.status}
                                                    onChange={e => setNewOrderForm({ ...newOrderForm, status: e.target.value })}
                                                    className="w-full appearance-none bg-white border border-stone-200 text-slate-800 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-3 pr-8 shadow-sm"
                                                >
                                                    <option value="Received">Received</option>
                                                    <option value="Processing">Processing</option>
                                                    <option value="Cutting">Cutting</option>
                                                    <option value="Fitting">Fitting</option>
                                                    <option value="Ready">Ready</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer Buttons */}
                        <div className="px-8 py-5 bg-white border-t border-stone-100 flex justify-end items-center gap-3">
                            <button
                                onClick={() => setIsNewOrderModalOpen(false)}
                                className="px-6 py-2.5 text-slate-500 font-bold text-sm bg-white border border-stone-200 rounded-lg hover:bg-stone-50 hover:text-slate-700 transition w-auto"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="new-order-form"
                                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-lg shadow-lg shadow-orange-500/20 flex items-center gap-2 transition transform active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                Save Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
