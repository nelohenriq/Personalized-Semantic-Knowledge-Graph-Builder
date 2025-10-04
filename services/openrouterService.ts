import { GraphData, GraphLink, GraphNode, SearchResult } from '../types';

const OPENROUTER_API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Extracts a knowledge graph from text using the OpenRouter API.
 * @param text The text content to analyze.
 * @param model The name of the OpenRouter model to use.
 * @param apiKey The user's OpenRouter API key.
 * @returns A promise that resolves to the extracted GraphData.
 */
export async function extractKnowledgeGraphOpenRouter(
  text: string,
  model: string,
  apiKey: string
): Promise<GraphData> {
  const prompt = `
    Analyze the following text and extract key concepts, entities, and their relationships to build a semantic knowledge graph.
    Identify the main topics and the connections between them. For each concept, provide a domain, a brief definition, and a snippet from the source text.
    For each relationship, provide a descriptive label and a confidence score (from 0.0 to 1.0).

    Your response MUST be a single, valid JSON object that adheres to the following structure. Do not include any text, explanations, or markdown formatting outside of the main JSON object.
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
    Do not create links to or from non-existent node IDs.

    Text to analyze:
    ---
    ${text}
    ---
  `;

  try {
    const response = await fetch(OPENROUTER_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': `http://localhost:3000`, // Required by OpenRouter for identification
        'X-Title': `Personalized Semantic Knowledge Graph Builder`, // Recommended by OpenRouter
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        stream: false,
      }),
    });

    if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData?.error?.message || errorMessage;
        } catch (e) {
            // If the error response is not JSON, read it as text.
            const errorText = await response.text().catch(() => 'Could not read error response body.');
            errorMessage = `API request failed with status ${response.status}: ${errorText}`;
        }

        if (response.status === 401) {
            throw new Error("Authentication error: Invalid OpenRouter API Key.");
        }
        throw new Error(errorMessage);
    }
    
    // Read the response as text first to avoid parsing errors with empty bodies.
    const responseText = await response.text();
    if (!responseText) {
        throw new Error("OpenRouter API returned a successful but empty response body.");
    }
    
    let responseData;
    try {
        responseData = JSON.parse(responseText);
    } catch(e) {
        console.error("Failed to parse OpenRouter response body:", responseText);
        throw new Error("OpenRouter API returned a non-JSON response.");
    }
    
    let jsonText = responseData.choices?.[0]?.message?.content;

    if (!jsonText) {
      throw new Error("OpenRouter API response is missing the expected content field.");
    }
    
    // Models can sometimes wrap JSON in markdown, so we extract it.
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = jsonText.match(jsonRegex);
    if (match && match[1]) {
      jsonText = match[1];
    }
    jsonText = jsonText.trim();

    let parsedJson: any;
    try {
        parsedJson = JSON.parse(jsonText);
    } catch (parseError) {
        console.error("Failed to parse JSON content from model:", jsonText);
        throw new Error(`The model returned invalid JSON. ${parseError instanceof Error ? parseError.message : ''}`);
    }

    // The model might return the data directly, or nested under a key.
    // We look for an object that has both 'nodes' and 'links' properties.
    let parsedData: GraphData | null = null;
    if (parsedJson.nodes && parsedJson.links) {
        parsedData = parsedJson as GraphData;
    } else {
        for (const key in parsedJson) {
            const potentialData = parsedJson[key];
            if (typeof potentialData === 'object' && potentialData !== null && potentialData.nodes && potentialData.links) {
                parsedData = potentialData as GraphData;
                break;
            }
        }
    }

    if (!parsedData || !Array.isArray(parsedData.nodes) || !Array.isArray(parsedData.links)) {
      console.error("Could not find 'nodes' and 'links' arrays in the response JSON from OpenRouter:", parsedJson);
      throw new Error("OpenRouter response JSON is missing 'nodes' or 'links' properties.");
    }

    // Data validation and filtering
    const nodeIds = new Set(parsedData.nodes.map(node => node.id));
    const validLinks = parsedData.links.filter(link => 
      nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
    );

    return { nodes: parsedData.nodes, links: validLinks };

  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Could not connect to OpenRouter API. Check your internet connection.");
    }
    throw new Error(`Failed to generate knowledge graph from OpenRouter. ${error instanceof Error ? error.message : ''}`);
  }
}

export async function performSemanticSearchOpenRouter(
  query: string,
  graphData: GraphData,
  model: string,
  apiKey: string
): Promise<SearchResult> {
  const prompt = `
    You are an intelligent assistant for a knowledge graph application. Your task is to answer questions based *only* on the provided knowledge graph data.
    Your response MUST be a single, valid JSON object with no other text, explanations, or markdown.
    
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
    const response = await fetch(OPENROUTER_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': `http://localhost:3000`,
        'X-Title': `Personalized Semantic Knowledge Graph Builder`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response body.');
      throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    const jsonText = responseData.choices?.[0]?.message?.content;

    if (!jsonText) {
      throw new Error("OpenRouter API returned an empty content field for semantic search.");
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
    console.error("Error calling OpenRouter API for semantic search:", error);
    throw new Error(`Failed to perform semantic search with OpenRouter. ${error instanceof Error ? error.message : ''}`);
  }
}