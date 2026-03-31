# Indigo - Dadashri Designers Dashboard

A premium, tailored management system for **Dadashri Designers**, a high-end couture fashion house. Built with modern web technologies, this dashboard enables seamless management of customers, bespoke measurements, and order lifecycles.

![Dadashri Designers Logo](/public/Logo.png)

## ✨ Key Features

- **Workshop Overview**: Real-time stats on active orders, urgent tasks, and daily revenue.
- **Customer CRM**: 
  - Centralized database for clients.
  - Detailed profiles with measurement history for multiple garment types (Shirts, Pants, Kurtas, Suits, etc.).
  - Custom measurement fields for specialized requirements.
- **Order Management**:
  - Full lifecycle tracking: *Processing → Cutting → Fitting → Ready → Completed*.
  - Urgent order flags and delivery date monitoring.
  - Interactive order details with payment tracking.
- **Financial Tracking**:
  - Daily earnings and total revenue highlights.
  - Payment status monitoring (Paid, Partial, Unpaid).
  - Record advances and subsequent payments.
- **Responsive Design**: Fully optimized for both desktop workshop use and mobile access.
- **Secure Access**: Admin authentication to protect sensitive client data.

## 🚀 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (for high-performance data storage)
- **Charts**: [Recharts](https://recharts.org/) for business insights
- **Icons**: [Lucide React](https://lucide.dev/)
- **Components**: Radix UI primitives

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB Atlas account (or local MongoDB instance)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd indigo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the `.env.example` file to `.env.local` and fill in your credentials.
   ```bash
   cp .env.example .env.local
   ```
   *Required variables:*
   - `MONGODB_URI`: Your MongoDB connection string.
   - `ADMIN_EMAIL`: Default admin email for login.
   - `ADMIN_PASSWORD`: Default admin password.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

## 📂 Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable UI components (Shadcn + custom dashboard modules).
- `lib/`: Utility functions, database connections (`mongodb.ts`), and TypeScript types.
- `public/`: Static assets (Logo, Favicon).

## 🔒 Security Note

Ensure that `.env.local` is never committed to version control. The repository includes a `.gitignore` that handles this by default.

---
*Crafted for elegance. Est. 2026.*
