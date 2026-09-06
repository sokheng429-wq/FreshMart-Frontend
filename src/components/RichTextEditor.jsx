import { useEffect, useRef, useState } from 'react'

export const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Insert text here...',
  minHeight = '140px',
  className = '',
}) => {
  const editorRef = useRef(null)
  const colorInputRef = useRef(null)
  const isUpdatingRef = useRef(false)

  // Active Formatting States
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    unorderedList: false,
    orderedList: false,
  })

  const [fontSize, setFontSize] = useState(11)
  const [textColor, setTextColor] = useState('#ffffff')
  const [isEmpty, setIsEmpty] = useState(true)

  // Sync incoming value with contentEditable innerHTML without losing cursor position
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        isUpdatingRef.current = true
        editorRef.current.innerHTML = value || ''
        isUpdatingRef.current = false
      }
      checkIsEmpty()
    }
  }, [value])

  const checkIsEmpty = () => {
    if (!editorRef.current) return
    const text = editorRef.current.innerText || ''
    const html = editorRef.current.innerHTML || ''
    const empty = text.trim() === '' && !html.includes('<img') && !html.includes('<hr')
    setIsEmpty(empty)
  }

  // Update active button states based on cursor selection
  const updateToolbarState = () => {
    if (!editorRef.current) return
    checkIsEmpty()

    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
      })

      // Get current computed font size or selection parent font size
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const node = selection.anchorNode
        const element = node?.nodeType === 1 ? node : node?.parentElement
        if (element && editorRef.current.contains(element)) {
          const computed = window.getComputedStyle(element)
          const computedPx = parseInt(computed.fontSize, 10)
          if (computedPx && !isNaN(computedPx)) {
            setFontSize(computedPx)
          }
        }
      }
    } catch {
      // ignore security or disconnected node errors
    }
  }

  // Emit HTML changes
  const handleInput = () => {
    if (isUpdatingRef.current || !editorRef.current) return
    checkIsEmpty()
    const html = editorRef.current.innerHTML
    // Normalize empty tags
    if (html === '<br>' || html === '<p><br></p>' || html === '<div><br></div>') {
      onChange?.('')
    } else {
      onChange?.(html)
    }
  }

  // Execute formatting with Selection / Range & document execCommand
  const executeCommand = (command, val = null) => {
    if (!editorRef.current) return
    editorRef.current.focus()

    // Apply command
    document.execCommand(command, false, val)

    handleInput()
    updateToolbarState()
  }

  // Apply Custom Font Size via Range API / DOM wrapping
  const applyFontSize = (newSize) => {
    const size = Math.max(8, Math.min(72, Number(newSize) || 11))
    setFontSize(size)
    if (!editorRef.current) return
    editorRef.current.focus()

    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) return
    const range = selection.getRangeAt(0)

    if (range.collapsed) {
      // When no text is highlighted, insert a styled zero-width span or execCommand
      document.execCommand('fontSize', false, '3')
      // Map font tags to span with precise px
      const fontEls = editorRef.current.querySelectorAll('font[size="3"]')
      fontEls.forEach((el) => {
        el.removeAttribute('size')
        el.style.fontSize = `${size}px`
      })
    } else {
      // Wrap selected contents in span with exact px font-size
      const fragment = range.extractContents()
      const span = document.createElement('span')
      span.style.fontSize = `${size}px`
      span.appendChild(fragment)
      range.insertNode(span)

      // Restore selection to the newly styled span
      const newRange = document.createRange()
      newRange.selectNodeContents(span)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }

    handleInput()
    updateToolbarState()
  }

  // Apply Text Color
  const applyColor = (color) => {
    setTextColor(color)
    executeCommand('foreColor', color)
  }

  const FONT_SIZES = [9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32]

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/80 transition-all duration-150 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 ${className}`}
    >
      {/* =========================================================================
         TOOLBAR
         ========================================================================= */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 bg-slate-900/90 px-3 py-2 select-none">
        
        {/* Bold Button */}
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black transition ${
            activeFormats.bold
              ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>

        {/* Italic Button */}
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-serif italic font-bold transition ${
            activeFormats.italic
              ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>

        {/* Underline Button */}
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold underline transition ${
            activeFormats.underline
              ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>

        {/* Strikethrough Button */}
        <button
          type="button"
          onClick={() => executeCommand('strikeThrough')}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold line-through transition ${
            activeFormats.strikeThrough
              ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <span className="mx-1 h-4 w-px bg-slate-800" />

        {/* Text Color Picker */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            title="Text Color"
          >
            <span className="font-bold">A</span>
            <span
              className="h-2.5 w-2.5 rounded-full border border-slate-600 shadow-sm"
              style={{ backgroundColor: textColor }}
            />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={textColor}
            onChange={(e) => applyColor(e.target.value)}
            className="sr-only"
          />
        </div>

        <span className="mx-1 h-4 w-px bg-slate-800" />

        {/* Bullet List Button */}
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition ${
            activeFormats.unorderedList
              ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Bullet List"
        >
          •≡
        </button>

        {/* Numbered List Button */}
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition ${
            activeFormats.orderedList
              ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Numbered List"
        >
          1≡
        </button>

        <span className="mx-1 h-4 w-px bg-slate-800" />

        {/* Font Size Stepper & Dropdown */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-950 px-1 py-0.5 shadow-inner">
          <button
            type="button"
            onClick={() => applyFontSize(fontSize - 1)}
            disabled={fontSize <= 8}
            className="flex h-5 w-5 items-center justify-center rounded text-xs font-black text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
            title="Decrease Font Size"
          >
            −
          </button>

          <select
            value={fontSize}
            onChange={(e) => applyFontSize(e.target.value)}
            className="bg-transparent text-center font-mono text-xs font-bold text-emerald-300 outline-none cursor-pointer"
            title="Font Size (px)"
          >
            {FONT_SIZES.map((sz) => (
              <option key={sz} value={sz} className="bg-slate-900 text-slate-200">
                {sz}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => applyFontSize(fontSize + 1)}
            disabled={fontSize >= 72}
            className="flex h-5 w-5 items-center justify-center rounded text-xs font-black text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
            title="Increase Font Size"
          >
            +
          </button>
        </div>

      </div>

      {/* =========================================================================
         CONTENT EDITABLE TEXT AREA
         ========================================================================= */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          onFocus={updateToolbarState}
          onBlur={updateToolbarState}
          style={{ minHeight }}
          className="rich-text-editor-area block w-full resize-y overflow-y-auto px-4 py-3 text-sm text-slate-100 outline-none leading-relaxed"
        />

        {/* Italic Gray Placeholder when Empty */}
        {isEmpty && (
          <div
            onClick={() => editorRef.current?.focus()}
            className="pointer-events-none absolute left-4 top-3 text-sm italic text-slate-500 select-none"
          >
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}

export default RichTextEditor
