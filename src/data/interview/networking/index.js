import httpRest from "./http-rest/index.js";
import retrofitOkhttp from "./retrofit-okhttp/index.js";
import serialization from "./serialization/index.js";
import errorAuth from "./error-auth/index.js";
import ktorWebsockets from "./ktor-websockets/index.js";

export default {
  id: "networking",
  name: "Networking",
  description:
    "Talking to servers — HTTP & REST fundamentals, Retrofit & OkHttp, JSON serialization, error handling & auth, and Ktor & WebSockets.",
  topics: [
    httpRest,
    retrofitOkhttp,
    serialization,
    errorAuth,
    ktorWebsockets,
  ],
};
