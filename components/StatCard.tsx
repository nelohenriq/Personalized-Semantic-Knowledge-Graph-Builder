import React from 'react';
import Card from './Card';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    dense?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, dense = false }) => {
    return (
        <Card className={dense ? "p-4" : "p-6"}>
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className={`font-bold ${dense ? 'text-2xl' : 'text-3xl'}`}>{value}</p>
            {subtitle && <p className={`text-muted-foreground ${dense ? 'text-xs' : 'text-sm'}`}>{subtitle}</p>}
        </Card>
    );
};

export default StatCard;
