import React from "react";
import {
  FieldPicker,
  TablePickerSynced,
  FieldPickerSynced,
  useGlobalConfig,
  useBase,
  Box,
  FormField,
  Select,
  Label,
  Input,
  Button,
  Heading,
  Icon,
} from "@airtable/blocks/ui";
import { Field, Table, FieldType } from "@airtable/blocks/models";

import { GlobalConfigKeys } from "./constants";
import { Summary } from "./types";

function Divider() {
  return <Box borderBottom="thick" />;
}

const dateTypes = [
  FieldType.DATE,
  FieldType.DATE_TIME,
  FieldType.CREATED_TIME,
  FieldType.LAST_MODIFIED_TIME,
];

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

  const canEdit = globalConfig.checkPermissionsForSet(
    GlobalConfigKeys.Summaries
  ).hasPermission;

  const onChangeAggregator = (summary: Summary, aggregatorKey: string) => {
    const newSummaries = summaries.map((s) => {
      if (s.fieldId !== summary.fieldId) return s;
      return { ...s, summary: aggregatorKey };
    });
    globalConfig.setAsync("summaries", newSummaries);
  };

  const onChangeInput = (summary: Summary, value: string) => {
    const newSummaries = summaries.map((s) => {
      if (s.fieldId !== summary.fieldId) return s;
      return { ...s, displayName: value };
    });
    globalConfig.setAsync("summaries", newSummaries);
  };

  const onRemoveSummary = (summary: Summary) => {
    const newSummaries = summaries.filter((s) => s.fieldId !== summary.fieldId);
    globalConfig.setAsync("summaries", newSummaries);
  };

  const fields = new Map(
    summaries.map((summary) => {
      return [summary.fieldId, table?.getFieldByIdIfExists(summary.fieldId)];
    })
  );

  const allSummaries = canEdit
    ? [...summaries, { fieldId: null, summary: "sum" }]
    : summaries;

  return (
    <Box
      display="flex"
      flexDirection="column"
      padding={3}
      borderBottom="thick"
      alignSelf="stretch"
      style={{
        backgroundColor: "#fafafa",
        borderLeft: "2px solid #eeeeee",
      }}
    >
      <Heading>Summary Table Settings</Heading>
      <FormField label="Table" marginTop={2}>
        <TablePickerSynced globalConfigKey="selectedTableId" />
      </FormField>
      <Divider />
      <FormField label="Group by (Columns)" marginTop={3}>
        <FieldPickerSynced
          table={table}
          globalConfigKey="groupFieldId"
          allowedTypes={dateTypes}
        />
      </FormField>
      <Divider />
      <Box marginTop={3}>
        <Label textColor="default" marginBottom={3}>
          Summaries (Rows)
        </Label>
        {allSummaries.map((summary) => (
          <SummaryEditor
            key={summary.fieldId}
            summary={summary}
            table={table}
            onChange={canEdit ? onChange : undefined}
            onChangeAggregator={canEdit ? onChangeAggregator : undefined}
            onChangeInput={canEdit ? onChangeInput : undefined}
            onRemoveSummary={canEdit ? onRemoveSummary : undefined}
            field={fields.get(summary.fieldId)}
          />
        ))}
      </Box>
    </Box>
  );
}

function SummaryEditor({
  summary,
  field,
  table,
  onChange,
  onChangeAggregator,
  onChangeInput,
  onRemoveSummary,
}: {
  summary: Summary;
  field: Field | null;
  table: Table;
  onChange?: (field: Field) => void;
  onChangeAggregator?: (summary: Summary, aggregatorKey: string) => void;
  onChangeInput?: (summary: Summary, value: string) => void;
  onRemoveSummary?: (summary: Summary) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  return (
    <Box
      key={summary.fieldId}
      borderRadius="large"
      border="default"
      marginBottom={2}
      width={350}
      maxWidth="100vw"
    >
      <Button
        variant="secondary"
        marginBottom={isExpanded ? 2 : 0}
        style={{
          textAlign: "left",
          paddingLeft: 12,
          justifyContent: "flex-start",
          width: "100%",
          ...(isExpanded && {
            backgroundColor: "#efefef",
            borderRadius: "4px 4px 0 0",
            borderBottom: "1px solid #e0e0e0",
          }),
        }}
        onClick={(e) => {
          setIsExpanded(!isExpanded);
          (e.target as HTMLElement).blur();
        }}
      >
        {summary.displayName || field?.name || (
          <span style={{ display: "flex", alignItems: "center" }}>
            <Icon name="plus" /> Add new summary
          </span>
        )}
      </Button>
      <Box
        padding={2}
        display="flex"
        flexDirection="column"
        style={{
          display: isExpanded ? "flex" : "none",
        }}
      >
        <Box display="flex" flexDirection="row" marginBottom={2}>
          <FormField label="Field" marginRight="10px" marginBottom={0}>
            <FieldPicker
              key={summary.fieldId || "new"}
              table={table}
              field={
                summary.fieldId
                  ? table.getFieldByIdIfExists(summary.fieldId)
                  : null
              }
              onChange={onChange}
              disabled={!onChange}
            />
          </FormField>
          {summary.fieldId ? (
            <FormField label="Summary" marginBottom={0}>
              <Select
                value={summary.summary}
                options={table
                  .getFieldByIdIfExists(summary.fieldId)
                  ?.availableAggregators.map((aggregator) => ({
                    value: aggregator.key,
                    label: aggregator.displayName,
                  }))}
                onChange={(value) =>
                  onChangeAggregator(summary, value as string)
                }
                disabled={!onChangeAggregator}
              />
            </FormField>
          ) : (
            <div>&nbsp;</div>
          )}
        </Box>
        {summary.fieldId && (
          <Box
            display="flex"
            flexDirection="row"
            style={{ display: isExpanded ? "flex" : "none" }}
          >
            <FormField
              label="Display Name"
              flex={1}
              marginRight="10px"
              marginBottom={0}
            >
              <Input
                value={summary.displayName || ""}
                placeholder={field?.name}
                onChange={(e) => onChangeInput(summary, e.target.value)}
                disabled={!onChangeInput}
              />
            </FormField>
            <Button
              icon="trash"
              onClick={() => onRemoveSummary(summary)}
              alignSelf="flex-end"
              variant="danger"
              disabled={!onRemoveSummary}
            >
              Remove
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
