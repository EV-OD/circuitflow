
import { parseSpiceOutput } from './spiceParser';
import { SimulationData } from '../types';

export class SimulationService {
  private static instance: SimulationService;
  private worker: Worker | null = null;
  private cachedBlobs: { script?: string, wasm?: string } = {};

  private constructor() {}

  static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  private async getBlobUrls() {
      if (this.cachedBlobs.script && this.cachedBlobs.wasm) {
          return this.cachedBlobs;
      }

      const [scriptRes, wasmRes] = await Promise.all([
          fetch('/spice/ngspice.js'),
          fetch('/spice/ngspice.wasm')
      ]);

      if (!scriptRes.ok) throw new Error(`Failed to load ngspice.js: ${scriptRes.status}`);
      if (!wasmRes.ok) throw new Error(`Failed to load ngspice.wasm: ${wasmRes.status}`);

      const scriptBlob = new Blob([await scriptRes.arrayBuffer()], { type: 'application/javascript' });
      const wasmBlob = new Blob([await wasmRes.arrayBuffer()], { type: 'application/wasm' });

      this.cachedBlobs = {
          script: URL.createObjectURL(scriptBlob),
          wasm: URL.createObjectURL(wasmBlob)
      };
      return this.cachedBlobs;
  }

  public async runSimulation(netlist: string): Promise<SimulationData | null> {
      // Terminate previous worker if exists to clean state
      if (this.worker) {
          this.worker.terminate();
          this.worker = null;
      }

      const { script: scriptUrl, wasm: wasmUrl } = await this.getBlobUrls();

      return new Promise((resolve, reject) => {
          const workerCode = `
            self.onmessage = function(e) {
                const { netlist, scriptUrl, wasmUrl } = e.data;
                self.Module = {
                    arguments: ['-b', 'input.cir'],
                    preRun: [function() { if (self.FS) self.FS.writeFile('input.cir', netlist); }],
                    postRun: [function() { self.postMessage({ type: 'done' }); }],
                    print: function(text) { if(text) self.postMessage({ type: 'stdout', message: text }); },
                    printErr: function(text) { if(text) self.postMessage({ type: 'stderr', message: text }); },
                    locateFile: function(path) { return path.endsWith('.wasm') ? wasmUrl : path; }
                };
                try {
                    importScripts(scriptUrl);
                } catch (e) {
                    self.postMessage({ type: 'stderr', message: 'Worker Import Error: ' + e.toString() });
                }
            };
          `;

          const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(workerBlob);
          this.worker = new Worker(workerUrl);

          let rawDataOutput = "";
          let logsOutput = "";

          this.worker.onmessage = (e) => {
              const { type, message } = e.data;
              if (type === 'stdout') {
                  // NGSPICE mixes simulation data and logs in stdout. 
                  // We collect everything for the parser.
                  rawDataOutput += message + '\n';
                  logsOutput += message + '\n';
              }
              else if (type === 'stderr') {
                  // Sometimes debug info comes here
                  logsOutput += `ERR: ${message}\n`;
              }
              else if (type === 'done') {
                  // We parse the raw output for plotting data AND the logs for scalar measurements
                  const data = parseSpiceOutput(rawDataOutput, logsOutput);
                  resolve(data);
                  this.worker?.terminate();
                  this.worker = null;
                  URL.revokeObjectURL(workerUrl);
              }
          };

          this.worker.onerror = (e) => {
              this.worker?.terminate();
              this.worker = null;
              URL.revokeObjectURL(workerUrl);
              reject(new Error(e.message));
          };

          this.worker.postMessage({ netlist, scriptUrl, wasmUrl });
      });
  }
}

export const simulationService = SimulationService.getInstance();
