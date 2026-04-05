import React from "react";
import {
    ResponsiveContainer,
    BarChart, Bar,
    LineChart, Line,
    ScatterChart, Scatter,
    AreaChart, Area,
    XAxis, YAxis,
    CartesianGrid, Tooltip,
    Cell,
} from "recharts";
import { useSettingsStore } from "@/store/settingsStore";

// Unique ID generator for SVG definitions
const useId = () => React.useId();

interface ChartConfig {
    type: "histogram" | "bar" | "line" | "scatter" | "heatmap" | "area" | "radar" | "donut";
    title: string;
    columns: string[];
    data: any[];
    xAxisLabel?: string;
    yAxisLabel?: string;
}

interface ChartRendererProps {
    config: ChartConfig;
}

// Theme Colors Definition
const THEMES = {
    monochrome: ["#EDEDED", "#555555", "#999999", "#CCCCCC", "#333333"],
    cyan: ["#00F0FF", "#00A3FF", "#0055FF", "#A0F0FF", "#002030"],
    violet: ["#7B61FF", "#B026FF", "#4D00FF", "#E0B0FF", "#200030"],
    amber: ["#FFB347", "#FF8C00", "#FF4500", "#FFD700", "#301000"],
    custom: ["#FFFFFF", "#AAAAAA", "#555555", "#333333", "#111111"],
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-black/40 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-4 py-3 backdrop-blur-2xl transition-all duration-300">
            <p className="text-[11px] text-white/50 uppercase tracking-widest mb-2 font-medium">{label}</p>
            {payload.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-3 mt-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || "#e63946", boxShadow: `0 0 8px ${entry.color || "#e63946"}80` }} />
                    <p className="text-sm font-sans font-semibold text-white/90">
                        {entry.name}: <span className="text-white ml-1">{typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : entry.value}</span>
                    </p>
                </div>
            ))}
        </div>
    );
};

export const ChartRenderer = React.memo<ChartRendererProps>(({ config }) => {
    const { theme, graphType, grid, axis, density, speed, tooltip } = useSettingsStore();
    const { data } = config;

    // Get active colors based on theme
    // @ts-ignore
    const colors = THEMES[theme] || THEMES.monochrome;

    // Chart Animation Speed
    const animationDuration = speed === "fast" ? 500 : speed === "slow" ? 2000 : 1000;

    // Generate unique ID for defs to prevent ID collisions if multiple charts render
    const uid = useId();

    // Data Density Sampling
    const sampledData = React.useMemo(() => {
        if (!data) return [];
        if (density === "raw" || density === "detailed") return data;
        if (density === "standard") {
            // If more than 100 points, sample down to 100
            if (data.length > 100) {
                const step = Math.ceil(data.length / 100);
                return data.filter((_, i) => i % step === 0);
            }
            return data;
        }
        // Minimal: Sample down to 20 points
        if (data.length > 20) {
            const step = Math.ceil(data.length / 20);
            return data.filter((_, i) => i % step === 0);
        }
        return data;
    }, [data, density]);

    if (!sampledData || sampledData.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-dim text-[10px] uppercase tracking-[0.4em]">
                No data available
            </div>
        );
    }

    // The backend dynamically generates optimal chart types for the data shape.
    // Overriding the chart type blindly breaks data keys (e.g. name vs date vs x).
    const targetType = config.type;

    // SVG Defs for Gradients and Shadows
    const renderGradientDefs = () => (
        <defs>
            <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id={`shadow-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="rgba(0,0,0,0.4)" />
            </filter>

            {colors.map((color: string, i: number) => (
                <linearGradient key={`grad-${uid}-${i}`} id={`colorGrad-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.2} />
                </linearGradient>
            ))}

            {/* Horizontal gradients for horizontal bar charts */}
            {colors.map((color: string, i: number) => (
                <linearGradient key={`grad-horiz-${uid}-${i}`} id={`colorGradHoriz-${uid}-${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.9} />
                </linearGradient>
            ))}
        </defs>
    );

    // Common Axis Props
    const axisProps = {
        tick: { fill: "#888", fontSize: 10, fontFamily: "Inter, sans-serif", fontWeight: 500 },
        axisLine: axis !== "minimal" ? { stroke: "rgba(255,255,255,0.05)" } : false,
        tickLine: false, // Cleaner look without tick lines
        tickMargin: 8,
    };

    const gridProps = {
        strokeDasharray: "4 4",
        stroke: "rgba(255,255,255,0.06)",
        opacity: grid === "hidden" ? 0 : grid === "subtle" ? 0.3 : 1,
    };

    // Render based on EFFECTIVE type
    switch (targetType) {
        case "histogram":
            return (
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={sampledData} barCategoryGap="8%" margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        {renderGradientDefs()}
                        <CartesianGrid {...gridProps} vertical={false} />
                        <XAxis
                            dataKey="bin"
                            {...axisProps}
                            angle={-30}
                            textAnchor="end"
                            height={60}
                            label={{ value: config.xAxisLabel || "Bin", position: 'insideBottom', offset: -10, fill: '#888', fontSize: 11, fontWeight: 500 }}
                        />
                        <YAxis {...axisProps} label={{ value: config.yAxisLabel || "Frequency", angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11, fontWeight: 500 }} />
                        {tooltip !== "simple" && <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />}
                        <Bar
                            dataKey="count"
                            name="Count"
                            radius={[6, 6, 0, 0]} // Pill tops
                            animationDuration={animationDuration}
                            animationEasing="ease-out"
                        >
                            {sampledData.map((_: any, i: number) => (
                                <Cell key={i} fill={`url(#colorGrad-${uid}-0)`} stroke={colors[0]} strokeWidth={1} strokeOpacity={0.5} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            );

        case "bar":
            return (
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={sampledData} layout="vertical" barCategoryGap="15%" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                        {renderGradientDefs()}
                        <CartesianGrid {...gridProps} horizontal={false} />
                        <XAxis type="number" {...axisProps} label={{ value: config.xAxisLabel || "Value", position: 'insideBottom', offset: -5, fill: '#888', fontSize: 11, fontWeight: 500 }} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={110}
                            {...axisProps}
                            label={{ value: config.yAxisLabel || "Category", angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11, fontWeight: 500 }}
                        />
                        {tooltip !== "simple" && <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />}
                        <Bar
                            dataKey="value"
                            name="Value"
                            radius={[0, 6, 6, 0]} // Pill right side
                            animationDuration={animationDuration}
                            animationEasing="ease-out"
                        >
                            {sampledData.map((_: any, i: number) => (
                                <Cell key={i} fill={`url(#colorGradHoriz-${uid}-${i % colors.length})`} stroke={colors[i % colors.length]} strokeWidth={1} strokeOpacity={0.7} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            );

        case "area":
            return (
                <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={sampledData}>
                        {renderGradientDefs()}
                        <CartesianGrid {...gridProps} vertical={false} />
                        <XAxis dataKey="date" {...axisProps} minTickGap={30} label={{ value: config.xAxisLabel || "Date", position: 'insideBottom', offset: -5, fill: '#888', fontSize: 11, fontWeight: 500 }} />
                        <YAxis {...axisProps} label={{ value: config.yAxisLabel || "Value", angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11, fontWeight: 500 }} />
                        {tooltip !== "simple" && <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />}
                        <Area
                            type="monotone"
                            dataKey="value"
                            name={config.yAxisLabel || "Value"}
                            stroke={colors[0]}
                            strokeWidth={3}
                            fill={`url(#colorGrad-${uid}-0)`}
                            animationDuration={animationDuration}
                            animationEasing="ease-out"
                            filter={`url(#shadow-${uid})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            );

        case "line":
            // Fallback for line is line
            return (
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={sampledData}>
                        {renderGradientDefs()}
                        <CartesianGrid {...gridProps} vertical={false} />
                        <XAxis dataKey="date" {...axisProps} minTickGap={30} label={{ value: config.xAxisLabel || "Date", position: 'insideBottom', offset: -5, fill: '#888', fontSize: 11, fontWeight: 500 }} />
                        <YAxis {...axisProps} label={{ value: config.yAxisLabel || "Value", angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11, fontWeight: 500 }} />
                        {tooltip !== "simple" && <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />}
                        <Line
                            type="monotone"
                            dataKey="value"
                            name={config.yAxisLabel || "Value"}
                            stroke={colors[0]}
                            strokeWidth={3}
                            dot={density === "detailed" || density === "raw" ? { r: 3, fill: '#000', stroke: colors[0], strokeWidth: 2 } : false}
                            activeDot={{ r: 6, fill: "#fff", stroke: colors[0], strokeWidth: 2, className: 'drop-shadow-glow' }}
                            animationDuration={animationDuration}
                            animationEasing="ease-out"
                            filter={`url(#glow-${uid})`}
                        />
                    </LineChart>
                </ResponsiveContainer>
            );

        case "scatter":
            return (
                <ResponsiveContainer width="100%" height={320}>
                    <ScatterChart>
                        {renderGradientDefs()}
                        <CartesianGrid {...gridProps} />
                        <XAxis
                            dataKey="x"
                            type="number"
                            name={config.columns[0] || "X"}
                            {...axisProps}
                            label={{ value: config.xAxisLabel || config.columns[0] || "X", position: 'insideBottom', offset: -5, fill: '#888', fontSize: 11, fontWeight: 500 }}
                        />
                        <YAxis
                            dataKey="y"
                            type="number"
                            name={config.columns[1] || "Y"}
                            {...axisProps}
                            label={{ value: config.yAxisLabel || config.columns[1] || "Y", angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11, fontWeight: 500 }}
                        />
                        {tooltip !== "simple" && <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '4 4' }} />}
                        <Scatter
                            data={sampledData}
                            fill={colors[1]}
                            fillOpacity={0.8}
                            animationDuration={animationDuration}
                            shape="circle"
                            filter={`url(#glow-${uid})`}
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            );

        case "heatmap":
            return <HeatmapRenderer data={sampledData} columns={config.columns} colors={colors} />;

        case "radar":
            // Fallback to Bar if Radar not implemented or data incompatible, 
            // but user asked for switch. Let's return a placeholder or fallback.
            // We'll fallback to Bar for now as Radar requires different data shape often.
            return (
                <div className="h-full flex items-center justify-center flex-col">
                    <p className="text-dim text-[10px] uppercase tracking-[0.4em] mb-2">Radar View</p>
                    <p className="text-spider-red text-[9px]">Data shape incompatible</p>
                </div>
            );

        case "donut":
            // Similar to Radar, requires different data shape (Pie). 
            // If data has "name" and "value", we can try Pie?
            // Not implemented in this iteration to keep it safe.
            return (
                <div className="h-full flex items-center justify-center flex-col">
                    <p className="text-dim text-[10px] uppercase tracking-[0.4em] mb-2">Donut View</p>
                    <p className="text-spider-red text-[9px]">Coming in v2.1</p>
                </div>
            );

        default:
            // Fallback to Line if nothing else matches
            return (
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={sampledData}>
                        {renderGradientDefs()}
                        <CartesianGrid {...gridProps} vertical={false} />
                        <XAxis dataKey="date" {...axisProps} minTickGap={30} label={{ value: config.xAxisLabel || "Date", position: 'insideBottom', offset: -5, fill: '#888', fontSize: 11, fontWeight: 500 }} />
                        <YAxis {...axisProps} label={{ value: config.yAxisLabel || "Value", angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11, fontWeight: 500 }} />
                        {tooltip !== "simple" && <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />}
                        <Line
                            type="monotone"
                            dataKey="value"
                            name={config.yAxisLabel || "Value"}
                            stroke={colors[0]}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: "#fff", stroke: colors[0], strokeWidth: 2, className: 'drop-shadow-glow' }}
                            animationDuration={animationDuration}
                            animationEasing="ease-out"
                            filter={`url(#glow-${uid})`}
                        />
                    </LineChart>
                </ResponsiveContainer>
            );
    }
});

// ── Heatmap ─────────────────────────────────────
const HeatmapRenderer: React.FC<{ data: any[]; columns: string[]; colors: string[] }> = ({
    data,
    columns,
    colors
}) => {
    // Generate color scale based on theme
    const getColor = (value: number) => {
        // Simple opacity based interpolation for demo
        // Assuming value is -1 to 1 for correlation
        const opacity = Math.abs(value);
        const color = value > 0 ? colors[0] : colors[1];
        return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`;
    };

    const cellSize = Math.min(60, Math.floor(500 / columns.length));

    return (
        <div className="flex flex-col items-center w-full h-full relative group">
            <div className="overflow-auto w-full custom-scrollbar flex-1 flex justify-center pb-4">
                <div className="inline-block mt-2">
                    {/* Header row */}
                    <div className="flex" style={{ marginLeft: cellSize + 10 }}>
                        {columns.map((col) => (
                            <div
                                key={col}
                                className="text-[8px] text-dim font-mono truncate transform -rotate-45 origin-bottom-left"
                                style={{ width: cellSize, height: cellSize }}
                            >
                                {col}
                            </div>
                        ))}
                    </div>
                    {columns.map((rowCol) => (
                        <div key={rowCol} className="flex items-center">
                            <div
                                className="text-[9px] text-dim font-mono truncate text-right pr-2"
                                style={{ width: cellSize + 10 }}
                            >
                                {rowCol}
                            </div>
                            {columns.map((colCol) => {
                                const cell = data.find(
                                    (d) => d.x === rowCol && d.y === colCol
                                );
                                const val = cell?.value ?? 0;
                                return (
                                    <div
                                        key={`${rowCol}-${colCol}`}
                                        className="border-b border-r border-[#151515] flex items-center justify-center cursor-crosshair transition-all duration-300 hover:scale-[1.15] hover:z-20 hover:border-white/30 hover:rounded-lg relative group/cell hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] rounded-sm"
                                        style={{
                                            width: cellSize,
                                            height: cellSize,
                                            backgroundColor: getColor(val),
                                            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
                                        }}
                                        title={`${rowCol} × ${colCol}: ${val.toFixed(2)}`}
                                    >
                                        <span className="text-[9px] font-sans font-medium text-white/50 group-hover/cell:text-white group-hover/cell:font-bold drop-shadow-md transition-all">
                                            {val.toFixed(1)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Cinematic Legend */}
            <div className="w-full max-w-[280px] mt-2 mb-2 flex flex-col items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                <div className="flex justify-between w-full text-[8px] font-mono text-dim/60 uppercase tracking-[0.2em] mb-1.5 px-1">
                    <span>-1.0 Inverse</span>
                    <span>0.0 Neutral</span>
                    <span>+1.0 Direct</span>
                </div>
                <div className="w-full h-1 relative flex rounded-full border border-white/10 overflow-hidden bg-black/50">
                    {/* Negative correlation gradient */}
                    <div className="flex-1" style={{ background: `linear-gradient(to right, ${getColor(-1)}, transparent)` }} />
                    {/* Positive correlation gradient */}
                    <div className="flex-1" style={{ background: `linear-gradient(to right, transparent, ${getColor(1)})` }} />

                    {/* Center tick indicator */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20 -translate-x-1/2" />
                </div>
            </div>
        </div>
    );
};
