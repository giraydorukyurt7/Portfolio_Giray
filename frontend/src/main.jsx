import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";


class ErrorBoundary extends React.Component {
constructor(props) {
super(props);
this.state = { hasError: false, error: null };
}
static getDerivedStateFromError(error) {
return { hasError: true, error };
}
componentDidCatch(error, info) {
console.error("App crashed:", error, info);
}
render() {
if (this.state.hasError) {
return (
<div className="mx-auto max-w-3xl p-6 text-sm">
<div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
<p className="font-semibold mb-1">Oops, something went wrong.</p>
<pre className="whitespace-pre-wrap break-words">{String(this.state.error)}</pre>
</div>
</div>
);
}
return this.props.children;
}
}


ReactDOM.createRoot(document.getElementById("root")).render(
<React.StrictMode>
<ErrorBoundary>
<App />
</ErrorBoundary>
</React.StrictMode>
);