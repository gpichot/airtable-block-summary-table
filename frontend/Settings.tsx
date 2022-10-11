import React from "react";
import {
  FieldPicker,
  Text,
  TablePickerSynced,
  FieldPickerSynced,
  useGlobalConfig,
  useBase,
  Box,
  FormField,
  Select,
} from "@airtable/blocks/ui";
import { Field } from "@airtable/blocks/models";

import { GlobalConfigKeys } from "./constants";
import { Summary, SummaryWithField } from "./types";

export default function Settings() {
  const globalConfig = useGlobalConfig();
  const base = useBase();

  const tableId = globalConfig.get(GlobalConfigKeys.SelectedTableID) as string;
  const table = base.getTableByIdIfExists(tableId);

  const summaries = (globalConfig.get(GlobalConfigKeys.Summaries) ||
    []) as Summary[];

  const onChange = (field: Field) => {
    globalConfig.setAsync("summaries", [
      ...summaries,
      { fieldId: field.id, summary: "sum" },
    ]);
  };

  const onChangeAggregator = (
    summary: SummaryWithField,
    aggregatorKey: string
  ) => {
    const newSummaries = summaries.map((s) => {
      if (s.fieldId !== summary.fieldId) return s;
      return { ...s, summary: aggregatorKey };
    });
    globalConfig.setAsync("summaries", newSummaries);
  };

  return (
    <Box display="flex" flexDirection="column" padding={3} borderBottom="thick">
      <FormField label="Table">
        <TablePickerSynced globalConfigKey="selectedTableId" />
      </FormField>
      <FormField label="Group by (Columns)">
        <FieldPickerSynced table={table} globalConfigKey="groupFieldId" />
      </FormField>

      <FormField label="Summaries (Rows)">
        {[...summaries, { fieldId: null, summary: "sum" }].map((summary) => (
          <Box display="flex" flexDirection="row" key={summary.fieldId}>
            <FormField label="Field" marginRight="10px">
              <FieldPicker
                key={summary.fieldId || "new"}
                table={table}
                field={
                  summary.fieldId
                    ? table.getFieldByIdIfExists(summary.fieldId)
                    : null
                }
                onChange={onChange}
              />
            </FormField>
            {summary.fieldId ? (
              <FormField label="Summary">
                <Select
                  value={summary.summary}
                  options={table
                    .getFieldByIdIfExists(summary.fieldId)
                    ?.availableAggregators.map((aggregator) => ({
                      value: aggregator.key,
                      label: aggregator.displayName,
                    }))}
                  onChange={(value) => onChangeAggregator(summary, value)}
                />
              </FormField>
            ) : (
              <div>&nbsp;</div>
            )}
          </Box>
        ))}
      </FormField>
    </Box>
  );
}
