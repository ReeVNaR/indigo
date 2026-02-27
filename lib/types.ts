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
    measurements?: {
        shirt?: { length: string; chest: string; waist: string; shoulder: string; sleeve: string; neck: string; cuff: string; lastUpdated?: string };
        pant?: { length: string; waist: string; hip: string; thigh: string; knee: string; bottom: string; lastUpdated?: string };
        kurta?: { length: string; chest: string; waist: string; hip: string; shoulder: string; sleeve: string; neck: string; lastUpdated?: string };
        suit?: { length: string; chest: string; waist: string; shoulder: string; sleeve: string; neck: string; lastUpdated?: string };
        vest?: { length: string; chest: string; waist: string; lastUpdated?: string };
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
