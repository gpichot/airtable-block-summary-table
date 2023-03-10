import React from "react";

import { GroupedData } from "../../utils";
import { convertGroupedDataToTable } from "./utilities";

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
        textOverflow: "ellipsis",
        overflow: "hidden",
      }}
      title={props.children as string}
    />
  );
}
export default function SummaryTable({
  summaries,
  transpose = false,
}: {
  summaries: GroupedData;
  transpose?: boolean;
}) {
  const table = convertGroupedDataToTable(summaries, { transpose });

  return (
    <table
      style={{
        tableLayout: "fixed",
        width: "100%",
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <Row heading>
          {table[0].map(({ value, id }) => (
            <CellHeading key={id} style={{ textAlign: "right" }}>
              {value}
            </CellHeading>
          ))}
        </Row>
      </thead>
      <tbody>
        {table.slice(1).map((row, index) => {
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
