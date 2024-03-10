import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import mongoose from "mongoose";
import mongodb from "mongodb";
const dbName = "talawa-file-uploads";
const typeDefs = gql `
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
            try {
                console.log("here");
                const { createReadStream, filename, mimetype, encoding } = await file;
                const stream = createReadStream();
                const client = mongoose.connection.getClient();
                const db = client.db(dbName);
                const bucket = new mongodb.GridFSBucket(db);
                const uploadStream = bucket.openUploadStream(filename);
                console.log(uploadStream);
                await new Promise((resolve, reject) => {
                    stream
                        .pipe(uploadStream)
                        .on("error", reject)
                        .on("finish", () => {
                        resolve;
                        return { filename, mimetype, encoding };
                    });
                });
            }
            catch (err) {
                console.log(err);
            }
        },
    },
};
async function startServer() {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        csrfPrevention: true,
        cache: "bounded",
        plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    });
    await server.start();
    const app = express();
    app.use(graphqlUploadExpress());
    server.applyMiddleware({ app: app });
    await new Promise((r) => app.listen({ port: 4000 }, r));
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}
const connectDB = async () => {
    const MONGO_URL = `mongodb://localhost:27017/${dbName}`;
    mongoose
        .connect(MONGO_URL)
        .then(() => console.log("MongoDB connected"))
        .catch((err) => console.log("MongoDB connection error:", err));
};
connectDB();
startServer();
