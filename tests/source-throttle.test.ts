// 信源分区与限流的配置读法：预印本这类「量大但低价值」的源靠它压住自动调度与单次导入量。
import { test } from "node:test";
import assert from "node:assert/strict";
import { intervalLockMinutes, maxItemsPerRun } from "@aihot/backend/sources/collect";

test("intervalMinutesLock 生效，越界或非数字回落到自动调度", () => {
  assert.equal(intervalLockMinutes({ _aihot: { intervalMinutesLock: 240 } }), 240);
  assert.equal(intervalLockMinutes({ _aihot: { intervalMinutesLock: "180" } }), 180);
  assert.equal(intervalLockMinutes({ _aihot: { intervalMinutesLock: 1 } }), null);
  assert.equal(intervalLockMinutes({ _aihot: { intervalMinutesLock: 99999 } }), null);
  assert.equal(intervalLockMinutes({ _aihot: { intervalMinutesLock: "abc" } }), null);
  assert.equal(intervalLockMinutes({}), null);
  assert.equal(intervalLockMinutes(null), null);
});

test("maxItemsPerRun 只能调小，不能放大全局上限", () => {
  assert.equal(maxItemsPerRun({ _aihot: { maxItemsPerRun: 10 } }, 60), 10);
  assert.equal(maxItemsPerRun({ _aihot: { maxItemsPerRun: 500 } }, 60), 60);
  assert.equal(maxItemsPerRun({ _aihot: { maxItemsPerRun: 0 } }, 60), 60);
  assert.equal(maxItemsPerRun({}, 60), 60);
});
