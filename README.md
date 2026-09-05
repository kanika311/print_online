# 🖨️ PrintPorter — On-Demand Cloud & Cyber Cafe Print Marketplace

PrintPorter is a production-grade, full-stack on-demand print marketplace connecting end-users with nearby cyber cafes and commercial print shops. It combines **Next.js + React + Tailwind CSS** on the frontend with **Node.js Express + Socket.io + MongoDB** on the backend.

---

## 🚀 Key Modules Built

### 1. Module 1: User App (Customer-Facing)
- **Document Input**: Drag-and-drop PDF upload with automated page counter + **Smart Edge-Detect Camera Scanner** with perspective crop and multi-page capture.
- **Print Configuration Engine**:
  - Paper Size: A4, A3, Legal, Letter
  - Print Type: Black & White vs. Vibrant Color
  - Paper Type: Normal 75gsm, Bond paper 85gsm, Glossy 180gsm, Cardstock 250gsm
  - Copies & Duplex (with 10% eco-discount calculation)
  - Binding options: None, Corner Staple, Spiral Ring Binding
  - Custom notes & instructions for the cyber cafe
- **Live Dynamic Price Calculator**: Real-time itemized cost calculation with GST breakdown.
- **Fulfillment & Payment**:
  - Self-Pickup vs Home Delivery (Porter / Dunzo bike dispatch)
  - Online Escrow (funds held until completion) vs Cash on Delivery (COD)
- **Live Order Tracker**: Real-time status stepper, animated interactive route map, downloadable PDF invoice, 1-click reorder, and star rating/reviews.
- **In-App Direct Chat**: Threaded live conversation with the assigned print shop.

### 2. Module 2: Partner App (Cyber Cafe / Print Shop Dashboard)
- **Shop Onboarding & KYC**: Trade license upload, Aadhaar/ID proof, address, and verification badge.
- **Availability Toggle**: Online / Offline switch like a driver app.
- **Service Capabilities**: Configurable paper sizes, binding equipment, color printer toggles, and max daily capacity limits.
- **Incoming Job Dispatch Queue**: Urgent audio-visual cards with **45-second accept/reject countdown timer** and auto-reassignment fallback.
- **Print Pipeline Controller**: `Dispatched` → `Accepted` → `Printing` → `Ready` → `Out for Delivery` → `Completed`.
- **COD Confirmation**: Dedicated **"Cash Received"** confirmation modal that logs into the COD reconciliation ledger before marking order completed.
- **Inventory & Supplies**: Ream counter for A4 75gsm, Glossy, Spiral coils, and Toners with low-stock alerts and capability auto-pause.
- **Earnings Analytics**: Daily, weekly gross revenue, and pending weekly settlements.

### 3. Module 3: Super Admin CMS Panel
- **Executive Dashboard**: GMV, active cyber cafes, platform commission earned, and pending COD collections.
- **Demand Heatmap**: Interactive geospatial heatmap of customer order clusters and cyber cafe fulfillment nodes.
- **Shop Management**: Review trade licenses, approve/reject KYC applications, and ban/suspend shops.
- **Order Management**: Platform-wide master order log with **Emergency Manual Reassign** to re-route stuck jobs.
- **COD Reconciliation Engine**: Audit ledger of all cash collected by cyber cafes vs platform cuts owed, with "Mark Settled" remittance verification.
- **Dynamic Pricing Matrix**: Set base page rates, paper surcharges, binding tiers, and peak surge multipliers.
- **Broadcast Composer**: Send announcements to All Users, Partner Cyber Cafes, or End-Users.

### 4. Module 4: Matching & Location Engine
- **MongoDB GeoJSON Queries**: Queries shops within a 5km radius using `2dsphere` coordinates `[longitude, latitude]`.
- **Composite Scoring**:
  $$\text{Score} = (1.5 \times \text{Distance}) + (2.0 \times (5.0 - \text{Rating})) + (0.8 \times \text{QueueLoad})$$
- **Auto-Reassignment**: Automatically re-dispatches to the next best shop if a shop does not accept within 45 seconds.
- **Delivery Partner Dispatch**: Automatically dispatches available courier partners when print status changes to `Ready`.

### 5. Module 5: Payments & COD Workflow
- **Online Escrow**: Pre-paid transactions held in escrow, released to the shop upon order completion.
- **COD Workflow**: Order placed with COD flag → printed → cash collected at counter/door → shop clicks "Confirm Cash Received" → recorded in COD reconciliation ledger → marked completed.
- **Anti-Fraud**: Restricts COD for users with $\ge 2$ uncollected cancellations.

### 6. Module 6: Notifications & Chat
- Socket.io live synchronization across Customer, Shop, and Admin rooms.
- In-App Chat modal for direct clarification on print jobs.
- Live simulated dispatch feed for SMS, WhatsApp, and Firebase Cloud Messaging (FCM).

### 7. Module 7: MongoDB Database Collections
- `users`: Customer, Shop Owner, Admin, and Delivery Partner profiles.
- `shops`: Cyber cafe documents with GeoJSON `location: { type: 'Point', coordinates: [lng, lat] }` and `2dsphere` index.
- `orders`: Print specifications, file URLs, total price, and fulfillment status.
- `delivery_partners`: Courier profiles with live coordinate updates.
- `transactions`: Platform commission and escrow ledger.
- `reviews`: 1-5 star ratings and customer comments.
- `stock_items`: Shop inventory tracking.
- `chat_messages`: Order-specific threaded chat.
- `broadcasts`: System alerts.

### 8. Module 8: Non-Functional & Security
- **Document Privacy**: 24-hour auto-expiry deletion cron shredding sensitive PDFs after job completion.
- **Mobile Simulator**: Interactive smartphone device frame for testing PWA responsiveness directly in the browser.

---

## 🛠️ Quick Start Guide

### Prerequisites
- Node.js 18+ or 20+ installed
- (Optional) MongoDB 7 via Docker or MongoDB Atlas

### Running Locally
1. **Start the Backend API Server**:
   ```bash
   cd server
   npm run dev
   ```
   *Runs on `http://localhost:5000` with WebSocket real-time server and high-speed MongoDB Document Store.*

2. **Start the Next.js Frontend**:
   ```bash
   cd client
   npm run dev
   ```
   *Runs on `http://localhost:3000`.*

3. **Explore Role Personas**:
   Use the **Role Switcher** in the top navigation bar to seamlessly switch between:
   - 👤 **User App** (Customer document upload, configurator & live tracking)
   - 🏪 **Partner Hub** (Cyber cafe 45s incoming queue, status pipeline & COD confirmation)
   - 🛡️ **Admin CMS** (Platform KPIs, demand heatmap, shop KYC & COD reconciliation)
   - 📱 **Mobile Frame** (Toggle smartphone viewport simulator)

---

## 🐳 Docker Deployment
To run MongoDB 7 and Redis in containers:
```bash
docker compose up -d
```
