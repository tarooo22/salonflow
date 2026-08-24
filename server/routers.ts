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
import { waitlistRouter } from "./routers/waitlist";
import { operationsRouter } from "./routers/operations";
import { posRouter } from "./routers/pos";
import { mediaRouter } from "./routers/media";
import { guidedTourRouter } from "./routers/guidedTour";
import { marketplaceRouter } from "./routers/marketplace";
import { feedbackRouter } from "./routers/feedback";
import { trialAccessRouter } from "./routers/trialAccess";

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
  waitlist: waitlistRouter,
  operations: operationsRouter,
  pos: posRouter,
  media: mediaRouter,
  guidedTour: guidedTourRouter,
  marketplace: marketplaceRouter,
  feedback: feedbackRouter,
  trialAccess: trialAccessRouter,
  public: publicRouter,
});

export type AppRouter = typeof appRouter;
