/**
 * Demo data for the Fertilizer Shop application
 * Used when backend is not available or returns empty data
 */

export const DEMO_PRODUCTS = [
  {
    id: 1,
    name: 'NPK 20-20-20',
    type: 'NPK',
    price: 1200,
    quantity: 50,
    supplier: 'AgroChem',
    description: 'Balanced fertilizer for all crops',
  },
  {
    id: 2,
    name: 'Urea',
    type: 'Urea',
    price: 900,
    quantity: 30,
    supplier: 'GreenGrow',
    description: 'High nitrogen content',
  },
  {
    id: 3,
    name: 'Organic Compost',
    type: 'Organic',
    price: 700,
    quantity: 20,
    supplier: 'EcoFarms',
    description: 'Natural soil conditioner',
  },
]

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