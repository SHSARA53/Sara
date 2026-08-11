import { Component, type ErrorInfo, type ReactNode } from "react";
import { Mascot } from "../mascot/Mascot";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * A render crash anywhere in the tree must never leave a toddler staring at
 * a blank white screen or a raw stack trace. This is the last line of
 * defense: catch it, show a warm "let's try again" screen instead.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-cream px-6 text-center">
        <Mascot mood="sleepy" size={140} />
        <h1 className="text-2xl font-extrabold">אופס, קרתה תקלה קטנה</h1>
        <p className="text-choco/70">לא נורא! בואו ננסה שוב מההתחלה.</p>
        <button
          type="button"
          onClick={() => window.location.assign("/")}
          className="no-select rounded-[2rem] bg-berry px-8 py-4 text-xl font-bold text-white shadow-lg"
        >
          התחלה מחדש
        </button>
      </div>
    );
  }
}
