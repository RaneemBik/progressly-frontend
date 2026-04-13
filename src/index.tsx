/**
 * index.tsx — React Application Mount Point
 *
 * Entry point for the browser bundle. Mounts the <App /> component into
 * the #root div in index.html using React 18's createRoot API.
 * Strict mode is enabled in development for detecting potential issues.
 */
import "./index.css";
import { render } from "react-dom";
import { App } from "./App";

render(<App />, document.getElementById("root"));