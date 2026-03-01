"use client";

import { useEffect, useRef } from "react";
import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";
import { CodebasePayload } from "@/types";

type CodebaseSceneProps = {
    payload: CodebasePayload | null;
    focusMode: boolean;
    onNodeClick: (nodeId: string) => void;
    blastRadii?: string[];
    simulatedTargetId?: string | null;
};

export default function CodebaseScene({ payload, focusMode, onNodeClick, blastRadii = [], simulatedTargetId = null }: CodebaseSceneProps) {
    const splineRef = useRef<Application | null>(null);

    const onLoad = (splineApp: Application) => {
        splineRef.current = splineApp;

        // Optional: Attach an event listener for user clicks on 3D objects
        splineApp.addEventListener("mouseDown", (e) => {
            // e.target.name should ideally map to our node "name" or "id"
            if (e.target && e.target.name) {
                onNodeClick(e.target.name);
            }
        });

        // If payload is already here, map it
        if (payload) {
            applyPayloadToScene(payload, focusMode, blastRadii, simulatedTargetId);
        }
    };

    const applyPayloadToScene = (data: CodebasePayload, isFocusEnabled: boolean, blastRadiiList: string[], simulatedTarget: string | null) => {
        if (!splineRef.current) return;

        // 1. Iterate over nodes
        data.nodes.forEach((node) => {
            // The Spline Code API expects either an exact object name or variable mappings.
            // E.g., setting a variable that controls a position via states

            // Look for a Spline object matching the node ID 
            // (Assuming you've prepared template objects in Spline named accordingly, 
            //  or we instantiate them dynamically if you build a true procedural API loop)
            const obj = splineRef.current?.findObjectByName(node.name);
            if (obj) {
                // Map NetworkX [x, y, z] to spatial coordinates
                obj.position.x = node.coordinates.x;
                obj.position.y = node.coordinates.y;
                obj.position.z = node.coordinates.z;

                // Map Cyclomatic Complexity to height (y-scale)
                const baseScale = 1;
                const complexityScale = baseScale + (node.cyclomatic_complexity * 0.1);
                obj.scale.y = complexityScale;

                // Map Louvain Cluster ID to a Spline color variable (visual neighborhoods)
                if (node.cluster_id !== undefined && splineRef.current) {
                    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#c084fc"];
                    const hexColor = colors[node.cluster_id % colors.length];
                    // Example API mapping if Spline had a 'Color' export variable exposed
                    try {
                        splineRef.current.setVariable(`Color_${node.name}`, hexColor);
                    } catch (e) { }
                }

                // Map Sandbox Blast Radius States
                if (simulatedTarget && (simulatedTarget === node.id || simulatedTarget === node.name)) {
                    // Turn targeted node red
                    splineRef.current?.emitEvent("start" as any, `SimulateDestroy_${node.name}`);
                } else if (blastRadiiList && (blastRadiiList.includes(node.id) || blastRadiiList.includes(node.name))) {
                    // Make dependent nodes pulse yellow/orange
                    splineRef.current?.emitEvent("start" as any, `SimulateDependent_${node.name}`);
                }
                // Standard Focus States
                else if (isFocusEnabled && !node.is_core_node) {
                    // Dim non-core files
                    // For demo purposes via API, triggering state "Dimmed":
                    splineRef.current?.emitEvent("reverse" as any, obj.name);
                } else if (node.is_core_node) {
                    // Glow core files
                    splineRef.current?.emitEvent("start" as any, obj.name);
                }
            }
        });
    };

    // Re-apply mappings if payload, focusMode, or sandbox simulation changes
    useEffect(() => {
        if (payload && splineRef.current) {
            applyPayloadToScene(payload, focusMode, blastRadii, simulatedTargetId);
        }
    }, [payload, focusMode, blastRadii, simulatedTargetId]);

    return (
        <div className="w-full h-full relative z-0">
            {/* 
        Note: You should replace this placeholder URL with your actual 
        exported public URL from the Spline Editor once your scene is ready.
      */}
            <Spline
                scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
                onLoad={onLoad}
            />
        </div>
    );
}
