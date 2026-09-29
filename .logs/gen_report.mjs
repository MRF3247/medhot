import { composeDaily } from "../packages/backend/src/reports/compose.ts";
const d = process.argv[2];
const r = await composeDaily(d, "manual");
console.log("日报生成:", JSON.stringify(r));
process.exit(0);
