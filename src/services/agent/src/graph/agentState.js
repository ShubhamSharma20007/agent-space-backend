import { Annotation } from "@langchain/langgraph";

// custom state schema
export const agentState = Annotation.Root({
    prompt:Annotation(),
    aiResponse:Annotation(),
    agent:Annotation(),
    conversationId:Annotation(),
    searchResults:Annotation(), // for search llm
    images:Annotation(), // for search img llm
    artifacts:Annotation(), // for coding preview
    userId:Annotation(),
    file:Annotation(),
    url:Annotation()  
})