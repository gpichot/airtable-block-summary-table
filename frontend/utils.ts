import { Field, Record as AirtableRecord } from "@airtable/blocks/models";
import { dateTypes, discreteTypes } from "./constants";
import { SummaryWithField } from "./types";

function groupBy<T>(array: T[], selector: (item: T) => string | number) {
  const groups: Record<string, T[]> = {};
  (array || []).forEach((item) => {
    const key = selector(item);
    if (groups[key]) {
      groups[key].push(item);
    } else {
      groups[key] = [item];
    }
  });
  return groups;
}

const Grouper = {
  date: (fieldValue: string) => {
    const date = new Date(fieldValue);
    return date.getFullYear();
  },
  text: (fieldValue: string) => {
    return fieldValue;
  },
  multipleLookupValues: (fieldValue: { value: string }[]) => {
    return fieldValue[0].value;
  },
};

export type GrouperConfig = {
  field: Field;
};

function getFieldGrouper(groupBy: GrouperConfig) {
  if (dateTypes.includes(groupBy.field.type)) {
    return Grouper.date;
  }

  if (discreteTypes.includes(groupBy.field.type)) {
    return Grouper.text;
  }
  if (groupBy.field.type in Grouper) {
    return Grouper[groupBy.field.type as keyof typeof Grouper];
  }

  throw new Error(`Unsupported field type: ${groupBy.field.type}`);
}

export function groupRecords(
  records: AirtableRecord[],
  groupByConfig: GrouperConfig
): Record<string, any[]> {
  const fieldGrouper = getFieldGrouper(groupByConfig);

  return groupBy(records, (record) =>
    fieldGrouper(record.getCellValue(groupByConfig.field.name) as any)
  );
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

  console.warn(`Aggregator ${name} not found`);

  return null;
}
function normalizeDisplayValue(value: string | number) {
  if (value === "NaN") return "-";
  return value;
}

export function getGroupedData(
  records: AirtableRecord[],
  groupField: Field | null | undefined,
  summariesWithFields: SummaryWithField[]
): {
  columns: string[];
  rows: {
    summary: SummaryWithField;
    values: ({ year: string; value: string | number } | null)[];
  }[];
} {
  if (!groupField) {
    return {
      columns: [],
      rows: [],
    };
  }

  const columns = groupRecords(records, {
    field: groupField,
  });

  return {
    columns: Object.keys(columns),
    rows: summariesWithFields.map((summary) => {
      return {
        summary: summary,
        values: Object.entries(columns).map(([year, records]) => {
          const aggregator = getAggregator(summary.field, summary.summary);
          if (!aggregator) return null;

          const value = aggregator.aggregateToString(records, summary.field);
          return {
            year,
            value: normalizeDisplayValue(value),
          };
        }),
      };
    }),
  };
}
