# DineSync - Comprehensive User Manual

Welcome to **DineSync**, the centralized hostel mess operations and meal management system. This manual explains how both students (users) and administrators can use the robust features provided by the platform.

---

## 📖 Table of Contents
1. [For Students (End Users)](#for-students-end-users)
   - [Authentication & Dashboard](#authentication--dashboard)
   - [Registering for a Mess](#registering-for-a-mess)
   - [Viewing the Menu](#viewing-the-menu)
   - [Sign-Offs (Leave Declarations)](#sign-offs-leave-declarations)
   - [Guest Requests](#guest-requests)
   - [Fee Management](#fee-management)
2. [For Administrators](#for-administrators)
   - [Managing Messes & Menus](#managing-messes--menus)
   - [Processing Fees](#processing-fees)
3. [Troubleshooting](#troubleshooting)

---

## 👨‍🎓 For Students (End Users)

### Authentication & Dashboard
Upon launching DineSync, you will be prompted to login. 
- You must authenticate with your established credentials. 
- Once logged in, the **Dashboard** serves as your central hub. 
- On the left hand (or bottom on mobile), access the navigation panel containing: `Dashboard`, `Menu`, `Registration`, `Sign-Off`, `Guest`, and `Fees`.

### Registering for a Mess
Before accessing specific amenities like Sign-Offs or direct billing, you must be registered to a specific active Mess (e.g., Mess A, Mess B, Mess C).
1. Navigate to the **Registration** tab.
2. View the available mess units and their current capacities.
3. Select your preferred mess and hit **Register**.

### Viewing the Menu
1. Click the **Menu** tab on the sidebar.
2. Here, you can view the weekly schedule (Breakfast, Lunch, Dinner) associated with your selected mess, alongside dynamic pricing for various food items.

### Sign-Offs (Leave Declarations)
If you are traveling home for the weekend or taking a vacation, you can *Sign-Off*. This freezes your mess billing so you are not charged for food waste while away.
1. Navigate to the **Sign-Off** tab. *(Note: You must be registered to a mess first, otherwise access is strictly denied).*
2. Enter your **Start Date** and **End Date**.
3. Optionally provide a reason.
4. Click **Confirm Retreat**. A historical log of your confirmed sign-offs will appear on the right pane.

### Guest Requests
Want to bring a friend to the mess? You can do this without requiring a permanent Mess transfer!
1. Navigate to the **Guest** tab.
2. Fill out the request form:
   - **Select Mess**: Choose the location where you and your guest will be dining (e.g. Mess A).
   - **Guest Roll No.**: Input the registered Roll Number of your guest.
   - **Date & Meal Type**: Select when they will be eating.
3. **Dynamic Pricing**: An intelligent algorithm will compute the fee based on the Meal Type and Mess selected.
4. Click **Proceed to Pay**.
5. A secure payment window will emerge. Confirm the details and hit **Pay Now**.
6. A historical log on the right will log the finalized transaction.

### Fee Management
1. Navigate to the **Fees** tab.
2. Review your pending dues (which are computed systematically at the end of each month) and execute payments here.

---

## 🛡️ For Administrators

Administrators have elevated privileges, allowing them to oversee system operations securely. Note: You must be signed into an account with the role `ADMIN`.

### Managing Messes & Menus
Admins control the available capacities and what items are served on which days.
- Utilize the Admin dashboard to add or revoke global menu items.
- Assign new `MenuSchedules` dynamically across all messes.

### Processing Fees
- System billing algorithms collate end-of-month queries aggregating Add-ons, Sign-Offs (subtractions), and standard meal fees. As an Admin, you oversee the holistic ledger reflecting in the `FeeRecords` system.

---

## ⚙️ Troubleshooting

- **Access Denied on Sign-Off page?** You have not yet selected a mess! Head to the Registration tab first.
- **Guest Tab is rendering default static Mess values?** This implies the backend server data sync was momentarily slow; the system gracefully mitigates this so you can still conduct operations securely.
- **Lost connection?** If you restart the server, note that you may need to re-login to retrieve a new secure JWT token.
