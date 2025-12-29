CopilotKit Next.js Example
==========================

This example shows how to use CopilotKitChat in a Next.js app and connect it to the Labadain Agent backend.

Prerequisites
-------------
- Labadain Agent server running locally on `http://localhost:8000` (see repository README).

Run the Next.js app
-------------------

```bash
cd frontend/copilotkit-next
npm install
npm run dev
```

Open http://localhost:3000 and chat. The component calls `POST http://localhost:8000/copilot/chat` with the message history and renders the assistant response.

Notes
-----
- For streaming, you can adapt the page to call `POST /copilot/chat/stream` and consume the `text/event-stream` response via the Fetch API `ReadableStream`.
- In production, configure CORS in the backend to allow only your frontend origin.
