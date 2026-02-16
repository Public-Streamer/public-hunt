import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";

const RevenueStats: React.FC = () => {
    // Mock data for now
    const stats = [
        {
            title: "Total Revenue",
            value: "$0.00",
            change: "+0% from last month",
            icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
        },
        {
            title: "Ticket Sales",
            value: "0",
            change: "+0 from last month",
            icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
        },
        {
            title: "Active Subscribers",
            value: "0",
            change: "+0 from last month",
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
        },
        {
            title: "Average Order Value",
            value: "$0.00",
            change: "+0% from last month",
            icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        {stat.icon}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {stat.change}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default RevenueStats;
