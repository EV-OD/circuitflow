
import { useState, useEffect, useRef, useCallback } from 'react';
import { CircuitComponent, Wire, ComponentDefinition, SimulationData, NetlistResult } from '../../../types';
import { runAutoCheck } from '../../../services/auto-checker';
import { DesignIssue } from '../../../services/auto-checker/types';

interface Notification extends DesignIssue {
    uniqueId: string; // timestamped ID for rendering key
}

export const useCircuitAutoCheck = (
    components: CircuitComponent[],
    wires: Wire[],
    customDefinitions: ComponentDefinition[],
    simulationResults?: { data: SimulationData, netlistInfo: NetlistResult } | null
) => {
    const [isAutoCheckEnabled, setIsAutoCheckEnabled] = useState(false);
    const [currentIssues, setCurrentIssues] = useState<DesignIssue[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    // To prevent rapid firing notifications for the same issue
    const lastIssueIds = useRef<Set<string>>(new Set());

    const triggerCheck = useCallback(() => {
        const issues = runAutoCheck(
            components, 
            wires, 
            customDefinitions,
            simulationResults?.data,
            simulationResults?.netlistInfo
        );
        setCurrentIssues(issues);

        // Calculate new issues to notify
        const currentIds = new Set(issues.map(i => i.id));
        const newNotifications: Notification[] = [];

        issues.forEach(issue => {
            // If this issue ID wasn't present in the last check, notify
            if (!lastIssueIds.current.has(issue.id)) {
                newNotifications.push({ ...issue, uniqueId: `${issue.id}-${Date.now()}` });
            }
        });

        if (newNotifications.length > 0) {
            setNotifications(prev => [...prev, ...newNotifications]);
            
            // Auto-dismiss after 4 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => !newNotifications.find(nn => nn.uniqueId === n.uniqueId)));
            }, 4000);
        }

        lastIssueIds.current = currentIds;
    }, [components, wires, customDefinitions, simulationResults]);

    // Effect for Auto-Mode: Run on dependency change
    useEffect(() => {
        if (isAutoCheckEnabled) {
            const timer = setTimeout(triggerCheck, 1000); // Debounce 1s
            return () => clearTimeout(timer);
        }
    }, [isAutoCheckEnabled, components, wires, customDefinitions, triggerCheck]);

    // Run check when simulation results update
    useEffect(() => {
        if (simulationResults) {
            triggerCheck();
        }
    }, [simulationResults, triggerCheck]);

    // Manual run function
    const runManualCheck = () => {
        lastIssueIds.current.clear(); // Clear memory to force re-notification
        triggerCheck();
    };

    return {
        isAutoCheckEnabled,
        setIsAutoCheckEnabled,
        currentIssues,
        notifications,
        runManualCheck
    };
};
