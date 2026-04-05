import React from "react";
import dynamic from "next/dynamic";
import { plotlyDarkTheme } from "@/lib/plotlyTheme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

interface BarChartProps {
    labels: string[];
    values: number[];
    name: string;
}

export const BarChart: React.FC<BarChartProps> = ({ labels, values, name }) => {
    return (
        <Plot
            data={[
                {
                    y: labels,
                    x: values,
                    type: "bar",
                    orientation: "h",
                    marker: {
                        color: "rgba(177, 18, 38, 0.6)",
                        line: { color: "#B11226", width: 1 }
                    },
                    name: name,
                },
            ]}
            layout={{
                ...plotlyDarkTheme.layout,
                title: { text: `TOP CATEGORIES // ${name}`, font: { size: 10, color: "#FFFFFF", family: "Space Grotesk" } },
                autosize: true,
                yaxis: {
                    ...plotlyDarkTheme.layout.yaxis,
                    automargin: true,
                }
            }}
            config={plotlyDarkTheme.config}
            style={{ width: "100%", height: "100%" }}
        />
    );
};
