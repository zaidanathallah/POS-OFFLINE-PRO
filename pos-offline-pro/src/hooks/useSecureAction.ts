import { useState, useCallback } from "react";
import { getSetting } from "@/db/settingsRepository";

export function useSecureAction() {
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [hintText, setHintText] = useState<string | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);

  const executeSecureAction = useCallback(
    async (
      actionCallback: () => void | Promise<void>,
      title: string = "Konfirmasi Aksi Terproteksi",
      hint?: string
    ) => {
      try {
        const isPinActive = await getSetting("is_pin_active", "0");
        if (isPinActive === "1") {
          setActionTitle(title);
          setHintText(hint);
          setPendingAction(() => actionCallback);
          setPinModalVisible(true);
        } else {
          // PIN protection is disabled, execute action directly
          await actionCallback();
        }
      } catch (err) {
        console.error("Error executing secure action:", err);
        await actionCallback();
      }
    },
    []
  );

  const handlePinSuccess = useCallback(async () => {
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
    setPinModalVisible(false);
    setHintText(undefined);
  }, [pendingAction]);

  const handlePinClose = useCallback(() => {
    setPendingAction(null);
    setPinModalVisible(false);
    setHintText(undefined);
  }, []);

  return {
    pinModalVisible,
    actionTitle,
    hintText,
    executeSecureAction,
    handlePinSuccess,
    handlePinClose,
  };
}
