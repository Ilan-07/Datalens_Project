import React from "react";
import dynamic from "next/dynamic";
import { plotlyDarkTheme } from "@/lib/plotlyTheme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

interface HeatMapProps {
    data: Record<string, Record<string, number>>;
    title?: string;
}

export const HeatMap: React.FC<HeatMapProps> = ({ data, title }) => {
    const columns = Object.keys(data);
    const values = columns.map(row => columns.map(col => data[row][col]));

    return (
        <Plot
            data={[
                {
                    z: values,
                    x: columns,
                    y: columns,
                    type: "heatmap",
                    colorscale: [
                        [0, "#00F0FF"],  // Cyan (Negative)
                        [0.5, "#000000"], // Black (Zero)
                        [1, "#B11226"]   // Red (Positive)
                    ],
                    showscale: true,
                    xgap: 4,
                    ygap: 4,
                },
            ]}
            layout={{
                ...plotlyDarkTheme.layout,
                title: {
                    text: title || "CORRELATION // DIMENSIONAL MATRIX",
                    font: { size: 10, color: "#FFFFFF", family: "Space Grotesk" }
                },
                autosize: true,
                xaxis: {
                    ...plotlyDarkTheme.layout.xaxis,
                    side: "bottom",
                    tickangle: -45,
                    automargin: true
                },
                yaxis: {
                    ...plotlyDarkTheme.layout.yaxis,
                    autorange: "reversed",
                    automargin: true
                },
            }}
            config={plotlyDarkTheme.config}
            style={{ width: "100%", height: "100%" }}
        />
    );
};
