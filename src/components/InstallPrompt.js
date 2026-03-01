import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Download, X, Share } from "lucide-react";

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem("focusradio-install-seen"),
  );
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari) setTimeout(() => setShowIOS(true), 5000);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setInstalled(true);
    localStorage.setItem("focusradio-install-seen", "1");
    setInstallEvent(null);
    setDismissed(true);
  };

  const show = !dismissed && !installed && (installEvent || showIOS);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 5 }}
          className="fixed bottom-6 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div
            className="rounded-2xl p-4 border border-cyan-400/20"
            style={{
              background: "rgba(8,8,14,0.97)",
              backdropFilter: "blur(20px)",
              boxShadow:
                "0 0 40px rgba(103,232,249,0.1), 0 8px 40px rgba(0,0,0,0.8)",
            }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(103,232,249,0.1)",
                  border: "1px solid rgba(103,232,249,0.2)",
                }}
              >
                <Radio size={20} className="text-cyan-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm font-medium">
                  Install focus.radio
                </p>

                {showIOS && !installEvent ? (
                  <p className="text-white/40 text-xs mt-1 leading-relaxed flex items-center gap-1 flex-wrap">
                    Tap{" "}
                    <Share size={11} className="text-cyan-400 inline mx-0.5" />
                    then{" "}
                    <span className="text-cyan-400">Add to Home Screen</span>
                  </p>
                ) : (
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    Install as an app for OS media controls, offline access and
                    a standalone window.
                  </p>
                )}

                {installEvent && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleInstall}
                      className="flex-1 py-2 rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                      style={{
                        color: "#67e8f9",
                        border: "1px solid rgba(103,232,249,0.3)",
                        background: "rgba(103,232,249,0.1)",
                      }}
                    >
                      <Download size={12} /> Install app
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem("focusradio-install-seen", "1");
                        setDismissed(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-mono text-white/25 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      Not now
                    </button>
                  </div>
                )}
                {showIOS && !installEvent && (
                  <button
                    onClick={() => {
                      localStorage.setItem("focusradio-install-seen", "1");
                      setDismissed(true);
                    }}
                    className="mt-2 text-xs font-mono text-white/20 hover:text-white/40 transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  localStorage.setItem("focusradio-install-seen", "1");
                  setDismissed(true);
                }}
                className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
