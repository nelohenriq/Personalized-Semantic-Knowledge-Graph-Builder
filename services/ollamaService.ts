import { GraphData, GraphLink, GraphNode, SearchResult } from '../types';

const OLLAMA_API_ENDPOINT = 'http://localhost:11434/api/generate';

/**
 * Fetches the list of available models from a local Ollama instance.
 * @returns A promise that resolves to an array of model name strings.
 */
export async function getOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');

    if (!response.ok) {
      throw new Error(`Ollama server responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.models || !Array.isArray(data.models)) {
      throw new Error("Invalid response format from Ollama /api/tags");
    }

    const modelNames = data.models.map((model: { name: string }) => model.name);
    return modelNames;

  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Could not connect to Ollama server at http://localhost:11434. Please ensure Ollama is running and accessible.");
    }
    throw error;
  }
}

/**
 * Extracts a knowledge graph from text using a local Ollama instance.
 * @param text The text content to analyze.
 * @param model The name of the Ollama model to use (e.g., 'llama3').
 * @returns A promise that resolves to the extracted GraphData.
 */
export async function extractKnowledgeGraphOllama(text: string, model: string): Promise<GraphData> {
  const prompt = `
    Analyze the following text and extract key concepts, entities, and their relationships to build a semantic knowledge graph.
    Identify the main topics and the connections between them. For each concept, provide a domain, a brief definition, and a snippet from the source text.
    For each relationship, provide a descriptive label and a confidence score (from 0.0 to 1.0).

    Your response MUST be a single, valid JSON object that adheres to the following structure:
    {
      "nodes": [
        {
          "id": "unique_node_identifier",
          "label": "Display Name",
          "domain": "Subject Area",
          "definition": "A brief definition.",
          "sourceText": "A relevant quote from the source text."
        }
      ],
      "links": [
        {
          "source": "source_node_id",
          "target": "target_node_id",
          "label": "Relationship description",
          "confidence": 0.9
        }
      ]
    }

    Ensure that the 'source' and 'target' fields in the links correctly reference the 'id' fields of the nodes.
    Do not create links to or from non-existent node IDs. Do not include any text or explanations outside of the main JSON object.

    Text to analyze:
    ---
    ${text}
    ---
  `;

  try {
    const response = await fetch(OLLAMA_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        format: 'json',
        stream: false, // We want the full response at once
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API request failed with status ${response.status}`);
    }

    const responseData = await response.json();
    const jsonText = responseData.response;
    
    if (!jsonText) {
        throw new Error("Ollama API returned an empty response.");
    }

    const parsedData = JSON.parse(jsonText) as GraphData;
    
    if (!parsedData.nodes || !parsedData.links) {
        throw new Error("Ollama response is missing 'nodes' or 'links' properties.");
    }


    // Data validation and filtering
    const nodeIds = new Set(parsedData.nodes.map(node => node.id));
    const validLinks = parsedData.links.filter(link => 
      nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
    );

    return { nodes: parsedData.nodes, links: validLinks };

  } catch (error) {
    console.error("Error calling Ollama API:", error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error("Could not connect to Ollama server at http://localhost:11434. Please ensure Ollama is running.");
    }
    throw new Error(`Failed to generate knowledge graph from Ollama. ${error instanceof Error ? error.message : ''}`);
  }
}

export async function performSemanticSearchOllama(query: string, graphData: GraphData, model: string): Promise<SearchResult> {
  const prompt = `
    You are an intelligent assistant for a knowledge graph application. Your task is to answer questions based *only* on the provided knowledge graph data.
    Your response MUST be a single, valid JSON object with no other text or explanations.
    
    The required JSON structure is:
    {
      "answer": "A concise, natural language answer to the user's question.",
      "relevant_nodes": ["node_id_1", "node_id_2"],
      "relevant_links": [
        { "source": "source_node_id_1", "target": "target_node_id_1" }
      ]
    }
    
    Here is the knowledge graph data, in JSON format:
    ---
    ${JSON.stringify(graphData, null, 2)}
    ---
    
    Here is the user's question:
    ---
    ${query}
    ---
    
    Analyze the question, find the answer in the graph, and return the response in the specified JSON format.
  `;

  try {
    const response = await fetch(OLLAMA_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        format: 'json',
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API request failed with status ${response.status}`);
    }
    
    const responseData = await response.json();
    const jsonText = responseData.response;
    
    if (!jsonText) {
      throw new Error("Ollama API returned an empty response for semantic search.");
    }

    const parsedData = JSON.parse(jsonText);

    const nodeMap = new Map(graphData.nodes.map(n => [n.id, n]));
    const linkMap = new Map(graphData.links.map(l => [`${l.source as string}-${l.target as string}`, l]));

    const relevantNodes = (parsedData.relevant_nodes || [])
        .map((id: string) => nodeMap.get(id))
        .filter((n: GraphNode | undefined): n is GraphNode => n !== undefined);
    
    const relevantLinks = (parsedData.relevant_links || [])
        .map((link: {source: string, target: string}) => linkMap.get(`${link.source}-${link.target}`))
        .filter((l: GraphLink | undefined): l is GraphLink => l !== undefined);
            
    return {
        answer: parsedData.answer || "The model did not provide an answer.",
        relevantNodes,
        relevantLinks
    };
  } catch (error) {
    console.error("Error calling Ollama API for semantic search:", error);
    throw new Error(`Failed to perform semantic search with Ollama. ${error instanceof Error ? error.message : ''}`);
  }
}