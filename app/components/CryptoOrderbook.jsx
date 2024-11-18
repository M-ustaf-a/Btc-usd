"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { ArrowUpDown, BarChart3, Scale } from "lucide-react";
import MarketDepth from "./MarketDepth";

// Binance API endpoint for orderbook data
const BINANCE_API_URL = "https://api.binance.com/api/v3/depth";

// Define the trading pairs
const tradingPairs = ["BTCUSDT", "ETHUSDT", "XRPUSDT"];

const CryptoOrderbook = () => {
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [] });
  const [spreadHistory, setSpreadHistory] = useState([]);
  const [imbalanceHistory, setImbalanceHistory] = useState([]);
  const [depthData, setDepthData] = useState([]);
  const [currentSpread, setCurrentSpread] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentImbalance, setCurrentImbalance] = useState(0);

  // Fetch the orderbook data from Binance API
  const fetchOrderbook = async () => {
    try {
      const response = await fetch(`${BINANCE_API_URL}?symbol=${selectedPair}&limit=10`);
      const data = await response.json();
      setOrderbook(data);
      calculateMetrics(data);
    } catch (error) {
      console.error("Error fetching data from Binance:", error);
    }
  };

  // Calculate spread and imbalance
  const calculateMetrics = (data) => {
    const bestBid = parseFloat(data.bids[0][0]);
    const bestAsk = parseFloat(data.asks[0][0]);
    const spread = bestAsk - bestBid;
    setCurrentSpread(spread.toFixed(2));

    const newSpreadPoint = {
      time: new Date().toLocaleTimeString(),
      value: spread.toFixed(2),
    };

    setSpreadHistory((prev) => [...prev, newSpreadPoint].slice(-60));

    const bidVolume = data.bids.reduce((acc, bid) => acc + parseFloat(bid[1]), 0);
    const askVolume = data.asks.reduce((acc, ask) => acc + parseFloat(ask[1]), 0);
    const imbalance = ((bidVolume - askVolume) / (bidVolume + askVolume)) * 100;
    setCurrentImbalance(imbalance.toFixed(2));

    const newImbalancePoint = {
      time: new Date().toLocaleTimeString(),
      value: imbalance.toFixed(2),
    };

    setImbalanceHistory((prev) => [...prev, newImbalancePoint].slice(-60));

    const depthPoints = [];
    data.bids.forEach((bid) => {
      depthPoints.push({ price: bid[0], volume: bid[1], type: "bid" });
    });

    data.asks.forEach((ask) => {
      depthPoints.push({ price: ask[0], volume: ask[1], type: "ask" });
    });

    setDepthData(depthPoints);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    fetchOrderbook();
    const interval = setInterval(fetchOrderbook, 1000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm">Time: {payload[0].payload.time}</p>
          <p className="text-sm">Value: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const spreadChartData = {
    labels: spreadHistory.map((item) => item.time),
    datasets: [
      {
        label: "Spread",
        data: spreadHistory.map((item) => item.value),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        fill: true,
      },
    ],
  };

  const imbalanceChartData = {
    labels: imbalanceHistory.map((item) => item.time),
    datasets: [
      {
        label: "Imbalance",
        data: imbalanceHistory.map((item) => item.value),
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        fill: true,
      },
    ],
  };

  const depthChartData = {
    labels: depthData.map((item) => item.price),
    datasets: [
      {
        label: "Bid Volume",
        data: depthData.filter((item) => item.type === "bid").map((item) => item.volume),
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.2)",
        fill: true,
      },
      {
        label: "Ask Volume",
        data: depthData.filter((item) => item.type === "ask").map((item) => item.volume),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        fill: true,
      },
    ],
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Crypto Orderbook</h1>
        <select
          value={selectedPair}
          onChange={(e) => setSelectedPair(e.target.value)}
          className="border p-2 rounded"
        >
          {tradingPairs.map((pair) => (
            <option key={pair} value={pair}>
              {pair}
            </option>
          ))}
        </select>
        <div className="text-sm space-x-4">
          <span className="text-gray-500">Current Spread: ${currentSpread}</span>
          <span className="text-gray-500">Last update: {lastUpdate}</span>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Bids */}
            <div>
              <h2 className="text-lg font-bold">Bids</h2>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="border-b">Price</th>
                    <th className="border-b">Size</th>
                    <th className="border-b">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderbook.bids.map((bid, index) => (
                    <tr key={index}>
                      <td className="border-b text-green-600">${bid[0]}</td>
                      <td className="border-b">{bid[1]}</td>
                      <td className="border-b">{(parseFloat(bid[0]) * parseFloat(bid[1])).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Asks */}
            <div>
              <h2 className="text-lg font-bold">Asks</h2>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="border-b">Price</th>
                    <th className="border-b">Size</th>
                    <th className="border-b">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderbook.asks.map((ask, index) => (
                    <tr key={index}>
                      <td className="border-b text-red-600">${ask[0]}</td>
                      <td className="border-b">{ask[1]}</td>
                      <td className="border-b">{(parseFloat(ask[0]) * parseFloat(ask[1])).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Spread Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Spread Indicator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Line data={spreadChartData} />
        </CardContent>
      </Card>

      {/* Orderbook Imbalance Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Orderbook Imbalance Indicator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            Current Imbalance:{" "}
            <span
              className={
                currentImbalance > 0 ? "text-green-600" : currentImbalance < 0 ? "text-red-600" : "text-gray-600"
              }
            >
              {currentImbalance}%
            </span>
          </p>
          <Line data={imbalanceChartData} />
        </CardContent>
      </Card>

      {/* Market Depth */}
       <MarketDepth/>
    </div>
  );
};

export default CryptoOrderbook;
