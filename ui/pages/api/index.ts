import { ApolloServer } from "apollo-server-micro";
import cors from "cors";
import prisma from "../../server/prisma";
import { getRequestOrigin } from "../../server/get-request-origin";
import schema from "../../server/graphql/schema";
import resolvers from "../../server/graphql/resolvers";
import EventHub from "../../server/services/eventHub.service";
import handler from "../../server/api-handler";
import { getNewHostInfo } from "utils/getHostInfo";
import subscribers from "../../server/subscribers";

export const config = {
  api: {
    bodyParser: false,
  },
};

export interface GraphQLContext {
  user?: Express.User;
  prisma: typeof prisma;
  //origin: string;
  eventHub?: any;
  currentGroup?: any;
  currentGroupMember?: any;
}

const corsOptions = {
  origin: "*",
  credentials: "include",
};

subscribers.initialize(EventHub);

export default handler()
  .use(cors(corsOptions))
  .use(
    new ApolloServer({
      typeDefs: schema,
      resolvers,
      context: async ({ req }): Promise<GraphQLContext> => {
        const { user } = req;
        // TODO: fetch user from Prisma?
        // let currentGroup = null;
        // let currentGroupMember = null;

        // if (req.headers.host) {
        //   let customDomain;
        //   let { host, subdomain } = getNewHostInfo(req.headers.host);
        //   if (
        //     !(
        //       host.endsWith(process.env.DEPLOY_URL) ||
        //       host.endsWith("localhost:3000") ||
        //       host.endsWith("staging.dreams.wtf")
        //     )
        //   ) {
        //     customDomain = host;
        //     subdomain = null;
        //   }

        //   if (customDomain) {
        //     currentGroup = await prisma.group.findFirst({
        //       where: { customDomain },
        //     });
        //   } else if (subdomain) {
        //     currentGroup = await prisma.group.findUnique({
        //       where: { slug: subdomain },
        //     });
        //   }
        //   if (currentGroup && user) {
        //     currentGroupMember = await prisma.groupMember.findUnique({
        //       where: {
        //         groupId_userId: {
        //           groupId: currentGroup.id,
        //           userId: user.id,
        //         },
        //       },
        //       include: { user: true },
        //     });
        //   }
        // }

        //const origin = getRequestOrigin(req);

        return {
          user,
          //origin,
          prisma,
          eventHub: EventHub,
          //currentGroup,
          //currentGroupMember,
        };
      },
    }).createHandler({
      path: "/api",
    })
  );
