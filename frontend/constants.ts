import { FieldType } from "@airtable/blocks/models";

export const GlobalConfigKeys = {
  SelectedTableID: "selectedTableId",
  SelectedViewID: "selectedViewId",
  GroupFieldID: "groupFieldId",
  Summaries: "summaries",
};

export const dateTypes = [
  FieldType.DATE,
  FieldType.DATE_TIME,
  FieldType.CREATED_TIME,
  FieldType.LAST_MODIFIED_TIME,
];

export const discreteTypes = [FieldType.SINGLE_LINE_TEXT, FieldType.FORMULA];

export const allowedTypes = [
  ...dateTypes,
  ...discreteTypes,
  FieldType.MULTIPLE_LOOKUP_VALUES,
];
