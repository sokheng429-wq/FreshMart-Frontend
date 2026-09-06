import React, { useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'

/**
 * Universal print helper that prints the invoice with full styling, colors,
 * and layout via a dedicated hidden print frame.
 */
export function printInvoiceDocument(invoice) {
  if (!invoice) return

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val) || 0)
  }

  const formatKhmer = (val) => {
    return new Intl.NumberFormat('km-KH').format(Math.round(Number(val) || 0)) + ' ៛'
  }

  const lines = invoice.lines || []
  const subTotal = Number(invoice.subTotal || 0)
  const discountAmount = Number(invoice.discountAmount || 0)
  const discountPercent = Number(invoice.discountPercent || 0)
  const taxAmount = Number(invoice.taxAmount || 0)
  const taxPercent = Number(invoice.taxPercent || 0)
  const markupAmount = Number(invoice.markupAmount || 0)
  const grandTotal = Number(invoice.grandTotal || 0)
  const paidAmount = Number(invoice.paidAmount || 0)
  const balance = Number(invoice.balance || 0)
  const exchangeRate = Number(invoice.exchangeRate || 4100)
  const grandTotalKhmer = invoice.grandTotalKhmer || grandTotal * exchangeRate

  const statusColor =
    invoice.status === 'PAID'
      ? '#16a34a'
      : invoice.status === 'CREDIT'
      ? '#9333ea'
      : invoice.status === 'PARTIAL'
      ? '#d97706'
      : '#dc2626'

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice - ${invoice.invoiceCode || 'INV'}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.4;
          }
          .invoice-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .company-logo {
            display: inline-block;
            width: 36px;
            height: 36px;
            background-color: #77bc1f;
            color: #ffffff;
            border-radius: 8px;
            font-size: 20px;
            font-weight: 900;
            text-align: center;
            line-height: 36px;
            vertical-align: middle;
            margin-right: 8px;
          }
          .company-title {
            font-size: 22px;
            font-weight: 900;
            color: #0f172a;
            vertical-align: middle;
            letter-spacing: -0.5px;
          }
          .inv-title {
            font-size: 26px;
            font-weight: 900;
            color: #ff9900;
            text-align: right;
            margin: 0;
            letter-spacing: 0.5px;
          }
          .inv-code {
            font-size: 13px;
            font-weight: 700;
            color: #334155;
            text-align: right;
            margin-top: 2px;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background-color: #f1f5f9;
            color: ${statusColor};
            border: 1px solid #cbd5e1;
            margin-top: 4px;
          }
          .meta-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          .meta-box {
            width: 48%;
            vertical-align: top;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
          }
          .meta-box-title {
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          .meta-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 11px;
          }
          .meta-label {
            color: #64748b;
          }
          .meta-value {
            font-weight: 700;
            color: #0f172a;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          .items-table th {
            background-color: #f1f5f9;
            color: #475569;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            border-bottom: 2px solid #0f172a;
          }
          .items-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11px;
          }
          .totals-table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals-left {
            width: 55%;
            vertical-align: top;
            padding-right: 16px;
          }
          .totals-right {
            width: 45%;
            vertical-align: top;
          }
          .calc-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 11px;
            color: #475569;
          }
          .calc-row.grand {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 13px;
            font-weight: 900;
            color: #0f172a;
            margin: 6px 0;
          }
          .calc-row.balance {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 6px 10px;
            font-weight: 800;
            color: #b91c1c;
          }
          .qr-box {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            margin-top: 8px;
          }
          .qr-badge {
            width: 60px;
            height: 60px;
            background: #005696;
            color: #ffffff;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 10px;
            text-align: center;
            line-height: 1.2;
          }
          .signatures {
            width: 100%;
            border-collapse: collapse;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .sig-box {
            width: 50%;
            text-align: center;
            font-size: 11px;
          }
          .sig-line {
            width: 180px;
            margin: 0 auto;
            border-bottom: 1px solid #64748b;
            padding-top: 45px;
            margin-bottom: 4px;
          }
          .footer-note {
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                <div>
                  <span class="company-logo">FM</span>
                  <span class="company-title">FRESHMART</span>
                </div>
                <div style="color: #64748b; font-size: 11px; margin-top: 4px;">Fresh & Quality Groceries Platform</div>
                <div style="color: #64748b; font-size: 10px;">Phnom Penh, Cambodia | Tel: +855 (0) 23 888 999</div>
                <div style="color: #64748b; font-size: 10px;">VAT / Tax ID: K008-902201948</div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div class="inv-title">SALE INVOICE</div>
                <div class="inv-code"># ${invoice.invoiceCode || 'INV-0000'}</div>
                <div><span class="status-badge">${invoice.status || 'UNPAID'}</span></div>
              </td>
            </tr>
          </table>

          <!-- Customer & Details Grid -->
          <table class="meta-grid">
            <tr>
              <td class="meta-box">
                <div class="meta-box-title">BILLED TO / អតិថិជន:</div>
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
                  ${invoice.customerName || invoice.billingName || 'Walk-in Customer'}
                </div>
                ${invoice.customerPhone ? `<div class="meta-item"><span class="meta-label">Phone:</span><span class="meta-value">${invoice.customerPhone}</span></div>` : ''}
                ${invoice.customerAddress ? `<div class="meta-item"><span class="meta-label">Address:</span><span class="meta-value">${invoice.customerAddress}</span></div>` : ''}
                ${invoice.billingTaxNo ? `<div class="meta-item"><span class="meta-label">Tax ID:</span><span class="meta-value">${invoice.billingTaxNo}</span></div>` : ''}
              </td>
              <td style="width: 4%;"></td>
              <td class="meta-box">
                <div class="meta-box-title">INVOICE DETAILS / ព័ត៌មានវិក័យប័ត្រ:</div>
                <div class="meta-item"><span class="meta-label">Invoice Date:</span><span class="meta-value">${invoice.invoiceDate || new Date().toISOString().slice(0, 10)}</span></div>
                <div class="meta-item"><span class="meta-label">Due Date:</span><span class="meta-value">${invoice.dueDate || '—'}</span></div>
                <div class="meta-item"><span class="meta-label">Payment Term:</span><span class="meta-value">${invoice.paymentTerm || 'Cash'}</span></div>
                <div class="meta-item"><span class="meta-label">Salesperson:</span><span class="meta-value">${invoice.salesperson || 'Staff'}</span></div>
                ${invoice.soCode ? `<div class="meta-item"><span class="meta-label">SO Code:</span><span class="meta-value">${invoice.soCode}</span></div>` : ''}
              </td>
            </tr>
          </table>

          <!-- Line Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">№</th>
                <th style="text-align: left;">Description / បរិយាយ</th>
                <th style="width: 50px; text-align: center;">UOM</th>
                <th style="width: 60px; text-align: right;">QTY</th>
                <th style="width: 80px; text-align: right;">Price</th>
                <th style="width: 80px; text-align: right;">Discount</th>
                <th style="width: 90px; text-align: right;">Total ($)</th>
              </tr>
            </thead>
            <tbody>
              ${
                lines.length > 0
                  ? lines
                      .map(
                        (l, idx) => `
                    <tr>
                      <td style="text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
                      <td>
                        <strong>${l.description || 'Product'}</strong>
                        ${l.productCode ? `<div style="font-size: 9px; color: #64748b;">Code: ${l.productCode}</div>` : ''}
                      </td>
                      <td style="text-align: center; color: #475569;">${l.uom || 'Pcs'}</td>
                      <td style="text-align: right; font-weight: 700;">${l.qty || 1}</td>
                      <td style="text-align: right;">${formatCurrency(l.unitPrice)}</td>
                      <td style="text-align: right; color: #16a34a;">${Number(l.discount) > 0 ? formatCurrency(l.discount) : '—'}</td>
                      <td style="text-align: right; font-weight: 800; color: #0f172a;">${formatCurrency(l.totalPrice)}</td>
                    </tr>
                  `
                      )
                      .join('')
                  : `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 16px;">No line items on this invoice</td></tr>`
              }
            </tbody>
          </table>

          <!-- Totals Section -->
          <table class="totals-table">
            <tr>
              <td class="totals-left">
                ${
                  invoice.note
                    ? `
                  <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 8px 10px; font-size: 11px; margin-bottom: 8px;">
                    <strong style="color: #92400e;">Note / ចំណាំ:</strong>
                    <div style="color: #78350f; margin-top: 2px;">${invoice.note}</div>
                  </div>
                `
                    : ''
                }

                <div class="qr-box">
                  <div class="qr-badge">
                    <span>ABA</span>
                    <span style="font-size: 8px; color: #ff9900;">KHQR</span>
                  </div>
                  <div style="font-size: 10px; color: #475569;">
                    <div style="font-weight: 800; color: #0f172a; text-transform: uppercase;">Payment Instructions:</div>
                    <div>Bank: <strong>ABA Bank</strong></div>
                    <div>Account: <strong>FRESHMART CO., LTD</strong></div>
                    <div>USD Account: <strong>000 888 777</strong></div>
                  </div>
                </div>
              </td>

              <td class="totals-right">
                <div class="calc-row">
                  <span>Sub Total / សរុបរង:</span>
                  <strong style="color: #0f172a;">${formatCurrency(subTotal)}</strong>
                </div>

                ${
                  discountAmount > 0
                    ? `
                  <div class="calc-row" style="color: #16a34a;">
                    <span>Discount (${discountPercent}%):</span>
                    <strong>- ${formatCurrency(discountAmount)}</strong>
                  </div>
                `
                    : ''
                }

                ${
                  taxAmount > 0
                    ? `
                  <div class="calc-row">
                    <span>Tax (VAT ${taxPercent}%):</span>
                    <strong style="color: #0f172a;">${formatCurrency(taxAmount)}</strong>
                  </div>
                `
                    : ''
                }

                ${
                  markupAmount > 0
                    ? `
                  <div class="calc-row">
                    <span>Markup:</span>
                    <strong style="color: #0f172a;">${formatCurrency(markupAmount)}</strong>
                  </div>
                `
                    : ''
                }

                <div class="calc-row grand">
                  <span style="color: #ff9900;">GRAND TOTAL:</span>
                  <span>${formatCurrency(grandTotal)}</span>
                </div>

                <div class="calc-row" style="font-size: 10px;">
                  <span>Khmer Equivalent (៛):</span>
                  <strong style="color: #2563eb;">${formatKhmer(grandTotalKhmer)}</strong>
                </div>

                <div class="calc-row" style="color: #15803d;">
                  <span>Paid Amount / បានបង់:</span>
                  <strong>${formatCurrency(paidAmount)}</strong>
                </div>

                <div class="calc-row balance">
                  <span>Balance Due / សមតុល្យខ្វះ:</span>
                  <span>${formatCurrency(balance)}</span>
                </div>
              </td>
            </tr>
          </table>

          <!-- Signatures -->
          <table class="signatures">
            <tr>
              <td class="sig-box">
                <div class="sig-line"></div>
                <strong>Customer Signature</strong>
                <div style="font-size: 9px; color: #64748b;">ហត្ថលេខា និងឈ្មោះអតិថិជន</div>
              </td>
              <td class="sig-box">
                <div class="sig-line"></div>
                <strong>Authorized Signature & Stamp</strong>
                <div style="font-size: 9px; color: #64748b;">ហត្ថលេខា និងត្រាអ្នកទទួល</div>
              </td>
            </tr>
          </table>

          <div class="footer-note">
            Thank you for choosing FreshMart! | អរគុណសម្រាប់ការគាំទ្រ FreshMart
          </div>
        </div>
      </body>
    </html>
  `

  // Use a hidden iframe for seamless, 100% reliable printing
  let printFrame = document.getElementById('bg_invoice_print_frame')
  if (!printFrame) {
    printFrame = document.createElement('iframe')
    printFrame.id = 'bg_invoice_print_frame'
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = '0'
    document.body.appendChild(printFrame)
  }

  const doc = printFrame.contentWindow.document
  doc.open()
  doc.write(htmlContent)
  doc.close()

  printFrame.contentWindow.focus()
  setTimeout(() => {
    printFrame.contentWindow.print()
  }, 350)
}

export const SaleInvoicePrintModal = ({ invoice, open, onClose }) => {
  const { lang } = useLanguage()

  if (!open || !invoice) return null

  const handlePrint = () => {
    printInvoiceDocument(invoice)
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val) || 0)
  }

  const formatKhmer = (val) => {
    return new Intl.NumberFormat('km-KH').format(Math.round(Number(val) || 0)) + ' ៛'
  }

  const lines = invoice.lines || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 text-[#FF9900]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                {lang === 'en' ? 'Invoice Print Preview' : 'ទិដ្ឋភាពបោះពុម្ពវិក័យប័ត្រ'}
              </h2>
              <p className="text-xs text-slate-400">#{invoice.invoiceCode || 'INV-0000'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#77BC1F] to-[#5ea113] hover:from-[#65a317] hover:to-[#4e880e] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-green-500/20 transition active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {lang === 'en' ? 'Print Invoice' : 'បោះពុម្ពវិក័យប័ត្រ'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-[#77BC1F] flex items-center justify-center text-white font-black text-sm">FM</div>
                <span className="text-2xl font-black tracking-tight text-slate-900">FRESHMART</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 font-semibold">Fresh & Quality Groceries Platform</p>
              <p className="text-xs text-slate-500 mt-0.5">Phnom Penh, Cambodia | Tel: +855 (0) 23 888 999</p>
              <p className="text-xs text-slate-500">VAT / Tax ID: K008-902201948</p>
            </div>

            <div className="text-left sm:text-right">
              <h1 className="text-3xl font-black uppercase tracking-wider text-[#FF9900]">SALE INVOICE</h1>
              <p className="text-sm font-bold text-slate-700 mt-1"># {invoice.invoiceCode}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
                <span>Status:</span>
                <span className={invoice.status === 'PAID' ? 'text-green-600 font-bold' : invoice.status === 'CREDIT' ? 'text-purple-600 font-bold' : 'text-amber-600 font-bold'}>
                  {invoice.status || 'UNPAID'}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice & Customer Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">BILLED TO / អតិថិជន:</p>
              <p className="text-sm font-black text-slate-900">{invoice.customerName || invoice.billingName || 'Walk-in Customer'}</p>
              {invoice.customerPhone && <p className="text-slate-700">Phone: {invoice.customerPhone}</p>}
              {invoice.customerAddress && <p className="text-slate-600">Address: {invoice.customerAddress}</p>}
              {invoice.billingTaxNo && <p className="text-slate-600">Tax ID: {invoice.billingTaxNo}</p>}
            </div>

            <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">INVOICE DETAILS / ពត៌មានវិក័យប័ត្រ:</p>
              <div className="grid grid-cols-2 gap-y-1 text-slate-700">
                <span className="text-slate-500">Invoice Date:</span>
                <span className="font-bold text-slate-900">{invoice.invoiceDate || new Date().toISOString().slice(0, 10)}</span>
                <span className="text-slate-500">Due Date:</span>
                <span className="font-bold text-slate-900">{invoice.dueDate || '—'}</span>
                <span className="text-slate-500">Payment Term:</span>
                <span className="font-bold text-slate-900">{invoice.paymentTerm || 'Cash on Delivery'}</span>
                <span className="text-slate-500">Salesperson:</span>
                <span className="font-bold text-slate-900">{invoice.salesperson || 'Staff'}</span>
                {invoice.soCode && (
                  <>
                    <span className="text-slate-500">SO Code:</span>
                    <span className="font-bold text-slate-900">{invoice.soCode}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-600 uppercase text-[10px] tracking-wider bg-slate-100">
                  <th className="py-2.5 px-3 w-10 text-center">№</th>
                  <th className="py-2.5 px-3">Description / បរិយាយ</th>
                  <th className="py-2.5 px-3 text-center">UOM</th>
                  <th className="py-2.5 px-3 text-right">QTY</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lines.length > 0 ? (
                  lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{line.description || 'Product'}</p>
                        {line.productCode && <p className="text-[10px] text-slate-500">Code: {line.productCode}</p>}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{line.uom || 'Pcs'}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{line.qty || 1}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(line.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(line.discount)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(line.totalPrice)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-slate-400 italic">No items listed on this invoice</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payments Section */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t-2 border-slate-800">
            {/* Left Note & Bank/QR Info */}
            <div className="sm:col-span-7 space-y-4">
              {invoice.note && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                  <p className="font-bold text-amber-900">Note / ចំណាំ:</p>
                  <p className="text-amber-800 mt-0.5">{invoice.note}</p>
                </div>
              )}

              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="h-20 w-20 shrink-0 bg-white border border-slate-300 rounded-lg p-1.5 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="w-full h-full bg-slate-900 rounded flex flex-col items-center justify-center text-white">
                    <span className="text-[8px] font-black uppercase text-[#FF9900]">ABA PAY</span>
                    <span className="text-[7px] text-slate-300">KHQR</span>
                  </div>
                </div>
                <div className="text-xs space-y-0.5 text-slate-600">
                  <p className="font-extrabold text-slate-900 uppercase">Payment Info / ព័ត៌មានទូទាត់:</p>
                  <p>Bank: <strong className="text-slate-800">ABA Bank</strong></p>
                  <p>Account Name: <strong className="text-slate-800">FRESHMART CO., LTD</strong></p>
                  <p>Account USD: <strong className="text-slate-800">000 888 777</strong></p>
                  <p className="text-[10px] text-slate-500">Scan QR Code via any banking app in Cambodia.</p>
                </div>
              </div>
            </div>

            {/* Right Totals Breakdown */}
            <div className="sm:col-span-5 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                <span>Sub Total / សរុបរង:</span>
                <span className="font-bold text-slate-900">{formatCurrency(invoice.subTotal)}</span>
              </div>

              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between py-1 text-emerald-600 border-b border-slate-100">
                  <span>Discount / បញ្ចុះតម្លៃ ({invoice.discountPercent || 0}%):</span>
                  <span className="font-bold">- {formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}

              {Number(invoice.taxAmount) > 0 && (
                <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                  <span>Tax Amount / ពន្ធ ({invoice.taxPercent || 0}%):</span>
                  <span className="font-bold text-slate-900">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}

              {Number(invoice.markupAmount) > 0 && (
                <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
                  <span>Markup / បន្ថែម:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(invoice.markupAmount)}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-t-2 border-slate-800 text-sm font-black text-slate-900 bg-slate-100 px-3 rounded-lg">
                <span className="uppercase text-[#FF9900]">Grand Total ($):</span>
                <span className="text-slate-900 text-base">{formatCurrency(invoice.grandTotal)}</span>
              </div>

              <div className="flex justify-between py-1 px-3 text-xs text-slate-600">
                <span>Khmer Equivalent (៛):</span>
                <span className="font-bold text-slate-900">{formatKhmer(invoice.grandTotalKhmer || (invoice.grandTotal * 4100))}</span>
              </div>

              <div className="flex justify-between py-1 px-3 text-xs text-emerald-700">
                <span>Paid Amount / បានបង់:</span>
                <span className="font-bold">{formatCurrency(invoice.paidAmount)}</span>
              </div>

              <div className="flex justify-between py-1.5 px-3 bg-red-50 text-xs font-black text-red-700 rounded-lg border border-red-200">
                <span>Balance Due / សមតុល្យនៅខ្វះ:</span>
                <span>{formatCurrency(invoice.balance)}</span>
              </div>
            </div>
          </div>

          {/* Signature Boxes */}
          <div className="grid grid-cols-2 gap-8 pt-16 mt-8 border-t border-slate-200 text-center text-xs text-slate-500">
            <div>
              <div className="w-48 mx-auto border-b border-slate-400 pb-1"></div>
              <p className="mt-2 font-bold text-slate-800">Customer Signature & Name</p>
              <p className="text-[10px]">ហត្ថលេខា និងឈ្មោះអតិថិជន</p>
            </div>
            <div>
              <div className="w-48 mx-auto border-b border-slate-400 pb-1"></div>
              <p className="mt-2 font-bold text-slate-800">Authorized Signature & Stamp</p>
              <p className="text-[10px]">ហត្ថលេខា និងត្រាអ្នកទទួល</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-8">
            Thank you for your business with FreshMart! | អរគុណសម្រាប់ការគាំទ្រ
          </div>
        </div>
      </div>
    </div>
  )
}
