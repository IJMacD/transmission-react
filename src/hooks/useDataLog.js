import { useState, useCallback } from 'react';

/**
 *
 * @returns {[number[][], (...series: number[]) => void]}
 */
export function useDataLog () {
    const [ data, setData ] = useState([]);

    const pushData = useCallback((/** @type {number[]} */ ...series) => {
        setData(data => {
            // If the incoming data doesn't match the dimension of the previous
            // data then we'll reset
            if (data.length !== series.length) {
                return series.map(s => [s]);
            }

            return data.map((d, i) => [ ...d, series[i]]);
        });
    }, [setData]);

    return [ data, pushData ];
}