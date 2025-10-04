
import { GoogleGenAI, Type } from "@google/genai";
import { GraphData, GraphLink, SearchResult, GraphNode } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This key is required for the built-in 'Z.ai' provider to function.
  // The user-configurable 'Google Gemini' provider will use its own key.
  console.warn("API_KEY environment variable not set. 'Z.ai' provider will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      description: "A list of concepts or entities, which will be the nodes of the graph.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique identifier for the node (e.g., the concept name in lowercase and snake_case)." },
          label: { type: Type.STRING, description: "The display name of the concept." },
          domain: { type: Type.STRING, description: "The general subject area or domain this concept belongs to (e.g., 'Physics', 'Computer Science')." },
          definition: { type: Type.STRING, description: "A brief definition of the concept based on the text." },
          sourceText: { type: Type.STRING, description: "A short, relevant quote from the source text where this concept was identified." }
        },
        required: ["id", "label", "domain", "definition", "sourceText"],
      },
    },
    links: {
      type: Type.ARRAY,
      description: "A list of relationships between the concepts, which will be the edges of the graph.",
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "The ID of the source node." },
          target: { type: Type.STRING, description: "The ID of the target node." },
          label: { type: Type.STRING, description: "A label describing the relationship (e.g., 'is-a', 'related-to', 'part-of')." },
          confidence: { type: Type.NUMBER, description: "A score from 0 to 1 indicating the confidence in this relationship." }
        },
        required: ["source", "target", "label", "confidence"],
      },
    },
  },
  required: ["nodes", "links"],
};

const searchResponseSchema = {
    type: Type.OBJECT,
    properties: {
        answer: {
            type: Type.STRING,
            description: "A concise, natural language answer to the user's question based on the provided knowledge graph context."
        },
        relevant_nodes: {
            type: Type.ARRAY,
            description: "An array of the string IDs of the nodes from the context that are most relevant to the answer.",
            items: { type: Type.STRING }
        },
        relevant_links: {
            type: Type.ARRAY,
            description: "An array of objects, where each object represents a relevant link and contains the 'source' and 'target' node IDs.",
            items: {
                type: Type.OBJECT,
                properties: {
                    source: { type: Type.STRING },
                    target: { type: Type.STRING }
                },
                required: ["source", "target"]
            }
        }
    },
    required: ["answer", "relevant_nodes", "relevant_links"]
};


export async function extractKnowledgeGraph(text: string, apiKey?: string): Promise<GraphData> {
    const prompt = `
    Analyze the following text and extract key concepts, entities, and their relationships to build a semantic knowledge graph.
    Identify the main topics and the connections between them. For each concept, provide a domain, a brief definition, and a snippet from the source text.
    For each relationship, provide a descriptive label and a confidence score.
    Ensure that the 'source' and 'target' fields in the links correctly reference the 'id' fields of the nodes. Do not create links to or from non-existent node IDs.

    Text to analyze:
    ---
    ${text}
    ---
    `;

    try {
        const client = apiKey ? new GoogleGenAI({ apiKey }) : ai;
        if (!apiKey && !API_KEY) throw new Error("API Key is not configured for Z.ai provider.");

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText) as GraphData;

        // Data validation and filtering
        const nodeIds = new Set(parsedData.nodes.map(node => node.id));
        // Fix: Cast source and target to string for validation, as they are strings from the API response.
        const validLinks = parsedData.links.filter(link => 
          nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
        );

        return { nodes: parsedData.nodes, links: validLinks };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate knowledge graph from Gemini API.");
    }
}


export async function performSemanticSearch(query: string, graphData: GraphData, apiKey?: string): Promise<SearchResult> {
    const prompt = `
    You are an intelligent assistant for a knowledge graph application. Your task is to answer questions based *only* on the provided knowledge graph data.
    
    Here is the knowledge graph data, in JSON format:
    ---
    ${JSON.stringify(graphData, null, 2)}
    ---
    
    Here is the user's question:
    ---
    ${query}
    ---
    
    Please perform the following steps:
    1.  Analyze the user's question.
    2.  Examine the provided knowledge graph to find the answer.
    3.  Formulate a concise, natural language answer.
    4.  Identify the specific nodes and links from the graph data that are most relevant to your answer.
    5.  Return your findings in the specified JSON format.
    `;

    try {
        const client = apiKey ? new GoogleGenAI({ apiKey }) : ai;
        if (!apiKey && !API_KEY) throw new Error("API Key is not configured for Z.ai provider.");

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: searchResponseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        const nodeMap = new Map(graphData.nodes.map(n => [n.id, n]));
        const linkMap = new Map(graphData.links.map(l => [`${l.source as string}-${l.target as string}`, l]));

        const relevantNodes = parsedData.relevant_nodes
            .map((id: string) => nodeMap.get(id))
            .filter((n: GraphNode | undefined): n is GraphNode => n !== undefined);
        
        const relevantLinks = parsedData.relevant_links
            .map((link: {source: string, target: string}) => linkMap.get(`${link.source}-${link.target}`))
            .filter((l: GraphLink | undefined): l is GraphLink => l !== undefined);
            
        return {
            answer: parsedData.answer,
            relevantNodes,
            relevantLinks
        };

    } catch (error) {
        console.error("Error calling Gemini API for semantic search:", error);
        throw new Error("Failed to perform semantic search with Gemini API.");
    }
}