"use client";

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

// Binance API Endpoint
const BINANCE_API_URL = "https://api.binance.com/api/v3/depth";

const MarketDepth = () => {
  const [depthData, setDepthData] = useState({ bids: [], asks: [] });
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [loading, setLoading] = useState(true);

  // Fetch depth data from Binance API
  const fetchDepthData = async () => {
    try {
      const response = await fetch(`${BINANCE_API_URL}?symbol=${selectedPair}&limit=100`);
      const data = await response.json();
      setDepthData({
        bids: calculateCumulativeVolume(data.bids),
        asks: calculateCumulativeVolume(data.asks, true),
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching Binance data:", error);
      setLoading(false);
    }
  };

  // Calculate cumulative volume for bids/asks
  const calculateCumulativeVolume = (levels, reverse = false) => {
    let cumulative = [];
    let totalVolume = 0;

    const sortedLevels = reverse ? [...levels].reverse() : levels;

    sortedLevels.forEach(([price, volume]) => {
      totalVolume += parseFloat(volume);
      cumulative.push({
        price: parseFloat(price),
        cumulativeVolume: totalVolume,
      });
    });

    return reverse ? cumulative.reverse() : cumulative;
  };

  // Update depth data on pair change or on first load
  useEffect(() => {
    fetchDepthData();
    const interval = setInterval(fetchDepthData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [selectedPair]);

  // Chart.js data
  const chartData = {
    labels: [
      ...depthData.bids.map((point) => point.price),
      ...depthData.asks.map((point) => point.price),
    ],
    datasets: [
      {
        label: "Bids",
        data: depthData.bids.map((point) => point.cumulativeVolume),
        borderColor: "#16a34a", // Green
        backgroundColor: "rgba(22, 163, 74, 0.2)",
        fill: true,
      },
      {
        label: "Asks",
        data: depthData.asks.map((point) => point.cumulativeVolume),
        borderColor: "#ef4444", // Red
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        fill: true,
      },
    ],
  };

  // Chart.js options
  const chartOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `Volume: ${context.raw.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Price",
        },
      },
      y: {
        title: {
          display: true,
          text: "Cumulative Volume",
        },
      },
    },
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <b>Market Depth</b>
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <Line data={chartData} options={chartOptions} />
      )}
    </div>
  );
};

export default MarketDepth;
