import { Field } from "@airtable/blocks/models";
export type Summary = {
  fieldId: string;
  summary: string;
  displayName?: string;
};
export type SummaryWithField = Summary & { field: Field };
