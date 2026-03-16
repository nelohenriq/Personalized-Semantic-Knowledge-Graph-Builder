import { GraphData, GraphLink, GraphNode, SearchResult } from '../types';

const ZAI_API_ENDPOINT = 'https://api.z.ai/api/paas/v4/chat/completions';

async function parseZaiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication error: Invalid Z.ai API Key.");
    }

    const errorText = await response.text().catch(() => `API request failed with status ${response.status} and no response body.`);

    // Check for the specific insufficient balance error
    if (errorText.includes('余额不足')) {
      throw new Error("Your Z.ai account has an insufficient balance. Please recharge your account on the Z.ai website to continue.");
    }

    let detailedError = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      detailedError = errorJson?.error?.message || detailedError;
    } catch (e) {
      // It's not a JSON error, so we'll use the raw text.
    }
    
    throw new Error(`Z.ai API request failed: ${detailedError}`);
  }

  const responseData = await response.json();
  let jsonText = responseData.choices?.[0]?.message?.content;

  if (!jsonText) {
    throw new Error("Z.ai API response is missing the expected content field.");
  }
  
  jsonText = jsonText.trim();
  const jsonMatch = jsonText.match(/```json\s*([\s\S]+?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    jsonText = jsonMatch[1];
  }

  try {
    return JSON.parse(jsonText);
  } catch (parseError) {
    console.error("Failed to parse JSON content from Z.ai model:", jsonText);
    throw new Error(`The model returned invalid JSON. ${parseError instanceof Error ? parseError.message : ''}`);
  }
}

export async function extractKnowledgeGraphZai(
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
      "nodes": [{"id": "...", "label": "...", "domain": "...", "definition": "...", "sourceText": "..."}],
      "links": [{"source": "...", "target": "...", "label": "...", "confidence": 0.9}]
    }

    Ensure that the 'source' and 'target' fields in the links correctly reference the 'id' fields of the nodes.
    Do not create links to or from non-existent node IDs.

    Text to analyze:
    ---
    ${text}
    ---
  `;

  try {
    const response = await fetch(ZAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
    });

    const parsedData = await parseZaiResponse(response) as GraphData;

    if (!parsedData || !Array.isArray(parsedData.nodes) || !Array.isArray(parsedData.links)) {
      throw new Error("Z.ai response JSON is missing 'nodes' or 'links' properties.");
    }
    
    const nodeIds = new Set(parsedData.nodes.map(node => node.id));
    const validLinks = parsedData.links.filter(link => 
      nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
    );

    return { nodes: parsedData.nodes, links: validLinks };

  } catch (error) {
    console.error("Error calling Z.ai API:", error);
    throw new Error(`Failed to generate knowledge graph from Z.ai. ${error instanceof Error ? error.message : ''}`);
  }
}

export async function performSemanticSearchZai(
  query: string,
  graphData: GraphData,
  model: string,
  apiKey: string
): Promise<SearchResult> {
  const prompt = `
    You are an intelligent assistant. Your task is to answer questions based *only* on the provided knowledge graph data.
    Your response MUST be a single, valid JSON object with no other text or explanations.
    
    The required JSON structure is:
    {
      "answer": "A concise, natural language answer to the user's question.",
      "relevant_nodes": ["node_id_1", "node_id_2"],
      "relevant_links": [
        { "source": "source_node_id_1", "target": "target_node_id_1" }
      ]
    }
    
    Knowledge graph data:
    ---
    ${JSON.stringify(graphData, null, 2)}
    ---
    
    User's question:
    ---
    ${query}
    ---
    
    Analyze the question, find the answer in the graph, and return the response in the specified JSON format.
  `;

  try {
    const response = await fetch(ZAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      }),
    });

    const parsedData = await parseZaiResponse(response);

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
    console.error("Error calling Z.ai API for semantic search:", error);
    throw new Error(`Failed to perform semantic search with Z.ai. ${error instanceof Error ? error.message : ''}`);
  }
}
