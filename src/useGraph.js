import { useRef, useState, useEffect } from "react";

export function useGraph ({
    limit = 60,
    colour = ["#8F8","#F88"],
    horizontalGridlines = 0,
} = {}) {
    /** @type {React.MutableRefObject<HTMLCanvasElement>} */
    const ref = useRef();
    /** @type {[number[][], (number[][]) => void]} */
    const [ dataSeries, setDataSeries ] = useState([]);

    /**
     *
     * @param  {number[]} values
     */
    function pushData (...values) {
        /** @type {number[][]}] */
        const newDataSeries = [];

        for (let i = 0; i < values.length; i++) {
            const newPoints = [ values[i], ...(dataSeries[i] || []) ];
            if (newPoints.length > limit) {
                newPoints.length = limit;
            }
            newDataSeries[i] = newPoints;
        }

        setDataSeries(newDataSeries);
    }

    useEffect(() => {
        if (ref.current) {
            const ctx = ref.current.getContext("2d");
            const width = ref.current.clientWidth * devicePixelRatio;
            const height = 200 * devicePixelRatio;
            ref.current.width = width;
            ref.current.height = height;
            const xStep = width / limit;
            const maxVal = getMaxValue(dataSeries);
            const yScale = height / maxVal;

            ctx.clearRect(0,0,width,height);

            ctx.globalAlpha = 0.5;

            for (let s = 0; s < dataSeries.length; s++) {
                const dataPoints = dataSeries[s];

                ctx.beginPath();
                ctx.moveTo(0, height);

                for (let i = 0; i < dataPoints.length; i++) {
                    ctx.lineTo(i * xStep, height - dataPoints[i] * yScale);
                }

                ctx.lineTo((dataPoints.length - 1) * xStep, height);
                ctx.closePath();

                ctx.fillStyle = colour instanceof Array ? colour[s] : colour;
                ctx.fill();
            }

            if (horizontalGridlines > 0) {
                ctx.beginPath();

                for (let y = 0; y <= maxVal; y += horizontalGridlines) {
                    ctx.moveTo(0, height - (y * yScale));
                    ctx.lineTo(width, height - (y * yScale));
                }

                ctx.strokeStyle = "#999";
                ctx.stroke();
            }
        }
    }, [dataSeries, limit, colour, horizontalGridlines]);

    return [ ref, pushData ];
}

function getMaxValue(dataSeries) {
    return Math.max(...dataSeries.map(series => Math.max(...series)));
}
