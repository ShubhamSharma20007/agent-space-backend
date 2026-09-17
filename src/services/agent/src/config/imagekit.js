import ImageKit, { toFile } from "@imagekit/nodejs";
import crypto from "node:crypto";

const client = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

const uploadFile = async (buffer, extension = "png") => {
  const fileName = `agent-${crypto.randomUUID()}.${extension}`;
  const result = await client.files.upload({
    file: await toFile(buffer,fileName),
    fileName,
    folder: "agent-space",
  })

  return result.url;
};

export default uploadFile;