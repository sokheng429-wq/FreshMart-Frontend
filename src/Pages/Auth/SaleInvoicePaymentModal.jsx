import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'

export const SaleInvoicePaymentModal = ({
  open,
  onClose,
  invoiceData,
  onSaveAndPay,
  onPreview,
  onPrint,
  saving = false,
}) => {
  const { lang } = useLanguage()

  const grandTotal = Number(invoiceData?.grandTotal || 0)
  const exchangeRate = Number(invoiceData?.exchangeRate || 4100)

  // Live Date (non-editable as requested: "Receive Date - Date - It cant edit bcuz it use live date")
  const [liveDate] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10) + ' ' + d.toTimeString().slice(0, 5)
  })

  // Payment states
  const [paymentAmount, setPaymentAmount] = useState(grandTotal)
  const [paymentType, setPaymentType] = useState('CASH') // CASH, ABA_QR, BANK_TRANSFER, CREDIT, CARD
  const [cashTendered, setCashTendered] = useState(grandTotal)
  const [abaRef, setAbaRef] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setPaymentAmount(grandTotal)
      setCashTendered(grandTotal)
    }
  }, [open, grandTotal])

  if (!open) return null

  const grandTotalKhmer = Math.round(grandTotal * exchangeRate)
  const numericPaymentAmount = Number(paymentAmount) || 0
  const balance = Math.max(0, grandTotal - numericPaymentAmount)
  const changeAmount = paymentType === 'CASH' && Number(cashTendered) > numericPaymentAmount
    ? Number(cashTendered) - numericPaymentAmount
    : 0

  const formatUSD = (num) => `$ ${Number(num || 0).toFixed(2)}`
  const formatKHR = (num) => `${new Intl.NumberFormat('km-KH').format(Math.round(Number(num || 0)))} ៛`

  const handleCreditPay = () => {
    onSaveAndPay({
      paymentType: paymentType,
      paidAmount: numericPaymentAmount,
      balance: balance,
      reference: paymentType === 'ABA_QR' ? abaRef : (paymentType === 'CASH' ? `Cash Paid: $${cashTendered}` : ''),
      note: note,
      receiveDate: liveDate,
      isCredit: paymentType === 'CREDIT' || balance > 0,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 text-[#77BC1F]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {lang === 'en' ? 'Payment Information' : 'ព័ត៌មានទូទាត់ប្រាក់'}
              </h2>
              <p className="text-xs text-slate-400">
                {invoiceData?.invoiceCode ? `#${invoiceData.invoiceCode}` : 'Invoice Settlement'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Row 1: Live Receive Date (Non-editable) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>{lang === 'en' ? 'Receive Date (Live)' : 'កាលបរិច្ឆេទទទួល (បច្ចុប្បន្ន)'}</span>
              <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping" />
                Live System Date
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={liveDate}
                readOnly
                disabled
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-4 py-2.5 text-sm font-semibold text-slate-300 cursor-not-allowed select-none"
              />
              <svg className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Row 2: Amounts (Dollar & Khmer Riel) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {lang === 'en' ? 'Invoice Amount Dollar ($)' : 'ចំនួនទឹកប្រាក់ដុល្លារ ($)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatUSD(grandTotal)}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2.5 text-base font-black text-orange-400 select-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-400">USD</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {lang === 'en' ? 'Invoice Amount Khmer (៛)' : 'ចំនួនទឹកប្រាក់រៀល (៛)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatKHR(grandTotalKhmer)}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-base font-black text-blue-400 select-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400">KHR</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500 text-right">Rate: 1 USD = {exchangeRate} KHR</p>
            </div>
          </div>

          {/* Row 3: Payment Amount & Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-green-400 mb-1.5">
                {lang === 'en' ? 'Payment Amount *' : 'ចំនួនទឹកប្រាក់ទូទាត់ *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={grandTotal}
                  value={paymentAmount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value)
                    setPaymentAmount(val)
                    if (paymentType === 'CASH') setCashTendered(val)
                  }}
                  className="w-full rounded-xl border border-green-500/60 bg-slate-950 px-4 py-2.5 text-base font-black text-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {lang === 'en' ? 'Remaining Balance' : 'សមតុល្យនៅខ្វះ'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatUSD(balance)}
                  readOnly
                  disabled
                  className={`w-full rounded-xl border px-4 py-2.5 text-base font-black select-none ${
                    balance > 0
                      ? 'border-red-500/40 bg-red-500/10 text-red-400'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">USD</span>
              </div>
            </div>
          </div>

          {/* Row 4: Payment Type Selectors */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              {lang === 'en' ? 'Payment Type' : 'វិធីសាស្រ្តទូទាត់'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'CASH', label: 'CASH', kh: 'សាច់ប្រាក់', icon: '💵', color: '#77BC1F' },
                { key: 'ABA_QR', label: 'ABA QR', kh: 'ABA QR', icon: '📱', color: '#005696' },
                { key: 'BANK_TRANSFER', label: 'Bank Transfer', kh: 'ផ្ទេរប្រាក់', icon: '🏦', color: '#3B82F6' },
                { key: 'CREDIT', label: 'Credit', kh: 'ជំពាក់/ឥណទាន', icon: '💳', color: '#a855f7' },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentType(m.key)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-bold ${
                    paymentType === m.key
                      ? 'border-green-400 bg-green-500/20 text-white shadow-lg shadow-green-500/10 scale-[1.02]'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-xl mb-1">{m.icon}</span>
                  <span>{lang === 'en' ? m.label : m.kh}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Specific input for ABA QR or Cash */}
          {paymentType === 'ABA_QR' && (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300">ABA PayWay / KHQR Scan</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase">Instant</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 bg-white rounded-lg p-1 flex items-center justify-center text-center shadow">
                  <span className="text-[10px] font-black text-slate-900 leading-tight">ABA<br />KHQR</span>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">ABA Transaction / Approval Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ABA-TXN-90281"
                    value={abaRef}
                    onChange={(e) => setAbaRef(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentType === 'CASH' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-green-500/30 bg-green-950/20">
              <div>
                <label className="block text-[11px] font-bold text-green-300 mb-1">Cash Received ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Change Return</label>
                <div className="px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-950 text-sm font-bold text-emerald-400">
                  {formatUSD(changeAmount)} <span className="text-[10px] text-slate-400">({formatKHR(changeAmount * exchangeRate)})</span>
                </div>
              </div>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {lang === 'en' ? 'Payment Memo / Note' : 'ចំណាំការទូទាត់'}
            </label>
            <input
              type="text"
              placeholder="Optional payment remarks..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-green-400"
            />
          </div>
        </div>

        {/* Footer Actions as requested: Preview Button, Print Button, Discard Button, and Credit Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {lang === 'en' ? 'Preview' : 'មើលជាមុន'}
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {lang === 'en' ? 'Print' : 'បោះពុម្ព'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              {lang === 'en' ? 'Discard' : 'បោះបង់'}
            </button>

            <button
              type="button"
              onClick={handleCreditPay}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#77BC1F] to-[#5ea113] hover:from-[#65a317] hover:to-[#4e880e] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-green-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{paymentType === 'CREDIT' ? (lang === 'en' ? 'Credit / Save' : 'ជំពាក់ / រក្សាទុក') : (lang === 'en' ? 'Pay & Save' : 'ទូទាត់ និងរក្សាទុក')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
