import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import GraphQLUpload, { FileUpload } from "graphql-upload/GraphQLUpload.mjs";
import { ApolloServerPluginLandingPageLocalDefault } from "apollo-server-core";
import mongoose from "mongoose";
import Upload from "./Upload";
import { fileStreamToBuffer } from "./utils";

const dbName = "talawa-file-uploads";

const typeDefs = gql`
  type User {
    name: String
  }

  type UploadedFile {
    _id: String!
    filename: String!
    mimetype: String!
    encoding: String!
    data: String!
  }

  type Query {
    getUploads: [UploadedFile!]
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

const resolvers = {
  Upload: GraphQLUpload,
  Query: {
    getUploads: async () => {
      const uploads = await Upload.find();
      return uploads.map((file) => {
        return {
          _id: file._id,
          filename: file.filename,
          mimetype: file.mimetype,
          encoding: file.encoding,
          data: file.data.toString("base64"),
        };
      });
    },
  },
  Mutation: {
    singleUpload: async (
      parent: {},
      { file }: { file: Promise<FileUpload> }
    ) => {
      try {
        const { createReadStream, filename, mimetype, encoding } = await file;
        const stream = createReadStream();

        await Upload.create({
          filename,
          mimetype,
          encoding,
          data: await fileStreamToBuffer(stream),
        });

        // const client = mongoose.connection.getClient();
        // const db = client.db(dbName);

        // const bucket = new mongodb.GridFSBucket(db as any);
        // const uploadStream = bucket.openUploadStream(filename);

        // stream
        //   .pipe(uploadStream)
        //   .on("error", function (err) {
        //     console.log("Error in uploading file", err);
        //   })
        //   .on("data", () => {
        //     console.log("data coming...");
        //   })
        //   .on("finish", function () {
        //     console.log("File Uploaded");
        //   });

        return { filename, mimetype, encoding };
      } catch (err) {
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

  server.applyMiddleware({ app: app as any });

  await new Promise<void>((r) => app.listen({ port: 4000 }, r));

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
