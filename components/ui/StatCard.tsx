import React from 'react';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    bgColor?: string;
    onClick?: () => void;
    prefix?: string;
    suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    change,
    icon,
    bgColor = 'bg-pink-50',
    onClick,
    prefix = '',
    suffix = ''
}) => {
    const isPositive = change?.startsWith('+');
    const formattedValue = typeof value === 'number'
        ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value;

    return (
        <div
            onClick={onClick}
            className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl shadow-sm transition-transform group-hover:scale-110 ${bgColor}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</span>
            </div>
            <div className="flex items-end justify-between">
                <h2 className="text-2xl font-bold">
                    {prefix && <span className="text-base text-gray-300 font-bold mr-1">{prefix}</span>}
                    {formattedValue}
                    {suffix && <span className="text-base text-gray-300 font-bold ml-1">{suffix}</span>}
                </h2>
                {change && (
                    <span className={`text-sm font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                        {change}
                    </span>
                )}
            </div>
        </div>
    );
};

export default StatCard;
