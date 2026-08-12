import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { clientsRouter } from "./routers/clients";
import { appointmentsRouter } from "./routers/appointments";
import { financeRouter } from "./routers/finance";
import { organizationRouter } from "./routers/organizations";
import { paymentsRouter } from "./routers/payments";
import { publicRouter } from "./routers/public";
import { reportingRouter } from "./routers/reporting";
import { servicesRouter } from "./routers/services";
import { staffRouter } from "./routers/staff";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  organizations: organizationRouter,
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
