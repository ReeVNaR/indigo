export type OrderStatus = 'Received' | 'Processing' | 'Ready' | 'Cutting' | 'Fitting' | 'Completed';

export interface Order {
    id: string;
    customerId?: string;
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
    measurementsSnapshot?: Customer['measurements'];
    payments?: Array<{ date: string; amount: number; method: string }>;
    paymentStatus?: 'Unpaid' | 'Partial' | 'Paid';
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    ordersCount: number;
    totalSpent: number;
    lastOrderDate: string;
    address?: string;
    notes?: string;
    ledgerEntries?: Array<{
        id: string;
        date: string;
        particular: string;
        totalAmount: number;
        advancePaid: number;
    }>;
    measurements?: {
        shirt?: { [key: string]: string | undefined; lastUpdated?: string };
        pant?: { [key: string]: string | undefined; lastUpdated?: string };
        kurta?: { [key: string]: string | undefined; lastUpdated?: string };
        suit?: { [key: string]: string | undefined; lastUpdated?: string };
        vest?: { [key: string]: string | undefined; lastUpdated?: string };
        customItems?: Array<{
            id: string;
            name: string;
            category: 'top' | 'bottom';
            measurements: any;
            lastUpdated?: string;
        }>;
    };
    measurementHistory?: Array<{
        date: string;
        type: 'shirt' | 'pant' | 'kurta' | 'suit' | 'vest' | 'custom';
        measurements: any;
        notes?: string;
    }>;
}
