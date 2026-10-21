import { test } from "node:test";
import assert from "node:assert/strict";
import {
  executeDataManagement,
  type DataManagementPort,
} from "../src/domain/privacy/dataManagement";
test("Data management rejects invalid confirmation before any work and cancels reminders only for full reset", async () => {
  const events: string[] = [];
  const port: DataManagementPort = {
    cleanTemporaryFiles: async () => {
      events.push("cleanup");
    },
    clear: async (all) => {
      events.push("clear:" + all);
    },
    reload: async () => {
      events.push("reload");
    },
    cancelReminders: async () => {
      events.push("cancel");
    },
  };
  for (const text of ["", "reset", "RESET "])
    await assert.rejects(
      () => executeDataManagement(true, text, port),
      /Confirmation/,
    );
  assert.deepEqual(events, []);
  await executeDataManagement(false, "DELETE", port);
  assert.deepEqual(events, ["clear:false", "reload"]);
  events.length = 0;
  assert.match(await executeDataManagement(true, "RESET", port), /cancelled/);
  assert.deepEqual(events, ["clear:true", "reload", "cancel", "cleanup"]);
});
test("Post-commit reminder or reload failures never report complete reset or false rollback", async () => {
  const base: DataManagementPort = {
    cleanTemporaryFiles: async () => {},
    clear: async () => {},
    reload: async () => {},
    cancelReminders: async () => {},
  };
  await assert.rejects(
    () =>
      executeDataManagement(true, "RESET", {
        ...base,
        clear: async () => {
          throw Error("db");
        },
      }),
    /rolled back/,
  );
  await assert.rejects(
    () =>
      executeDataManagement(true, "RESET", {
        ...base,
        reload: async () => {
          throw Error("reload");
        },
      }),
    /committed.*reload failed/,
  );
  await assert.rejects(
    () =>
      executeDataManagement(true, "RESET", {
        ...base,
        cleanTemporaryFiles: async () => {
          throw Error("cache");
        },
      }),
    /cleanup failed.*not fully complete/,
  );
  await assert.rejects(
    () =>
      executeDataManagement(true, "RESET", {
        ...base,
        cancelReminders: async () => {
          throw Error("OS");
        },
      }),
    /cancellation failed.*not fully complete/,
  );
});
