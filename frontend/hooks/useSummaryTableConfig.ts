import { useBase, useGlobalConfig } from "@airtable/blocks/ui";

import { GlobalConfigKeys } from "../constants";
import { Summary, SummaryWithField } from "../types";

/**
 * Responsible for retrieving the summary table config from the settings.
 */

export function useSummaryTableConfig() {
  const base = useBase();
  const globalConfig = useGlobalConfig();

  const tableId = globalConfig.get(GlobalConfigKeys.SelectedTableID) as string;
  const table = base.getTableByIdIfExists(tableId);
  const viewId = globalConfig.get(GlobalConfigKeys.SelectedViewID) as string;
  const source = table?.getViewByIdIfExists(viewId);

  const groupFieldId = globalConfig.get(
    GlobalConfigKeys.GroupFieldID,
  ) as string;
  const groupField = table?.getFieldByIdIfExists(groupFieldId);

  const summaries = (globalConfig.get(GlobalConfigKeys.Summaries) ||
    []) as Summary[];

  const validSummaries = summaries.filter((x) =>
    Boolean(x.fieldId),
  ) as (Summary & {
    fieldId: string;
  })[];
  const summariesFieldIds = validSummaries.map((summary) => summary.fieldId);
  const summariesWithFields = validSummaries
    .map((summary) => {
      const field = table?.getFieldByIdIfExists(summary.fieldId);
      if (!field) return null;
      return {
        ...summary,
        field,
      };
    })
    .filter(Boolean) as SummaryWithField[];

  const isTableTransposed = useGlobalConfig().get("transpose") as boolean;

  return {
    fieldsIds: [groupFieldId, ...summariesFieldIds].filter(Boolean),
    source,
    groupField,
    summariesWithFields,
    isTableTransposed,
  };
}
