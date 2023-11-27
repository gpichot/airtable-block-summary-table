import React from "react";
import {
  DragDropContext,
  Draggable,
  DraggableProvidedDragHandleProps,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { Field, Table } from "@airtable/blocks/models";
import {
  Box,
  Button,
  FieldPicker,
  FieldPickerSynced,
  FormField,
  Heading,
  Icon,
  Input,
  Label,
  Select,
  SwitchSynced,
  TablePickerSynced,
  useBase,
  useGlobalConfig,
  ViewPickerSynced,
} from "@airtable/blocks/ui";
import { v4 as uuidv4 } from "uuid";

import { allowedTypes, GlobalConfigKeys } from "./constants";
import { Summary } from "./types";

function Divider() {
  return <Box borderBottom="thick" />;
}

function getNewSummaries(
  summaries: Summary[],
  updatedSummary: Summary,
  field: Field | null,
) {
  const isNew = !updatedSummary.fieldId;

  if (isNew) {
    if (!field) {
      console.error("No field found for new summary");
      return summaries;
    }
    const newSummary = { id: uuidv4(), fieldId: field.id, summary: "sum" };
    return [...summaries, newSummary];
  }

  if (!field) {
    return summaries.filter((s) => s.id !== updatedSummary.id);
  }

  return summaries.map((s) => {
    if (s.id !== updatedSummary.id) return s;
    return {
      id: s.id,
      fieldId: field.id,
      summary: "sum",
    };
  });
}

export default function Settings() {
  const globalConfig = useGlobalConfig();
  const base = useBase();

  const tableId = globalConfig.get(GlobalConfigKeys.SelectedTableID) as string;
  const table = base.getTableByIdIfExists(tableId);

  const summaries = (globalConfig.get(GlobalConfigKeys.Summaries) ||
    []) as Summary[];

  const onChange = (summary: Summary, field: Field | null) => {
    const newSummaries = getNewSummaries(summaries, summary, field);
    globalConfig.setAsync(GlobalConfigKeys.Summaries, newSummaries);
  };

  const canEdit = globalConfig.checkPermissionsForSet(
    GlobalConfigKeys.Summaries,
  ).hasPermission;

  const onChangeAggregator = (summary: Summary, aggregatorKey: string) => {
    const newSummaries = summaries.map((s) => {
      if (s.id !== summary.id) return s;
      return { ...s, summary: aggregatorKey };
    });
    globalConfig.setAsync("summaries", newSummaries);
  };

  const onChangeInput = (summary: Summary, value: string) => {
    const newSummaries = summaries.map((s) => {
      if (s.id !== summary.id) return s;
      return { ...s, displayName: value };
    });
    globalConfig.setAsync("summaries", newSummaries);
  };

  const onRemoveSummary = (summary: Summary) => {
    const newSummaries = summaries.filter((s) => s.id !== summary.id);
    globalConfig.setAsync("summaries", newSummaries);
  };

  const handleDrop = (result: DropResult) => {
    if (!result.destination) return;

    const newSummaries = Array.from(summaries);
    const [removed] = newSummaries.splice(result.source.index, 1);
    newSummaries.splice(result.destination.index, 0, removed);

    globalConfig.setAsync("summaries", newSummaries);
  };

  const fields = new Map(
    summaries.map((summary) => {
      return [
        summary.fieldId,
        table?.getFieldByIdIfExists(summary.fieldId || ""),
      ];
    }),
  );

  const allSummaries = canEdit
    ? [...summaries, { id: null, fieldId: null, summary: "sum" }]
    : summaries;

  return (
    <Box
      display="flex"
      flexDirection="column"
      padding={3}
      borderBottom="thick"
      alignSelf="stretch"
      flex="0 0 350px"
      maxWidth="100vw"
      style={{
        backgroundColor: "#fafafa",
        borderLeft: "2px solid #eeeeee",
        overflowY: "scroll",
      }}
    >
      <form>
        <Heading>Summary Table Settings</Heading>
        <FormField label="Table" marginTop={2}>
          <TablePickerSynced
            globalConfigKey="selectedTableId"
            onChange={(table) => {
              if (table?.id === tableId) return;

              // Reset the summaries when the table changes
              globalConfig.setAsync(GlobalConfigKeys.GroupFieldID, null);
              globalConfig.setAsync(GlobalConfigKeys.Summaries, []);
            }}
          />
        </FormField>
        <FormField label="View">
          <ViewPickerSynced
            globalConfigKey={GlobalConfigKeys.SelectedViewID}
            table={table}
          />
        </FormField>
        <Divider />
        <div data-testid="group-field">
          <FormField
            label="Group by (Columns)"
            marginTop={3}
            htmlFor="groupByField"
          >
            <FieldPickerSynced
              table={table}
              globalConfigKey="groupFieldId"
              allowedTypes={allowedTypes}
              disabled={!table}
              id="groupByField"
            />
          </FormField>
        </div>
        <Divider />
        <Box marginTop={3}>
          <Label textColor="default" marginBottom={3}>
            Summaries (Rows)
          </Label>
          <DragDropContext onDragEnd={handleDrop}>
            <Droppable droppableId="summaries">
              {(provided) => (
                <div
                  className="list-container"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {allSummaries.map((summary, index) => (
                    <Draggable
                      key={summary.id}
                      draggableId={summary.id || "$$new-summary"}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <SummaryEditor
                          ref={provided.innerRef}
                          data-testid={`summary-editor-${index}`}
                          summary={summary}
                          table={table}
                          field={fields.get(summary.fieldId) || null}
                          className="item-container"
                          dragHandleProps={provided.dragHandleProps}
                          onChange={canEdit ? onChange : undefined}
                          onChangeAggregator={
                            canEdit ? onChangeAggregator : undefined
                          }
                          onChangeInput={canEdit ? onChangeInput : undefined}
                          onRemoveSummary={
                            canEdit ? onRemoveSummary : undefined
                          }
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.8 : 1,
                          }}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
        <Divider />

        <SwitchSynced globalConfigKey="transpose" label="Transpose Table" />
      </form>
    </Box>
  );
}

function getSummaryDisplayName(summary: Summary, field: Field | null) {
  if (summary.displayName) return summary.displayName;

  if (field) {
    const aggregator = field.availableAggregators.find(
      (x) => x.key === summary.summary,
    );
    if (!aggregator) return field.name;
    return `${field.name} (${aggregator.displayName})`;
  }
  return (
    <span style={{ display: "flex", alignItems: "center" }}>
      <Icon name="plus" /> Add new summary
    </span>
  );
}

type SummmaryEditorProps = {
  summary: Summary;
  field: Field | null;
  table: Table | null;
  onChange?: (summary: Summary, field: Field | null) => void;
  onChangeAggregator?: (summary: Summary, aggregatorKey: string) => void;
  onChangeInput?: (summary: Summary, value: string) => void;
  onRemoveSummary?: (summary: Summary) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps;
} & Omit<React.ComponentPropsWithoutRef<"div">, "onChange">;

function SummaryEditorWithoutRef(
  {
    summary,
    field,
    table,
    onChange,
    onChangeAggregator,
    onChangeInput,
    onRemoveSummary,
    dragHandleProps,
    ...divProps
  }: SummmaryEditorProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const summaryOptions =
    table
      ?.getFieldByIdIfExists(summary.fieldId || "")
      ?.availableAggregators.map((aggregator) => ({
        value: aggregator.key,
        label: aggregator.displayName,
      })) || [];
  return (
    <div {...divProps} ref={ref}>
      <Box
        key={summary.fieldId}
        borderRadius="large"
        border="default"
        marginBottom={2}
        backgroundColor="#fafafa"
      >
        <button
          style={{
            textAlign: "left",
            paddingLeft: 12,
            justifyContent: "flex-start",
            width: "100%",
            color: onChange ? "#000" : "#999",
            marginBottom: isExpanded ? 2 : 0,
            outline: "none",
            border: "none",
            height: 32,

            cursor: "pointer",
            ...(isExpanded
              ? {
                  backgroundColor: "#efefef",
                  borderRadius: "4px 4px 0 0",
                  borderBottom: "1px solid #e0e0e0",
                }
              : { borderBottom: "none" }),
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
            (e?.target as HTMLElement).blur();
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {getSummaryDisplayName(summary, field)}
            {onChange && (
              <button
                {...dragHandleProps}
                style={{
                  marginLeft: "auto",
                  border: "none",
                  backgroundColor: "transparent",
                }}
              >
                <Icon name="dragHandle" />
              </button>
            )}
          </span>
        </button>
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
                    ? table?.getFieldByIdIfExists(summary.fieldId)
                    : null
                }
                disabled={!onChange}
                onChange={(field) => onChange?.(summary, field)}
              />
            </FormField>
            {summary.fieldId ? (
              <FormField label="Summary" marginBottom={0}>
                <Select
                  value={summary.summary}
                  options={summaryOptions}
                  disabled={!onChangeAggregator}
                  onChange={(value) =>
                    onChangeAggregator?.(summary, value as string)
                  }
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
                  disabled={!onChangeInput}
                  onChange={(e) => onChangeInput?.(summary, e.target.value)}
                />
              </FormField>
              <Button
                icon="trash"
                alignSelf="flex-end"
                variant="danger"
                disabled={!onRemoveSummary}
                onClick={() => onRemoveSummary?.(summary)}
              >
                Remove
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </div>
  );
}

const SummaryEditor = React.forwardRef(SummaryEditorWithoutRef);
