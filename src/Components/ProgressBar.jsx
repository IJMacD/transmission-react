export function ProgressBar ({ value, color = "#000", height = "10px", width = "100%" }) {
    return (
        <div style={{ width, border: `1px solid ${color}` }}>
            <div style={{ width: `${value * 100}%`, backgroundColor: color, height }} />
        </div>
    )
}