# AI‑Floor‑Planner‑Tool

A lightweight web application enabling floor plan creation and interaction with an AI model, combining a Python backend with a browser-based frontend.

## Project Structure

```
AI‑Floor‑Planner‑Tool/
├─ static/            # Static assets (JS, CSS, images)
├─ templates/         # HTML and Jinja2 templates for rendering
├─ app.py             # Main Python application (FLASK)
├─ README.md          # This file
└─ .gitignore
```

## Overview

- **Backend (`app.py`)**: Built with Flask it Handles:
  - API endpoints for floor plan generation
  - Loading or interfacing with an underlying AI model (local or remote)
  - Rendering web pages and returning JSON data

- **Frontend (`templates/`, `static/`)**:
  - HTML pages served to users
  - JavaScript for interactive layout editing or form submission
  - CSS for styling the interface
  - Possibly includes drawing canvases, blueprint views, or form inputs

## Getting Started

1. **Install dependencies** (if a `requirements.txt` is added later):

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install flask [other dependencies…]
   ```

2. **Run the app**:

   ```bash
   python app.py
   ```

3. **Access the interface**:
   Open `http://localhost:5000` (or the port printed by `app.py`).

## Usage

- The landing page allowa:
  - Drawing a room boundary with furnitures
  - Selecting furniture or layout options
  - Triggering the AI model to generate or adjust layouts
  - Downloading or viewing resulting floor plans

## Extension Ideas

- **Model Integration**: Clearly link backend endpoints to AI inference pipelines.
- **User Interface Enhancements**: Add live canvas drawing, drag‑and‑drop placement, or real‑time updates.
- **Input Formats**: Support image, SVG, or JSON definitions of room boundaries or constraints.
- **Export Options**: Allow downloading layouts as JSON, SVG, PNG, or even 3D file formats.
- **User Profiles**: Authentication, saving projects, versioning layouts.
- **Mobile Responsiveness**: Ensure UI works across devices.
- **Deployment**: Add Dockerfile or deployment instructions for hosting.
