#!/usr/bin/env tsx
/**
 * Integration test script for forecast API endpoints
 * Tests the complete flow: generate forecast -> save to DB -> fetch latest
 * 
 * Usage: pnpm tsx scripts/test-forecast-api.ts
 */

import { db } from '../lib/db';
import { forecasts } from '../lib/db/schema';
import { saveForecast, getLatestForecast } from '../lib/db/forecasts';
import { desc } from 'drizzle-orm';

async function testForecastDatabase() {
  console.log('🧪 Testing Forecast Database Functions\n');

  try {
    // Test 1: Save a mock forecast
    console.log('1️⃣  Testing saveForecast()...');
    const mockForecast = {
      generated_at: new Date().toISOString(),
      period: {
        start: '2026-03-05',
        end: '2026-04-04',
        days: 30,
      },
      predictions: [
        {
          sku_id: 'TEST-001',
          sku_name: 'Test Product',
          pin_code: '400001',
          area_name: 'Test Area',
          predicted_demand: 100,
          confidence: 0.85,
          trend: 'increasing' as const,
          change_percent: 15,
        },
      ],
      restock_alerts: [],
      trends: {
        beverages: {
          direction: 'up' as const,
          change_percent: 10,
          description: 'Test trend',
        },
      },
      summary: {
        total_predictions: 1,
        high_urgency_alerts: 0,
        avg_confidence: 0.85,
        top_growing_skus: [],
      },
    };

    const saved = await saveForecast(mockForecast);
    console.log(`✅ Forecast saved with ID: ${saved.id}`);
    console.log(`   Generated at: ${saved.generatedAt}\n`);

    // Test 2: Fetch latest forecast
    console.log('2️⃣  Testing getLatestForecast()...');
    const latest = await getLatestForecast();
    
    if (!latest) {
      throw new Error('Failed to fetch latest forecast');
    }

    console.log(`✅ Latest forecast retrieved:`);
    console.log(`   ID: ${latest.id}`);
    console.log(`   Generated at: ${latest.generatedAt}`);
    console.log(`   Predictions: ${latest.forecastData.predictions.length}`);
    console.log(`   Period: ${latest.forecastData.period.start} to ${latest.forecastData.period.end}\n`);

    // Test 3: Verify JSON parsing
    console.log('3️⃣  Testing JSON data integrity...');
    if (typeof latest.forecastData === 'object' && latest.forecastData.predictions) {
      console.log('✅ Forecast data correctly parsed from JSON\n');
    } else {
      throw new Error('Forecast data not properly parsed');
    }

    // Test 4: Count total forecasts
    console.log('4️⃣  Checking total forecasts in database...');
    const allForecasts = await db
      .select({ id: forecasts.id })
      .from(forecasts)
      .orderBy(desc(forecasts.generatedAt));
    
    console.log(`✅ Total forecasts in database: ${allForecasts.length}\n`);

    console.log('🎉 All tests passed!\n');
    
    // Cleanup test data
    console.log('🧹 Cleaning up test data...');
    await db.delete(forecasts).where(forecasts.id.eq(saved.id));
    console.log('✅ Test data cleaned up\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testForecastDatabase()
  .then(() => {
    console.log('✨ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
