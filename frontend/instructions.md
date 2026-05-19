# FinTrack Pro - Implementation & Setup Guide

FinTrack Pro is a premium, modular financial accounting system designed for small to medium enterprises with a focus on South African SARS compliance. This document outlines the system architecture, features, and setup instructions.

## 🚀 Key Features

### 1. Smart Inbox (AP Automation)
- **AI Extraction**: Uses Gemini 3 Flash to extract supplier details, VAT, line items, and totals from uploaded images or PDFs.
- **Verification Queue**: Extracted bills stay in a pending queue until verified by an accountant.
- **Ledger Integration**: One-click "Process" creates the necessary double-entry journal (Debit Expense, Credit Trade Creditors).

### 2. Asset Register
- **Lifecycle Tracking**: Track assets from purchase through disposal.
- **Financial Linking**: Link physical assets to specific ledger transactions for audit trails.
- **Warranty Management**: Real-time status indicators for warranty coverage.

### 3. SARS Compliance Center
- **VAT201 Generation**: Automated calculation of Input and Output VAT.
- **CIT Provisional Returns**: Estimates for IRP6 based on real-time net profit.
- **Input VAT Reclaim Queue**: Selective flagging of expenses where valid tax invoices are held.

### 4. AI Auditor (Gemini Pro)
- **Strategic Advice**: High-level financial audit of P&L and Balance Sheet.
- **Tax Optimization**: Suggestions for Section 12E (SBC) eligibility and tax shield strategies.
- **Natural Language Query**: Ask the ledger specific questions like "What is my burn rate forecast?"

## 🛠 Tech Stack
- **Frontend**: React (ESM), Tailwind CSS.
- **Icons**: Lucide React.
- **Charts**: Recharts.
- **Intelligence**: Google Gemini API (@google/genai).

## 📦 Setup Instructions

1.  **Environment Variables**: Ensure `process.env.API_KEY` is configured with a valid Google AI Studio API key.
2.  **Mounting**: The app mounts to `#root` in `index.html`.
3.  **Imports**: All components use standard ES6 modules.

## 📖 Operational Workflow
1.  **Configure Accounts**: Go to "Chart of Accounts" to set up your specific business structure.
2.  **Daily Capture**: Use "Smart Inbox" to upload receipts or "Tax Invoices" to manually record entries.
3.  **Reconcile VAT**: Use the "Compliance Center" to check which expenses have valid tax invoices for reclaiming.
4.  **Reporting**: Generate P&L and Balance Sheets in "Financial Statements" for board meetings or bank requirements.
