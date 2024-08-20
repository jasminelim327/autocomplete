import React, { useState, useEffect, useRef, useCallback } from "react";
import { Option } from '../../types/AutocompleteTypes.tsx';

interface AutocompleteProps<T> {
  options: T[];
  placeholder?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  multiple?: boolean;
  value?: T | T[];
  onChange?: (value: T | T[]) => void;
  onInputChange?: (inputValue: string) => void;
  filterOptions?: (options: T[], inputValue: string) => T[];
  renderOption?: (option: T) => React.ReactNode;
  isAsync?: boolean;
  debounceDelay?: number;
}

function Autocomplete<T extends Option>({
  options,
  placeholder = "",
  label,
  description,
  disabled = false,
  multiple = true,
  value,
  onChange,
  onInputChange,
  filterOptions,
  renderOption,
  isAsync = false,
  debounceDelay = 600,
}: AutocompleteProps<T>) {
  const [inputValue, setInputValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<T[]>(options);
  const [selectedValue, setSelectedValue] = useState<T[]>(
    multiple ? (value as T[]) || [] : []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true);

    if (isAsync) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      setLoading(true);

      debounceTimeoutRef.current = setTimeout(() => {
        updateFilteredOptions(value);
      }, debounceDelay);
    } else {
      updateFilteredOptions(value);
    }

    if (onInputChange) onInputChange(value);
  };

  // Update filtered options based on input value
  const updateFilteredOptions = useCallback(
    (value: string) => {
      const newFilteredOptions = filterOptions
        ? filterOptions(options, value)
        : options.filter((option) =>
            typeof option === "string"
              ? option.toLowerCase().includes(value.toLowerCase())
              : (option as { label: string }).label
                  .toLowerCase()
                  .includes(value.toLowerCase())
          );
      setFilteredOptions(newFilteredOptions);
      setLoading(false);
    },
    [filterOptions, options]
  );

  // Async filtering with debounce
  useEffect(() => {
    if (isAsync) {
      debounceTimeoutRef.current = setTimeout(() => {
        updateFilteredOptions(inputValue);
      }, debounceDelay);

      return () => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      };
    } else {
      updateFilteredOptions(inputValue);
    }
  }, [inputValue, debounceDelay, isAsync, updateFilteredOptions]);

  // Handle option selection
  const handleOptionClick = (option: T) => {
    if (multiple) {
      setSelectedValue((prevSelectedValue) =>
        prevSelectedValue.includes(option)
          ? prevSelectedValue.filter((val) => val !== option)
          : [...prevSelectedValue, option]
      );
    } else {
      setSelectedValue([option]);
      setIsOpen(false);
    }

    if (onChange) onChange(multiple ? selectedValue : option);
    setInputValue("");
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        setHighlightedIndex((prevIndex) =>
          Math.min(prevIndex + 1, filteredOptions.length - 1)
        );
        break;
      case "ArrowUp":
        setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        break;
      case "Enter":
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-64">
      {label && <label className="block text-gray-700">{label}</label>}
      <div className="flex flex-wrap items-center border p-2 bg-white rounded">
        {selectedValue.map((option, index) => (
          <span
            key={index}
            className="bg-blue-100 text-gray rounded-full px-2 py-1 mr-2 mb-2 text-sm flex items-center"
          >
            {typeof option === "string"
              ? option
              : (option as { label: string }).label}
            <button
              type="button"
              className="ml-1 text-gray-500 rounded-full px-1 py-0.5 text-xs flex items-center focus:outline-none"
              onClick={() => handleOptionClick(option)}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 border-0 p-0 outline-none ${
            disabled ? "bg-gray-200" : "bg-white"
          }`}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="border bg-white mt-1 max-h-60 overflow-y-auto absolute z-10 w-full"
        >
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-gray-500">No options available</div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                className={`p-2 cursor-pointer flex items-center ${
                  highlightedIndex === index ? "bg-blue-100" : ""
                }`}
                onClick={() => handleOptionClick(option)}
              >
                <input
                  type="checkbox"
                  checked={selectedValue.includes(option)}
                  onChange={() => handleOptionClick(option)}
                  className="mr-2"
                />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="loader"></div>
                  </div>
                )}
                {renderOption
                  ? renderOption(option)
                  : typeof option === "string"
                  ? option
                  : (option as { label: string }).label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Autocomplete;
