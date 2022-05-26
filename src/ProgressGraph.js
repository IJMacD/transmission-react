import { useRef, useEffect } from 'react';

/**
 *
 * @param {object} props
 * @param {[ number[], number[] ]} props.data
 * @param {number} [props.startTime]
 * @param {string} [props.color]
 * @returns
 */
export function ProgressGraph ({ data, startTime = NaN, color = "#4F4" }) {
    /** @type {import('react').MutableRefObject<HTMLCanvasElement>} */
    const ref = useRef();

    const debug = false;

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

        const i_1 = Math.max(l - 10, 0);
        const i_2 = l - 1;

        const x_0 = data[0][0];
        const x_1 = data[0][i_1];
        const x_2 = data[0][i_2];

        const y_1 = data[1][i_1];
        const y_2 = data[1][i_2];

        // y = mx + c

        // y1 = mx1 + c
        // y2 = mx2 + c

        // y2 - y1 = m(x2 - x1)

        // m = (y2 - y1)/(x2 - x1);

        const m = (y_2 - y_1) / (x_2 - x_1);

        // c = y2 - mx2

        const c = y_2 - m * x_2;

        // const dY_end = 1 - y_2;
        // const dX_end = dY_end / m;

        // const dY_start = y_1;
        // const dX_start = dY_start / m;

        // const x_start = x_1 - dX_start;
        // const x_end = x_2 + dX_end;

        // x = (y - c) / m;

        // Extrapolate:

        const predicted_y_start = 0
        const y_end = 1

        // Start should be value provided if given, or
        // the first recorded data point, or
        // the predicted x-intercept
        const x_start = isNaN(startTime) ? Math.min(x_0, (predicted_y_start - c) / m) : startTime;
        // End should be predicted end if m > 0, or
        // calculated to make [byte percent] === [time percent]
        const x_end = m > 0 ? (y_end - c) / m : ((x_2 - x_start) / y_2 + x_start);

        const x_range = x_end - x_start;
        const x_scale = graphWidth / x_range;

        ctx.translate(gutter, gutter);

        const fontSize = 10 * devicePixelRatio;
        ctx.font = `${fontSize}px sans-serif`;

        // Time divisions
        const div = 30 * 60 * 1000;
        const tz = new Date().getTimezoneOffset() * 60 * 1000;
        for (let x = x_start - (x_start % div) + div; x < x_end; x += div) {
            ctx.beginPath();
            ctx.moveTo((x - x_start) * x_scale, 0);
            ctx.lineTo((x - x_start) * x_scale, graphHeight);
            ctx.lineWidth = (((x - tz) % 86400000) === 0 ? 2 : 0.5) * devicePixelRatio;
            console.log(`${formatTime(new Date(x))}: ${x % 86400000}`);
            ctx.strokeStyle = "#666";
            ctx.stroke();
            // ctx.fillText(formatTime(new Date(x)), (x - x_start) * x_scale - fontSize, graphHeight + fontSize);
        }

        // Background fill
        ctx.beginPath();
        ctx.rect(0, (1 - y_2) * graphHeight, graphWidth, graphHeight - (1 - y_2) * graphHeight);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.fill();

        ctx.lineWidth = devicePixelRatio;

        // Horizontal progress line
        ctx.beginPath();
        ctx.moveTo(0, (1 - y_2) * graphHeight);
        ctx.lineTo(graphWidth, (1 - y_2) * graphHeight);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 1;
        ctx.stroke();

        // Graph light green
        ctx.beginPath();
        // let first = true;
        ctx.lineTo(0, graphHeight);
        for (let i = 0; i < l; i++) {
            const x = data[0][i];
            const y = data[1][i];
            if (x >= x_start) {
                // if (first) {
                //     ctx.lineTo((x - x_start) * x_scale, graphHeight);
                //     first = false;
                // }
                ctx.lineTo((x - x_start) * x_scale, (1 - y) * graphHeight);
            }
        }
        const xL = data[0][l-1];
        ctx.lineTo((xL - x_start) * x_scale, graphHeight);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.fill();

        // Percent text
        ctx.fillStyle = color;
        ctx.textAlign = "right";
        ctx.fillText(`${(y_2 * 100).toFixed()}%`, -devicePixelRatio, (1 - y_2) * graphHeight + fontSize / 2);

        // Diagonal Trendline
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, graphWidth, graphHeight);
        ctx.clip();

        ctx.beginPath();
        const y_start = m * x_start + c;
        ctx.moveTo(0, (1 - y_start) * graphHeight);
        ctx.lineTo(graphWidth, 0);
        ctx.setLineDash([2 * devicePixelRatio, 2 * devicePixelRatio]);
        ctx.strokeStyle = "#333";
        ctx.stroke();

        ctx.restore();

        // Start text
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.font = `${fontSize}px sans-serif`;
        const d_start = new Date(x_start);
        ctx.fillText(formatTime(d_start), 0, graphHeight + fontSize);

        // ETA text
        if (l > 1) {
            ctx.fillStyle = "#000";
            ctx.textAlign = "center";
            ctx.font = `${fontSize}px sans-serif`;
            const eta = new Date(x_end);
            ctx.fillText(formatTime(eta), graphWidth, graphHeight + fontSize);
        }

        // Time percentage completion
        if (x_2 < x_end) {
            ctx.strokeStyle = "#008";
            ctx.beginPath();
            const x_2_px = (x_2 - x_start) * x_scale;
            ctx.moveTo(x_2_px, 0);
            ctx.lineTo(x_2_px, graphHeight);
            ctx.stroke();
            ctx.fillStyle = "#008";
            ctx.textAlign = "center";
            ctx.font = `${fontSize}px sans-serif`;
            ctx.fillText(`${((x_2-x_start)/(x_end - x_start) * 100).toFixed()}%`, x_2_px, -5 * devicePixelRatio);
        }

        // Border black
        ctx.beginPath();
        ctx.rect(0, 0, graphWidth, graphHeight);
        ctx.strokeStyle = "#000";
        ctx.setLineDash([]);
        ctx.stroke();

        // Debug Trendline text
        if (debug) {
            ctx.fillStyle = "#000";
            ctx.textAlign = "right";
            ctx.font = `${fontSize}px sans-serif`;
            ctx.fillText(`y = ${m}x + ${c}`, graphWidth - 2 * fontSize, fontSize);
            const d_start = new Date(x_start);
            ctx.fillText(formatTime(d_start), graphWidth - 2 * fontSize, 2* fontSize);
            const d_end = new Date(x_end);
            ctx.fillText(formatTime(d_end), graphWidth - 2 * fontSize, 3 * fontSize);
            ctx.fillText(`@ x = ${formatTime(new Date(x_start))}: y = ${m * x_start + c}`, graphWidth - 2 * fontSize, 4 * fontSize);
            ctx.fillText(`@ x = ${formatTime(new Date(x_end))}: y = ${m * x_end + c}`, graphWidth - 2 * fontSize, 5 * fontSize);

            ctx.beginPath();
            ctx.moveTo((x_0 - x_start) * x_scale, 0);
            ctx.lineTo((x_0 - x_start) * x_scale, graphHeight);
            ctx.moveTo((x_1 - x_start) * x_scale, 0);
            ctx.lineTo((x_1 - x_start) * x_scale, graphHeight);
            ctx.moveTo((x_2 - x_start) * x_scale, 0);
            ctx.lineTo((x_2 - x_start) * x_scale, graphHeight);
            ctx.strokeStyle = "#333";
            ctx.stroke();
        }

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