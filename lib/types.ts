export type Role = 'super_admin' | 'admin';
export type Locale = 'am' | 'en';
export type ProductCategory = 'cement' | 'brick' | 'terazone' | 'service';
export type PayType = 'monthly' | 'daily' | 'weekly';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile' | 'other';
export type Product = { id:string; name:string; sku:string|null; category:ProductCategory; unit:string; selling_price:number|null; stock_on_hand:number; low_stock_threshold:number; is_active:boolean; is_stock_tracked:boolean };
