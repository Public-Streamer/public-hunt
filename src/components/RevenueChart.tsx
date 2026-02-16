import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  events: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  detailed?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, detailed = false }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => {
            if (detailed) {
              return new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
            }
            return new Date(date).toLocaleDateString('en-US', { month: 'short' });
          }}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          stroke="#8884d8"
          tickFormatter={formatCurrency}
        />
        {detailed && (
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#82ca9d"
          />
        )}
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === 'revenue') {
              return [formatCurrency(value), 'Revenue'];
            }
            return [value.toString(), name];
          }}
        />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="revenue"
          name="Revenue"
          fill="#8884d8"
          barSize={detailed ? 20 : 15}
        />
        {detailed && (
          <Bar
            yAxisId="right"
            dataKey="events"
            name="Events"
            fill="#82ca9d"
            barSize={20}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;