import { GoogleGenAI, Type } from "@google/genai";
import { GraphData, GraphLink, SearchResult, GraphNode } from '../types';

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

/**
 * Parses known Gemini API errors into user-friendly messages.
 * @param error The error object caught from the API call.
 * @param context A string describing the operation that failed (e.g., 'knowledge graph extraction').
 * @returns An Error object with a user-friendly message.
 */
function handleGeminiError(error: unknown, context: string): Error {
    console.error(`Error calling Gemini API during ${context}:`, error);

    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('429') || message.includes('resource_exhausted') || message.includes('quota')) {
            return new Error("You exceeded your Google Gemini API quota. Please check your plan and billing details, or wait and try again.");
        }
        if (message.includes('400') && message.includes('api key not valid')) {
            return new Error("Authentication error: The provided Google Gemini API Key is invalid.");
        }
    }

    return new Error(`Failed to ${context} with the Gemini API.`);
}


export async function extractKnowledgeGraph(text: string, apiKey: string): Promise<GraphData> {
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

    if (!apiKey) {
      throw new Error("Google Gemini API Key is required.");
    }

    try {
        const client = new GoogleGenAI({ apiKey });

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
        const validLinks = parsedData.links.filter(link => 
          nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
        );

        return { nodes: parsedData.nodes, links: validLinks };

    } catch (error) {
        throw handleGeminiError(error, "generate knowledge graph");
    }
}


export async function performSemanticSearch(query: string, graphData: GraphData, apiKey: string): Promise<SearchResult> {
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

    if (!apiKey) {
      throw new Error("Google Gemini API Key is required.");
    }

    try {
        const client = new GoogleGenAI({ apiKey });

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
        throw handleGeminiError(error, "perform semantic search");
    }
}