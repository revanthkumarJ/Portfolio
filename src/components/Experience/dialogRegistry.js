import SwipeSde1 from "./dialogs/SwipeSde1";
import SwipeIntern from "./dialogs/SwipeIntern";
import MifosDeveloper from "./dialogs/MifosDeveloper";
import MifosMsoc from "./dialogs/MifosMsoc";
import MifosMentor from "./dialogs/MifosMentor";

/* Maps an experience's detailKey to the dialog component that renders
   its full details. Add a new entry here when a new dialog is created. */
const dialogRegistry = {
  "swipe-sde1": SwipeSde1,
  "swipe-intern": SwipeIntern,
  "mifos-developer": MifosDeveloper,
  "mifos-msoc": MifosMsoc,
  "mifos-mentor": MifosMentor,
};

export default dialogRegistry;
