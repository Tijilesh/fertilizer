/**
 * Demo data for the Fertilizer Shop application
 * Used when backend is not available or returns empty data
 */

import masterProducts from './products.json';

export const DEMO_PRODUCTS = masterProducts.map((p, index) => ({
  id: index + 1,
  ...p
}));

export const DEMO_SALES = [
  {
    id: 1,
    customer_name: 'Ravi Kumar',
    customer_phone: '9876543210',
    total_amount: 2400,
    sale_date: new Date().toISOString(),
    items: 'NPK 20-20-20 (x2)',
  },
  {
    id: 2,
    customer_name: 'Sita Devi',
    customer_phone: '9123456780',
    total_amount: 900,
    sale_date: new Date().toISOString(),
    items: 'Urea (x1)',
  },
]

export const DEMO_SCHEMES = [
  {
    id: 1,
    name: 'PM-KISAN',
    fullName: 'Pradhan Mantri Kisan Samman Nidhi',
    description: 'Income support scheme for farmers providing ₹6,000 per year in three installments.',
    eligibility: ['Small and marginal farmers', 'Landholding farmers', 'Valid Aadhaar number'],
    benefits: '₹2,000 per installment (3 installments per year)',
    application: ['Visit PM-KISAN portal', 'Register with Aadhaar', 'Verify land records'],
    link: 'https://pmkisan.gov.in/'
  },
  {
    id: 2,
    name: 'Soil Health Card',
    fullName: 'Soil Health Card Scheme',
    description: 'Provides soil health assessment and recommendations for optimal fertilizer use.',
    eligibility: ['All farmers', 'Landholding farmers'],
    benefits: 'Free soil testing, nutrient recommendations, fertilizer guidance',
    application: ['Contact local agriculture office', 'Provide land details', 'Soil sample collection'],
    link: 'https://soilhealth.dac.gov.in/'
  }
]

export const DEMO_ACCOUNTING = {
  totalRevenue: 156000,
  totalGST: 28080,
  totalInvoices: 45,
  invoices: [
    {
      id: 1,
      invoiceNumber: '1001',
      date: '2024-03-01',
      customer: 'Ravi Kumar',
      amount: 2400,
      gstAmount: 432,
      totalAmount: 2832,
      status: 'paid'
    },
    {
      id: 2,
      invoiceNumber: '1002',
      date: '2024-03-02',
      customer: 'Sita Devi',
      amount: 900,
      gstAmount: 162,
      totalAmount: 1062,
      status: 'pending'
    }
  ]
}

export const DEMO_EXPIRY = [
  {
    id: 1,
    productName: 'NPK 20-20-20',
    batchNumber: 'BT-9901',
    quantity: 15,
    expiryDate: '2024-04-15',
    daysUntilExpiry: 12,
    supplier: 'AgroChem',
    cost: 1200,
    totalValue: 18000,
    status: 'warning'
  },
  {
    id: 2,
    productName: 'Urea',
    batchNumber: 'BT-8802',
    quantity: 5,
    expiryDate: '2024-03-10',
    daysUntilExpiry: -10,
    supplier: 'GreenGrow',
    cost: 900,
    totalValue: 4500,
    status: 'expired'
  }
]

export const DEMO_DASHBOARD_STATS = {
  totalRevenue: 156800,
  totalProducts: 24,
  totalCustomers: 156,
  averageOrderValue: 1250,
  revenueGrowth: 12.5,
  productGrowth: 5.2,
  customerGrowth: 8.1,
  orderGrowth: -2.3
}

export const DEMO_FARMER_TIPS = [
  {
    id: 1,
    icon: '🌱',
    category: 'Crop Care',
    title: 'Soil Testing',
    content: 'Always test your soil before applying fertilizers to know the exact nutrient requirements.'
  },
  {
    id: 2,
    icon: '💧',
    category: 'Irrigation',
    title: 'Water Management',
    content: 'Avoid over-irrigation after applying Urea to prevent leaching of nitrogen.'
  }
]

export const DEMO_SEASONAL_OFFERS = [
  {
    id: 1,
    icon: '🌟',
    title: 'Spring Special',
    description: 'Get 15% discount on all organic fertilizers this spring.',
    discount: '15%',
    validUntil: '2024-04-30'
  }
]

export const DEMO_ANALYTICS = {
  monthlySales: [
    { month: 'Jan', sales: 45000 },
    { month: 'Feb', sales: 52000 },
    { month: 'Mar', sales: 48000 }
  ],
  categoryData: [
    { name: 'NPK', value: 40, color: '#3B82F6' },
    { name: 'Urea', value: 25, color: '#10B981' },
    { name: 'Organic', value: 20, color: '#F59E0B' }
  ]
}

export const DEMO_SUPPLIERS = [
  {
    id: 1,
    name: 'AgroChem Solutions',
    contact_person: 'John Doe',
    phone: '9876543210',
    email: 'contact@agrochem.com',
    address: '123 Industry Park, Mumbai',
    credit_limit: 500000,
    current_balance: 120000,
    status: 'active'
  },
  {
    id: 2,
    name: 'Greener Pastures',
    contact_person: 'Jane Smith',
    phone: '9123456789',
    email: 'info@greener.com',
    address: '45 Green Road, Bengaluru',
    credit_limit: 300000,
    current_balance: 0,
    status: 'active'
  }
]

export const DEMO_PURCHASE_ORDERS = [
  {
    id: 1,
    supplier_name: 'AgroChem Solutions',
    total_amount: 45000,
    order_date: '2024-03-01',
    delivery_date: '2024-03-05',
    status: 'delivered',
    items: [
      { product_name: 'NPK 20-20-20', quantity: 50, price_per_unit: 800, total_price: 40000 },
      { product_name: 'Urea', quantity: 10, price_per_unit: 500, total_price: 5000 }
    ]
  },
  {
    id: 2,
    supplier_name: 'Greener Pastures',
    total_amount: 15000,
    order_date: '2024-03-10',
    delivery_date: null,
    status: 'pending',
    items: [
      { product_name: 'Organic Compost', quantity: 30, price_per_unit: 500, total_price: 15000 }
    ]
  }
]

export const DEMO_PAYMENTS = [
  {
    id: 1,
    payment_type: 'income',
    customer_name: 'Ravi Kumar',
    amount: 2400,
    payment_method: 'UPI',
    status: 'completed',
    payment_date: '2024-03-01',
    sale_id: 1
  },
  {
    id: 2,
    payment_type: 'expense',
    supplier_name: 'AgroChem Solutions',
    amount: 15000,
    payment_method: 'Bank Transfer',
    status: 'completed',
    payment_date: '2024-03-02',
    purchase_order_id: 1
  },
  {
    id: 3,
    payment_type: 'income',
    customer_name: 'Sita Devi',
    amount: 900,
    payment_method: 'Cash',
    status: 'pending',
    payment_date: '2024-03-03',
    sale_id: 2
  }
]

export const DEMO_ORDERS = [
  {
    id: 1,
    order_number: 'ORD-5501',
    status: 'delivered',
    total_amount: 2400,
    created_at: '2024-03-01',
    items: [
      { name: 'NPK 20-20-20', quantity: 2, price: 1200, totalPrice: 2400 }
    ]
  },
  {
    id: 2,
    order_number: 'ORD-5502',
    status: 'processing',
    total_amount: 900,
    created_at: '2024-03-03',
    items: [
      { name: 'Urea', quantity: 1, price: 900, totalPrice: 900 }
    ]
  }
]

export const DEMO_PROMO_BANNERS = [
  {
    id: 1,
    title: 'Monsoon Special',
    description: 'Up to 30% off on all NPK fertilizers. boost your yield this season!',
    color: 'from-primary-600 to-emerald-600',
    icon: '🌾'
  },
  {
    id: 2,
    title: 'Organic Revolution',
    description: 'Switch to organic today. Get free soil health consultation.',
    color: 'from-amber-500 to-orange-600',
    icon: '🥕'
  },
  {
    id: 3,
    title: 'Smart Farming',
    description: 'Use our AI assistant to optimize your fertilizer usage.',
    color: 'from-blue-600 to-indigo-700',
    icon: '🤖'
  }
]

export const DEMO_FEATURED_DEALS = [
  {
    id: 101,
    name: 'Super NPK Max',
    tag: 'Best Seller',
    price: 1050,
    originalPrice: 1500,
    discount: 30,
    image: '📦'
  },
  {
    id: 102,
    name: 'Eco-Compost Pro',
    tag: 'Sustainable',
    price: 600,
    originalPrice: 800,
    discount: 25,
    image: '🌱'
  },
  {
    id: 103,
    name: 'Urea Gold',
    tag: 'Fast Acting',
    price: 850,
    originalPrice: 1000,
    discount: 15,
    image: '⚡'
  }
]

export const paymentMethods = [
  { id: 'cash', name: 'Cash', icon: 'DollarSign' },
  { id: 'card', name: 'Card', icon: 'CreditCard' },
  { id: 'upi', name: 'UPI', icon: 'Smartphone' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: 'Banknote' },
  { id: 'cheque', name: 'Cheque', icon: 'FileText' }
]
