# Personalized Semantic Knowledge Graph Builder

**Transform your learning materials into interactive, interconnected knowledge graphs with the power of AI.**

This application is a sophisticated, AI-powered tool designed to analyze documents like PDFs, research papers, and notes, and automatically build a personalized knowledge graph. It extracts key concepts, identifies relationships, and visualizes connections to enhance learning, research, and deep comprehension.

## ✨ Core Features

-   **📄 Document Upload & Parsing:** Supports PDF, TXT, and Markdown files. All parsing happens locally in your browser for complete privacy.
-   **🧠 AI-Powered Knowledge Extraction:** Intelligently chunks large documents and uses your chosen AI provider to extract concepts, definitions, domains, and relationships.
-   **🎨 Interactive Graph Visualization:** A dynamic, force-directed graph powered by D3.js. Pan, zoom, drag nodes, and explore your knowledge visually.
-   **🔌 Multi-Provider AI Support:** You're in control. Seamlessly switch between local and cloud AI models:
    -   **Ollama:** Run powerful models like Llama 3 locally for maximum privacy.
    -   **Z.ai:** Access cutting-edge models like GLM.
    -   **Google Gemini:** Leverage Google's powerful `gemini-2.5-flash` model.
    -   **OpenRouter:** Connect to a wide range of models, including many free-tier options.
-   **🔍 Semantic Search:** Ask natural language questions about your documents (e.g., "What is the relationship between quantum mechanics and general relativity?") and get AI-powered answers based on the graph's context.
-   **⚙️ Powerful Filtering & Customization:**
    -   Filter the graph by relationship confidence scores.
    -   Instantly search and highlight specific nodes.
    -   Customize node colors by domain for better visual organization.
-   **🔒 Privacy-First Architecture:** Your documents and generated graphs are processed and stored in your browser. No data is sent to a server unless you explicitly configure a cloud-based AI provider.
-   **🌓 Light & Dark Modes:** A beautiful, responsive UI that adapts to your system theme.

## 🛠️ Tech Stack

This project is built with a modern, performant, and type-safe technology stack.

-   **Framework:** [React](https://react.dev/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Graph Visualization:** [D3.js](https://d3js.org/) (`d3-force`, `d3-zoom`)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **PDF Parsing:** [PDF.js](https://mozilla.github.io/pdf.js/)

## 🚀 Getting Started: A User's Guide

### 1. Configure an AI Provider

-   Click the **Settings** button in the header to open the AI Provider modal.
-   Choose your preferred provider.
-   **For Cloud Providers (Z.ai, Gemini, OpenRouter):** Enter your API key. It will be saved securely in your browser's local storage.
-   **For Ollama (Local):** Ensure your Ollama server is running. The application will automatically detect and list your available models.

### 2. Upload a Document

-   Navigate to the **Upload** tab.
-   Drag and drop a `.pdf`, `.txt`, or `.md` file, or click to browse your files.
-   The AI will begin processing the document. You can monitor the progress.

### 3. Explore Your Knowledge Graph

-   Once processing is complete, you'll be taken to the **Knowledge Graph** tab.
-   Interact with the graph: pan, zoom, and drag nodes.
-   Click on any node to view its details, including its definition and the source text it was extracted from.
-   Use the sidebar to filter nodes by name or by the confidence level of their relationships.

### 4. Ask Questions

-   Go to the **Search** tab.
-   Type a question about the content of your document and get a direct, AI-generated answer based on the knowledge within your graph.

## 💻 Local Development Setup

Interested in contributing or running the project locally? Follow these steps.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [pnpm](https://pnpm.io/) (or npm/yarn)

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/knowledge-graph-builder.git
    cd knowledge-graph-builder
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```

4.  Open your browser and navigate to `http://localhost:5173` (or the port specified in your terminal).

## 🗺️ Future Roadmap

This project is actively being developed. Here are some of the features planned for the future:

-   **🧠 Learning Path Generation:** Automatically create a step-by-step learning sequence between two concepts.
-   **💾 Save/Load Graphs:** Export your graph to a local file and import it back later.
-   **📚 Multi-Document Analysis:** Combine multiple documents into a single, unified knowledge graph.
-   **👤 User Accounts & Cloud Sync:** Optional user accounts for saving and syncing graphs across devices.
-   **📈 Advanced Analytics:** Deeper insights into your knowledge, identifying key concepts, information density, and potential knowledge gaps.

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features, bug fixes, or improvements, please feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
