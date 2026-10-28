import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "salonflow";
export default defineRailway(() => {
  const salonflow = service("salonflow", {
    source: github("tarooo22/salonflow", { branch: "main", checkSuites: false }),
    build: { buildCommand: "pnpm run build", buildEnvironment: "V3", builder: "RAILPACK" },
    start: "pnpm run start",
    healthcheck: "/health",
    healthcheckTimeout: 300,
    replicas: { "us-west2": 1 },
    deploy: { limitOverride: { containers: { cpu: 1, memoryBytes: 1000000000 } }, sleepApplication: false },
  });

  return project("protective-caring", {
    variables: { managed: false },
    resources: [salonflow],
  });
});
