import {
  initializeBlock,
  useBase,
  useRecords,
  useGlobalConfig,
  useSettingsButton,
  useViewport,
  Box,
  Text,
} from "@airtable/blocks/ui";
import { Field } from "@airtable/blocks/models";
import React from "react";
import Settings from "./Settings";
import { Summary, SummaryWithField } from "./types";
import { GlobalConfigKeys } from "./constants";

type Viewport = ReturnType<typeof useViewport>;

function SummaryTableApp() {
  const base = useBase();
  const globalConfig = useGlobalConfig();
  const viewport = useViewport();

  const [isShowingSettings, setIsShowingSettings] = React.useState(
    viewport.isFullscreen
  );
  React.useEffect(() => {
    const onViewportChange = (viewport: Viewport) => {
      setIsShowingSettings(viewport.isFullscreen);
    };
    viewport.watch("isFullscreen", onViewportChange);
    return () => {
      viewport.unwatch("isFullscreen", onViewportChange);
    };
  }, [viewport]);

  useSettingsButton(() => {
    const newIsShowingSettings = !isShowingSettings;
    setIsShowingSettings(newIsShowingSettings);

    if (newIsShowingSettings) {
      viewport.enterFullscreenIfPossible();
    }
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

  const isEmpty = data.columns.length === 0 || data.rows.length === 0;
  React.useEffect(() => {
    if (!isEmpty) return;
    setIsShowingSettings(true);
  }, [isEmpty]);

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="flex-start"
      height="100vh"
    >
      <SummaryTable summaries={data} />
      {isShowingSettings && <Settings />}
    </Box>
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
): {
  columns: string[];
  rows: {
    summary: SummaryWithField;
    values: { year: string; value: string }[];
  }[];
} {
  if (!groupField) {
    return {
      columns: [],
      rows: [],
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
        summary: summary,
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

function Row({
  heading,
  ...props
}: React.ComponentPropsWithoutRef<"tr"> & {
  heading?: boolean;
}) {
  return (
    <tr
      {...props}
      style={{
        borderBottom: heading ? "2px solid rgba(0,0,0,0.1)" : "none",
      }}
    />
  );
}

function Cell({ style, ...props }: React.ComponentPropsWithoutRef<"td">) {
  return (
    <td {...props} style={{ border: "1px solid rgba(0,0,0,0.05)", ...style }} />
  );
}

function CellHeading({
  style,
  ...props
}: React.ComponentPropsWithoutRef<typeof Cell>) {
  return (
    <Cell
      {...props}
      style={{
        ...style,
        backgroundColor: "#FAFAFA",
        padding: "10px",
        fontWeight: "bold",
      }}
    />
  );
}

function EmptyTable() {
  return (
    <Box
      width="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="100%"
    >
      <Text fontSize={8}>Use Settings to start</Text>
    </Box>
  );
}

function SummaryTable({
  summaries,
}: {
  summaries: ReturnType<typeof getGroupedData>;
}) {
  if (!summaries?.columns?.length) return <EmptyTable />;
  if (!summaries?.rows?.length) return <EmptyTable />;
  return (
    <table
      style={{
        tableLayout: "fixed",
        width: "100%",
        borderCollapse: "collapse",
        margin: "1rem",
      }}
    >
      <thead>
        <Row heading>
          <CellHeading></CellHeading>
          {summaries.columns.map((year) => (
            <CellHeading key={year} style={{ textAlign: "right" }}>
              {year}
            </CellHeading>
          ))}
        </Row>
      </thead>
      <tbody>
        {summaries.rows.map((row, index) => (
          <Row
            key={row.summary.field.id}
            style={{
              backgroundColor: index % 2 === 0 ? "white" : "#f5f5f5",
            }}
          >
            <CellHeading style={{ padding: "10px" }}>
              {row.summary.displayName || row.summary.field.name}
            </CellHeading>
            {row.values.map((value) => (
              <Cell
                key={value.year}
                style={{ textAlign: "right", padding: "10px" }}
              >
                {value.value}
              </Cell>
            ))}
          </Row>
        ))}
      </tbody>
    </table>
  );
}

initializeBlock(() => <SummaryTableApp />);
