declare module "react-plotly.js" {
    import * as React from "react";
    import { PlotData, Layout, Config } from "plotly.js";

    interface PlotProps {
        data: Partial<PlotData>[];
        layout: Partial<Layout>;
        config?: Partial<Config>;
        style?: React.CSSProperties;
        className?: string;
        onInitialized?: (figure: Readonly<Figure>, graphDiv: Readonly<HTMLDivElement>) => void;
        onUpdate?: (figure: Readonly<Figure>, graphDiv: Readonly<HTMLDivElement>) => void;
        onPurge?: (figure: Readonly<Figure>, graphDiv: Readonly<HTMLDivElement>) => void;
        onError?: (err: Readonly<Error>) => void;
    }

    interface Figure {
        data: Partial<PlotData>[];
        layout: Partial<Layout>;
        frames: any[] | null;
    }

    class PlotlyChart extends React.Component<PlotProps> { }
    export default PlotlyChart;
}
