import { Record, View } from "@airtable/blocks/models";

declare module "@airtable/blocks/ui" {
  /**
   * Override the default types to add support for null records value
   * (supported in code but not advertised in types)
   * @see https://github.com/Airtable/blocks/blob/master/packages/sdk/src/ui/use_records.ts#L201-L204
   */
  export function useRecords(
    tableOrViewOrQueryResult: View | null,
    opts?: { fields: string[] },
  ): Array<Record> | null;
}
