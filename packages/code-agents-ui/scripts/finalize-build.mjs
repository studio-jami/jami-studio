import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const target = join("dist", "styles.css");

mkdirSync(dirname(target), { recursive: true });
copyFileSync(join("src", "styles.css"), target);
