import { GroupedData } from "../../utils";

export function isTableEmpty(table: GroupedData): boolean {
  return !table.columns.length || !table.rows.length;
}

export function transposeTable<T>(table: T[][]): T[][] {
  return table[0].map((_, colIndex) => {
    return table.map((row) => row[colIndex]);
  });
}

export function convertGroupedDataToTable(
  groupedData: GroupedData,
  { transpose = false }: { transpose?: boolean } = {}
): {
  value: string | number | undefined;
  id: string;
}[][] {
  const table = [
    [
      { value: undefined, id: "top" },
      ...groupedData.columns.map((x) => ({ value: x, id: x })),
    ],
    ...groupedData.rows.map((row) => {
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

  return transpose ? transposeTable(table) : table;
}
