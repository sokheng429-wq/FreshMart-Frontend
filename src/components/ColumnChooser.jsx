import { useState, useRef, useEffect } from 'react';

const ColumnChooser = ({ availableColumns, visibleColumns, onApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelected, setTempSelected] = useState(visibleColumns);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredColumns = availableColumns.filter(col =>
    col.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (columnKey) => {
    setTempSelected(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAll = () => {
    setTempSelected(availableColumns.map(col => col.key));
  };

  const handleClearAll = () => {
    setTempSelected([]);
  };

  const handleApply = () => {
    onApply(tempSelected);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelected(visibleColumns);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded hover:bg-gray-100 transition-colors"
        title="Choose columns"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 3h4v4H3V3zm6 0h4v4H9V3zm6 0h4v4h-4V3zM3 9h4v4H3V9zm6 0h4v4H9V9zm6 0h4v4h-4V9zM3 15h4v4H3v-4zm6 0h4v4H9v-4zm6 0h4v4h-4v-4z"
            fill="#232F3F"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-base font-semibold text-[#232F3F]" style={{ fontFamily: 'Montserrat' }}>
              Choose column you want to display on table
            </h3>
          </div>

          {/* Search Input */}
          <div className="px-4 pt-3">
            <input
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#77BC1F] focus:border-transparent"
              style={{ fontFamily: 'Montserrat' }}
            />
          </div>

          {/* Select All / Clear All */}
          <div className="px-4 py-2 flex gap-3 text-sm">
            <button
              onClick={handleSelectAll}
              className="text-[#77BC1F] hover:text-[#6AAA1A] font-medium"
              style={{ fontFamily: 'Montserrat' }}
            >
              Select All
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={handleClearAll}
              className="text-gray-600 hover:text-gray-800 font-medium"
              style={{ fontFamily: 'Montserrat' }}
            >
              Clear All
            </button>
          </div>

          {/* Column List */}
          <div className="max-h-80 overflow-y-auto px-4 py-2">
            {filteredColumns.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center" style={{ fontFamily: 'Montserrat' }}>
                No columns found
              </p>
            ) : (
              filteredColumns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2"
                >
                  <input
                    type="checkbox"
                    checked={tempSelected.includes(col.key)}
                    onChange={() => handleToggle(col.key)}
                    className="w-4 h-4 rounded border-gray-300 text-[#77BC1F] focus:ring-[#77BC1F] cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 font-medium" style={{ fontFamily: 'Montserrat' }}>
                    {col.label}
                  </span>
                </label>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-3 border-t border-gray-200 flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-semibold rounded-md bg-gray-100 text-[#232F3F] hover:bg-gray-200 transition-colors"
              style={{ fontFamily: 'Montserrat' }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-semibold rounded-md bg-[#77BC1F] text-white hover:bg-[#6AAA1A] transition-colors"
              style={{ fontFamily: 'Montserrat' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnChooser;
