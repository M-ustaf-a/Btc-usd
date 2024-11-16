"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpDown, BarChart3, Scale } from "lucide-react";

const tradingPairs = ["BTC-USD", "ETH-USD", "XRP-USD"];

const CryptoOrderbook = () => {
  const [selectedPair, setSelectedPair] = useState("BTC-USD");
  const [orderbook, setOrderbook] = useState({ bids: [], asks: [] });
  const [spreadHistory, setSpreadHistory] = useState([]);
  const [imbalanceHistory, setImbalanceHistory] = useState([]);
  const [depthData, setDepthData] = useState([]);
  const [currentSpread, setCurrentSpread] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentImbalance, setCurrentImbalance] = useState(0);

  useEffect(() => {
    const generateMockData = () => {
      const basePrices = {
        "BTC-USD": 40000,
        "ETH-USD": 2000,
        "XRP-USD": 1,
      };
      const basePrice = basePrices[selectedPair] || 40000;
      const variance = Math.random() * 100 - 50;
      const currentPrice = basePrice + variance;

      const mockBids = Array.from({ length: 10 }, (_, i) => ({
        price: (currentPrice - i * 2 - Math.random()).toFixed(2),
        size: (Math.random() * 5 + 1).toFixed(3),
        total: 0,
      }));

      const mockAsks = Array.from({ length: 10 }, (_, i) => ({
        price: (currentPrice + i * 2 + Math.random()).toFixed(2),
        size: (Math.random() * 5 + 1).toFixed(3),
        total: 0,
      }));

      let bidTotal = 0;
      mockBids.forEach((bid) => {
        bidTotal += parseFloat(bid.size);
        bid.total = bidTotal.toFixed(3);
      });

      let askTotal = 0;
      mockAsks.forEach((ask) => {
        askTotal += parseFloat(ask.size);
        ask.total = askTotal.toFixed(3);
      });

      return {
        bids: mockBids.sort((a, b) => b.price - a.price),
        asks: mockAsks.sort((a, b) => a.price - b.price),
      };
    };

    const updateData = () => {
      const newOrderbook = generateMockData();
      setOrderbook(newOrderbook);

      const bestBid = Math.max(...newOrderbook.bids.map((b) => parseFloat(b.price)));
      const bestAsk = Math.min(...newOrderbook.asks.map((a) => parseFloat(a.price)));
      const spread = bestAsk - bestBid;
      setCurrentSpread(spread.toFixed(2));

      const newSpreadPoint = {
        time: new Date().toLocaleTimeString(),
        value: spread.toFixed(2),
      };

      setSpreadHistory((prev) => [...prev, newSpreadPoint].slice(-60));

      const bidVolume = parseFloat(newOrderbook.bids[newOrderbook.bids.length - 1].total);
      const askVolume = parseFloat(newOrderbook.asks[newOrderbook.asks.length - 1].total);
      const imbalance = ((bidVolume - askVolume) / (bidVolume + askVolume)) * 100;
      setCurrentImbalance(imbalance.toFixed(2));

      const newImbalancePoint = {
        time: new Date().toLocaleTimeString(),
        value: imbalance.toFixed(2),
      };

      setImbalanceHistory((prev) => [...prev, newImbalancePoint].slice(-60));

      const depthPoints = [];
      [...newOrderbook.bids].reverse().forEach((bid) => {
        depthPoints.push({ price: bid.price, volume: bid.total, type: "bid" });
      });

      newOrderbook.asks.forEach((ask) => {
        depthPoints.push({ price: ask.price, volume: ask.total, type: "ask" });
      });

      setDepthData(depthPoints);
      setLastUpdate(new Date().toLocaleTimeString());
    };

    updateData();
    const interval = setInterval(updateData, 1000);
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

      {/* Spread Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Spread Indicator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={spreadHistory}>
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} />
            </LineChart>
          </ResponsiveContainer>
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
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={imbalanceHistory}>
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="value" stroke="#4caf50" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>


      {/* Market Depth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Market Depth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={depthData}>
              <XAxis dataKey="price" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="volume" stroke="#16a34a" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orderbook */}
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
                      <td className="border-b text-green-600">${bid.price}</td>
                      <td className="border-b">{bid.size}</td>
                      <td className="border-b">{bid.total}</td>
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
                      <td className="border-b text-red-600">${ask.price}</td>
                      <td className="border-b">{ask.size}</td>
                      <td className="border-b">{ask.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoOrderbook;
