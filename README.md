# Fertilizer Shop Management System

A comprehensive web application designed specifically for fertilizer shop owners to manage their inventory, record sales, and generate reports.

## Features

### 🏠 Dashboard
- Overview of key metrics (total products, sales, revenue, low stock items)
- Recent sales activity
- Low stock alerts
- Quick access to add products and record sales

### 📦 Product Management
- Add, edit, and delete fertilizer products
- Track product details (name, type, price, quantity, supplier, description)
- Stock level monitoring with status indicators
- Search and filter products by name and type
- Predefined fertilizer types (NPK, Urea, DAP, Organic, etc.)

### 🛒 Sales Management
- Record sales transactions with customer information
- Add multiple items to a single sale
- Automatic stock deduction when sales are recorded
- View detailed sale history
- Search sales by customer name, phone, or sale ID

### 📊 Reports
- **Inventory Report**: Complete overview of all products with stock status
- **Sales Report**: Daily sales and revenue with date range filtering
- **Stock Status**: Automatic categorization (Low Stock ≤5, Medium Stock ≤10, Good Stock >10)

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fertilizer-shop
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

### Alternative Manual Setup

If the combined install doesn't work, install dependencies separately:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Start development servers (from root directory)
npm run dev
```

## Usage

1. **Access the application**: Open your browser and go to `http://localhost:3000`

2. **Add Products**: 
   - Navigate to Products → Add Product
   - Fill in product details (name, type, price, quantity, supplier)
   - Save the product

3. **Record Sales**:
   - Navigate to Sales → Record Sale
   - Enter customer information (optional)
   - Add items to the sale
   - Complete the transaction

4. **View Reports**:
   - Navigate to Reports
   - View inventory and sales reports
   - Filter sales by date range

## Database Schema

The application uses SQLite with the following tables:

- **products**: Product information and inventory
- **sales**: Sales transactions
- **sale_items**: Individual items in each sale

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get single sale with items
- `POST /api/sales` - Record new sale

### Reports
- `GET /api/reports/inventory` - Get inventory report
- `GET /api/reports/sales` - Get sales report (with optional date filters)

## Production Deployment

1. **Build the frontend**:
   ```bash
   cd client
   npm run build
   ```

2. **Set environment variables**:
   ```bash
   export NODE_ENV=production
   ```

3. **Start the production server**:
   ```bash
   cd server
   npm start
   ```

The application will serve the built frontend from the backend server.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository. 