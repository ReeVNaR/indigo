"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase';
import { Customer, Order, OrderStatus } from '@/lib/types';
import {
    Search,
    User,
    ChevronRight,
    ChevronLeft,
    Check,
    Calendar,
    CreditCard,
    AlertCircle,
    ShoppingBag,
    Plus
} from "lucide-react";

export const GARMENT_OPTIONS = [
    'Shirt', 'Pant', 'Kurta', 'Blazer', 'Suit', 'Safari', 'Waistcoat', 'Jacket', 'Sherwani'
] as const;
export type GarmentType = typeof GARMENT_OPTIONS[number];

interface NewOrderFormProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onOrderCreated: (order: Order, customer?: Customer) => void;
    customers: Customer[];
}

export default function NewOrderForm({ isOpen, onOpenChange, onOrderCreated, customers }: NewOrderFormProps) {
    // ─── STATE ───
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

    // Form Data
    const [newOrderForm, setNewOrderForm] = useState({
        customerId: null as string | null,
        customerData: {
            name: '',
            phone: '',
            category: 'Adult' as 'Adult' | 'Kid'
        },
        showInlineCustomerForm: false, // For creating new customer
        items: [] as {
            garment_type: GarmentType,
            quantity: number,
            price: number,
            fabric_source: 'Customer' | 'Shop'
        }[],
        clothSource: 'Customer' as 'Customer' | 'Shop',
        deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        advancePaid: 0,
        status: 'Received' as OrderStatus,
        isUrgent: false
    });

    // Validations & UI State
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setCurrentStep(1);
            setCustomerSearchQuery('');
            setShowCustomerSuggestions(false);
            setNewOrderForm({
                customerId: null,
                customerData: { name: '', phone: '', category: 'Adult' },
                showInlineCustomerForm: false,
                items: [],
                clothSource: 'Customer',
                deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                advancePaid: 0,
                status: 'Received',
                isUrgent: false
            });
        }
    }, [isOpen]);

    // ─── DERIVED VALUES ───
    const filteredCustomers = useMemo(() => {
        if (!customerSearchQuery) return [];
        return customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()));
    }, [customers, customerSearchQuery]);

    const totalAmount = useMemo(() => {
        return newOrderForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }, [newOrderForm.items]);

    const itemsRemainingBalance = useMemo(() => {
        return Math.max(0, totalAmount - newOrderForm.advancePaid);
    }, [totalAmount, newOrderForm.advancePaid]);

    const handleGlobalClothSourceChange = (source: 'Customer' | 'Shop') => {
        setNewOrderForm(p => ({
            ...p,
            clothSource: source,
            items: p.items.map(i => ({ ...i, fabric_source: source }))
        }));
    };


    // ─── ACTIONS ───
    const handleSelectCustomer = (customer: Customer) => {
        setNewOrderForm(prev => ({
            ...prev,
            customerId: customer.id,
            customerData: { name: customer.name, phone: customer.phone, category: 'Adult' },
            showInlineCustomerForm: false
        }));
        setCustomerSearchQuery(customer.name);
        setShowCustomerSuggestions(false);
    };

    const handleCreateNewCustomerParams = () => {
        setNewOrderForm(prev => ({
            ...prev,
            customerId: null,
            showInlineCustomerForm: true,
            customerData: { ...prev.customerData, name: customerSearchQuery }
        }));
        setShowCustomerSuggestions(false);
    };

    const toggleGarment = (type: GarmentType) => {
        const idx = newOrderForm.items.findIndex(i => i.garment_type === type);
        if (idx !== -1) {
            // Remove
            setNewOrderForm(p => ({ ...p, items: p.items.filter(i => i.garment_type !== type) }));
        } else {
            // Add with current cloth source as default
            setNewOrderForm(p => ({
                ...p,
                items: [...p.items, { garment_type: type, quantity: 1, price: 0, fabric_source: p.clothSource }]
            }));
        }
    };

    const updateItem = (type: GarmentType, field: 'quantity' | 'price', value: number) => {
        setNewOrderForm(p => ({
            ...p,
            items: p.items.map(i => i.garment_type === type ? { ...i, [field]: value } : i)
        }));
    };

    const handleSaveOrder = async () => {
        setIsSaving(true);
        try {
            let finalCustomerId = newOrderForm.customerId;
            let newCustomer: Customer | undefined;

            // 1. Create customer if needed
            if (!finalCustomerId && newOrderForm.customerData.name) {
                const { data: customer, error: custError } = await supabase
                    .from('customers')
                    .insert([{
                        name: newOrderForm.customerData.name,
                        phone: newOrderForm.customerData.phone,
                        email: `${newOrderForm.customerData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`
                    }])
                    .select()
                    .single();

                if (custError) throw custError;

                finalCustomerId = customer.id;
                newCustomer = {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email || '',
                    phone: customer.phone || '',
                    ordersCount: 0,
                    totalSpent: 0,
                    lastOrderDate: ''
                };
            }

            if (!finalCustomerId) throw new Error("No customer identified");

            // 2. Create Order
            const newOrderPayload = {
                customer_id: finalCustomerId,
                customer_name: newOrderForm.customerData.name,
                delivery_date: newOrderForm.deliveryDate,
                order_date: new Date().toISOString().split('T')[0],
                amount: totalAmount,
                advance_paid: newOrderForm.advancePaid,
                status: newOrderForm.status,
                is_urgent: newOrderForm.isUrgent,
                cloth_type: newOrderForm.items.map(i => i.garment_type).join(', '),
                quantity: newOrderForm.items.reduce((s, i) => s + i.quantity, 0),
                cloth_source: newOrderForm.items[0]?.fabric_source || 'Customer'
            };

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([newOrderPayload])
                .select()
                .single();

            if (orderError) throw orderError;

            // 3. Create Order Items
            if (newOrderForm.items.length > 0) {
                const itemsPayload = newOrderForm.items.map(item => ({
                    order_id: orderData.id,
                    garment_type: item.garment_type,
                    quantity: item.quantity,
                    price: item.price,
                    fabric_source: item.fabric_source
                }));

                const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
                if (itemsError) console.warn('Order items table might not exist or error:', itemsError.message);
            }

            // 4. Callback
            const initials = orderData.customer_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
            const newOrder: Order = {
                id: orderData.id,
                customerName: orderData.customer_name,
                initial: initials || 'XX',
                clothType: orderData.cloth_type,
                deliveryDate: orderData.delivery_date,
                amount: orderData.amount,
                status: orderData.status as OrderStatus,
                isUrgent: orderData.is_urgent,
                quantity: orderData.quantity,
                orderDate: orderData.order_date,
                advancePaid: orderData.advance_paid,
                clothSource: orderData.cloth_source
            };

            onOrderCreated(newOrder, newCustomer);
            onOpenChange(false);

        } catch (error) {
            console.error('Error saving order:', error);
            alert('Failed to save order.');
        } finally {
            setIsSaving(false);
        }
    };


    // ─── RENDERERS ───

    // Step 1: Customer
    const canProceedStep1 = newOrderForm.customerId || (newOrderForm.showInlineCustomerForm && newOrderForm.customerData.name.length > 2);

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-[#131c3f]">Who is this order for?</h3>
                <p className="text-sm text-slate-500">Search existing customers or create a new profile.</p>
            </div>

            {/* Selected Customer View */}
            {(newOrderForm.customerId && !newOrderForm.showInlineCustomerForm) ? (
                <div className="bg-amber-50/50 border border-amber-200/50 shadow-sm rounded-xl p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-amber-100/50 border border-amber-200/50 flex items-center justify-center">
                        <User className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="text-center">
                        <h4 className="text-xl font-bold text-[#131c3f]">{newOrderForm.customerData.name}</h4>
                        <p className="text-sm font-medium text-slate-500">{newOrderForm.customerData.phone || 'No phone number'}</p>
                    </div>
                    <button
                        onClick={() => { setNewOrderForm(p => ({ ...p, customerId: null })); setCustomerSearchQuery(''); }}
                        className="text-xs font-bold text-slate-400 hover:text-orange-600 uppercase tracking-widest transition-colors mt-2"
                    >
                        Change Customer
                    </button>
                </div>
            ) : newOrderForm.showInlineCustomerForm ? (
                // New Customer Form
                <div className="bg-amber-50/50 border border-amber-200/50 shadow-sm rounded-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-[#131c3f] uppercase tracking-wide">New Customer Details</h4>
                        <button onClick={() => setNewOrderForm(p => ({ ...p, showInlineCustomerForm: false }))} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={newOrderForm.customerData.name}
                                onChange={e => setNewOrderForm(p => ({ ...p, customerData: { ...p.customerData, name: e.target.value } }))}
                                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#131c3f] focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all shadow-sm"
                                placeholder="Enter name"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                            <input
                                type="tel"
                                value={newOrderForm.customerData.phone}
                                onChange={e => setNewOrderForm(p => ({ ...p, customerData: { ...p.customerData, phone: e.target.value } }))}
                                className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#131c3f] focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all shadow-sm"
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                // Search Box
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Start typing name..."
                            value={customerSearchQuery}
                            onChange={e => { setCustomerSearchQuery(e.target.value); setShowCustomerSuggestions(true); }}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-medium text-[#131c3f] outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 focus:bg-white transition-all shadow-sm"
                        />
                    </div>

                    {/* Suggestions */}
                    {showCustomerSuggestions && customerSearchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-10 overflow-hidden max-h-60 overflow-y-auto">
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelectCustomer(c)}
                                        className="w-full px-5 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-black group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#131c3f]">{c.name}</p>
                                                <p className="text-xs text-slate-400">{c.phone}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500" />
                                    </button>
                                ))
                            ) : (
                                <button
                                    onClick={handleCreateNewCustomerParams}
                                    className="w-full px-5 py-4 text-left hover:bg-amber-50 flex items-center gap-3 group transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-amber-100/50 text-amber-600 flex items-center justify-center ring-1 ring-amber-200/50">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-amber-700">Create new customer &quot;{customerSearchQuery}&quot;</p>
                                        <p className="text-xs text-amber-500/80">Click to add details</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // Step 2: Garments
    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-[#131c3f]">Select Garments</h3>
                <p className="text-sm text-slate-500">Choose items and enter details.</p>
            </div>

            <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-500">Cloth Source</span>
                    <div className="inline-flex bg-slate-100 rounded-full p-0.5">
                        <button
                            type="button"
                            onClick={() => handleGlobalClothSourceChange('Customer')}
                            className={`px-3 py-0.5 rounded-full transition-colors ${newOrderForm.clothSource === 'Customer'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-slate-500'
                                }`}
                        >
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => handleGlobalClothSourceChange('Shop')}
                            className={`px-3 py-0.5 rounded-full transition-colors ${newOrderForm.clothSource === 'Shop'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-slate-500'
                                }`}
                        >
                            Shop
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {GARMENT_OPTIONS.map(type => {
                    const item = newOrderForm.items.find(i => i.garment_type === type);
                    const isSelected = !!item;

                    return (
                        <div
                            key={type}
                            className={`
                                relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                ${isSelected ? 'border-[#131c3f] bg-amber-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm'}
                            `}
                            onClick={(e) => {
                                // Prevent toggling if clicking inputs
                                if ((e.target as HTMLElement).tagName === 'INPUT') return;
                                toggleGarment(type);
                            }}
                        >
                            {isSelected && (
                                <div className="absolute top-3 right-3 text-amber-600 bg-amber-100 rounded-full p-0.5 shadow-sm">
                                    <Check className="w-3 h-3 stroke-[4]" />
                                </div>
                            )}

                            <div className="mb-4">
                                <span className={`text-sm font-black uppercase tracking-wider ${isSelected ? 'text-[#131c3f]' : 'text-slate-400'}`}>
                                    {type}
                                </span>
                            </div>

                            {isSelected ? (
                                <div className="space-y-2 mt-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex items-center justify-between bg-white rounded-md border border-slate-200 p-1">
                                        <span className="text-[10px] font-bold text-slate-400 pl-2">QTY</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={e => updateItem(type, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-12 text-right text-sm font-bold outline-none text-[#131c3f]"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between bg-white rounded-md border border-slate-200 p-1">
                                        <span className="text-[10px] font-bold text-slate-400 pl-2">₹</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.price}
                                            onChange={e => updateItem(type, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-16 text-right text-sm font-bold outline-none text-[#131c3f]"
                                            placeholder="Price"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Cloth</span>
                                        <div className="inline-flex items-center bg-slate-100 rounded-full p-0.5 text-[9px] font-bold">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewOrderForm(p => ({
                                                        ...p,
                                                        items: p.items.map(i =>
                                                            i.garment_type === type ? { ...i, fabric_source: 'Customer' } : i
                                                        )
                                                    }));
                                                }}
                                                className={`px-3 py-0.5 rounded-full transition-colors ${item.fabric_source === 'Customer'
                                                        ? 'bg-amber-500 text-white shadow-sm'
                                                        : 'text-slate-500'
                                                    }`}
                                            >
                                                Customer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewOrderForm(p => ({
                                                        ...p,
                                                        items: p.items.map(i =>
                                                            i.garment_type === type ? { ...i, fabric_source: 'Shop' } : i
                                                        )
                                                    }));
                                                }}
                                                className={`px-3 py-0.5 rounded-full transition-colors ${item.fabric_source === 'Shop'
                                                        ? 'bg-amber-500 text-white shadow-sm'
                                                        : 'text-slate-500'
                                                    }`}
                                            >
                                                Shop
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-auto h-[66px] flex items-center justify-center text-slate-200">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Total Footer inside step */}
            {newOrderForm.items.length > 0 && (
                <div className="bg-white border border-amber-200 rounded-xl p-4 flex justify-between items-center shadow-sm animate-in fade-in duration-300">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">Total Estimated</span>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-slate-400">₹</span>
                        <span className="text-sm font-black text-slate-800">
                            {totalAmount.toLocaleString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );

    // Step 3: Review & Terms
    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-[#131c3f]">Finalize Order</h3>
                <p className="text-sm text-slate-500">Set delivery & payment details.</p>
            </div>

            <div className="bg-slate-50/50 rounded-xl p-1 border border-slate-100 space-y-1">
                {/* Summary Row */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-slate-100 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100/50 text-amber-600 flex items-center justify-center font-bold text-xs ring-1 ring-amber-200/50">
                            {newOrderForm.customerData.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#131c3f]">{newOrderForm.customerData.name}</p>
                            <p className="text-xs text-slate-400">{newOrderForm.items.length} items · ₹{totalAmount}</p>
                        </div>
                    </div>
                    <button onClick={() => setCurrentStep(1)} className="text-xs font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest">Edit</button>
                </div>

                {/* Date Picker */}
                <div className="p-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Delivery Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            value={newOrderForm.deliveryDate}
                            onChange={e => setNewOrderForm(p => ({ ...p, deliveryDate: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#131c3f] outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Advance and Balance */}
                <div className="p-3 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Advance Paid</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                            <input
                                type="number"
                                value={newOrderForm.advancePaid}
                                onChange={e => setNewOrderForm(p => ({ ...p, advancePaid: parseFloat(e.target.value) || 0 }))}
                                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#131c3f] outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Balance Due</label>
                        <div className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-black shadow-sm ${itemsRemainingBalance > 0 ? 'text-red-500' : 'text-amber-600'}`}>
                            ₹{itemsRemainingBalance}
                        </div>
                    </div>
                </div>

                {/* Urgent Toggle */}
                <div className="p-3 flex items-center justify-between border-t border-slate-200/50 mt-2 pt-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className={`w-4 h-4 ${newOrderForm.isUrgent ? 'text-red-500' : 'text-slate-400'}`} />
                        <span className={`text-sm font-bold ${newOrderForm.isUrgent ? 'text-red-600' : 'text-slate-500'}`}>Mark as Urgent</span>
                    </div>
                    <button
                        onClick={() => setNewOrderForm(p => ({ ...p, isUrgent: !p.isUrgent }))}
                        className={`h-6 w-11 rounded-full relative transition-colors ${newOrderForm.isUrgent ? 'bg-red-500' : 'bg-slate-200'}`}
                    >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${newOrderForm.isUrgent ? 'translate-x-5' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white p-0 overflow-hidden border border-slate-200 shadow-2xl rounded-2xl">
                {/* Stepper Header */}
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <DialogTitle className="text-sm font-black text-[#131c3f] uppercase tracking-widest">New Order</DialogTitle>
                        <div className="text-xs font-bold text-slate-400">Step {currentStep} of 3</div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-400 to-amber-600 transition-all duration-300 ease-out"
                            style={{ width: `${(currentStep / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 h-[420px] overflow-y-auto">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                </div>

                {/* Footer Navigation */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    {currentStep === 1 ? (
                        <button onClick={() => onOpenChange(false)} className="text-xs font-black text-slate-400 hover:text-slate-700 uppercase tracking-widest">
                            Cancel
                        </button>
                    ) : (
                        <button onClick={() => setCurrentStep(prev => (prev - 1) as 1 | 2 | 3)} className="flex items-center gap-1 text-xs font-black text-slate-500 hover:text-[#131c3f] uppercase tracking-widest transition-colors">
                            <ChevronLeft className="w-3 h-3" /> Back
                        </button>
                    )}

                    {currentStep < 3 ? (
                        <button
                            onClick={() => setCurrentStep(prev => (prev + 1) as 1 | 2 | 3)}
                            disabled={currentStep === 1 ? !canProceedStep1 : newOrderForm.items.length === 0}
                            className="bg-gradient-to-r from-orange-400 to-amber-600 hover:from-orange-500 hover:to-amber-700 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
                        >
                            Next <ChevronRight className="w-3 h-3" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSaveOrder}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-orange-400 to-amber-600 hover:from-orange-500 hover:to-amber-700 text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSaving ? 'Saving...' : 'Confirm Order'}
                        </button>
                    )}
                </div>

            </DialogContent>
        </Dialog>
    );
}
