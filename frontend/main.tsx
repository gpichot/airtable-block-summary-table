import React from "react";
import {
  useBase,
  useRecords,
  useGlobalConfig,
  useSettingsButton,
  useViewport,
  Box,
  Text,
} from "@airtable/blocks/ui";
import { Table } from "@airtable/blocks/models";
import Settings from "./Settings";
import { Summary, SummaryWithField } from "./types";
import { GlobalConfigKeys } from "./constants";
import { getGroupedData } from "./utils";

type Viewport = ReturnType<typeof useViewport>;

export default function SummaryTableApp() {
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

  const validSummaries = summaries.filter((x) =>
    Boolean(x.fieldId)
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

  const records = useRecords(table as unknown as Table, {
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

function transposeTable<T>(table: T[][]): T[][] {
  return table[0].map((_, colIndex) => {
    return table.map((row) => row[colIndex]);
  });
}

function SummaryTable({
  summaries,
}: {
  summaries: ReturnType<typeof getGroupedData>;
}) {
  const isTableTransposed = useGlobalConfig().get("transpose") as boolean;

  if (!summaries?.columns?.length) return <EmptyTable />;
  if (!summaries?.rows?.length) return <EmptyTable />;

  const table = [
    [
      { value: undefined, id: "top" },
      ...summaries.columns.map((x) => ({ value: x, id: x })),
    ],
    ...summaries.rows.map((row) => {
      return [
        {
          value: row.summary.displayName || row.summary.field.name,
          id: row.summary.field.id,
        },
        ...row.values.map((x) => ({
          value: x?.value,
          id: `${x?.year}-${row.summary.field.id}`,
        })),
      ];
    }),
  ];

  const finalTable = isTableTransposed ? transposeTable(table) : table;

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
          {finalTable[0].map(({ value, id }) => (
            <CellHeading key={id} style={{ textAlign: "right" }}>
              {value}
            </CellHeading>
          ))}
        </Row>
      </thead>
      <tbody>
        {finalTable.slice(1).map((row, index) => {
          const cells = row.slice(1);
          return (
            <Row
              key={index}
              style={{
                backgroundColor: index % 2 === 0 ? "white" : "#f5f5f5",
              }}
            >
              <CellHeading style={{ padding: "10px" }}>
                {row[0].value}
              </CellHeading>
              {cells.map(({ value, id }) =>
                value ? (
                  <Cell
                    key={id}
                    style={{ textAlign: "right", padding: "10px" }}
                  >
                    {value}
                  </Cell>
                ) : null
              )}
            </Row>
          );
        })}
      </tbody>
    </table>
  );
}
