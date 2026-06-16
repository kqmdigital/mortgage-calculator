import { ChevronDown } from 'lucide-react';

/**
 * Reusable multi-select dropdown with checkbox options.
 *
 * @param {string} label - Field label shown above the control
 * @param {string[]} options - Selectable option values
 * @param {string[]} selected - Currently selected values
 * @param {(value: string) => void} onToggle - Called with an option value to toggle it
 * @param {boolean} isOpen - Whether the option panel is open
 * @param {() => void} onToggleOpen - Toggles the open state
 * @param {React.RefObject} dropdownRef - Ref on the wrapper (used for click-outside detection)
 * @param {string} [placeholder='All'] - Text shown when nothing is selected
 * @param {boolean} [scrollable=false] - Constrain panel height and scroll (for long option lists)
 */
const MultiSelectDropdown = ({
  label,
  options,
  selected,
  onToggle,
  isOpen,
  onToggleOpen,
  dropdownRef,
  placeholder = 'All',
  scrollable = false
}) => (
  <div className="relative" ref={dropdownRef}>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <button
      type="button"
      onClick={onToggleOpen}
      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex justify-between items-center bg-white text-base sm:text-sm min-h-[44px] sm:min-h-[auto]"
    >
      <span className="text-gray-700 truncate">
        {selected.length === 0 ? placeholder : selected.join(', ')}
      </span>
      <ChevronDown className="w-4 h-4 flex-shrink-0 ml-1" />
    </button>
    {isOpen && (
      <div
        className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10${
          scrollable ? ' max-h-52 overflow-y-auto' : ''
        }`}
      >
        <div className="p-2">
          {options.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="rounded"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default MultiSelectDropdown;
