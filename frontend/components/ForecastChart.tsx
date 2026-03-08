import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ForecastChartProps {
  baselineMape: number;
  contextMape: number;
  improvement: number;
}

const ForecastChart: React.FC<ForecastChartProps> = ({
  baselineMape,
  contextMape,
  improvement
}) => {
  const data = {
    labels: ['Baseline Model', 'Context-Aware Model'],
    datasets: [
      {
        label: 'Forecast Error (MAPE %)',
        data: [baselineMape, contextMape],
        backgroundColor: [
          'rgba(239, 68, 68, 0.85)',  // Red for baseline
          'rgba(34, 197, 94, 0.85)'   // Green for context-aware
        ],
        borderColor: [
          'rgb(220, 38, 38)',  // Darker red border
          'rgb(22, 163, 74)'   // Darker green border
        ],
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 80,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Forecast Accuracy Improvement',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: '#1f2937',
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed.y.toFixed(2);
            return `Forecast Error: ${value}%`;
          },
          afterLabel: function(context: any) {
            if (context.dataIndex === 0) {
              return 'Higher error = Less accurate';
            } else {
              return 'Lower error = More accurate';
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Forecast Error (MAPE %)',
          font: {
            size: 13,
            weight: 'bold' as const,
          },
          color: '#4b5563',
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#6b7280',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        ticks: {
          font: {
            size: 13,
            weight: 'bold' as const,
          },
          color: '#374151',
        },
        grid: {
          display: false,
        }
      }
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="h-80">
        <Bar data={data} options={options} />
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Baseline: {baselineMape.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Context-Aware: {contextMape.toFixed(2)}%</span>
            </div>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">
              Improvement: <span className="font-bold text-green-700 text-lg">{improvement.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;
