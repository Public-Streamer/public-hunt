import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceDataPoint {
  date: string;
  revenue: number;
  events: number;
}

interface StreamPerformanceChartProps {
  data: PerformanceDataPoint[];
}

const StreamPerformanceChart: React.FC<StreamPerformanceChartProps> = ({ data }) => {
  // Transform data for performance metrics
  const performanceData = data.map((item, index) => ({
    date: item.date,
    viewers: item.events * 50, // Estimate viewers based on events
    quality: Math.min(100, Math.max(70, 90 - (index % 5) * 2)), // Simulated quality score
    engagement: Math.min(100, Math.max(60, 80 + (index % 3) * 5)), // Simulated engagement
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={performanceData}
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
            return new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
          }}
        />
        <YAxis yAxisId="left" orientation="left" domain={[0, 100]} />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === 'viewers') {
              return [value.toString(), 'Viewers'];
            }
            return [value.toString() + '%', name];
          }}
        />
        <Legend />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="viewers"
          name="Viewers"
          stroke="#8884d8"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="quality"
          name="Quality Score"
          stroke="#82ca9d"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="engagement"
          name="Engagement"
          stroke="#ffc658"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default StreamPerformanceChart;