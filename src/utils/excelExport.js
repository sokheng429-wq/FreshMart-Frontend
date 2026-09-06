import * as XLSX from 'xlsx'

/**
 * Professional Excel (.xlsx) Exporter for FreshMart System
 * Generates branded, styled, and auto-filtered spreadsheets.
 *
 * @param {Object} options
 * @param {string} options.filename - Name of downloaded file (e.g. "product-supplier-list.xlsx")
 * @param {string} options.sheetName - Name of the worksheet tab (e.g. "Suppliers")
 * @param {string} options.title - Document report title (e.g. "PRODUCT SUPPLIER MAPPINGS")
 * @param {string} [options.subtitle] - Optional subtitle or description
 * @param {Array<string>} options.headers - Array of table header column names
 * @param {Array<Array<any>>} options.data - 2D Array of table row values
 * @param {Object} [options.summary] - Optional summary label & totals (e.g. { "Total Records": 25 })
 */
export const exportStyledExcel = ({
  filename = 'freshmart-export.xlsx',
  sheetName = 'Report',
  title = "FRESHMART SUPERMARKET REPORT",
  subtitle = '',
  headers = [],
  data = [],
  summary = null,
}) => {
  const now = new Date()
  const formattedDate = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // 1. Build Document Header Banner
  const titleRow = ["FRESHMART SUPERMARKET"]
  const subtitleRow = [title.toUpperCase()]
  const metaRow = [
    `Export Date: ${formattedDate}`,
    `Exported By: Admin / System`,
    `Total Records: ${data.length}`,
    subtitle ? `Note: ${subtitle}` : `System: FreshMart POS & Inventory`,
  ]
  const emptyRow = []

  // 2. Assemble Full Sheet AOA (Array of Arrays)
  const sheetAOA = [
    titleRow,
    subtitleRow,
    metaRow,
    emptyRow,
    headers,
    ...data,
  ]

  // 3. Append summary row if provided
  if (summary && typeof summary === 'object') {
    const summaryRow = new Array(headers.length).fill('')
    summaryRow[0] = 'TOTAL SUMMARY:'
    Object.entries(summary).forEach(([k, v], i) => {
      if (i + 1 < summaryRow.length) {
        summaryRow[i + 1] = `${k}: ${v}`
      }
    })
    sheetAOA.push(emptyRow)
    sheetAOA.push(summaryRow)
  }

  // 4. Create Worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetAOA)

  // 5. Calculate Smart Column Widths
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = String(header || '').length

    data.forEach((row) => {
      const cellVal = row[colIdx]
      if (cellVal !== undefined && cellVal !== null) {
        const len = String(cellVal).length
        if (len > maxLen) maxLen = len
      }
    })

    // Add comfort padding
    return { wch: Math.max(14, Math.min(48, maxLen + 4)) }
  })
  ws['!cols'] = colWidths

  // 6. Set Row Heights (for title banner & header clarity)
  ws['!rows'] = [
    { hpt: 24 }, // Title row height
    { hpt: 20 }, // Subtitle row height
    { hpt: 18 }, // Meta row height
    { hpt: 10 }, // Spacer row height
    { hpt: 22 }, // Table Header row height
  ]

  // 7. Enable Native Auto-Filter on Table Headers (Row index 4, which is 5th row)
  const headerRowIdx = 4
  const endRowIdx = headerRowIdx + data.length
  if (headers.length > 0 && data.length > 0) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIdx, c: 0 },
        e: { r: endRowIdx, c: headers.length - 1 },
      }),
    }
  }

  // 8. Create Workbook and Download
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))

  // Safe filename
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(wb, cleanFilename)
}

/**
 * Backwards-compatible helper matching legacy downloadExcel signature
 */
export const downloadExcel = (filename, sheetName, headers, dataRows, title = '') => {
  exportStyledExcel({
    filename,
    sheetName,
    title: title || sheetName || "FRESHMART DATA EXPORT",
    headers,
    data: dataRows,
  })
}

export default exportStyledExcel
