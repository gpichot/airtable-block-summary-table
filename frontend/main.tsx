import React from "react";
import { View } from "@airtable/blocks/models";
import { Box, useRecords } from "@airtable/blocks/ui";

import EmptyTable from "./components/Canvas/EmptyTable";
import SummaryTable from "./components/Canvas/SummaryTable";
import { isTableEmpty } from "./components/Canvas/utilities";
import useAdaptiveSettingsButton from "./hooks/useAdaptiveSettingsButton";
import { useSummaryTableConfig } from "./hooks/useSummaryTableConfig";
import Settings from "./Settings";
import { getGroupedData } from "./utils";

export default function SummaryTableApp() {
  const [isShowingSettings, setIsShowingSettings] = useAdaptiveSettingsButton();

  const config = useSummaryTableConfig();

  const records = useRecords(config.source as unknown as View, {
    fields: config.fieldsIds,
  });

  const data = getGroupedData(
    records,
    config.groupField,
    config.summariesWithFields,
  );

  const isEmpty = data.columns.length === 0 || data.rows.length === 0;

  // If data becomes empty, show settings
  React.useEffect(() => {
    if (!isEmpty) return;
    setIsShowingSettings(true);
  }, [isEmpty, setIsShowingSettings]);

  const tableElement = isTableEmpty(data) ? (
    <EmptyTable />
  ) : (
    <SummaryTable summaries={data} transpose={config.isTableTransposed} />
  );

  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="flex-start"
      height="100vh"
    >
      <Box display="flex" flexDirection="column" flex="1" padding="1rem">
        {tableElement}
      </Box>
      {isShowingSettings && <Settings />}
    </Box>
  );
}
