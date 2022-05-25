import { useRef, useEffect } from 'react';

/**
 *
 * @param {object} props
 * @param {[ number[], number[] ]} props.data
 * @returns
 */
export function ProgressGraph ({ data }) {
    /** @type {import('react').MutableRefObject<HTMLCanvasElement>} */
    const ref = useRef();

    useEffect(() => {
        const ctx = ref.current.getContext("2d");
        const width = ref.current.clientWidth * devicePixelRatio;
        const height = 200 * devicePixelRatio;
        ref.current.width = width;
        ref.current.height = height;

        const gutter = 25 * devicePixelRatio;

        const graphWidth = width - gutter * 2;
        const graphHeight = height - gutter * 2;

        if (!data[1]) {
            return null;
        }

        if (data[1].length === 0) {
            return null;
        }

        let l = data[1].findIndex(y => y === 1);

        if (l === -1) {
            l = data[1].length;
        } else {
            l++;
        }

        const minX = data[0][0];
        const maxX = data[0][l - 1];

        const minY = data[1][0];
        const maxY = data[1][l - 1];

        const m = (maxY - minY) / (maxX - minX);

        const dY_end = 1 - maxY;
        const dX_end = dY_end / m;

        const dY_start = minY;
        const dX_start = dY_start / m;

        const x_start = minX - dX_start;
        const x_end = maxX + dX_end;

        const x_range = x_end - x_start;
        const x_scale = graphWidth / x_range;

        ctx.translate(gutter, gutter);

        const fontSize = 10 * devicePixelRatio;
        ctx.font = `${fontSize}px sans-serif`;

        // Time divisions
        ctx.beginPath();
        const div = 30 * 60 * 1000;
        for (let x = x_start - (x_start % div) + div; x < x_end; x += div) {
            ctx.moveTo((x - x_start) * x_scale, 0);
            ctx.lineTo((x - x_start) * x_scale, graphHeight);
            // ctx.fillText(formatTime(new Date(x)), (x - x_start) * x_scale - fontSize, graphHeight + fontSize);
        }
        ctx.strokeStyle = "#666";
        ctx.stroke();

        // Graph light green
        ctx.beginPath();
        const x0 = data[0][0];
        ctx.lineTo((x0 - x_start) * x_scale, graphHeight);
        for (let i = 0; i < l; i++) {
            const x = data[0][i];
            const y = data[1][i];
            ctx.lineTo((x - x_start) * x_scale, (1 - y) * graphHeight);
        }
        const xL = data[0][l-1];
        ctx.lineTo((xL - x_start) * x_scale, graphHeight);
        ctx.fillStyle = "#4F4";
        ctx.globalAlpha = 0.5;
        ctx.fill();

        ctx.lineWidth = devicePixelRatio;

        // Horizontal green
        ctx.beginPath();
        ctx.moveTo(0, (1 - maxY) * graphHeight);
        ctx.lineTo(graphWidth, (1 - maxY) * graphHeight);
        ctx.strokeStyle = "#080";
        ctx.stroke();

        // Background fill green
        ctx.beginPath();
        ctx.rect(0, (1 - maxY) * graphHeight, graphWidth, graphHeight - (1 - maxY) * graphHeight);
        ctx.fillStyle = "#CFC";
        ctx.globalAlpha = 0.5;
        ctx.fill();

        // Percent text
        ctx.fillStyle = "#080";
        ctx.textAlign = "right";
        ctx.fillText(`${(maxY * 100).toFixed()}%`, -devicePixelRatio, (1 - maxY) * graphHeight + fontSize / 2);

        // Diagonal Trendline
        ctx.beginPath();
        ctx.moveTo(0, graphHeight);
        ctx.lineTo(graphWidth, 0);
        ctx.setLineDash([2 * devicePixelRatio, 2 * devicePixelRatio]);
        ctx.strokeStyle = "#333";
        ctx.stroke();

        // ETA text
        if (l > 1) {
            ctx.fillStyle = "#000";
            ctx.textAlign = "right";
            ctx.font = `${fontSize}px sans-serif`;
            const eta = new Date(x_end);
            ctx.fillText(formatTime(eta), graphWidth + 2 * fontSize, graphHeight + fontSize);
        }

        // Border black
        ctx.beginPath();
        ctx.rect(0, 0, graphWidth, graphHeight);
        ctx.strokeStyle = "#000";
        ctx.setLineDash([]);
        ctx.stroke();

        ctx.resetTransform();

    }, [data]);

    return <canvas ref={ref} />
}

/**
 * @param {Date} d
 */
function formatTime (d) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/**
 * @param {number} n
 */
function pad2 (n) {
    return n.toString().padStart(2, "0");
}