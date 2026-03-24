import React from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import Button from './ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-sm border border-rose-100">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Something went wrong</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            The application encountered an unexpected error. We've been notified and are working on a fix.
          </p>
          <div className="flex gap-3 mt-8">
            <Button onClick={() => window.location.reload()} className="h-11 px-6 rounded-xl">
              <RefreshCcw size={16} className="mr-2" /> Reload Page
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="h-11 px-6 rounded-xl">
               <Home size={16} className="mr-2" /> Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
