import { mobileByteSensei } from "./mobileByteSensei.js";
import { mifos } from "./mifos.js";
import { swipe } from "./swipe.js";

/* Company case studies, looked up by slug from /experience/:slug.
   Add the next company's data file here and the route picks it up. */
export const experienceCaseStudies = [swipe, mifos, mobileByteSensei];

export const experienceBySlug = Object.fromEntries(
  experienceCaseStudies.map((e) => [e.slug, e])
);
