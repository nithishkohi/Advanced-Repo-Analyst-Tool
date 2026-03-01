"use client";

import { useMemo, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
    MarkerType,
    useNodesState,
    useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CodebasePayload } from '@/types';

type FlowchartProps = {
    payload: CodebasePayload | null;
    focusMode: boolean;
    onNodeClick: (nodeId: string) => void;
    blastRadii?: string[];
    simulatedTargetId?: string | null;
    simulationRisk?: string | null;
};

export default function CodebaseFlow({ payload, focusMode, onNodeClick, blastRadii = [], simulatedTargetId = null, simulationRisk = null }: FlowchartProps) {

    // Map backend NetworkX DAG to React Flow Schema
    const initialNodes: Node[] = useMemo(() => {
        if (!payload) return [];
        return payload.nodes.map((n) => {
            const isTarget = simulatedTargetId === n.id;
            const isBlastHover = blastRadii.includes(n.id);
            const isDimmed = focusMode && !n.is_core_node && !isTarget && !isBlastHover;

            // Compute styling dynamically 
            let bgColor = 'transparent'; // No background by default
            let borderColor = '#334155'; // slate-700
            let shadow = 'none';
            let textColor = '#cbd5e1'; // slate-300

            if (isTarget && simulationRisk === 'Low') {
                // Safe - Orange/Yellow
                bgColor = '#422006'; // amber-950
                borderColor = '#f59e0b'; // amber-500
                shadow = '0 0 15px rgba(245, 158, 11, 0.4)';
                textColor = '#fde68a'; // amber-200
            } else if (isTarget || isBlastHover) {
                // Danger - Red when simulating an impact on others or errors
                bgColor = '#450a0a'; // red-950
                borderColor = '#ef4444'; // red-500
                shadow = '0 0 15px rgba(239, 68, 68, 0.4)';
                textColor = '#fecaca'; // red-200
            } else if (n.is_core_node) {
                // Core nodes get slightly darker/thicker border but stay gray
                bgColor = 'rgba(15, 23, 42, 0.5)'; // subtle slate-900
                borderColor = '#475569'; // slate-600
                shadow = '0 0 10px rgba(71, 85, 105, 0.2)';
            }

            return {
                id: n.id,
                position: { x: n.coordinates.x * 2.5, y: n.coordinates.y * 2.5 },
                data: {
                    label: (
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight">{n.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-1 opacity-80 truncate" style={{ maxWidth: 150 }}>{n.path}</span>
                            {n.cyclomatic_complexity > 5 && (
                                <span className={`absolute -top-2 -right-2 ${isTarget || isBlastHover ? 'bg-red-500' : 'bg-slate-600'} text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-lg`}>
                                    {Math.round(n.cyclomatic_complexity)}
                                </span>
                            )}
                        </div>
                    )
                },
                style: {
                    background: bgColor,
                    color: textColor,
                    border: `2px solid ${borderColor}`,
                    borderRadius: '8px', // more professional tight radius
                    padding: '12px 16px',
                    width: 'auto',
                    minWidth: '180px',
                    boxShadow: shadow,
                    opacity: isDimmed ? 0.3 : 1,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                }
            }
        });
    }, [payload, focusMode, blastRadii, simulatedTargetId]);

    const initialEdges: Edge[] = useMemo(() => {
        if (!payload) return [];
        return payload.edges.map((e, idx) => {
            const isHighlighted = blastRadii.includes(e.source) || simulatedTargetId === e.source;
            return {
                id: `e${e.source}-${e.target}-${idx}`,
                source: e.source,
                target: e.target,
                animated: isHighlighted, // Animate blast paths
                style: {
                    stroke: isHighlighted ? '#ef4444' : '#475569',
                    strokeWidth: isHighlighted ? 2 : 1
                },
                markerEnd: isHighlighted ? {
                    type: MarkerType.ArrowClosed,
                    color: '#ef4444',
                } : undefined,
            };
        });
    }, [payload, blastRadii, simulatedTargetId]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Sync state when payload changes mapping
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    return (
        <div className="w-full h-full bg-[#030712]">
            {payload ? (
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={(_, node) => onNodeClick(node.id)}
                    fitView
                    minZoom={0.1}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#1e293b" gap={20} size={1} />
                    <Controls className="bg-slate-900 border-slate-800 fill-white" />
                </ReactFlow>
            ) : (
                <div className="flex h-full items-center justify-center text-slate-500 font-mono text-sm">
                    No Codebase Ingested. Waiting for DAG Payload...
                </div>
            )}
        </div>
    );
}
