
# CircuitFlow Simulator

**CircuitFlow** is a modern, web-based electronic circuit simulator and schematic capture tool. It combines an infinite canvas, orthogonal auto-wiring, and a powerful **SPICE simulation engine** (via WebAssembly) with an integrated **AI Engineering Agent**.


## 🚀 Key Features

### 🛠 Schematic Editor
- **Infinite Canvas:** Pan and zoom freely to build large circuits.
- **Orthogonal Auto-Wiring:** Intelligent A* pathfinding algorithm routes wires neatly around components using Manhattan geometry.
- **Smart Component Library:** Includes basic passives (R, L, C), sources (DC, Pulse, Current), and real-world semiconductors (BJT, MOSFET, Diodes, OpAmps).
- **Shortcuts:** Quick-add (`Shift+A`), Wire (`W`), Move (`M`), Probe (`P`).

### ⚡ SPICE Simulation
- **Browser-Based Engine:** Runs **ngspice** directly in the browser using WebAssembly. No backend required for simulation.
- **Analysis Modes:**
  - **Transient Analysis (.TRAN):** Time-domain simulation.
  - **DC Sweep (.DC):** Parameter sweeping.
  - **Operating Point (.OP):** Static bias point calculation.
- **Lab Workbench:** Virtual oscilloscope and data table for analyzing results.
- **Visual Probing:** Click any node to plot voltage, or any component to plot current/power.

### 🤖 AI Co-Pilot (CircuitAI)
Powered by **Google Gemini 2.5**, the integrated agent acts as an engineering assistant:
- **Natural Language Building:** Ask "Build a low-pass filter with a 1kHz cutoff" and watch it place and connect components.
- **Design Validation:** The agent can "see" your circuit and run electrical rule checks (ERC) and design rule checks (DRC).
- **Automated Reporting:** Generates comprehensive Markdown reports with pass/fail criteria, efficiency metrics, and datasheets.
- **Multimodal Debugging:** The agent can capture snapshots of the canvas to visually debug orientation or layout issues.

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/circuitflow.git
   cd circuitflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   # Required for AI Features
   API_KEY=your_google_gemini_api_key
   
   # Optional: For Cloud Saving
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```

## 🎮 Usage Guide

### Basic Controls
*   **Pan:** Middle Mouse Drag / Spacebar + Left Click
*   **Zoom:** Mouse Wheel / Buttons in toolbar
*   **Select:** Left Click (Hold Shift to multi-select)
*   **Delete:** `Delete` or `X` key
*   **Rotate:** `R` key

### Building a Circuit
1.  Press `Shift+A` to open the Quick Add menu.
2.  Type "Resistor" or "Voltage" and press Enter.
3.  Place the component on the grid.
4.  Press `W` (Wire Tool) and click port-to-port to connect. The auto-router will handle the path.

### Simulating
1.  Click the **Run** button in the top right.
2.  By default, it runs a Transient analysis.
3.  Click the **Probe** tool (`P`) and click on a wire to see its voltage trace in the graph panel.
4.  Click on a component to see detailed current/power metrics.

### Using the AI Agent
1.  Click the "CircuitAI" button in the toolbar.
2.  **Builder Mode:** Type "Add a voltage divider with 5V input, 10k top resistor, and 1k bottom resistor."
3.  **Auditor Mode:** Type "Validate this circuit." The agent will run a simulation, check for floating nodes, verify power limits, and generate a report.

## 🏗 Architecture

*   **Frontend:** React 19, TypeScript, Tailwind CSS.
*   **State Management:** React Context API with functional updates for performance.
*   **Graphics:** SVG for the schematic canvas, D3.js for the simulation graphs.
*   **Simulation Core:** `ngspice` compiled to WASM, communicating via Web Workers to keep the UI responsive.
*   **AI Layer:** Google GenAI SDK with structured tool calling (Function Calling) to manipulate the circuit state directly.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
