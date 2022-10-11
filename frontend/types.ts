import { Field } from "@airtable/blocks/models";
export type Summary = { fieldId: string; summary: string };
export type SummaryWithField = Summary & { field: Field };
