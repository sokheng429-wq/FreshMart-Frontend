import React from 'react'

/**
 * Printable Cost Change Note Document Template
 * Optimized for A4 / Letter printing with print CSS
 */
export const CostChangeNotePrint = ({
  company = {
    name: "FRESHMART SUPERMARKET",
    email: 'support@freshmart.com',
    website: 'www.freshmart.com',
    address: '#128, Preah Norodom Blvd, Phnom Penh, Cambodia (រាជធានីភ្នំពេញ)',
    phone: '+855 23 999 888 / +855 12 345 678',
  },
  document = {
    code: 'CC-20260831-001',
    date: new Date().toISOString(),
    outlet: 'MAIN-OUTLET',
    location: 'DEFAULT-LOC',
    reference: 'REF-PRICE-HIKE-001',
  },
  items = [],
  printedBy = {
    user: 'Admin',
    timestamp: new Date().toLocaleString('en-GB'),
  },
  onClose,
}) => {
  const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`
  const formatQty = (qty) => Number(qty || 0).toFixed(2)

  const formatDisplayDate = (dStr) => {
    if (!dStr) return '—'
    const d = new Date(dStr)
    if (Number.isNaN(d.getTime())) return dStr
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate totals
  const totalOldCostSum = items.reduce(
    (sum, it) => sum + (Number(it.qty || 0) * Number(it.oldCost || 0)),
    0
  )
  const totalNewCostSum = items.reduce(
    (sum, it) => sum + (Number(it.qty || 0) * Number(it.newCost || 0)),
    0
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex flex-col items-center">
      {/* Screen-only Action Toolbar */}
      <div className="no-print mb-4 w-full max-w-[210mm] flex items-center justify-between rounded-xl bg-slate-900 border border-slate-700 p-3 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">🖨️ Printable Cost Change Note</span>
          <span className="rounded bg-[#7EB631]/20 px-2 py-0.5 text-[11px] font-bold text-[#7EB631]">
            A4 Ready
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            ✕ Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#7EB631] px-4 py-1.5 text-xs font-black text-slate-950 shadow-md transition hover:brightness-110"
          >
            <span>🖨️</span>
            <span>Print Note</span>
          </button>
        </div>
      </div>

      {/* A4 Printable Document Container */}
      <div
        id="cost-change-printable-doc"
        className="cost-change-print-sheet bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-8 border border-black shadow-2xl font-['Montserrat','Kantumruy_Pro',sans-serif] text-[11px] leading-relaxed relative flex flex-col justify-between"
        style={{
          boxSizing: 'border-box',
          color: '#000000',
          backgroundColor: '#ffffff',
        }}
      >
        <div>
          {/* HEADER ROW (2 Columns) */}
          <div className="flex justify-between items-start pb-4 border-b border-black">
            {/* Left Side: Logo Box + Company Info */}
            <div className="flex gap-3.5 max-w-[62%]">
              {/* Logo Box */}
              <div
                className="w-14 h-14 shrink-0 rounded flex flex-col items-center justify-center p-1 text-center"
                style={{ backgroundColor: '#243040' }}
              >
                <span className="text-[10px] font-black tracking-wider leading-tight text-[#7EB631]">
                  FRESHMART
                </span>
              </div>

              {/* Company Details */}
              <div className="space-y-0.5 text-[10px] text-black">
                <div className="font-extrabold text-[12px] uppercase text-black">
                  {company.name || "FRESHMART SUPERMARKET"}
                </div>
                <div>
                  <span className="font-bold">Email: </span>
                  <span>{company.email || 'support@freshmart.com'}</span>
                </div>
                <div>
                  <span className="font-bold">Website: </span>
                  <span>{company.website || 'www.freshmart.com'}</span>
                </div>
                <div className="font-['Kantumruy_Pro',sans-serif]">
                  <span className="font-bold font-['Montserrat']">Address: </span>
                  <span>{company.address || '#128, Preah Norodom Blvd, Phnom Penh'}</span>
                </div>
                <div>
                  <span className="font-bold">Phone: </span>
                  <span>{company.phone || '+855 23 999 888'}</span>
                </div>
              </div>
            </div>

            {/* Right Side: Document Title & Metadata */}
            <div className="text-right space-y-1 max-w-[36%]">
              <h1 className="text-[16px] font-black uppercase tracking-tight text-black">
                Cost Change Note
              </h1>
              <div className="space-y-0.5 text-[10px]">
                <div>
                  <span className="font-bold">Document Code: </span>
                  <span className="font-mono font-bold">{document.code || 'CC-000000'}</span>
                </div>
                <div>
                  <span className="font-bold">Document Date: </span>
                  <span>{formatDisplayDate(document.date)}</span>
                </div>
                <div>
                  <span className="font-bold">Outlet: </span>
                  <span>{document.outlet || 'MAIN-OUTLET'}</span>
                </div>
                <div>
                  <span className="font-bold">Location: </span>
                  <span>{document.location || 'DEFAULT-LOC'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* REFERENCE BAR */}
          <div
            className="my-3 px-3 py-1.5 border border-black/30 text-[10px]"
            style={{ backgroundColor: '#f3f4f6' }}
          >
            <span className="font-bold">Reference : </span>
            <span>{document.reference || '—'}</span>
          </div>

          {/* ITEM TABLE */}
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr
                className="border-b border-black text-[10px] font-bold uppercase"
                style={{ backgroundColor: '#e5e7eb' }}
              >
                <th className="py-2 px-1 text-center w-7">N°</th>
                <th className="py-2 px-1 text-center w-10">Picture</th>
                <th className="py-2 px-2">Product Code</th>
                <th className="py-2 px-2">Description</th>
                <th className="py-2 px-2 text-right">QTY</th>
                <th className="py-2 px-2">UOM</th>
                <th className="py-2 px-2 text-right">Old Cost</th>
                <th className="py-2 px-2 text-right">Old Total Cost</th>
                <th className="py-2 px-2 text-right">New Cost</th>
                <th className="py-2 px-2 text-right">New Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                    No cost change items recorded.
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => {
                  const qty = Number(row.qty || 1)
                  const oldCost = Number(row.oldCost || 0)
                  const oldTotal = row.oldTotalCost !== undefined ? Number(row.oldTotalCost) : qty * oldCost
                  const newCost = Number(row.newCost || 0)
                  const newTotal = row.newTotalCost !== undefined ? Number(row.newTotalCost) : qty * newCost

                  return (
                    <tr
                      key={row.id || idx}
                      className={idx === items.length - 1 ? 'border-b border-black' : ''}
                    >
                      <td className="py-1 px-1 text-center font-mono align-middle">{idx + 1}</td>
                      <td className="py-1 px-1 text-center align-middle">
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt=""
                            className="h-8 w-8 object-cover border border-black/40 rounded mx-auto"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <span className="text-[9px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-1 px-2 font-mono font-bold align-middle">{row.productCode || row.code || '—'}</td>
                      <td className="py-1 px-2 align-middle">
                        <div className="font-semibold">{row.description || row.name || '—'}</div>
                        {row.nameKh && row.nameKh !== '—' && (
                          <div className="text-[9px] text-black/70 font-['Kantumruy_Pro']">{row.nameKh}</div>
                        )}
                      </td>
                      <td className="py-1 px-2 text-right font-mono align-middle">{formatQty(qty)}</td>
                      <td className="py-1 px-2 align-middle">{row.uom || 'Unit'}</td>
                      <td className="py-1 px-2 text-right font-mono align-middle">{formatMoney(oldCost)}</td>
                      <td className="py-1 px-2 text-right font-mono font-semibold align-middle">{formatMoney(oldTotal)}</td>
                      <td className="py-1 px-2 text-right font-mono align-middle">{formatMoney(newCost)}</td>
                      <td className="py-1 px-2 text-right font-mono font-bold align-middle">{formatMoney(newTotal)}</td>
                    </tr>
                  )
                })
              )}

              {/* TOTALS ROW */}
              {items.length > 0 && (
                <tr className="font-bold text-[10px]">
                  <td colSpan={7} className="py-2.5 px-2 text-right uppercase tracking-wider">
                    Total:
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono border-t border-black">
                    {formatMoney(totalOldCostSum)}
                  </td>
                  <td className="py-2.5 px-2"></td>
                  <td className="py-2.5 px-2 text-right font-mono border-t border-black text-[11px]">
                    {formatMoney(totalNewCostSum)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="mt-8 pt-2 border-t border-black/80 flex items-center justify-between text-[9px] text-black">
          <div>
            <span className="font-bold">Print By : </span>
            <span>
              {printedBy.user || 'Admin'} {printedBy.timestamp || new Date().toLocaleString('en-GB')}
            </span>
          </div>

          <div className="font-mono font-bold">1/1</div>
        </div>
      </div>

      {/* Embedded Print CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #cost-change-printable-doc,
          #cost-change-printable-doc * {
            visibility: visible !important;
          }
          #cost-change-printable-doc {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 12mm !important;
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default CostChangeNotePrint
