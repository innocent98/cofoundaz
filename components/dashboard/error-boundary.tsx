'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in dashboard widget:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-white border border-red-100 rounded-card shadow-sm h-full w-full min-h-[120px]">
          <p className="text-sm font-medium text-sage-600 mb-3 text-center">
            Couldn&apos;t load this.
          </p>
          <button
            onClick={this.handleRetry}
            className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-input transition-colors shadow-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
