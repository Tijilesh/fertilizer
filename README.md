# Fertilizer Shop Management System

A comprehensive web application designed specifically for fertilizer shop owners to manage their inventory, record sales, and generate reports, alongside a complete digital storefront and community hub for farmers.

## Features

### 🔐 Security & Access Control
- Role-Based Access Control (Admin, Owner, Customer)
- Secure OTP-based Email Authentication
- Specialized views based on user roles

### 🌍 Multi-language Support
- Native Localization (i18n) built-in
- Support for 6 languages: English, Hindi, Telugu, Tamil, Kannada, and Marathi
- Instantly translates navigation, store items, and dashboards

### 🏠 Admin & Owner Dashboard
- Overview of key metrics (total products, sales, revenue, low stock items)
- Recent sales activity and low stock alerts
- Advanced Inventory and Procurement Management
- Payment tracking and accounting modules

### 🛒 Customer Storefront & Checkout
- Premium Farmer Shop to browse available fertilizers and agricultural products
- Advanced Cart system with discount code support
- Integrated Payment Simulation (Netbanking, UPI/QR, Credit/Debit Card, and Cash on Delivery)

### 🌿 Advanced Agricultural Tools
- **AI Disease Detection:** Live camera integration to scan plant leaves and detect potential diseases.
- **Smart Assistant:** Automated chatbot support for quick farming and application queries.
- **Fertilizer Calculator:** Determine the exact crop input requirements.
- **Government Schemes:** Real-time explorer for agricultural subsidies and policies.
- **Community Forum:** A space for farmers to connect, ask questions, and share insights.

### 📦 Product & Sales Management
- Add, edit, and delete fertilizer products with extensive details
- Predefined fertilizer types (NPK, Urea, DAP, Organic, etc.)
- Record sales transactions with automatic stock deduction
- Comprehensive reporting (Inventory, Sales, Stock Status)

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Node.js with Express
- **Database**: MySQL
- **Styling**: Tailwind CSS
- **Testing**: Cypress (E2E)
- **Icons**: Lucide React

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server (v8 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fertilizer-shop
   ```

2. **Database Configuration**
   - Create a MySQL database named `fertilizer_shop`
   - Update `server/.env` with your database credentials:
     ```env
     DB_HOST=127.0.0.1
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=fertilizer_shop
     PORT=5012
     EMAIL_USER=your_email@gmail.com
     EMAIL_PASS=your_app_password
     ```

3. **Install dependencies**
   ```bash
   npm run install-all
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```
   This will start both the backend server (dynamically assigns port 5012/5013) and frontend development server.

## Database Schema

The application uses MySQL with robust relational tables:
- **users**: Accounts, roles, and authentication
- **products**: Product information and inventory
- **sales & sale_items**: Sales transactions
- **purchases & purchase_items**: Procurement tracking
- **payments**: Transaction ledgers
- **farmers**: Customer profiles

## Testing

End-to-end testing is provided via Cypress:
```bash
cd client
npm run cypress:open
```

## Production Deployment

1. **Build the frontend**:
   ```bash
   cd client
   npm run build
   ```

2. **Set environment variables**:
   Set `NODE_ENV=production` on your server host.

3. **Start the production server**:
   ```bash
   cd server
   node index.js
   ```

## License

This project is licensed under the MIT License.