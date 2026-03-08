# MicroPulse Dashboard

Next.js dashboard for MicroPulse AI-driven demand forecasting and inventory optimization.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Backend API

In the parent directory:
```bash
python run_api.py
```

The API should be running at http://localhost:8000

### 3. Start the Dashboard

```bash
npm run dev
```

The dashboard will be available at http://localhost:3000

## Features

- **Forecast Visualization**: Compare baseline vs context-aware MAPE
- **Inventory Impact**: View safety stock reduction and turnover improvements
- **Financial Metrics**: See working capital saved and revenue recovery potential
- **AI Chat**: Ask questions about SKU × PIN combinations

## Default Data

- SKU: `500ml_Cola`
- PIN: `395001`

## API Endpoints Used

- `GET /forecast?sku=...&pin=...` - Forecast data
- `GET /inventory?sku=...&pin=...` - Inventory data
- `POST /chat/ask` - AI chat

## Technology Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Chart.js
- Axios

## Troubleshooting

### API Connection Issues

If you see "Failed to load data":
1. Make sure the API server is running: `python run_api.py`
2. Check that the API is accessible at http://localhost:8000
3. Verify CORS is enabled in the API

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

## Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Project Structure

```
frontend/
├── pages/
│   ├── index.tsx          # Main dashboard page
│   └── _app.tsx           # App wrapper
├── components/
│   ├── ForecastChart.tsx  # Forecast visualization
│   ├── InventoryImpact.tsx # Inventory charts
│   ├── FinancialImpact.tsx # Financial KPIs
│   └── AIChat.tsx         # AI assistant
├── services/
│   └── api.ts             # API service layer
├── styles/
│   └── globals.css        # Global styles
└── package.json           # Dependencies
```

## License

MIT
