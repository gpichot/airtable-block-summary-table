import {
  initializeBlock,
  useBase,
  useRecords,
  useGlobalConfig,
  useSettingsButton,
} from "@airtable/blocks/ui";
import { Field } from "@airtable/blocks/models";
import React from "react";
import Settings from "./Settings";
import { Summary, SummaryWithField } from "./types";
import { GlobalConfigKeys } from "./constants";

function HelloWorldTypescriptApp() {
  const base = useBase();
  const globalConfig = useGlobalConfig();

  const [isShowingSettings, setIsShowingSettings] = React.useState(false);
  useSettingsButton(() => {
    setIsShowingSettings(!isShowingSettings);
  });

  const tableId = globalConfig.get(GlobalConfigKeys.SelectedTableID) as string;
  const table = base.getTableByIdIfExists(tableId);

  const groupFieldId = globalConfig.get(
    GlobalConfigKeys.GroupFieldID
  ) as string;
  const groupField = table?.getFieldByIdIfExists(groupFieldId);

  const summaries = (globalConfig.get(GlobalConfigKeys.Summaries) ||
    []) as Summary[];
  const summariesFieldIds = summaries.map((summary) => summary.fieldId);
  const summariesWithFields = summaries.map((summary) => {
    return { ...summary, field: table?.getFieldByIdIfExists(summary.fieldId) };
  });

  const records = useRecords(table, {
    fields: [groupFieldId, ...summariesFieldIds].filter(Boolean),
  });

  const data = getGroupedData(records, groupField, summariesWithFields);

  return (
    <>
      <SummaryTable summaries={data} />
      {isShowingSettings && <Settings />}
    </>
  );
}

function groupBy<T>(array: T[], selector: (item: T) => string | number) {
  const groups: Record<string, T[]> = {};
  array.forEach((item) => {
    const key = selector(item);
    if (groups[key]) {
      groups[key].push(item);
    } else {
      groups[key] = [item];
    }
  });
  return groups;
}

function getAggregator(field: Field, name: string) {
  const aggregator = field.availableAggregators.find((aggregator) => {
    return aggregator.key === name;
  });
  if (aggregator) return aggregator;

  const countAggregator = field.availableAggregators.find((aggregator) => {
    return aggregator.key === "count";
  });

  if (countAggregator) return countAggregator;

  throw new Error(`Aggregator ${name} not found`);
}

function getGroupedData(
  records: any[],
  groupField: Field | null | undefined,
  summariesWithFields: SummaryWithField[]
) {
  if (!groupField) {
    return {
      columns: [] as string[],
      rows: [] as {
        summary: string;
        field: Field;
        values: { year: string; value: string }[];
      }[],
    };
  }

  const years = groupBy(
    records,
    (record) => record.getCellValue(groupField.name).split("-")[0]
  );

  return {
    columns: Object.keys(years),
    rows: summariesWithFields.map((summary) => {
      return {
        summary: summary.summary,
        field: summary.field,
        values: Object.entries(years).map(([year, records]) => {
          const aggregator = getAggregator(summary.field, summary.summary);
          if (!aggregator) return null;

          const value = aggregator.aggregateToString(records, summary.field);
          return {
            year,
            value,
          };
        }),
      };
    }),
  };
}

function SummaryTable({
  summaries,
}: {
  summaries: ReturnType<typeof getGroupedData>;
}) {
  console.log(summaries);
  if (!summaries?.columns?.length) return <p>Use Settings to start</p>;
  if (!summaries?.rows?.length) return <p>Use Settings to start</p>;
  return (
    <table
      style={{
        tableLayout: "fixed",
        width: "100%",
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr>
          <th></th>
          {summaries.columns.map((year) => (
            <th key={year} style={{ textAlign: "right", padding: "10px" }}>
              {year}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {summaries.rows.map((row, index) => (
          <tr
            key={row.field.id}
            style={{
              backgroundColor: index % 2 === 0 ? "white" : "#f5f5f5",
            }}
          >
            <td style={{ padding: "10px" }}>{row.field.name}</td>
            {row.values.map((value) => (
              <td
                key={value.year}
                style={{ textAlign: "right", padding: "10px" }}
              >
                {value.value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

initializeBlock(() => <HelloWorldTypescriptApp />);
