import React, { useState, useEffect, useRef } from 'react';
import { DollarSign } from 'lucide-react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: number;
    onChange: (value: number) => void;
    label?: string;
    icon?: React.ReactNode;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    label,
    icon,
    className = '',
    ...props
}) => {
    // Local display value (string formatted)
    const [displayValue, setDisplayValue] = useState('');

    // Format initial value
    useEffect(() => {
        setDisplayValue(formatToBRL(value));
    }, [value]);

    const formatToBRL = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const numericValue = parseInt(rawValue || '0', 10) / 100;

        // Let the parent know the numeric value
        onChange(numericValue);

        // Update local display immediately for smoothness
        setDisplayValue(formatToBRL(numericValue));
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF69B4] transition-colors font-bold text-xs">
                        {icon}
                    </div>
                )}
                <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    className={`
                        w-full bg-[#F5F5F5] border-none rounded-2xl py-4 ${icon ? 'pl-12' : 'px-5'} pr-4 outline-none 
                        focus:ring-2 focus:ring-[#FF69B4]/20 font-bold text-gray-800 transition-all text-sm
                        ${className}
                    `}
                    {...props}
                />
            </div>
        </div>
    );
};

export default CurrencyInput;
