import { render } from "ink";
import App from "./App.js";

const instance = render(<App gateway={null} />, {
  stdout: process.stdout,
  stderr: process.stderr,
  stdin: process.stdin,
  exitOnCtrlC: true,
  patchConsole: false,
  debug: process.env["NODE_ENV"] === "development",
  maxFps: 30,
});

export default instance;
