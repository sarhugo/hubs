import { useEffect, useCallback, useState, useRef } from "react";

const supported =
  "relList" in HTMLLinkElement.prototype &&
  document.createElement("link").relList.supports("manifest") &&
  "onbeforeinstallprompt" in window;

export function useInstallPWA() {
  const installEventRef = useRef();

  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = event => {
      event.preventDefault();
      installEventRef.current = event;
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const installPWA = useCallback(async () => {
    installEventRef.current.prompt();

    const choiceResult = await installEventRef.current.userChoice;

    if (choiceResult.outcome === "accepted") {
      setInstalled(true);
    }
  }, []);

  return { supported, installed, installPWA };
}
