import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { clientsRouter } from "./routers/clients";
import { appointmentsRouter } from "./routers/appointments";
import { financeRouter } from "./routers/finance";
import { organizationRouter } from "./routers/organizations";
import { invitationsRouter } from "./routers/invitations";
import { onboardingRouter } from "./routers/onboarding";
import { paymentsRouter } from "./routers/payments";
import { publicRouter } from "./routers/public";
import { reportingRouter } from "./routers/reporting";
import { servicesRouter } from "./routers/services";
import { staffRouter } from "./routers/staff";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,
  organizations: organizationRouter,
  onboarding: onboardingRouter,
  invitations: invitationsRouter,
  staff: staffRouter,
  services: servicesRouter,
  clients: clientsRouter,
  appointments: appointmentsRouter,
  payments: paymentsRouter,
  finance: financeRouter,
  reporting: reportingRouter,
  public: publicRouter,
});

export type AppRouter = typeof appRouter;
