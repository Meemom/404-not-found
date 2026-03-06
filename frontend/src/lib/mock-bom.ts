import type { BOMItem } from "@/lib/types";

export const MOCK_BOM: BOMItem[] = [
  {
    component_id: "MCU-32BIT-AUTO",
    name: "32-bit Automotive Microcontroller",
    category: "Semiconductors",
    criticality: "critical",
    suppliers: {
      primary: { supplier_id: "sup-tsmc-001", name: "TSMC", lead_time_days: 45, cost_per_unit_eur: 8.5 },
      backup: { supplier_id: "sup-infineon-de-001", name: "Infineon Technologies (Dresden)", lead_time_days: 7 },
    },
    inventory: {
      current_stock_units: 18000, daily_consumption_units: 1500, days_of_supply: 12,
      safety_stock_units: 31500, reorder_point_units: 21000, status: "below_reorder", inventory_value_eur: 153000,
    },
    warehouse_location: "Frankfurt Main Warehouse",
    last_replenishment: "2026-02-15",
    next_expected_delivery: "2026-03-18",
    dependent_orders: [
      { order_id: "ORD-DE-8821", customer: "BMW AG", product: "Engine Control Unit v4.2", quantity: 12000, total_value_eur: 2250000, due_date: "2026-03-10", status: "in_production" },
      { order_id: "ORD-DE-9301", customer: "BMW AG", product: "Sensor Interface Board v1.5", quantity: 6000, total_value_eur: 588000, due_date: "2026-03-28", status: "in_production" },
    ],
  },
  {
    component_id: "POWER-MGMT-IC",
    name: "Power Management IC (Automotive Grade)",
    category: "Semiconductors",
    criticality: "critical",
    suppliers: {
      primary: { supplier_id: "sup-tsmc-001", name: "TSMC", lead_time_days: 45, cost_per_unit_eur: 5.2 },
      backup: { supplier_id: "sup-stmicro-001", name: "STMicroelectronics", lead_time_days: 14 },
    },
    inventory: {
      current_stock_units: 22000, daily_consumption_units: 1200, days_of_supply: 18,
      safety_stock_units: 25200, reorder_point_units: 16800, status: "adequate", inventory_value_eur: 114400,
    },
    warehouse_location: "Frankfurt Main Warehouse",
    last_replenishment: "2026-02-20",
    next_expected_delivery: "2026-03-14",
    dependent_orders: [
      { order_id: "ORD-DE-8821", customer: "BMW AG", product: "Engine Control Unit v4.2", quantity: 12000, total_value_eur: 2250000, due_date: "2026-03-10", status: "in_production" },
      { order_id: "ORD-DE-9103", customer: "Volkswagen Group", product: "Power Management Module v3.1", quantity: 8500, total_value_eur: 1989000, due_date: "2026-03-21", status: "in_production" },
    ],
  },
  {
    component_id: "CAN-CONTROLLER",
    name: "CAN Bus Controller Chip",
    category: "Semiconductors",
    criticality: "critical",
    suppliers: {
      primary: { supplier_id: "sup-infineon-my-001", name: "Infineon Technologies (Malaysia)", lead_time_days: 21, cost_per_unit_eur: 3.8 },
      backup: { supplier_id: "sup-infineon-de-001", name: "Infineon Technologies (Dresden)", lead_time_days: 7 },
    },
    inventory: {
      current_stock_units: 35000, daily_consumption_units: 800, days_of_supply: 43,
      safety_stock_units: 16800, reorder_point_units: 11200, status: "healthy", inventory_value_eur: 133000,
    },
    warehouse_location: "Frankfurt Main Warehouse",
    last_replenishment: "2026-02-25",
    next_expected_delivery: "2026-03-10",
    dependent_orders: [
      { order_id: "ORD-DE-8821", customer: "BMW AG", product: "Engine Control Unit v4.2", quantity: 12000, total_value_eur: 2250000, due_date: "2026-03-10", status: "in_production" },
      { order_id: "ORD-DE-9250", customer: "Bosch GmbH", product: "CAN Bus Controller Board v2.0", quantity: 5000, total_value_eur: 710000, due_date: "2026-04-01", status: "awaiting_components" },
    ],
  },
  {
    component_id: "GATE-DRIVER-IC",
    name: "Gate Driver IC (High-Side)",
    category: "Semiconductors",
    criticality: "medium",
    suppliers: {
      primary: { supplier_id: "sup-infineon-my-001", name: "Infineon Technologies (Malaysia)", lead_time_days: 21, cost_per_unit_eur: 2.9 },
      backup: { supplier_id: "sup-infineon-de-001", name: "Infineon Technologies (Dresden)", lead_time_days: 7 },
    },
    inventory: {
      current_stock_units: 15000, daily_consumption_units: 600, days_of_supply: 25,
      safety_stock_units: 12600, reorder_point_units: 8400, status: "healthy", inventory_value_eur: 43500,
    },
    warehouse_location: "Frankfurt Secondary",
    last_replenishment: "2026-02-22",
    next_expected_delivery: "2026-03-15",
    dependent_orders: [
      { order_id: "ORD-DE-9103", customer: "Volkswagen Group", product: "Power Management Module v3.1", quantity: 8500, total_value_eur: 1989000, due_date: "2026-03-21", status: "in_production" },
    ],
  },
  {
    component_id: "BATT-CELL-48V",
    name: "48V Battery Cell Module",
    category: "Battery Components",
    criticality: "medium",
    suppliers: {
      primary: { supplier_id: "sup-samsung-001", name: "Samsung SDI", lead_time_days: 30, cost_per_unit_eur: 45.0 },
      backup: { supplier_id: "sup-lg-001", name: "LG Energy Solution", lead_time_days: 28 },
    },
    inventory: {
      current_stock_units: 4200, daily_consumption_units: 150, days_of_supply: 28,
      safety_stock_units: 3150, reorder_point_units: 2100, status: "healthy", inventory_value_eur: 189000,
    },
    warehouse_location: "Frankfurt Main Warehouse",
    last_replenishment: "2026-02-18",
    next_expected_delivery: "2026-03-20",
    dependent_orders: [],
  },
  {
    component_id: "SENSOR-IC-MEMS",
    name: "MEMS Sensor IC (Automotive)",
    category: "Sensors",
    criticality: "low",
    suppliers: {
      primary: { supplier_id: "sup-stmicro-001", name: "STMicroelectronics", lead_time_days: 14, cost_per_unit_eur: 4.1 },
      backup: null,
    },
    inventory: {
      current_stock_units: 28000, daily_consumption_units: 700, days_of_supply: 40,
      safety_stock_units: 14700, reorder_point_units: 9800, status: "healthy", inventory_value_eur: 114800,
    },
    warehouse_location: "Frankfurt Main Warehouse",
    last_replenishment: "2026-02-28",
    next_expected_delivery: "2026-03-12",
    dependent_orders: [
      { order_id: "ORD-DE-9250", customer: "Bosch GmbH", product: "CAN Bus Controller Board v2.0", quantity: 5000, total_value_eur: 710000, due_date: "2026-04-01", status: "awaiting_components" },
      { order_id: "ORD-DE-9301", customer: "BMW AG", product: "Sensor Interface Board v1.5", quantity: 6000, total_value_eur: 588000, due_date: "2026-03-28", status: "in_production" },
    ],
  },
];
