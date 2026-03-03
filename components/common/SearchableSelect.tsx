'use client';
import { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
    id: string;
    name: string;
    [key: string]: any;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    noOptionsMessage?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select Option...',
    className = '',
    noOptionsMessage = 'No options found'
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = useMemo(() => {
        return options.filter(opt =>
            opt.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const selectedOption = useMemo(() => {
        return options.find(opt => opt.id === value);
    }, [options, value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(id);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`position-relative w-100 ${className}`} ref={dropdownRef}>
            <div
                className="form-control bg-light border-0 d-flex justify-content-between align-items-center cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
                style={{ cursor: 'pointer', height: '100%', minHeight: '38px' }}
            >
                <span className={selectedOption ? 'text-dark' : 'text-muted'}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} small opacity-50`}></i>
            </div>

            {isOpen && (
                <div className="position-absolute top-100 start-0 end-0 mt-1 bg-white border shadow-lg rounded-3 overflow-hidden" style={{ zIndex: 1100 }}>
                    <div className="p-2 border-bottom">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-transparent border-end-0">
                                <i className="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0 shadow-none bg-transparent"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="overflow-auto" style={{ maxHeight: '250px' }}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.id}
                                    className={`px-3 py-2 cursor-pointer small select-option ${value === opt.id ? 'bg-primary text-white' : 'text-dark'}`}
                                    onClick={(e) => handleSelect(opt.id, e)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {opt.name}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-3 text-muted small text-center">{noOptionsMessage}</div>
                        )}
                    </div>
                </div>
            )}
            <style jsx>{`
                .select-option:hover {
                    background-color: ${value ? '' : '#f8f9fa'};
                    color: ${value ? '' : '#000'};
                }
                .select-option:not(.bg-primary):hover {
                    background-color: #f8f9fa;
                }
            `}</style>
        </div>
    );
}
