"""
MicroPulse Inventory Simulation Module
Periodic Review (R,S) Model with actual demand backtest
"""

import numpy as np
from typing import Dict, List, Tuple
import warnings

warnings.filterwarnings('ignore')


class PeriodicReviewSimulator:
    """
    Periodic Review (R,S) inventory model simulator.
    
    Uses actual test demand to backtest inventory performance.
    Orders placed every R days, arrive after L days lead time.
    """
    
    def __init__(
        self,
        forecast_test: np.ndarray,
        actual_test: np.ndarray,
        sigma_forecast: float,
        unit_cost: float,
        unit_margin: float,
        holding_cost_per_unit: float,
        lead_time: int = 3,
        review_period: int = 7,
        service_level_z: float = 1.65
    ):
        """
        Initialize inventory simulator.
        
        Args:
            forecast_test: Forecasted demand for test period (array length 36)
            actual_test: Actual demand for test period (array length 36)
            sigma_forecast: Forecast error standard deviation
            unit_cost: Cost per unit
            unit_margin: Profit margin per unit
            holding_cost_per_unit: Holding cost per unit per day
            lead_time: Lead time in days (default: 3)
            review_period: Review period in days (default: 7)
            service_level_z: Z-score for service level (default: 1.65 for 95%)
        """
        self.forecast_test = np.array(forecast_test)
        self.actual_test = np.array(actual_test)
        self.sigma_forecast = sigma_forecast
        self.unit_cost = unit_cost
        self.unit_margin = unit_margin
        self.holding_cost_per_unit = holding_cost_per_unit
        self.lead_time = lead_time
        self.review_period = review_period
        self.service_level_z = service_level_z
        
        # Validate inputs
        if len(self.forecast_test) != len(self.actual_test):
            raise ValueError("Forecast and actual arrays must have same length")
        
        self.num_days = len(self.actual_test)
        
        # Calculate policy parameters
        self.protection_period = self.lead_time + self.review_period
        self.mean_forecast = np.mean(self.forecast_test)
        self.expected_demand = self.mean_forecast * self.protection_period
        self.safety_stock = self.service_level_z * self.sigma_forecast * np.sqrt(self.protection_period)
        self.order_up_to = self.expected_demand + self.safety_stock
        
    def simulate(self) -> Dict:
        """
        Run day-by-day inventory simulation using actual demand.
        
        Returns:
            Dictionary with simulation results
        """
        # Initialize inventory
        inventory = self.order_up_to  # Starting inventory
        
        # Tracking variables
        inventory_levels = []
        stockout_days = 0
        lost_sales_units = 0
        total_units_sold = 0
        
        # Order tracking: list of (arrival_day, quantity) tuples
        pending_orders = []
        
        # Simulate each day
        for day in range(self.num_days):
            # Check if any orders arrive today
            arriving_orders = [qty for arrival_day, qty in pending_orders if arrival_day == day]
            for qty in arriving_orders:
                inventory += qty
            
            # Remove arrived orders from pending
            pending_orders = [(arrival_day, qty) for arrival_day, qty in pending_orders if arrival_day != day]
            
            # Record inventory level at start of day
            inventory_levels.append(inventory)
            
            # Actual demand for today
            demand = self.actual_test[day]
            
            # Try to fulfill demand
            if inventory >= demand:
                # Sufficient inventory
                inventory -= demand
                total_units_sold += demand
            else:
                # Stockout
                stockout_days += 1
                lost_sales = demand - inventory
                lost_sales_units += lost_sales
                total_units_sold += inventory
                inventory = 0  # Inventory depleted
            
            # Check if it's a review day (place order)
            if (day + 1) % self.review_period == 0:
                # Calculate order quantity
                # Order up to S level
                inventory_position = inventory
                
                # Add pending orders to inventory position
                for arrival_day, qty in pending_orders:
                    inventory_position += qty
                
                # Order quantity
                order_qty = max(0, self.order_up_to - inventory_position)
                
                if order_qty > 0:
                    # Order arrives after lead_time days
                    arrival_day = day + self.lead_time
                    if arrival_day < self.num_days:
                        pending_orders.append((arrival_day, order_qty))
        
        # Calculate metrics
        average_inventory = np.mean(inventory_levels)
        stockout_rate = (stockout_days / self.num_days) * 100
        
        # Financial calculations
        revenue = total_units_sold * self.unit_margin
        lost_revenue = lost_sales_units * self.unit_margin
        holding_cost = sum(inventory_levels) * self.holding_cost_per_unit
        working_capital = average_inventory * self.unit_cost
        
        # Service level achieved
        fill_rate = (total_units_sold / np.sum(self.actual_test)) * 100 if np.sum(self.actual_test) > 0 else 0
        
        # Inventory turnover ratio
        inventory_turnover = (total_units_sold / average_inventory) if average_inventory > 0 else 0
        
        # Return results
        results = {
            # Policy parameters
            'protection_period': self.protection_period,
            'mean_forecast': round(float(self.mean_forecast), 2),
            'expected_demand': round(float(self.expected_demand), 2),
            'safety_stock': round(float(self.safety_stock), 2),
            'order_up_to': round(float(self.order_up_to), 2),
            'starting_inventory': round(float(self.order_up_to), 2),
            
            # Simulation results
            'num_days': self.num_days,
            'stockout_days': int(stockout_days),
            'stockout_rate': round(float(stockout_rate), 2),
            'lost_sales_units': round(float(lost_sales_units), 2),
            'total_units_sold': round(float(total_units_sold), 2),
            'total_demand': round(float(np.sum(self.actual_test)), 2),
            'fill_rate': round(float(fill_rate), 2),
            
            # Inventory metrics
            'average_inventory': round(float(average_inventory), 2),
            'min_inventory': round(float(np.min(inventory_levels)), 2),
            'max_inventory': round(float(np.max(inventory_levels)), 2),
            'inventory_turnover': round(float(inventory_turnover), 2),
            
            # Financial metrics
            'revenue': round(float(revenue), 2),
            'lost_revenue': round(float(lost_revenue), 2),
            'holding_cost': round(float(holding_cost), 2),
            'working_capital': round(float(working_capital), 2),
            'net_profit': round(float(revenue - holding_cost), 2),
            
            # Configuration
            'unit_cost': self.unit_cost,
            'unit_margin': self.unit_margin,
            'holding_cost_per_unit': self.holding_cost_per_unit,
            'lead_time': self.lead_time,
            'review_period': self.review_period,
            'service_level_z': self.service_level_z
        }
        
        return results


def run_inventory_simulation(
    forecast_test: np.ndarray,
    actual_test: np.ndarray,
    sigma_forecast: float,
    unit_cost: float = 10.5,
    unit_margin: float = 4.2,
    holding_cost_per_unit: float = 0.05,
    lead_time: int = 3,
    review_period: int = 7,
    service_level_z: float = 1.65
) -> Dict:
    """
    Run inventory simulation with Periodic Review (R,S) model.
    
    Args:
        forecast_test: Forecasted demand for test period
        actual_test: Actual demand for test period
        sigma_forecast: Forecast error standard deviation
        unit_cost: Cost per unit (default: 10.5)
        unit_margin: Profit margin per unit (default: 4.2)
        holding_cost_per_unit: Holding cost per unit per day (default: 0.05)
        lead_time: Lead time in days (default: 3)
        review_period: Review period in days (default: 7)
        service_level_z: Z-score for service level (default: 1.65)
        
    Returns:
        Dictionary with simulation results
    """
    simulator = PeriodicReviewSimulator(
        forecast_test=forecast_test,
        actual_test=actual_test,
        sigma_forecast=sigma_forecast,
        unit_cost=unit_cost,
        unit_margin=unit_margin,
        holding_cost_per_unit=holding_cost_per_unit,
        lead_time=lead_time,
        review_period=review_period,
        service_level_z=service_level_z
    )
    
    results = simulator.simulate()
    
    return results


def compare_inventory_performance(
    baseline_results: Dict,
    context_results: Dict
) -> Dict:
    """
    Compare inventory performance between baseline and context-aware models.
    
    Args:
        baseline_results: Simulation results from baseline model
        context_results: Simulation results from context-aware model
        
    Returns:
        Dictionary with comparison metrics
    """
    comparison = {
        # Safety stock comparison
        'baseline_safety_stock': baseline_results['safety_stock'],
        'context_safety_stock': context_results['safety_stock'],
        'safety_stock_reduction': round(
            baseline_results['safety_stock'] - context_results['safety_stock'], 2
        ),
        'safety_stock_reduction_percent': round(
            ((baseline_results['safety_stock'] - context_results['safety_stock']) / 
             baseline_results['safety_stock']) * 100, 2
        ) if baseline_results['safety_stock'] > 0 else 0,
        
        # Average inventory comparison
        'baseline_avg_inventory': baseline_results['average_inventory'],
        'context_avg_inventory': context_results['average_inventory'],
        'avg_inventory_reduction': round(
            baseline_results['average_inventory'] - context_results['average_inventory'], 2
        ),
        'avg_inventory_reduction_percent': round(
            ((baseline_results['average_inventory'] - context_results['average_inventory']) / 
             baseline_results['average_inventory']) * 100, 2
        ) if baseline_results['average_inventory'] > 0 else 0,
        
        # Working capital comparison
        'baseline_working_capital': baseline_results['working_capital'],
        'context_working_capital': context_results['working_capital'],
        'working_capital_saved': round(
            baseline_results['working_capital'] - context_results['working_capital'], 2
        ),
        'working_capital_saved_percent': round(
            ((baseline_results['working_capital'] - context_results['working_capital']) / 
             baseline_results['working_capital']) * 100, 2
        ) if baseline_results['working_capital'] > 0 else 0,
        
        # Stockout comparison
        'baseline_stockout_rate': baseline_results['stockout_rate'],
        'context_stockout_rate': context_results['stockout_rate'],
        'stockout_rate_reduction': round(
            baseline_results['stockout_rate'] - context_results['stockout_rate'], 2
        ),
        
        # Lost sales comparison
        'baseline_lost_sales': baseline_results['lost_sales_units'],
        'context_lost_sales': context_results['lost_sales_units'],
        'lost_sales_reduction': round(
            baseline_results['lost_sales_units'] - context_results['lost_sales_units'], 2
        ),
        
        # Inventory turnover comparison
        'baseline_inventory_turnover': baseline_results['inventory_turnover'],
        'context_inventory_turnover': context_results['inventory_turnover'],
        'inventory_turnover_improvement': round(
            context_results['inventory_turnover'] - baseline_results['inventory_turnover'], 2
        ),
        'inventory_turnover_improvement_percent': round(
            ((context_results['inventory_turnover'] - baseline_results['inventory_turnover']) / 
             baseline_results['inventory_turnover']) * 100, 2
        ) if baseline_results['inventory_turnover'] > 0 else 0,
        
        # Revenue comparison
        'baseline_revenue': baseline_results['revenue'],
        'context_revenue': context_results['revenue'],
        'revenue_gain': round(
            context_results['revenue'] - baseline_results['revenue'], 2
        ),
        
        # Holding cost comparison
        'baseline_holding_cost': baseline_results['holding_cost'],
        'context_holding_cost': context_results['holding_cost'],
        'holding_cost_saved': round(
            baseline_results['holding_cost'] - context_results['holding_cost'], 2
        ),
        
        # Net profit comparison
        'baseline_net_profit': baseline_results['net_profit'],
        'context_net_profit': context_results['net_profit'],
        'net_profit_improvement': round(
            context_results['net_profit'] - baseline_results['net_profit'], 2
        )
    }
    
    return comparison


def print_simulation_results(results: Dict, model_name: str = "Model") -> None:
    """
    Print simulation results in a formatted way.
    
    Args:
        results: Simulation results dictionary
        model_name: Name of the model (for display)
    """
    print("\n" + "="*70)
    print(f"INVENTORY SIMULATION RESULTS - {model_name}")
    print("="*70)
    
    print("\nPolicy Parameters:")
    print(f"  Protection Period: {results['protection_period']} days")
    print(f"  Mean Forecast: {results['mean_forecast']} units/day")
    print(f"  Expected Demand: {results['expected_demand']} units")
    print(f"  Safety Stock: {results['safety_stock']} units")
    print(f"  Order-Up-To Level (S): {results['order_up_to']} units")
    print(f"  Starting Inventory: {results['starting_inventory']} units")
    
    print("\nSimulation Results:")
    print(f"  Simulation Days: {results['num_days']}")
    print(f"  Total Demand: {results['total_demand']} units")
    print(f"  Units Sold: {results['total_units_sold']} units")
    print(f"  Lost Sales: {results['lost_sales_units']} units")
    print(f"  Fill Rate: {results['fill_rate']}%")
    print(f"  Stockout Days: {results['stockout_days']}")
    print(f"  Stockout Rate: {results['stockout_rate']}%")
    
    print("\nInventory Metrics:")
    print(f"  Average Inventory: {results['average_inventory']} units")
    print(f"  Min Inventory: {results['min_inventory']} units")
    print(f"  Max Inventory: {results['max_inventory']} units")
    print(f"  Inventory Turnover: {results['inventory_turnover']:.2f}x")
    
    print("\nFinancial Metrics:")
    print(f"  Revenue: ₹{results['revenue']:.2f}")
    print(f"  Lost Revenue: ₹{results['lost_revenue']:.2f}")
    print(f"  Holding Cost: ₹{results['holding_cost']:.2f}")
    print(f"  Working Capital: ₹{results['working_capital']:.2f}")
    print(f"  Net Profit: ₹{results['net_profit']:.2f}")
    
    print("="*70)


def print_comparison_results(comparison: Dict) -> None:
    """
    Print comparison results in a formatted way.
    
    Args:
        comparison: Comparison results dictionary
    """
    print("\n" + "="*70)
    print("INVENTORY PERFORMANCE COMPARISON")
    print("="*70)
    
    print("\nSafety Stock:")
    print(f"  Baseline: {comparison['baseline_safety_stock']} units")
    print(f"  Context-Aware: {comparison['context_safety_stock']} units")
    print(f"  Reduction: {comparison['safety_stock_reduction']} units ({comparison['safety_stock_reduction_percent']}%)")
    
    print("\nAverage Inventory:")
    print(f"  Baseline: {comparison['baseline_avg_inventory']} units")
    print(f"  Context-Aware: {comparison['context_avg_inventory']} units")
    print(f"  Reduction: {comparison['avg_inventory_reduction']} units ({comparison['avg_inventory_reduction_percent']}%)")
    
    print("\nWorking Capital:")
    print(f"  Baseline: ₹{comparison['baseline_working_capital']:.2f}")
    print(f"  Context-Aware: ₹{comparison['context_working_capital']:.2f}")
    print(f"  Saved: ₹{comparison['working_capital_saved']:.2f} ({comparison['working_capital_saved_percent']}%)")
    
    print("\nStockout Performance:")
    print(f"  Baseline Rate: {comparison['baseline_stockout_rate']}%")
    print(f"  Context-Aware Rate: {comparison['context_stockout_rate']}%")
    print(f"  Reduction: {comparison['stockout_rate_reduction']}%")
    
    print("\nLost Sales:")
    print(f"  Baseline: {comparison['baseline_lost_sales']} units")
    print(f"  Context-Aware: {comparison['context_lost_sales']} units")
    print(f"  Reduction: {comparison['lost_sales_reduction']} units")
    
    print("\nRevenue:")
    print(f"  Baseline: ₹{comparison['baseline_revenue']:.2f}")
    print(f"  Context-Aware: ₹{comparison['context_revenue']:.2f}")
    print(f"  Gain: ₹{comparison['revenue_gain']:.2f}")
    
    print("\nHolding Cost:")
    print(f"  Baseline: ₹{comparison['baseline_holding_cost']:.2f}")
    print(f"  Context-Aware: ₹{comparison['context_holding_cost']:.2f}")
    print(f"  Saved: ₹{comparison['holding_cost_saved']:.2f}")
    
    print("\nNet Profit:")
    print(f"  Baseline: ₹{comparison['baseline_net_profit']:.2f}")
    print(f"  Context-Aware: ₹{comparison['context_net_profit']:.2f}")
    print(f"  Improvement: ₹{comparison['net_profit_improvement']:.2f}")
    
    print("\nInventory Turnover:")
    print(f"  Baseline: {comparison['baseline_inventory_turnover']:.2f}x")
    print(f"  Context-Aware: {comparison['context_inventory_turnover']:.2f}x")
    print(f"  Improvement: {comparison['inventory_turnover_improvement']:.2f}x ({comparison['inventory_turnover_improvement_percent']:.2f}%)")
    
    print("="*70)


if __name__ == "__main__":
    # Example usage
    print("Inventory Simulation Module")
    print("Use run_inventory_simulation() to simulate inventory performance")
    print("Use compare_inventory_performance() to compare baseline vs context-aware")
