import React from "react";
import { Box, Text } from "@airtable/blocks/ui";

export default function EmptyTable() {
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
