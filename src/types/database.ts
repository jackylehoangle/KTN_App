// Hand-written types mirroring supabase/schema.sql.
// Regenerate/adjust if the schema changes.

export type UserRole = 'admin' | 'kinh_doanh' | 'vat_tu' | 'nhan_su' | 'tai_chinh' | 'san_xuat';
export type StaffLevel = 'staff' | 'manager';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  level: StaffLevel;
  phone: string | null;
  active: boolean;
  created_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  module_href: string;
  granted_by: string | null;
  created_at: string;
}

export type ApprovalType = 'purchase' | 'advance' | 'other';
export type ApprovalStatus = 'pending_manager' | 'pending_director' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  code: string;
  request_type: ApprovalType;
  title: string;
  description: string | null;
  amount: number | null;
  department: UserRole;
  requested_by: string;
  requested_by_name: string;
  status: ApprovalStatus;
  created_at: string;
}

export type ApprovalActionStep = 'manager' | 'director';
export type ApprovalActionKind = 'approve' | 'reject';

export interface ApprovalAction {
  id: string;
  request_id: string;
  approver_id: string;
  step: ApprovalActionStep;
  action: ApprovalActionKind;
  note: string | null;
  acted_at: string;
}

// ---------- Module 1: Kinh doanh ----------
export interface Customer {
  id: string;
  code: string;
  name: string;
  customer_type: 'individual' | 'company';
  tax_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type OpportunityStage = 'new' | 'contacted' | 'quoted' | 'negotiating' | 'won' | 'lost';

export interface Opportunity {
  id: string;
  code: string;
  customer_id: string | null;
  name: string;
  stage: OpportunityStage;
  value: number;
  expected_close_date: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type ContractStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Contract {
  id: string;
  code: string;
  customer_id: string | null;
  opportunity_id: string | null;
  title: string;
  value: number;
  start_date: string | null;
  end_date: string | null;
  status: ContractStatus;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
}

export type SalesOrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export interface SalesOrder {
  id: string;
  code: string;
  customer_id: string | null;
  contract_id: string | null;
  order_date: string;
  delivery_date: string | null;
  status: SalesOrderStatus;
  total_amount: number;
  created_by: string | null;
  created_at: string;
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

// ---------- Module 2: Vat tu ----------
export interface Supplier {
  id: string;
  code: string;
  name: string;
  tax_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  manager_id: string | null;
}

export interface MaterialCategory {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  category_id: string | null;
  unit: string;
  spec: string | null;
  min_stock: number;
  unit_cost: number;
  default_supplier_id: string | null;
  active: boolean;
  created_at: string;
}

export type PurchaseOrderStatus = 'pending' | 'confirmed' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  code: string;
  supplier_id: string | null;
  order_date: string;
  expected_date: string | null;
  status: PurchaseOrderStatus;
  total_amount: number;
  created_by: string | null;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  material_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type StockMovementType = 'in' | 'out' | 'transfer' | 'adjust';

export interface StockMovement {
  id: string;
  code: string;
  material_id: string;
  warehouse_id: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost: number;
  reference_type: 'purchase_order' | 'sales_order' | 'production' | 'manual' | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StockBalance {
  material_id: string;
  material_code: string;
  material_name: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity_on_hand: number;
}

// ---------- Module 3: Nhan su ----------
export interface Department {
  id: string;
  name: string;
  parent_id: string | null;
  manager_id: string | null;
}

export interface Position {
  id: string;
  name: string;
  department_id: string | null;
}

export type EmployeeStatus = 'active' | 'probation' | 'inactive' | 'terminated';

export interface Employee {
  id: string;
  code: string;
  full_name: string;
  gender: 'male' | 'female' | 'other' | null;
  date_of_birth: string | null;
  id_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  department_id: string | null;
  position_id: string | null;
  hire_date: string | null;
  termination_date: string | null;
  status: EmployeeStatus;
  base_salary: number;
  bank_account: string | null;
  avatar_url: string | null;
  user_id: string | null;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'late';

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  note: string | null;
}

export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  status: LeaveStatus;
  approved_by: string | null;
  reason: string | null;
  created_at: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  period: string;
  base_salary: number;
  allowance: number;
  bonus: number;
  deductions: number;
  insurance: number;
  tax: number;
  net_salary: number;
  status: 'draft' | 'paid';
  paid_at: string | null;
}

// ---------- Module 4: Tai chinh ----------
export interface Account {
  id: string;
  name: string;
  account_number: string | null;
  bank_name: string | null;
  type: 'cash' | 'bank';
  currency: string;
  opening_balance: number;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  code: string;
  account_id: string;
  transaction_type: TransactionType;
  category: string | null;
  amount: number;
  transaction_date: string;
  related_type: 'contract' | 'purchase_order' | 'payroll' | 'invoice' | 'other' | null;
  related_id: string | null;
  description: string | null;
  receipt_url: string | null;
  created_by: string | null;
  created_at: string;
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  code: string;
  customer_id: string | null;
  contract_id: string | null;
  sales_order_id: string | null;
  invoice_date: string;
  due_date: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  created_by: string | null;
  created_at: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  account_id: string | null;
  amount: number;
  payment_date: string;
  method: string | null;
  note: string | null;
  receipt_url: string | null;
}

export interface Budget {
  id: string;
  department_id: string | null;
  category: string;
  period: string;
  amount: number;
}

// ---------- Module 5: Bao gia & SXKH ----------
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface Quotation {
  id: string;
  code: string;
  customer_id: string | null;
  opportunity_id: string | null;
  quotation_date: string;
  valid_until: string | null;
  status: QuotationStatus;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
  subtotal: number;
}

export interface BomItem {
  id: string;
  product_name: string;
  material_id: string | null;
  quantity_required: number;
  unit: string;
}

export type ProductionPlanStatus = 'planning' | 'in_progress' | 'completed' | 'cancelled';

export interface ProductionPlan {
  id: string;
  code: string;
  name: string;
  contract_id: string | null;
  sales_order_id: string | null;
  planned_start: string | null;
  planned_end: string | null;
  status: ProductionPlanStatus;
  created_by: string | null;
  created_at: string;
}

export interface ProductionPlanItem {
  id: string;
  production_plan_id: string;
  product_name: string;
  quantity: number;
  unit: string;
}

export type ProductionTaskStatus = 'pending' | 'in_progress' | 'done';

export interface ProductionTask {
  id: string;
  production_plan_id: string;
  task_name: string;
  assigned_to: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProductionTaskStatus;
  progress_pct: number;
}

