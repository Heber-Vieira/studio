import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
    helperText?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    icon,
    error,
    helperText,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-2">
            {label && (
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF69B4] transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full bg-[#F5F5F5] border-none rounded-2xl py-4 outline-none 
            focus:ring-2 focus:ring-[#FF69B4]/20 font-bold transition-all
            ${icon ? 'pl-12 pr-4' : 'px-6'}
            ${error ? 'ring-2 ring-rose-300' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-rose-500 text-xs font-medium ml-2">{error}</p>
            )}
            {helperText && !error && (
                <p className="text-gray-400 text-xs font-medium ml-2">{helperText}</p>
            )}
        </div>
    );
};

export default InputField;
