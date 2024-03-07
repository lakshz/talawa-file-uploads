import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import { finished } from "stream/promises";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import fs from "fs";
const typeDefs = gql `
  #graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type User {
    name: String
  }

  type Query {
    getUsers: [User]
  }

  # The implementation for this scalar is provided by the
  # 'GraphQLUpload' export from the 'graphql-upload' package
  # in the resolver map below.
  scalar Upload

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  input CreateUserInput {
    name: String!
    image: Upload!
  }

  type Mutation {
    singleUpload(file: Upload!): File!
    createUser(data: CreateUserInput!): User!
  }
`;
const users = [
    {
        name: "Lakshya",
    },
    {
        name: "Kunal",
    },
];
const resolvers = {
    Upload: GraphQLUpload,
    Query: {
        getUsers: () => users,
    },
    Mutation: {
        singleUpload: async (parent, { file }) => {
            const { createReadStream, filename, mimetype, encoding } = await file;
            const stream = createReadStream();
            const out = fs.createWriteStream("local-file-output.txt");
            stream.pipe(out);
            await finished(out);
            return { filename, mimetype, encoding };
        },
        createUser: async (parent, args) => {
            const { createReadStream, filename, mimetype, encoding } = await args.data
                .image;
            const stream = createReadStream();
            const out = require("fs").createWriteStream("local-file-output.txt");
            stream.pipe(out);
            await finished(out);
            return { name: "Lakshya" };
        },
    },
};
async function startServer() {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        csrfPrevention: true, // needed for security
        cache: "bounded",
        plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    });
    await server.start();
    const app = express();
    // This middleware should be added before calling `applyMiddleware`.
    app.use(graphqlUploadExpress());
    server.applyMiddleware({ app });
    await new Promise((r) => app.listen({ port: 4000 }, r));
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}
startServer();
