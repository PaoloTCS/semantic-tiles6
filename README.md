# Maybe old

# Semantic Tiles - Knowledge Map

A visual knowledge management system that organizes information using semantic relationships and Voronoi diagrams.

## Features

- Create hierarchical knowledge domains with semantic relationships
- Upload and manage documents within domains
- Visualize knowledge domains using Voronoi diagrams
- Query documents using AI-powered semantic search
- Get document summaries with AI

## Technology Stack

- **Frontend**: React.js with D3.js for visualizations
- **Backend**: Flask REST API
- **AI/ML**: OpenAI embeddings and GPT-4 for semantic processing

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 16+
- OpenAI API key

### Installation

1. Clone the repository
   ```
   git clone https://github.com/PaoloTCS/semantic-tiles.git
   cd semantic-tiles
   ```

2. Install backend dependencies
   ```
   pip install -r requirements.txt
   ```

3. Configure environment variables
   Create a `.env` file in the backend directory with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   SECRET_KEY=your_secret_key
   ```

4. Install frontend dependencies
   ```
   cd frontend
   npm install
   ```

### Running the Application

1. Start the backend server
   ```
   cd backend
   python run.py
   ```

2. Start the frontend application
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Create your first knowledge domain
2. Upload documents to your domain
3. Navigate through the Voronoi diagram to explore your knowledge hierarchy
4. Add sub-domains to organize your knowledge
5. Use the document panel to query and interact with your documents

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for embeddings and language models
- D3.js for visualization capabilities