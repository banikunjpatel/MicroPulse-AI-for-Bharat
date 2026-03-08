import React from 'react';
import { Bar } from 'react-chartjs-2';

interface InventoryImpactProps {
  safetyStockReduction: number;
  inventoryTurnoverImprovement: number;
}

const InventoryImpact: React.FC<InventoryImpactProps> = ({
  safetyStockReduction,
  inventoryTurnoverImprovement
}) => {
  const data = {
    labels: ['Safety Stock Reduction', 'Inventory Turnover Improvement'],
    datasets: [
      {
        label: 'Improvement (%)',
        data: [safetyStockReduction, inventoryTurnoverImprovement],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)'],
        borderColor: ['rgb(59, 130, 246)', 'rgb(168, 85, 247)'],
        borderWidth: 1,
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
        text: 'Inventory Optimization Impact',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Improvement (%)',
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default InventoryImpact;
