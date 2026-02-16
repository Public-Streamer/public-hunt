import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Activity } from 'lucide-react';

interface DataPoint {
    time: string;
    viewers: number;
}

interface LiveViewerChartProps {
    data: DataPoint[];
    currentViewers: number;
    peakViewers: number;
    avgViewers: number;
}

export const LiveViewerChart: React.FC<LiveViewerChartProps> = ({
    data,
    currentViewers,
    peakViewers,
    avgViewers
}) => {
    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-pink-500" />
                            Live Analytics
                        </CardTitle>
                        <CardDescription>
                            Real-time viewer count (last 30 minutes)
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                        Live
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                        <div className="text-2xl font-bold text-pink-600">
                            {currentViewers}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Users className="h-3 w-3" />
                            Current
                        </div>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {peakViewers}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Peak
                        </div>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {avgViewers}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Activity className="h-3 w-3" />
                            Average
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[200px] w-full">
                    {data.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="viewerGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#374151"
                                    opacity={0.3}
                                />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={30}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                    labelStyle={{ color: '#9ca3af' }}
                                    itemStyle={{ color: '#ec4899' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="viewers"
                                    stroke="#ec4899"
                                    strokeWidth={2}
                                    fill="url(#viewerGradient)"
                                    animationDuration={300}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            Collecting data...
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default LiveViewerChart;
