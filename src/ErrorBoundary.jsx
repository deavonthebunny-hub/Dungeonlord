import React from "react";
import { hasBackupSave, readCurrentSave } from "./persistence/browserStorage";
import { BUILD_VERSION } from "./persistence/saveSchema";
import { copyText } from "./playtestSupport";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.errorInfo = info;
  }

  diagnostics() {
    let currentSave = null;
    let backupAvailable = false;
    try {
      currentSave = readCurrentSave();
      backupAvailable = hasBackupSave();
    } catch {
      currentSave = "Browser storage could not be read.";
    }
    return JSON.stringify(
      {
        game: "Dungeonlord",
        version: BUILD_VERSION,
        generatedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        message: this.state.error?.message || "Unknown application error",
        stack: this.state.error?.stack || null,
        componentStack: this.errorInfo?.componentStack || null,
        currentSave,
        backupAvailable,
      },
      null,
      2
    );
  }

  async copyDiagnostics() {
    try {
      await copyText(this.diagnostics());
      this.setState({ copied: true });
    } catch {
      this.setState({ copied: false });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="crashScreen">
        <section className="crashCard">
          <div className="crashEyebrow">Dungeonlord {BUILD_VERSION}</div>
          <h1>The dungeon fell silent.</h1>
          <p>
            An unexpected error stopped the interface. Your current save and automatic backup have not been deleted.
          </p>
          <pre>{this.state.error.message}</pre>
          <div className="crashActions">
            <button type="button" onClick={() => window.location.reload()}>
              Reload Game
            </button>
            <button type="button" onClick={() => this.copyDiagnostics()}>
              {this.state.copied ? "Diagnostics Copied" : "Copy Diagnostics"}
            </button>
          </div>
        </section>
      </main>
    );
  }
}
