import type { Express } from "express";
import { storageGetSignedUrl } from "../storage";

const publicMediaKey = /^salons\/[^/]+\/(locations\/[^/]+\/cover(?:_[A-Za-z0-9]+)?|locations\/[^/]+\/feed\/[^/]+|staff\/[^/]+\/avatar(?:_[A-Za-z0-9]+)?)\.(?:jpg|png|webp)$/;

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const params = req.params as Record<string, string>;
    const key = String(params["0"] ?? "");
    if (!publicMediaKey.test(key)) {
      res.status(404).send("Media is not publicly available");
      return;
    }

    try {
      const signedUrl = await storageGetSignedUrl(key, 900);
      res.redirect(307, signedUrl);
    } catch (error) {
      console.error("Public media proxy failed", error);
      res.status(503).send("Media is temporarily unavailable");
    }
  });
}
