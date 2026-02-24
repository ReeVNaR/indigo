export type OrderStatus = 'Received' | 'Processing' | 'Ready' | 'Cutting' | 'Fitting' | 'Completed';

export interface Order {
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

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    ordersCount: number;
    totalSpent: number;
    lastOrderDate: string;
    measurements?: {
        shirt?: { length: string; chest: string; waist: string; shoulder: string; sleeve: string; neck: string; cuff: string; lastUpdated?: string };
        pant?: { length: string; waist: string; hip: string; thigh: string; knee: string; bottom: string; lastUpdated?: string };
        kurta?: { length: string; chest: string; waist: string; hip: string; shoulder: string; sleeve: string; neck: string; lastUpdated?: string };
    };
}
