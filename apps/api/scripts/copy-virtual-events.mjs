import { cp } from "node:fs/promises";
import { resolve } from "node:path";

await cp(resolve("src/virtual-events"), resolve("dist/virtual-events"), {
  recursive: true,
});
