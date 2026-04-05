export const plotlyDarkTheme = {
    layout: {
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: {
            family: "Space Grotesk, sans-serif",
            color: "#888888",
            size: 10,
        },
        xaxis: {
            gridcolor: "rgba(177, 18, 38, 0.05)",
            linecolor: "rgba(177, 18, 38, 0.2)",
            zerolinecolor: "rgba(177, 18, 38, 0.2)",
            tickfont: { color: "#666666", size: 9 },
            title: { font: { size: 10, color: "#B11226" } }
        },
        yaxis: {
            gridcolor: "rgba(177, 18, 38, 0.05)",
            linecolor: "rgba(177, 18, 38, 0.2)",
            zerolinecolor: "rgba(177, 18, 38, 0.2)",
            tickfont: { color: "#666666", size: 9 },
            title: { font: { size: 10, color: "#B11226" } }
        },
        margin: { t: 50, r: 30, b: 50, l: 50 },
        colorway: ["#B11226", "#00F0FF", "#FF00E5", "#00FF41", "#FFD700", "#FFFFFF"],
        hoverlabel: {
            bgcolor: "#000000",
            bordercolor: "#B11226",
            font: { color: "#FFFFFF", size: 12 },
        },
    },
    config: {
        responsive: true,
        displayModeBar: false,
    },
};
