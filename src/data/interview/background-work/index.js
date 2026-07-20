import workmanagerFundamentals from "./workmanager-fundamentals/index.js";
import workmanagerAdvanced from "./workmanager-advanced/index.js";
import alarmsForeground from "./alarms-foreground/index.js";
import dozeChoosing from "./doze-choosing/index.js";

export default {
  id: "background-work",
  name: "Background Work",
  description:
    "Running work off the UI — WorkManager fundamentals & advanced (constraints, chaining, unique work), AlarmManager & foreground services, and Doze/battery & choosing the right tool.",
  topics: [
    workmanagerFundamentals,
    workmanagerAdvanced,
    alarmsForeground,
    dozeChoosing,
  ],
};
