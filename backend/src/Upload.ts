import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    encoding: { type: String, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

const Upload = mongoose.model("Upload", uploadSchema);

export default Upload;
