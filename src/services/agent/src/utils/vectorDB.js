import dotenv from 'dotenv'
dotenv.config()
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
 import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import mongoose from "mongoose";
const createVectorStore  = async(docs, sourceId) => {
  const state = mongoose.connection.readyState;
// 0: disconnected
// 1: connected
// 2: connecting
// 3: disconnecting
 if(state !== 1){
    throw new Error("MongoDB is not connected");
 }
    const db = mongoose.connection.db;
    const collectionName = `pdf_chunks`
    const collection = db.collection(collectionName);

    const taggedDocs = docs.map(doc => ({
        ...doc,
        metadata: { ...doc.metadata, sourceId },
    }));


    const embedding = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001", // 768 dimensions
    apiKey:process.env.GEMINI_API_KEY

    });
    
    const vectorStore = new MongoDBAtlasVectorSearch(embedding,{
        collection,
        indexName:'vector_index',
        textKey:'text',
        embeddingKey:'embedding',
    })

    await vectorStore.addDocuments(taggedDocs)
    return vectorStore


};
export default createVectorStore;