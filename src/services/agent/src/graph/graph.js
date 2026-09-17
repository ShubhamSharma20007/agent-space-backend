import { StateGraph, START, END } from "@langchain/langgraph";
import { agentState } from "./agentState.js";
import { routerAgent } from "./routerAgent.js";

import { chatAgent } from "../agents/chat.agent.js";
import { searchAgent } from "../agents/search.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { pdfAgent } from "../agents/pdf.agent.js";
import { pptAgent } from "../agents/ppt.agent.js";
import { imageGenAgent } from "../agents/imageGen.agent.js";
import { pdfRAG } from "../agents/pdfRAG.agent.js";
import { imageAnalyzer } from "../agents/imageAnalyzer.js";

const workflow = new StateGraph(agentState);

// Nodes
workflow
  .addNode("router_node", routerAgent)
  .addNode("chat_node", chatAgent)
  .addNode("search_node", searchAgent)
  .addNode("coding_node", codingAgent)
  .addNode("pdf_node", pdfAgent)
  .addNode("ppt_node", pptAgent)
  .addNode("imgGen_node", imageGenAgent)
  .addNode('pdfRAG_node',pdfRAG)
  .addNode('imageAnalyzer_node',imageAnalyzer)

// Edges
workflow.addEdge(START, "router_node");
workflow.addConditionalEdges(
  "router_node",
  (state) => {
    switch (state.agent) {
      case "chat":
        return "chat_node";

      case "search":
        return "search_node";

      case "coding":
        return "coding_node";

      case "pdf":
        return "pdf_node";

      case "ppt":
        return "ppt_node";

      case "image":
        return "imgGen_node";

      case "pdfRAG":
        return "pdfRAG_node";

      case "imageAnalyzer":
        return "imageAnalyzer_node"

      default:
        return "chat_node"; 
    }
  },
  {
    chat_node: "chat_node",
    search_node: "search_node",
    coding_node: "coding_node",
    pdf_node: "pdf_node",
    ppt_node: "ppt_node",
    imgGen_node: "imgGen_node",
    pdfRAG_node: "pdfRAG_node",
    imageAnalyzer_node: "imageAnalyzer_node"
  }
);

workflow.addEdge('search_node','chat_node')
workflow.addEdge('chat_node',END)
workflow.addEdge('coding_node',END)
workflow.addEdge('pdf_node',END)
workflow.addEdge('ppt_node',END)
workflow.addEdge('imgGen_node',END) 
workflow.addEdge('pdfRAG_node',END)
workflow.addEdge('imageAnalyzer_node',END)



export const graph = workflow.compile()