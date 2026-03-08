import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ForecastChart from '../components/ForecastChart';
import InventoryImpact from '../components/InventoryImpact';
import FinancialImpact from '../components/FinancialImpact';
import AIChat from '../components/AIChat';
import AIRecommendation from '../components/AIRecommendation';
import MarketContext from '../components/MarketContext';
import ContextSignals from '../components/ContextSignals';
import DemandHeatmap from '../components/DemandHeatmap';
import { getForecast, getInventory, getAvailableCombinations, getHeatmapData, ForecastData, InventoryData } from '../services/api';

export default function Home() {
  const [sku, setSku] = useState('500ml_Cola');
  const [pin, setPin] = useState('395001');
  const [scenario, setScenario] = useState('normal');
  const [skuOptions, setSkuOptions] = useState<string[]>([]);
  const [pinOptions, setPinOptions] = useState<string[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCombinations();
  }, []);

  useEffect(() => {
    if (sku && pin) {
      loadData();
    }
  }, [sku, pin, scenario]);

  const loadCombinations = async () => {
    try {
      const data = await getAvailableCombinations();
      
      if (data.combinations && data.combinations.length > 0) {
        // Extract unique SKUs and PINs
        const skus = [...new Set(data.combinations.map((c: any) => c.sku_id))];
        const pins = [...new Set(data.combinations.map((c: any) => c.pin_code.toString()))];
        
        setSkuOptions(skus);
        setPinOptions(pins);
        
        // Set default values if not already set
        if (skus.length && !sku) setSku(skus[0]);
        if (pins.length && !pin) setPin(pins[0]);
      }
    } catch (err) {
      console.error('Error loading combinations:', err);
      // Fallback to default values
      setSkuOptions(['500ml_Cola']);
      setPinOptions(['395001']);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [forecast, inventory, heatmap] = await Promise.all([
        getForecast(sku, pin, scenario),
        getInventory(sku, pin),
        getHeatmapData(sku)
      ]);

      setForecastData(forecast);
      setInventoryData(inventory);
      setHeatmapData(heatmap.heatmap_data || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Make sure the API server is running at http://localhost:8000');
    } finally {
      setLoading(false);
    }
  };

  const revenueRecoveryPotential = inventoryData 
    ? inventoryData.working_capital_saved * 3 
    : 0;

  return (
    <>
      <Head>
        <title>MicroPulse Dashboard</title>
        <meta name="description" content="AI-powered demand forecasting and inventory optimization" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">MicroPulse — Hyperlocal Retail Intelligence</h1>
            <p className="text-blue-100 mt-1">AI-powered demand forecasting and inventory optimization</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* AI Insight Banner */}
          {!loading && forecastData && inventoryData && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8 shadow-md">
              <div className="flex items-start gap-3">
                <div className="text-3xl mt-1">⚡</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    AI-Powered Business Impact Summary
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Context-aware forecasting reduced demand uncertainty by{' '}
                    <span className="font-bold text-blue-700">{forecastData.sigma_reduction_percent.toFixed(1)}%</span>,
                    enabling a{' '}
                    <span className="font-bold text-green-700">{inventoryData.safety_stock_reduction_percent.toFixed(1)}%</span>
                    {' '}reduction in safety stock while maintaining optimal service levels. 
                    This unlocked{' '}
                    <span className="font-bold text-purple-700">₹{inventoryData.working_capital_saved.toFixed(0)}</span>
                    {' '}in working capital for <span className="font-semibold">{sku} × {pin}</span>, 
                    with potential revenue recovery of{' '}
                    <span className="font-bold text-indigo-700">₹{(inventoryData.working_capital_saved * 3).toFixed(0)}</span>.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                      <span className="text-gray-600">Forecast Accuracy:</span>
                      <span className="font-bold text-green-600">+{forecastData.mape_improvement_percent.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                      <span className="text-gray-600">Inventory Efficiency:</span>
                      <span className="font-bold text-blue-600">+{inventoryData.inventory_turnover_improvement_percent.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                      <span className="text-gray-600">Stockout Reduction:</span>
                      <span className="font-bold text-purple-600">{(inventoryData.baseline_stockout_rate - inventoryData.context_stockout_rate).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SKU Selection */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SKU Product
                </label>
                <select
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {skuOptions.length === 0 && (
                    <option value="">Loading SKUs...</option>
                  )}
                  {skuOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PIN Code
                </label>
                <select
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {pinOptions.length === 0 && (
                    <option value="">Loading PINs...</option>
                  )}
                  {pinOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Scenario Simulation
                </label>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-800 font-medium cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <option value="normal">Normal</option>
                  <option value="heatwave">Heatwave (+15%)</option>
                  <option value="festival">Festival (+20%)</option>
                  <option value="holiday">Holiday (+18%)</option>
                  <option value="promotion">Promotion (+25%)</option>
                </select>
              </div>
              
              <div className="pt-7">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {loading ? 'Loading...' : 'Load Data'}
                </button>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                💡 Select a SKU, PIN code, and scenario to view forecast accuracy, inventory optimization, and financial impact metrics.
                {forecastData?.scenario_effect && (
                  <span className="ml-2 text-purple-600 font-semibold">
                    Active Scenario: {forecastData.scenario_effect.description}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading data...</p>
            </div>
          )}

          {/* Dashboard Content */}
          {!loading && forecastData && inventoryData && (
            <>
              {/* Scenario Impact Banner */}
              {scenario !== 'normal' && forecastData.scenario_effect && (
                <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border-l-4 border-orange-500 rounded-lg p-5 mb-6 shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl mt-1">⚠️</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        Scenario Impact Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-orange-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Scenario Applied</p>
                          <p className="text-lg font-bold text-orange-700 capitalize">{forecastData.scenario_effect.scenario}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-red-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expected Demand Increase</p>
                          <p className="text-lg font-bold text-red-700">{forecastData.scenario_effect.demand_uplift}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-purple-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Potential Revenue Opportunity</p>
                          <p className="text-lg font-bold text-purple-700">
                            ₹{(inventoryData.working_capital_saved * forecastData.scenario_effect.multiplier * 3).toFixed(0)}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-yellow-200">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stockout Risk Level</p>
                          <p className="text-lg font-bold text-yellow-700">
                            {forecastData.scenario_effect.multiplier >= 1.20 ? 'Elevated' : 
                             forecastData.scenario_effect.multiplier >= 1.15 ? 'Medium' : 'Moderate'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* KPI Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Forecast Improvement Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border-2 border-green-200 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Forecast Improvement</p>
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">📈</span>
                    </div>
                  </div>
                  <p className="text-5xl font-bold text-green-700 mb-2">
                    {forecastData.mape_improvement_percent.toFixed(1)}%
                  </p>
                  <p className="text-sm text-green-600 font-medium">MAPE reduction</p>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-gray-600">
                      Confidence: <span className="font-bold text-green-700">
                        {forecastData.forecast_confidence 
                          ? (forecastData.forecast_confidence * 100).toFixed(0)
                          : (((1 - (forecastData.context_sigma / forecastData.baseline_sigma)) * 100).toFixed(0))}%
                      </span>
                    </p>
                  </div>
                </div>

                {/* Safety Stock Reduction Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border-2 border-blue-200 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Safety Stock Reduction</p>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">📦</span>
                    </div>
                  </div>
                  <p className="text-5xl font-bold text-blue-700 mb-2">
                    {inventoryData.safety_stock_reduction_percent.toFixed(1)}%
                  </p>
                  <p className="text-sm text-blue-600 font-medium">Inventory optimization</p>
                </div>

                {/* Working Capital Saved Card */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border-2 border-purple-200 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Working Capital Saved</p>
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">💰</span>
                    </div>
                  </div>
                  <p className="text-5xl font-bold text-purple-700 mb-2">
                    ₹{inventoryData.working_capital_saved.toFixed(0)}
                  </p>
                  <p className="text-sm text-purple-600 font-medium">
                    {inventoryData.working_capital_saved_percent.toFixed(1)}% reduction
                  </p>
                </div>
              </div>

              {/* Context Panels Row */}
              {(forecastData.context_signals || forecastData.market_context || forecastData.recommendation) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {forecastData.context_signals && (
                    <ContextSignals signals={forecastData.context_signals} />
                  )}
                  
                  {forecastData.market_context && (
                    <MarketContext context={forecastData.market_context} />
                  )}
                  
                  {forecastData.recommendation && (
                    <AIRecommendation recommendation={forecastData.recommendation} />
                  )}
                </div>
              )}

              {/* Hyperlocal Demand Heatmap */}
              {heatmapData.length > 0 && (
                <div className="mb-8">
                  <DemandHeatmap sku={sku} heatmapData={heatmapData} />
                </div>
              )}

              {/* Charts and AI Chat */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Charts */}
                <div className="lg:col-span-2 space-y-6">
                  <ForecastChart
                    baselineMape={forecastData.baseline_mape}
                    contextMape={forecastData.context_mape}
                    improvement={forecastData.mape_improvement_percent}
                  />

                  <InventoryImpact
                    safetyStockReduction={inventoryData.safety_stock_reduction_percent}
                    inventoryTurnoverImprovement={inventoryData.inventory_turnover_improvement_percent}
                  />

                  <FinancialImpact
                    workingCapitalSaved={inventoryData.working_capital_saved}
                    workingCapitalSavedPercent={inventoryData.working_capital_saved_percent}
                    revenueRecoveryPotential={revenueRecoveryPotential}
                  />
                </div>

                {/* Right Column - AI Chat */}
                <div className="lg:col-span-1">
                  <AIChat sku={sku} pin={pin} />
                </div>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-12 py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm">MicroPulse © 2026 - AI-driven Retail Intelligence</p>
          </div>
        </footer>
      </div>
    </>
  );
}
