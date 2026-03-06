/* ═══ Warden TypeScript Interfaces ═══ */

// ── Company ──
export interface Location {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Avatar {
  initials: string;
  color: string;
  shape: string;
}

export interface Customer {
  id: string;
  name: string;
  tier: number;
  annual_value_eur: number;
  sla_days: number;
  location?: Location;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  hq: Location;
  annual_revenue_eur: number;
  employees: number;
  avatar: Avatar;
  customers: Customer[];
  risk_appetite: string;
  inventory_policy: {
    safety_stock_days: number;
    reorder_point_days: number;
  };
  critical_components: string[];
  founded_year?: number;
  certifications: string[];
  primary_products: string[];
}

// ── Supplier ──
export interface Supplier {
  supplier_id: string;
  name: string;
  location: Location;
  tier: number;
  components_supplied: string[];
  health_score: number;
  lead_time_days: number;
  single_source: boolean;
  annual_spend_eur: number;
  contract_type: string;
  force_majeure_clause: boolean;
  backup_suppliers: string[];
  current_status: "normal" | "at_risk" | "disrupted";
  contact?: {
    name: string;
    role: string;
    email: string;
  };
  reliability_rating?: number;
  on_time_delivery_pct?: number;
  quality_score?: number;
}

// ── Orders & Inventory ──
export interface Shipment {
  shipment_id: string;
  from_supplier: string;
  component: string;
  quantity: number;
  status: "on_track" | "at_risk" | "delayed";
  eta_original: string;
  eta_revised: string | null;
  delay_days: number;
}

export interface Order {
  order_id: string;
  customer_id: string;
  customer_name: string;
  product: string;
  quantity: number;
  unit_price_eur: number;
  total_value_eur: number;
  order_date: string;
  due_date: string;
  sla_deadline: string;
  status: string;
  completion_pct: number;
  components_required: string[];
  shipments: Shipment[];
}

export interface InventoryItem {
  component_id: string;
  name: string;
  category: string;
  current_stock_units: number;
  daily_consumption_units: number;
  days_of_supply: number;
  safety_stock_units: number;
  reorder_point_units: number;
  status: "healthy" | "adequate" | "below_reorder" | "critical";
  unit_cost_eur: number;
  primary_supplier: string;
  backup_supplier: string | null;
  warehouse_location: string;
  last_replenishment: string;
  next_expected_delivery: string;
}

// ── BOM (Bill of Materials) ──
export interface BOMSupplier {
  supplier_id: string;
  name: string;
  lead_time_days: number;
  cost_per_unit_eur?: number;
}

export interface BOMDependentOrder {
  order_id: string;
  customer: string;
  product: string;
  quantity: number;
  total_value_eur: number;
  due_date: string;
  status: string;
}

export interface BOMInventory {
  current_stock_units: number;
  daily_consumption_units: number;
  days_of_supply: number;
  safety_stock_units: number;
  reorder_point_units: number;
  status: "healthy" | "adequate" | "below_reorder" | "critical";
  inventory_value_eur: number;
}

export interface BOMItem {
  component_id: string;
  name: string;
  category: string;
  criticality: "critical" | "medium" | "low";
  suppliers: {
    primary: BOMSupplier;
    backup: BOMSupplier | null;
  };
  inventory: BOMInventory;
  warehouse_location: string;
  last_replenishment: string;
  next_expected_delivery: string;
  dependent_orders: BOMDependentOrder[];
}

// ── Risk & Disruption ──
export interface Disruption {
  id?: string;
  disruption_id: string;
  title: string;
  type: string;
  region?: string;
  affected_region?: string;
  affected_countries: string[];
  start_date?: string;
  detected_at?: string;
  end_date?: string | null;
  severity: number;
  description: string;
  status?: string;
  affected_suppliers?: string[];
  affected_supplier_ids?: string[];
  financial_impact_eur: number | null;
  mitigation_taken?: string | null;
  outcome?: string | null;
  lessons_learned?: string | null;
  is_active?: boolean;
  risk_details?: {
    shipments_affected: string[];
    orders_at_risk: string[];
    days_until_stockout: number;
    sla_breach_probability: number;
    revenue_at_risk_eur: number;
  };
}

export interface SupplierHealth {
  supplier_id: string;
  name: string;
  health_score: number;
  status: string;
  current_status?: string;
  components_at_risk: string[];
}

export interface DashboardOverview {
  risk_score: number;
  revenue_at_risk_eur: number;
  active_alerts: number;
  pending_actions: number;
  supplier_health: SupplierHealth[];
  sla_at_risk_orders: SLAAtRiskOrder[];
  critical_inventory: CriticalInventory[];
  disruptions: Disruption[];
  total_orders: number;
  total_suppliers: number;
  last_updated: string;
}

export interface SLAAtRiskOrder {
  order_id: string;
  customer: string;
  customer_name: string;
  value_eur: number;
  sla_deadline: string;
  completion_pct: number;
  breach_probability: number;
  product: string;
}

export interface CriticalInventory {
  component_id: string;
  name: string;
  days_of_supply: number;
  reorder_point_days: number;
  status: string;
}

// ── Actions ──
export interface PendingAction {
  id: string;
  action_id: string;
  type: string;
  title: string;
  description: string;
  detail?: string;
  target: string;
  urgency: "critical" | "high" | "medium" | "low";
  confidence?: number;
  content: string;
  related_disruption: string | null;
  related_order: string | null;
  estimated_cost_eur?: number;
  estimated_saving_eur?: number;
  created_at: string;
  status: "pending" | "approved" | "dismissed";
  approved_at?: string;
  dismissed_at?: string;
  dismiss_reason?: string;
}

// ── Globe ──
export interface GlobeNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "hq" | "supplier" | "customer";
  color: string;
  size: number;
  label: string;
  tier?: number;
  status?: string;
  health_score?: number;
  details: Record<string, unknown>;
}

export interface GlobeArc {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  status: string;
  label: string;
  stroke: number;
  dash: boolean;
}

export interface RiskZone {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
  label: string;
  severity: number;
}

export interface GlobeData {
  nodes: GlobeNode[];
  arcs: GlobeArc[];
  risk_zones: RiskZone[];
}

// ── Chat ──
export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  thinking?: string[];
  actions?: PendingAction[];
  agent?: string;
}

export interface SSEEvent {
  type: "thinking" | "response" | "action_generated" | "done";
  content: string;
  agent?: string;
  timestamp: string;
  reasoning_trace?: string[];
}

// ── Perception Intelligence ──
export interface EventNodeData {
  label: string;
  eventType: string;
  severity: number;
  confidence: number;
  delay: string;
  affectedRegions: string[];
}

export interface EventNode {
  id: string;
  type: "event";
  data: EventNodeData;
}

export interface ArticleResult {
  article_id: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  published_at: string;
  relevance_score: number;
  source_type: "news";
  is_mock: boolean;
}

export interface VideoResult {
  video_id: string;
  title: string;
  channel_name: string;
  thumbnail_url: string;
  watch_url: string;
  published_at: string;
  is_mock: boolean;
}

export interface EventIntelligence {
  event_id: string;
  articles: ArticleResult[];
  videos: VideoResult[];
  mcp_status: {
    brave_search: "live" | "fallback";
    fetch: "available" | "unavailable";
    youtube: "live" | "fallback";
  };
  fetched_at: string;
}

export interface ArticleContent {
  url: string;
  title?: string;
  source_name?: string;
  content: string;
  word_count: number;
  fetch_success: boolean;
  is_loading?: boolean;
  error?: string;
}

