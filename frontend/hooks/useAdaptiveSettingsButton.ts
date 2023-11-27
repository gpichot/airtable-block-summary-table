import React from "react";
import { useSettingsButton, useViewport } from "@airtable/blocks/ui";

type Viewport = ReturnType<typeof useViewport>;

/**
 * Responsible for showing/hiding settings pane based on viewport.
 */
export default function useAdaptiveSettingsButton() {
  const viewport = useViewport();

  const [isShowingSettings, setIsShowingSettings] = React.useState(
    viewport.isFullscreen,
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

  return [isShowingSettings, setIsShowingSettings] as const;
}
