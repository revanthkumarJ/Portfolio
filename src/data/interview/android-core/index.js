import activityLifecycle from "./activity-lifecycle/index.js";
import fragments from "./fragments/index.js";
import intentsTasks from "./intents-tasks/index.js";
import servicesComponents from "./services-components/index.js";
import contextProcess from "./context-process/index.js";
import threadingPermissions from "./threading-permissions/index.js";

export default {
  id: "android-core",
  name: "Android Core",
  description:
    "The Android framework itself — Activity & Fragment lifecycles, Intents/tasks/launch modes, Services/Receivers/Providers, Context & processes, threading, and permissions.",
  topics: [
    activityLifecycle,
    fragments,
    intentsTasks,
    servicesComponents,
    contextProcess,
    threadingPermissions,
  ],
};
