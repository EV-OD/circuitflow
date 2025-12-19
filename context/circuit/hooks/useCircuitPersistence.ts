
import React, { useCallback } from 'react';
import { CircuitComponent, Wire, CircuitState, ComponentDefinition, CircuitReport } from '../../../types';
import { storage } from '../../../services/storageAdapter';

interface PersistenceDeps {
    components: CircuitComponent[];
    setComponents: React.Dispatch<React.SetStateAction<CircuitComponent[]>>;
    wires: Wire[];
    setWires: React.Dispatch<React.SetStateAction<Wire[]>>;
    customDefinitions: ComponentDefinition[];
    setCustomDefinitions: React.Dispatch<React.SetStateAction<ComponentDefinition[]>>;
    reports: CircuitReport[];
    setReports: React.Dispatch<React.SetStateAction<CircuitReport[]>>;
    setIsLoading: (l: boolean) => void;
    clearHistory: () => void;
}

export const useCircuitPersistence = ({
    components, setComponents, wires, setWires, customDefinitions, setCustomDefinitions, reports, setReports, setIsLoading, clearHistory
}: PersistenceDeps) => {

    const saveCircuit = useCallback(async (name: string) => {
        setIsLoading(true);
        await storage.save(name, { components, wires, customDefinitions, reports, name, lastModified: Date.now() });
        setTimeout(() => setIsLoading(false), 500);
    }, [components, wires, customDefinitions, reports, setIsLoading]);

    const loadCircuit = useCallback(async (name: string) => {
        setIsLoading(true);
        const state = await storage.load(name);
        if (state) {
            clearHistory();
            setComponents(state.components);
            setWires(state.wires);
            if (state.customDefinitions) setCustomDefinitions(state.customDefinitions);
            if (state.reports) setReports(state.reports);
        }
        setTimeout(() => setIsLoading(false), 500);
    }, [clearHistory, setComponents, setWires, setCustomDefinitions, setReports, setIsLoading]);

    const downloadCircuit = useCallback((name: string = 'circuit') => {
        const state: CircuitState = { components, wires, customDefinitions, reports, name, lastModified: Date.now() };
        const jsonString = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [components, wires, customDefinitions, reports]);

    const uploadCircuit = useCallback(async (file: File) => {
        setIsLoading(true);
        try {
            const text = await file.text();
            const state = JSON.parse(text) as CircuitState;
            clearHistory();
            setComponents(state.components);
            setWires(state.wires);
            if (state.customDefinitions) setCustomDefinitions(state.customDefinitions);
            if (state.reports) setReports(state.reports);
        } catch (error) {
            console.error(error);
            alert('Failed to load circuit file.');
        } finally {
            setIsLoading(false);
        }
    }, [clearHistory, setComponents, setWires, setCustomDefinitions, setReports, setIsLoading]);

    return { saveCircuit, loadCircuit, downloadCircuit, uploadCircuit };
};
