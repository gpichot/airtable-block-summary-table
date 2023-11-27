import { Field } from "@airtable/blocks/models";

export type Summary = {
  id: string | null;
  fieldId: string | null;
  summary: string;
  displayName?: string;
};
export type SummaryWithField = Summary & { field: Field };
