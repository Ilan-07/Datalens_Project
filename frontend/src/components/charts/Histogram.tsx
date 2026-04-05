import React from "react";
import dynamic from "next/dynamic";
import { plotlyDarkTheme } from "@/lib/plotlyTheme";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

interface HistogramProps {
    data: number[];
    name: string;
}

export const Histogram: React.FC<HistogramProps> = ({ data, name }) => {
    return (
        <Plot
            data={[
                {
                    x: data,
                    type: "histogram",
                    marker: {
                        color: "rgba(177, 18, 38, 0.6)",
                        line: { color: "#B11226", width: 1 }
                    },
                    name: name,
                },
            ]}
            layout={{
                ...plotlyDarkTheme.layout,
                title: { text: `DISTRIBUTION // ${name}`, font: { size: 10, color: "#FFFFFF", family: "Space Grotesk" } },
                bargap: 0.2,
                autosize: true,
            }}
            config={plotlyDarkTheme.config}
            style={{ width: "100%", height: "100%" }}
        />
    );
};
