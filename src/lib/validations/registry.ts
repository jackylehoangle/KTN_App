import {
  customerSchema,
  opportunitySchema,
  contractSchema,
  salesOrderSchema,
  salesOrderItemSchema,
  leadSchema,
  contactSchema,
  interactionSchema,
} from '@/lib/validations/kinh-doanh';
import {
  materialCategorySchema,
  purchaseOrderSchema,
  purchaseOrderItemSchema,
} from '@/lib/validations/vat-tu';
import {
  departmentSchema,
  employeeSchema,
  employeeContractSchema,
  leaveRequestSchema,
  positionSchema,
  attendanceSchema,
  payrollSchema,
} from '@/lib/validations/nhan-su';
import {
  accountSchema,
  transactionSchema,
  invoiceSchema,
  invoicePaymentSchema,
  budgetSchema,
} from '@/lib/validations/tai-chinh';
import {
  quotationSchema,
  productionPlanSchema,
  quotationItemSchema,
  bomItemSchema,
  productionPlanItemSchema,
  productionTaskSchema,
  solarPackageSchema,
  solarPackageItemSchema,
} from '@/lib/validations/bao-gia-sxkh';
import { userRoleLevelSchema, moduleGrantSchema } from '@/lib/validations/permissions';
import { approvalRequestSchema, approvalActionSchema } from '@/lib/validations/de-xuat';
import { projectSchema, taskSchema } from '@/lib/validations/du-an';

// Central registry so EntityFormDialog (a Client Component) can look up a zod
// schema by key instead of receiving the schema object itself as a prop —
// Next.js cannot serialize class instances like ZodType across the
// Server -> Client Component boundary.
export const SCHEMA_REGISTRY = {
  project: projectSchema,
  task: taskSchema,
  customer: customerSchema,
  opportunity: opportunitySchema,
  contract: contractSchema,
  salesOrder: salesOrderSchema,
  salesOrderItem: salesOrderItemSchema,
  lead: leadSchema,
  contact: contactSchema,
  interaction: interactionSchema,
  materialCategory: materialCategorySchema,
  purchaseOrder: purchaseOrderSchema,
  purchaseOrderItem: purchaseOrderItemSchema,
  department: departmentSchema,
  employee: employeeSchema,
  employeeContract: employeeContractSchema,
  leaveRequest: leaveRequestSchema,
  position: positionSchema,
  attendance: attendanceSchema,
  payroll: payrollSchema,
  account: accountSchema,
  transaction: transactionSchema,
  invoice: invoiceSchema,
  invoicePayment: invoicePaymentSchema,
  budget: budgetSchema,
  quotation: quotationSchema,
  productionPlan: productionPlanSchema,
  quotationItem: quotationItemSchema,
  bomItem: bomItemSchema,
  productionPlanItem: productionPlanItemSchema,
  productionTask: productionTaskSchema,
  solarPackage: solarPackageSchema,
  solarPackageItem: solarPackageItemSchema,
  userRoleLevel: userRoleLevelSchema,
  moduleGrant: moduleGrantSchema,
  approvalRequest: approvalRequestSchema,
  approvalAction: approvalActionSchema,
} as const;

export type SchemaKey = keyof typeof SCHEMA_REGISTRY;
