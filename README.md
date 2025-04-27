# University Wallet Application

## Overview
The University Wallet is a banking application designed specifically for university communities. It allows university users to register using their university email addresses and securely transfer funds within the university ecosystem. The primary goal is to ensure transparency in fund transactions, avoiding corruption among university faculties, staff, and students.

The application is built using **Node.js**, **TypeScript**, and integrates with a **PostgreSQL** local database. For blockchain integration, **MegaEth testnet** is used to record transactions securely.

This project idea was originally given by **Waqar Zaka**.

### Key Features:
- **University-Only Registration**: Users can only register with valid university email addresses.
- **Blockchain-based Transactions**: All transactions are recorded on the blockchain using MegaEth Testnet.
- **Admin-Only Fund Deposits**: Only the admin can deposit funds into the university account.
- **Transparent Transactions**: All incoming and outgoing transactions are visible to all users.
- **Tracking Withdrawals**: Users can see who withdraws funds and how much.
- **Gas-Free Transactions**: Users don't need to manage gas fees as all transactions are carried out using the admin's account.
- **Admin Management**: The admin can add or remove other admins, providing more control over the application.

## Features & Functionality

### 1. **Registration & Login**
Users can sign up and log in using their university email addresses. Once registered, each user is assigned a blockchain wallet address (stored in the database) and can interact with the wallet without worrying about private keys or gas fees.

### 2. **Blockchain Integration**
All transactions are carried out using blockchain technology. The **MegaEth testnet** records each transaction, providing complete transparency. Transaction hashes are stored in the database for easy reference.

- **Admin Account**: The admin account (with a private key stored in the `.env` file) is responsible for initiating all transactions. This ensures users don't need to worry about gas fees.
- **Wallet Address**: Each user receives a wallet address upon registration. The application handles the interaction with the blockchain, so users don't have to directly manage their addresses or private keys.

### 3. **Funds Management**
- **Deposits**: Only the admin can deposit funds into the system. These funds appear on the **All Transactions** page, where every user can see the deposit and track the funds.
- **Transfers**: Users can transfer funds to others within the university. Transfers can be made by searching for users by their department or college name.
- **Withdrawals**: Once funds are transferred, users can withdraw the funds. The transaction and withdrawal details are visible to all users on the **All Transactions** page.

### 4. **Admin Management**
- **Add/Remove Admins**: The admin can promote a simple user account to admin status or demote an admin back to a regular user account. This provides more flexibility in managing the platform’s administrative users.
  - The process involves modifying the user's status in the database and updating the respective roles.

### 5. **Transparency & Accountability**
All financial transactions, including deposits, transfers, and withdrawals, are publicly visible to all users within the application. This promotes transparency and discourages corruption within the university.

### 6. **All Transactions Page**
This page shows:
- All incoming deposits (admin deposits).
- All fund transfers and withdrawals.
- Users can see the history of funds, including which user withdrew what amount and when.

## Setup and Installation

### Prerequisites
Before you start, make sure you have the following installed:
- **Node.js** (v14 or later)
- **npm** (Node Package Manager)
- **PostgreSQL** (for the local database)
- **MegaEth Testnet** for blockchain integration
- **.env File**: You’ll need a private key for the admin's blockchain account (details below).

### 1. Clone the repository
```bash
git clone https://github.com/haywoodjablomi860/UniversityWallet.git
cd UniversityWallet

```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up the database
Create a PostgreSQL database and update your `.env` file with the connection details. You can use the provided SQL file `my_database2_schema.sql` located in the `Database` folder to set up your database structure.

To set up your database schema, run:
```bash
psql -U your_username -d your_database -f path/to/my_database2_schema.sql
```

This will create the required tables (`users`, `transactions`, etc.) for the application.

### 4. Run the application
Start the server with:
```bash
npm run start
```

This will start the application on [http://localhost:3000](http://localhost:3000).


## Technical Details

### Backend
- **Node.js**: Backend is built using Node.js and Express for the API.
- **TypeScript**: All application code is written in TypeScript for type safety.
- **PostgreSQL**: A PostgreSQL database is used to store user data, transactions, and wallet information.
- **MegaEth Testnet**: The MegaEth Testnet is used to record and verify blockchain transactions.

### Security
- Private key management is crucial for blockchain-based applications. The admin's private key is stored securely in the `.env` file.
- Users never interact with their private keys directly, as the application handles blockchain interactions on their behalf.


