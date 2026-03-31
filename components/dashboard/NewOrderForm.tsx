"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
    Plus,
    X,
    Scissors,
    Trash2,
    History,
    Copy,
    ArrowUpRight
} from "lucide-react";

interface NewOrderFormProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onOrderCreated: (order: Order, customer?: Customer) => void;
    customers: Customer[];
    orders: Order[];
}

export default function NewOrderForm({ isOpen, onOpenChange, onOrderCreated, customers, orders }: NewOrderFormProps) {
    // ─── STATE ───
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
    const [editingMeasurementsType, setEditingMeasurementsType] = useState<string | null>(null);

    // Form Data
    const [newOrderForm, setNewOrderForm] = useState({
        customerId: null as string | null,
        customerData: {
            name: '',
            phone: '',
            address: '',
            notes: '',
            category: 'Adult' as 'Adult' | 'Kid'
        },
        measurements: {} as Customer['measurements'],
        showInlineCustomerForm: false,
        items: [] as {
            garment_type: 'Shirt' | 'Pant' | 'Kurta' | 'Suit' | 'Vest' | 'Custom',
            custom_name?: string,
            quantity: number,
            price: number,
            fabric_source: 'Customer' | 'Shop'
        }[],
        deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        advancePaid: 0,
        status: 'Received' as OrderStatus,
        isUrgent: false
    });

    // Validations & UI State
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
    const [isSaving, setIsSaving] = useState(false);
    const [customCategory, setCustomCategory] = useState<'top' | 'bottom'>('top');
    const [isAddingExtraField, setIsAddingExtraField] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setCurrentStep(1);
            setCustomerSearchQuery('');
            setShowCustomerSuggestions(false);
            setFocusedSuggestionIndex(-1);
            setNewOrderForm({
                customerId: null,
                customerData: { name: '', phone: '', address: '', notes: '', category: 'Adult' },
                measurements: {},
                showInlineCustomerForm: false,
                items: [],
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

    // Reset focused index when suggestions change
    useEffect(() => {
        setFocusedSuggestionIndex(-1);
    }, [filteredCustomers]);

    const totalAmount = useMemo(() => {
        return newOrderForm.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    }, [newOrderForm.items]);

    const itemsRemainingBalance = useMemo(() => {
        return Math.max(0, totalAmount - newOrderForm.advancePaid);
    }, [totalAmount, newOrderForm.advancePaid]);

    const canProceedStep1 = useMemo(() => {
        return !!(newOrderForm.customerId || (newOrderForm.showInlineCustomerForm && newOrderForm.customerData.name.length > 2));
    }, [newOrderForm.customerId, newOrderForm.showInlineCustomerForm, newOrderForm.customerData.name]);


    // ─── ACTIONS ───
    const handleSelectCustomer = (customer: Customer) => {
        setNewOrderForm(prev => ({
            ...prev,
            customerId: customer.id,
            customerData: {
                name: customer.name,
                phone: customer.phone,
                address: customer.address || '',
                notes: customer.notes || '',
                category: 'Adult'
            },
            measurements: customer.measurements || {},
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

    const handleProceed = () => {
        if (currentStep === 1 && !canProceedStep1) return;
        if (currentStep === 2 && newOrderForm.items.length === 0) return;
        if (isSaving) return;

        if (currentStep === 2) {
            const missing = newOrderForm.items.some(item => {
                const type = item.garment_type.toLowerCase();
                const m = (newOrderForm.measurements as any)?.[type];
                const hasData = m && Object.keys(m).filter(k => k !== 'lastUpdated').some(k => m[k] && m[k].toString().trim() !== '');
                return !hasData;
            });
            if (missing) setCurrentStep(3);
            else setCurrentStep(4);
        } else if (currentStep < 4) {
            setCurrentStep(prev => (prev + 1) as any);
        } else {
            handleSaveOrder();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Global Hotkeys
        if (e.ctrlKey && e.key === 'Enter' || e.metaKey && e.key === 'Enter') {
            e.preventDefault();
            handleProceed();
            return;
        }

        if (currentStep === 1) {
            if (!showCustomerSuggestions || !customerSearchQuery) return;

            const suggestionsCount = filteredCustomers.length;
            const totalOptions = suggestionsCount > 0 ? suggestionsCount : 1;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedSuggestionIndex(prev => (prev < totalOptions - 1 ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedSuggestionIndex(prev => (prev > 0 ? prev - 1 : totalOptions - 1));
            } else if (e.key === 'Enter') {
                if (focusedSuggestionIndex === -1 && suggestionsCount === 1) {
                    handleSelectCustomer(filteredCustomers[0]);
                    return;
                }

                if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < totalOptions) {
                    e.preventDefault();
                    if (suggestionsCount > 0) {
                        handleSelectCustomer(filteredCustomers[focusedSuggestionIndex]);
                    } else {
                        handleCreateNewCustomerParams();
                    }
                } else if (suggestionsCount === 0) {
                    e.preventDefault();
                    handleCreateNewCustomerParams();
                }
            } else if (e.key === 'Escape') {
                setShowCustomerSuggestions(false);
            }
        }
    };

    const toggleGarment = (type: 'Shirt' | 'Pant' | 'Kurta' | 'Suit' | 'Vest' | 'Custom') => {
        const idx = newOrderForm.items.findIndex(i => i.garment_type === type);
        if (idx !== -1) {
            setNewOrderForm(p => ({ ...p, items: p.items.filter(i => i.garment_type !== type) }));
        } else {
            setNewOrderForm(p => ({
                ...p,
                items: [...p.items, {
                    garment_type: type,
                    custom_name: type === 'Custom' ? 'Other' : undefined,
                    quantity: 1,
                    price: 0,
                    fabric_source: 'Customer'
                }]
            }));
        }
    };

    const updateItem = (type: string, field: string, value: any) => {
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

            if (!finalCustomerId && newOrderForm.customerData.name) {
                const custRes = await fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: newOrderForm.customerData.name,
                        phone: newOrderForm.customerData.phone,
                        address: newOrderForm.customerData.address,
                        notes: newOrderForm.customerData.notes,
                        email: `${newOrderForm.customerData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                        ordersCount: 0,
                        totalSpent: 0,
                        lastOrderDate: ''
                    })
                });

                if (!custRes.ok) throw new Error('Failed to create customer');
                const customerData = await custRes.json();
                finalCustomerId = customerData.id;
                newCustomer = { ...customerData, id: customerData.id };
            }

            if (!finalCustomerId) throw new Error("No customer identified");

            const newOrderPayload = {
                customerId: finalCustomerId,
                customerName: newOrderForm.customerData.name,
                deliveryDate: newOrderForm.deliveryDate,
                orderDate: new Date().toISOString().split('T')[0],
                amount: totalAmount,
                advancePaid: newOrderForm.advancePaid,
                status: newOrderForm.status,
                isUrgent: newOrderForm.isUrgent,
                clothType: newOrderForm.items.map(i => i.garment_type).join(', '),
                quantity: newOrderForm.items.reduce((s, i) => s + i.quantity, 0),
                clothSource: newOrderForm.items[0]?.fabric_source || 'Customer',
                measurementsSnapshot: newOrderForm.measurements
            };

            const orderRes = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrderPayload)
            });

            if (!orderRes.ok) throw new Error('Failed to create order');
            const orderData = await orderRes.json();
            const initials = orderData.customerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
            const newOrder: Order = { ...orderData, initial: initials || 'XX' };

            // Sync measurements to customer profile
            if (newOrderForm.measurements && Object.keys(newOrderForm.measurements).length > 0) {
                await fetch('/api/customers', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: finalCustomerId,
                        measurements: newOrderForm.measurements
                    })
                });
            }

            onOrderCreated(newOrder, newCustomer);
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error saving order:', error);
            alert(`Failed to save order: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // ─── RENDERERS ───

    const renderStep1 = () => (
        <div className="space-y-6 min-h-[350px]">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-[#131c3f] uppercase tracking-tight">Customer Information</h3>
                <p className="text-sm text-slate-500">Search existing customers or create a new profile.</p>
            </div>

            {newOrderForm.customerId && !newOrderForm.showInlineCustomerForm ? (
                <div className="bg-amber-50/50 border-2 border-amber-200 shadow-sm rounded-xl p-6 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center border-4 border-white shadow-md">
                        <User className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="text-center">
                        <h4 className="text-xl font-bold text-[#131c3f] tracking-tight">{newOrderForm.customerData.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">{newOrderForm.customerData.phone || 'No phone number'}</p>
                    </div>
                    <button
                        onClick={() => { setNewOrderForm(p => ({ ...p, customerId: null })); setCustomerSearchQuery(''); }}
                        className="text-[10px] font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest transition-colors mt-1"
                    >
                        Change Customer
                    </button>
                </div>
            ) : newOrderForm.showInlineCustomerForm ? (
                <div className="bg-white border-2 border-stone-100 shadow-xl rounded-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-[#131c3f] uppercase tracking-widest">New Customer Details</h4>
                        <button onClick={() => setNewOrderForm(p => ({ ...p, showInlineCustomerForm: false }))} className="text-[10px] font-bold text-slate-500 hover:text-slate-600">Cancel</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={newOrderForm.customerData.name}
                                onChange={e => setNewOrderForm(p => ({ ...p, customerData: { ...p.customerData, name: e.target.value } }))}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-lg text-sm font-bold text-[#131c3f] focus:border-amber-400 focus:bg-white outline-none transition-all"
                                placeholder="Enter name"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                            <input
                                type="tel"
                                value={newOrderForm.customerData.phone}
                                onChange={e => setNewOrderForm(p => ({ ...p, customerData: { ...p.customerData, phone: e.target.value } }))}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-lg text-sm font-bold text-[#131c3f] focus:border-amber-400 focus:bg-white outline-none transition-all"
                                placeholder="Optional"
                            />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Address</label>
                            <input
                                type="text"
                                value={newOrderForm.customerData.address}
                                onChange={e => setNewOrderForm(p => ({ ...p, customerData: { ...p.customerData, address: e.target.value } }))}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-lg text-sm font-bold text-[#131c3f] focus:border-amber-400 focus:bg-white outline-none transition-all"
                                placeholder="Enter address"
                            />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Notes</label>
                            <input
                                type="text"
                                value={newOrderForm.customerData.notes}
                                onChange={e => setNewOrderForm(p => ({ ...p, customerData: { ...p.customerData, notes: e.target.value } }))}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-lg text-sm font-bold text-[#131c3f] focus:border-amber-400 focus:bg-white outline-none transition-all"
                                placeholder="Special instructions or notes"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative max-w-xl mx-auto">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Find or add customer..."
                            value={customerSearchQuery}
                            onChange={e => { setCustomerSearchQuery(e.target.value); setShowCustomerSuggestions(true); }}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-12 pr-5 py-4 bg-white border-2 border-stone-100 rounded-xl text-lg font-medium text-[#131c3f] outline-none focus:border-amber-400 focus:ring-8 focus:ring-amber-400/5 transition-all shadow-sm"
                        />
                    </div>

                    {showCustomerSuggestions && customerSearchQuery && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-stone-100 rounded-2xl shadow-2xl z-20 overflow-hidden max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((c, idx) => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelectCustomer(c)}
                                        onMouseEnter={() => setFocusedSuggestionIndex(idx)}
                                        className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors border-b border-stone-50 last:border-none group ${focusedSuggestionIndex === idx ? 'bg-amber-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-colors ${focusedSuggestionIndex === idx ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600'}`}>
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-[#131c3f]">{c.name}</p>
                                                <p className="text-xs text-slate-500 font-medium">{c.phone || 'No phone'}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 transition-colors ${focusedSuggestionIndex === idx ? 'text-amber-500 translate-x-1' : 'text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1'}`} />
                                    </button>
                                ))
                            ) : (
                                <button
                                    onClick={handleCreateNewCustomerParams}
                                    onMouseEnter={() => setFocusedSuggestionIndex(0)}
                                    className={`w-full px-6 py-6 text-left flex items-center gap-4 group transition-colors ${focusedSuggestionIndex === 0 ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center border-2 border-amber-200/50">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-amber-700 uppercase tracking-tight">Create &quot;{customerSearchQuery}&quot;</p>
                                        <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mt-0.5">Add new customer to database</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-[#131c3f] uppercase tracking-tight">Customise Items</h3>
                <p className="text-xs text-slate-500">Pick garments and details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['Shirt', 'Pant', 'Kurta', 'Suit', 'Vest', 'Custom'] as const).map(type => {
                    const item = newOrderForm.items.find(i => i.garment_type === type);
                    const isSelected = !!item;

                    return (
                        <div
                            key={type}
                            tabIndex={0}
                            className={`
                                relative flex flex-col p-4 rounded-2xl border-2 transition-all duration-300 select-none cursor-pointer outline-none focus:ring-4 focus:ring-amber-400/20
                                ${isSelected
                                    ? 'border-[#131c3f] bg-white shadow-xl ring-4 ring-[#131c3f]/5'
                                    : 'border-stone-100 bg-white hover:border-amber-200 hover:shadow-lg'}
                            `}
                            onClick={(e) => {
                                if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
                                if (!isSelected) toggleGarment(type);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
                                    e.preventDefault();
                                    if (!isSelected) toggleGarment(type);
                                }
                            }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#131b2e] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <span className={`text-[11px] font-bold uppercase tracking-widest ${isSelected ? 'text-[#131c3f]' : 'text-slate-500'}`}>
                                        {type}
                                    </span>
                                </div>
                                {isSelected ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleGarment(type);
                                        }}
                                        className="text-white bg-[#131c3f] hover:bg-orange-500 rounded-full p-1.5 shadow-md animate-in zoom-in duration-300 transition-all active:scale-90"
                                    >
                                        <Check className="w-4 h-4 stroke-[3]" />
                                    </button>
                                ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-stone-100" />
                                )}
                            </div>

                            {isSelected ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {type === 'Custom' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Specific Item Name</label>
                                            <input
                                                type="text"
                                                value={item.custom_name}
                                                onChange={e => updateItem(type, 'custom_name', e.target.value)}
                                                placeholder="e.g. Blazer, Sherwani"
                                                className="w-full px-4 py-3 text-sm font-bold border-2 border-slate-100 rounded-xl focus:border-[#131c3f] outline-none text-[#131c3f] bg-slate-50 transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantity</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity === 0 ? '' : item.quantity}
                                                    onChange={e => updateItem(type, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl text-base font-black text-[#131c3f] outline-none focus:bg-white focus:border-[#131c3f]"
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rate (₹)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.price === 0 ? '' : item.price}
                                                    onChange={e => updateItem(type, 'price', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl text-base font-black text-[#131c3f] outline-none focus:bg-white focus:border-[#131c3f]"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-stone-100">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Measurements</label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); setEditingMeasurementsType(type); }}
                                                className="h-7 px-3 text-[9px] font-black uppercase tracking-widest border-stone-200 hover:bg-stone-50 gap-1"
                                            >
                                                <Scissors className="w-3 h-3 text-orange-500" />
                                                Edit
                                            </Button>
                                        </div>
                                        {(() => {
                                            const m = (newOrderForm.measurements as any)?.[type.toLowerCase()];
                                            const hasData = m && Object.keys(m).filter(k => k !== 'lastUpdated').some(k => m[k] && m[k].toString().trim() !== '');

                                            return hasData ? (
                                                <div className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                                                    <Check className="w-2.5 h-2.5" /> Measurements Ready
                                                </div>
                                            ) : (
                                                <div className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                                                    <AlertCircle className="w-2.5 h-2.5" /> No Measurements Set
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-stone-100">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cloth Source</label>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${item.fabric_source === 'Customer' ? 'text-orange-600 bg-orange-50' : 'text-[#131c3f] bg-blue-50'}`}>
                                                Provided by {item.fabric_source}
                                            </span>
                                        </div>
                                        <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); updateItem(type, 'fabric_source', 'Customer'); }}
                                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${item.fabric_source === 'Customer' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
                                            >
                                                Customer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); updateItem(type, 'fabric_source', 'Shop'); }}
                                                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${item.fabric_source === 'Shop' ? 'bg-[#131c3f] text-white shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
                                            >
                                                Our Shop
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 mb-2 border-2 border-dashed border-stone-100 rounded-xl flex flex-col items-center justify-center py-6 group-hover:border-amber-300 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-all duration-300">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 group-hover:text-amber-600">Add Item</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {newOrderForm.items.length > 0 && (
                <div className="bg-[#131b2e] rounded-2xl p-6 flex justify-between items-center shadow-xl border-2 border-[#1c2a5e] animate-in slide-in-from-bottom-2">
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Total Valuation</span>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{newOrderForm.items.length} garments selected</div>
                    </div>
                    <div className="text-2xl font-bold text-white">₹{totalAmount.toLocaleString()}</div>
                </div>
            )}
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-[#131c3f] tracking-tight uppercase">Enter Measurements</h3>
                <p className="text-sm font-bold text-slate-500">Please provide measurements for the selected garments.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {newOrderForm.items.map((item, idx) => {
                    const type = item.garment_type;
                    const displayName = type === 'Custom' ? (item.custom_name || 'Custom Item') : type;
                    const m = (newOrderForm.measurements as any)?.[type.toLowerCase()];
                    const hasData = m && Object.keys(m).filter(k => k !== 'lastUpdated').some(k => m[k] && m[k].toString().trim() !== '');

                    return (
                        <div key={idx} className={`p-4 rounded-2xl border-2 transition-all ${hasData ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-stone-100 shadow-sm'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasData ? 'bg-emerald-500 text-white' : 'bg-[#131b2e] text-white'}`}>
                                        <Scissors className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-[#131c3f] uppercase tracking-tight">{displayName}</h4>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${hasData ? 'text-emerald-600' : 'text-amber-500'}`}>
                                            {hasData ? 'Measurements Ready' : 'Measurements Missing'}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setEditingMeasurementsType(type)}
                                    variant={hasData ? "outline" : "default"}
                                    size="sm"
                                    className={`font-black uppercase tracking-widest text-[9px] ${!hasData ? 'bg-orange-500 hover:bg-orange-600' : 'border-stone-200 text-slate-500'}`}
                                >
                                    {hasData ? 'Edit Data' : 'Add Measurement'}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-10">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-[#131c3f] uppercase tracking-tight">Final Checks</h3>
                <p className="text-sm text-slate-500">Pick delivery date and payment status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Summary Card */}
                <div className="bg-white border-2 border-stone-100 rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 text-xl font-black border-2 border-amber-200/50">
                            {newOrderForm.customerData.name.charAt(0)}
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-[#131c3f] tracking-tight">{newOrderForm.customerData.name}</h4>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{newOrderForm.items.length} Items Selected</p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-stone-100">
                        {newOrderForm.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-transparent hover:border-slate-200 transition-colors">
                                <span className="text-xs font-black text-[#131c3f] uppercase tracking-wider">{item.garment_type === 'Custom' ? item.custom_name : item.garment_type}</span>
                                <span className="text-xs font-bold text-slate-500">{item.quantity} × ₹{item.price}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Delivery Deadline</label>
                        <div className="relative group">
                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input
                                type="date"
                                value={newOrderForm.deliveryDate}
                                onChange={e => setNewOrderForm(p => ({ ...p, deliveryDate: e.target.value }))}
                                className="w-full pl-14 pr-6 py-4 bg-white border-2 border-stone-100 rounded-2xl text-base font-bold text-[#131c3f] focus:border-orange-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Advance (₹)</label>
                            <input
                                type="number"
                                value={newOrderForm.advancePaid === 0 ? '' : newOrderForm.advancePaid}
                                onChange={e => setNewOrderForm(p => ({ ...p, advancePaid: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-5 py-4 bg-white border-2 border-stone-100 rounded-2xl text-base font-bold text-[#131c3f] focus:border-orange-500 outline-none transition-all shadow-sm"
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Balance Due</label>
                            <div className={`w-full px-5 py-4 border-2 border-stone-100 rounded-2xl text-base font-black shadow-sm bg-slate-50 ${itemsRemainingBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                ₹{itemsRemainingBalance}
                            </div>
                        </div>
                    </div>

                    {/* Measurements Check */}
                    {newOrderForm.items.some(item => {
                        const type = item.garment_type.toLowerCase();
                        const m = (newOrderForm.measurements as any)?.[type];
                        const hasData = m && Object.keys(m).filter(k => k !== 'lastUpdated').some(k => m[k] && m[k].toString().trim() !== '');
                        return !hasData;
                    }) && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-pulse mb-4">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <p className="text-[10px] font-black text-red-700 uppercase tracking-tight">Requirement: Some items are missing measurements! Please go back to Step 3 to add them.</p>
                            </div>
                        )}

                    <div className="p-6 bg-amber-50 rounded-3xl border-2 border-amber-100/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${newOrderForm.isUrgent ? 'bg-orange-500 text-white shadow-lg' : 'bg-amber-100 text-amber-600'}`}>
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#131c3f] uppercase tracking-tight">Express Processing</p>
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Mark as urgent order</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setNewOrderForm(p => ({ ...p, isUrgent: !p.isUrgent }))}
                            className={`h-8 w-14 rounded-full relative transition-all duration-300 ${newOrderForm.isUrgent ? 'bg-orange-500' : 'bg-stone-200'}`}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 shadow-sm ${newOrderForm.isUrgent ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            default: return null;
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent
                    showCloseButton={false}
                    className="sm:max-w-xl bg-white p-0 overflow-hidden border-none shadow-2xl rounded-xl"
                    onKeyDown={handleKeyDown}
                >
                    <DialogTitle className="sr-only">New Order</DialogTitle>
                    <div className="flex flex-col h-[80vh] md:h-auto max-h-[85vh]">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center z-20">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[#131b2e] flex items-center justify-center text-white shadow-md">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#131b2e] uppercase tracking-tight leading-none">New Order</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(s => (
                                                <div key={s} className={`h-1 rounded-full transition-all duration-300 ${s === currentStep ? 'w-3 bg-orange-500' : s < currentStep ? 'w-1.5 bg-[#131b2e]' : 'w-1.5 bg-slate-200'}`} />
                                            ))}
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Step {currentStep}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-6">
                            {renderCurrentStep()}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between z-20">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (currentStep === 1) {
                                        setNewOrderForm(prev => ({ ...prev, customerId: null, showInlineCustomerForm: false }));
                                        setCustomerSearchQuery('');
                                    } else {
                                        setCurrentStep(prev => (prev - 1) as any);
                                    }
                                }}
                                disabled={currentStep === 1 && !newOrderForm.customerId && !newOrderForm.showInlineCustomerForm}
                                className={`font-bold uppercase tracking-widest text-[10px] transition-all ${(currentStep === 1 && !newOrderForm.customerId && !newOrderForm.showInlineCustomerForm)
                                    ? 'opacity-0 pointer-events-none'
                                    : 'text-slate-500 hover:text-[#131b2e]'
                                    }`}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                {currentStep === 1 ? 'Cancel Selection' : 'Back'}
                            </Button>
                            <Button
                                onClick={handleProceed}
                                disabled={currentStep === 1 ? !canProceedStep1 : currentStep === 2 ? newOrderForm.items.length === 0 : isSaving}
                                className="bg-[#131b2e] hover:bg-[#1c2a5e] text-white px-8 py-5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-[#131b2e]/10 transition-all active:scale-95 focus:ring-4 focus:ring-amber-400/30"
                            >
                                {currentStep === 4 ? (isSaving ? 'Saving...' : 'Finish') : 'Next Step'}
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Measurement Edit Dialog */}
            <Dialog open={!!editingMeasurementsType} onOpenChange={(open) => { if (!open) setEditingMeasurementsType(null); }}>
                <DialogContent className="sm:max-w-md bg-white border-2 border-slate-100 shadow-2xl rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                        <DialogTitle className="text-sm font-black text-[#131b2e] uppercase tracking-wider">
                            {editingMeasurementsType === 'Custom' ?
                                (newOrderForm.items.find(i => i.garment_type === 'Custom')?.custom_name || 'Custom') :
                                editingMeasurementsType} Measurements
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2 border-t border-stone-50">
                            {(() => {
                                const type = editingMeasurementsType?.toLowerCase();
                                const isCustom = type === 'custom';

                                const baseFields = type === 'shirt' ? ['length', 'chest', 'waist', 'shoulder', 'sleeve', 'neck', 'cuff'] :
                                    type === 'pant' ? ['length', 'waist', 'hip', 'thigh', 'knee', 'bottom'] :
                                        type === 'kurta' ? ['length', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'neck'] :
                                            type === 'suit' ? ['length', 'chest', 'waist', 'shoulder', 'sleeve', 'neck'] :
                                                type === 'vest' ? ['length', 'chest', 'waist'] :
                                                    isCustom ? (customCategory === 'top' ? ['length', 'chest', 'waist', 'hip', 'shoulder', 'sleeve', 'neck'] : ['length', 'waist', 'hip', 'thigh', 'knee', 'bottom']) : [];

                                const currentMeasures = (newOrderForm.measurements as any)?.[type as any] || {};
                                const extraFields = Object.keys(currentMeasures).filter(k => k !== 'lastUpdated' && !baseFields.includes(k));
                                const allFields = [...baseFields, ...extraFields];

                                return (
                                    <div className="space-y-6 w-full">
                                        {isCustom && (
                                            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                                                <button
                                                    onClick={() => setCustomCategory('top')}
                                                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${customCategory === 'top' ? 'bg-white text-[#131b2e] shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    Upper Body
                                                </button>
                                                <button
                                                    onClick={() => setCustomCategory('bottom')}
                                                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${customCategory === 'bottom' ? 'bg-white text-[#131b2e] shadow-sm' : 'text-slate-500'}`}
                                                >
                                                    Lower Body (Legs)
                                                </button>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                            {allFields.map(field => (
                                                <div key={field} className="flex items-center justify-between border-b border-stone-50 pb-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest capitalize">{field}</label>
                                                    <div className="flex items-center gap-1 group">
                                                        <input
                                                            type="number"
                                                            step="0.125"
                                                            value={currentMeasures[field] || ''}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setNewOrderForm(prev => ({
                                                                    ...prev,
                                                                    measurements: {
                                                                        ...prev.measurements,
                                                                        [type!]: {
                                                                            ...((prev.measurements?.[type as keyof Customer['measurements']] as any) || {}),
                                                                            [field]: val
                                                                        }
                                                                    }
                                                                }));
                                                            }}
                                                            className="w-14 h-8 text-right text-xs font-black text-[#131b2e] bg-slate-50 border border-stone-200 rounded px-2 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                                        />
                                                        <span className="text-[10px] font-bold text-slate-400">&quot;</span>
                                                        {extraFields.includes(field) && (
                                                            <button
                                                                onClick={() => {
                                                                    const newMeasures = { ...currentMeasures };
                                                                    delete newMeasures[field];
                                                                    setNewOrderForm(prev => ({
                                                                        ...prev,
                                                                        measurements: {
                                                                            ...prev.measurements,
                                                                            [type!]: newMeasures
                                                                        }
                                                                    }));
                                                                }}
                                                                className="p-1 text-gray-300 hover:text-red-500"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Extra Point UI */}
                                        <div className="pt-2">
                                            {isAddingExtraField ? (
                                                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="e.g. Cuff"
                                                        value={newFieldName}
                                                        onChange={e => setNewFieldName(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter' && newFieldName.trim()) {
                                                                const field = newFieldName.trim().toLowerCase();
                                                                setNewOrderForm(prev => ({
                                                                    ...prev,
                                                                    measurements: {
                                                                        ...prev.measurements,
                                                                        [type!]: { ...((prev.measurements?.[type as any] as any) || {}), [field]: '' }
                                                                    }
                                                                }));
                                                                setNewFieldName('');
                                                                setIsAddingExtraField(false);
                                                            }
                                                        }}
                                                        className="flex-1 px-3 py-1.5 text-xs font-bold border rounded outline-none"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            if (newFieldName.trim()) {
                                                                const field = newFieldName.trim().toLowerCase();
                                                                setNewOrderForm(prev => ({
                                                                    ...prev,
                                                                    measurements: {
                                                                        ...prev.measurements,
                                                                        [type!]: { ...((prev.measurements?.[type as any] as any) || {}), [field]: '' }
                                                                    }
                                                                }));
                                                                setNewFieldName('');
                                                                setIsAddingExtraField(false);
                                                            }
                                                        }}
                                                        className="h-8 bg-[#131b2e] text-white text-[10px]"
                                                    >Add</Button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setIsAddingExtraField(true)}
                                                    className="w-full py-2 border border-dashed rounded text-[9px] font-black uppercase text-slate-400 flex items-center justify-center gap-1.5 hover:text-[#131b2e] hover:border-[#131b2e] transition-all"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Extra Point
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <Button
                            onClick={() => setEditingMeasurementsType(null)}
                            className="w-full bg-[#131b2e] hover:bg-[#1c2a5e] text-white font-black uppercase tracking-widest text-xs py-5 rounded-xl shadow-lg shadow-[#131b2e]/10"
                        >
                            Apply Measurements
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
