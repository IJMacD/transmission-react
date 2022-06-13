import { useRef, useEffect } from 'react';

/**
 *
 * @param {object} props
 * @param {[ number[], number[] ]} props.data
 * @param {string} [props.color]
 * @param {number} [props.startTime]
 * @param {string} [props.finalValueLabel]
 * @returns
 */
export function ProgressGraph ({ data, color = "#4F4", startTime = NaN, finalValueLabel = "" }) {
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
        const borderThickness = 1 * devicePixelRatio;

        const gutterTop = borderThickness;
        const gutterBottom = 2 * gutter;
        const gutterLeft = gutter * 3;
        const gutterRight = borderThickness;

        const graphWidth = width - gutterLeft - gutterRight;
        const graphHeight = height - gutterTop - gutterBottom;

        ctx.translate(gutterLeft, gutterTop);

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

        const y_0 = data[1][0];
        const y_1 = data[1][i_1];
        const y_2 = data[1][i_2];

        /*
         * y = mx + c
         *
         * y1 = mx1 + c
         * y2 = mx2 + c
         *
         * y2 - y1 = m(x2 - x1)
         *
         * m = (y2 - y1)/(x2 - x1);
         *
         * c = y2 - mx2
         */

        const m = (y_2 - y_1) / (x_2 - x_1);

        const c = y_2 - m * x_2;

        // Extrapolate:

        const predicted_y_start = 0
        const y_end = 1

        // Start should be value provided if given, or
        // the first recorded data point, or
        // the predicted x-intercept
        const x_start = isNaN(startTime) ? Math.min(x_0, (predicted_y_start - c) / m) : startTime;
        // if m > 0,
        // end can be calculated,
        // otherwise make [byte percent] === [time percent]
        // if y_2 == 0 then x_end will be infinity
        const x_end = m > 0 ? (y_end - c) / m : ((x_2 - x_start) / y_2 + x_start);

        const x_range = x_end - x_start;
        const x_scale = graphWidth / x_range;

        const fontSize = 10 * devicePixelRatio;
        ctx.font = `${fontSize}px sans-serif`;

        // Start Drawing

        // Time divisions
        if (x_end < Infinity) {
            const div = 30 * 60 * 1000;
            const tz = new Date().getTimezoneOffset() * 60 * 1000;
            const showBellMarks = x_range < 86400000 * 2;
            for (let x = x_start - (x_start % div) + div; x < x_end; x += div) {
                const isDayMark = ((x - tz) % 86400000) === 0;
                if (isDayMark || showBellMarks) {
                    ctx.beginPath();
                    ctx.moveTo((x - x_start) * x_scale, 0);
                    ctx.lineTo((x - x_start) * x_scale, graphHeight);
                    ctx.lineWidth = (isDayMark ? 2 : 0.5) * devicePixelRatio;
                    ctx.strokeStyle = "#666";
                    ctx.stroke();
                    // ctx.fillText(formatTime(new Date(x)), (x - x_start) * x_scale - fontSize, graphHeight + fontSize);
                }
            }
        }

        const y_px_value = (1 - y_2) * graphHeight;

        // Byte percentage completion fill
        {
            ctx.beginPath();
            ctx.rect(0, y_px_value, graphWidth, graphHeight - y_px_value);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.2;
            ctx.fill();

            ctx.lineWidth = devicePixelRatio;

            // Byte percentage progress line
            ctx.beginPath();
            ctx.moveTo(0, y_px_value);
            ctx.lineTo(graphWidth, y_px_value);
            ctx.lineWidth = 0.5 * devicePixelRatio;
            ctx.strokeStyle = color;
            ctx.globalAlpha = 1;
            ctx.stroke();

            // Percent text
            if (y_2 < 1) {
                ctx.globalAlpha = 1;
                ctx.fillStyle = color;
                ctx.textAlign = "right";
                const windowedYVal = Math.max(y_px_value, fontSize);
                ctx.fillText(`${(y_2 * 100).toFixed()}%`, -1 * devicePixelRatio, windowedYVal);
            }

            if (finalValueLabel.length > 0) {
                // Final Value label
                ctx.fillStyle = "#000";
                ctx.textAlign = "left";
                ctx.font = `${fontSize}px sans-serif`;
                ctx.fillText(finalValueLabel, -gutterLeft, fontSize);

                ctx.beginPath();
                ctx.moveTo(-gutterLeft, 0);
                ctx.lineTo(0, 0);
                ctx.moveTo(-gutterLeft, graphHeight);
                ctx.lineTo(0, graphHeight);
                ctx.setLineDash([2*devicePixelRatio,2*devicePixelRatio]);
                ctx.strokeStyle = "#000";
                ctx.stroke();

                ctx.setLineDash([]);
            }
        }

        // Time percentage completion
        if (x_end < Infinity)
        {
            ctx.strokeStyle = color;

            const x_2_px = (x_2 - x_start) * x_scale;

            // Vertical Line
            ctx.beginPath();
            ctx.moveTo(x_2_px, 0);
            ctx.lineTo(x_2_px, graphHeight);
            ctx.lineWidth = 0.5 * devicePixelRatio;
            ctx.stroke();

            // Area
            ctx.beginPath();
            ctx.rect(0, 0, x_2_px, graphHeight);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.2;
            ctx.fill();

            // Percentage text
            ctx.globalAlpha = 1;
            ctx.textAlign = "center";
            ctx.font = `${fontSize}px sans-serif`;
            const windowedXVal = Math.min(x_2_px, graphWidth - fontSize * 1.5);
            ctx.fillText(`${((x_2-x_start)/(x_end - x_start) * 100).toFixed()}%`, windowedXVal, graphHeight + fontSize);

            // Start text
            ctx.fillStyle = "#000";
            ctx.textAlign = "left";
            ctx.font = `${fontSize}px sans-serif`;
            const d_start = new Date(x_start);
            ctx.fillText(formatTime(d_start), 0, graphHeight + fontSize * 2);

            // ETA text
            if (m > 0) {
                ctx.fillStyle = "#000";
                ctx.textAlign = "right";
                ctx.font = `${fontSize}px sans-serif`;
                const eta = new Date(x_end);
                ctx.fillText(formatTime(eta), graphWidth, graphHeight + fontSize * 2);
            }
        }

        // Predicted Trendline
        if (m > 0 && y_2 < 1) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, graphWidth, graphHeight);
            ctx.clip();

            ctx.beginPath();

            const extrapolateBackwards = false;

            if (extrapolateBackwards) {
                const y_start = m * x_start + c;
                ctx.moveTo(0, (1 - y_start) * graphHeight);
            }
            else {
                ctx.moveTo((x_1 - x_start) * x_scale, (1 - y_1) * graphHeight);
            }

            ctx.lineTo(graphWidth, 0);
            ctx.setLineDash([2 * devicePixelRatio, 2 * devicePixelRatio]);
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 1 * devicePixelRatio
            ctx.stroke();

            ctx.restore();
        }

        // Recorded data
        {
            // Dashed line to start of recording
            ctx.beginPath();
            ctx.moveTo(0, graphHeight);
            ctx.lineTo((x_0 - x_start) * x_scale, (1 - y_0) * graphHeight)
            ctx.strokeStyle = color;
            ctx.globalAlpha = 1;
            ctx.lineWidth = 2 * devicePixelRatio;
            ctx.setLineDash([4 * devicePixelRatio,4 * devicePixelRatio]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Data line
            ctx.beginPath();
            for (let i = 0; i < l; i++) {
                const x = data[0][i];
                const y = data[1][i];
                if (x >= x_start && y >= 0 && y <= 1) {
                    ctx.lineTo((x - x_start) * x_scale, (1 - y) * graphHeight);
                }
            }
            ctx.stroke();

            if (y_2 < 1) {
                // Latest data point dot
                const r = 3 * devicePixelRatio;
                ctx.beginPath();
                ctx.arc((x_2 - x_start) * x_scale, (1- y_2) * graphHeight, r, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            }
        }

        // Border black
        ctx.beginPath();
        ctx.rect(0, 0, graphWidth, graphHeight);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = borderThickness;
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