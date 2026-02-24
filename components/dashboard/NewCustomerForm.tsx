"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase';
import { Customer } from '@/lib/types';
import { Plus } from "lucide-react";

interface NewCustomerFormProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onCustomerCreated: (customer: Customer) => void;
}

export default function NewCustomerForm({ isOpen, onOpenChange, onCustomerCreated }: NewCustomerFormProps) {
    const [newCustomerForm, setNewCustomerForm] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
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
                onCustomerCreated(newCustomer);
                onOpenChange(false);
                setNewCustomerForm({ name: '', email: '', phone: '' });
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Failed to create customer.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-[#fffdf9]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-800 uppercase tracking-tight">Add Customer</DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm">Add a new client to your directory.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                        <input
                            required
                            value={newCustomerForm.name}
                            onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 transition-all font-medium"
                            placeholder="e.g. Jane Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                        <input
                            type="tel"
                            value={newCustomerForm.phone}
                            onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 transition-all font-medium"
                            placeholder="e.g. (555) 000-0000"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                        <input
                            type="email"
                            value={newCustomerForm.email}
                            onChange={e => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 transition-all font-medium"
                            placeholder="e.g. jane@example.com"
                        />
                    </div>
                    <DialogFooter className="pt-6 flex flex-row justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-bold uppercase tracking-wider w-fit">Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 font-bold uppercase tracking-wider w-fit">
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
