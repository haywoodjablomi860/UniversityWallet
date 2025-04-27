// client/src/pages/TransactionNetwork.tsx

import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import cytoscape from "cytoscape";
import edgehandles from "cytoscape-edgehandles";

// Register the extension
cytoscape.use(edgehandles);

// Helper: Compute initials from a full name
function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

// Helper: Map a string id to a color
function getColorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

type Transaction = {
  id: string | number;
  senderId: string | number;
  senderName: string;
  receiverId: string | number;
  receiverName: string;
  amount: string | number;
  timestamp: string | number;
  type: string;
};

export default function TransactionNetwork() {
  const cyRef = useRef<HTMLDivElement>(null);
  const [cyInstance, setCyInstance] = useState<cytoscape.Core | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  // Fetch transactions from the server
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/all-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/all-transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  useEffect(() => {
    if (typeof window === "undefined" || !cyRef.current) return;

    // Initialize Cytoscape with updated styling
    const cy = cytoscape({
      container: cyRef.current,
      elements: [],
      style: [
        // Node style
        {
          selector: "node",
          style: {
            label: "data(initials)",
            "text-valign": "center",
            "text-halign": "center",
            "background-color": "data(color)",
            color: "#fff",
            "font-size": "12px",
            width: "50px",
            height: "50px",
            "overlay-padding": "6px",
            "z-index": 10,
            // Adding smooth transitions for supported properties
            "transition-property": "width, height, background-color",
            "transition-duration": 300,
          },
        },
        // Node hover style: Increase size instead of using transform
        {
          selector: "node.hover",
          style: {
            label: "data(fullName)",
            "border-width": "3px",
            "border-color": "#333",
            width: "60px",
            height: "60px",
          },
        },
        // Default edge style with dash pattern
        {
          selector: "edge",
          style: {
            width: 3,
            "line-color": "#bbb",
            "target-arrow-color": "#bbb",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "line-style": "dashed",
            label: "data(label)",
            "font-size": "10px",
            "text-rotation": "autorotate",
            "text-margin-y": -10,
            opacity: 0.8,
          },
        },
        // Highlighted edge style
        {
          selector: "edge.highlight",
          style: {
            "line-color": "data(senderColor)",
            "target-arrow-color": "data(senderColor)",
            width: 4,
            "line-style": "solid",
            opacity: 1,
          },
        },
      ],
      layout: { name: "cose", animate: true },
    });

    setCyInstance(cy);

    // Build nodes and edges from transactions
    const nodesMap = new Map<string, { data: any }>();
    transactions.forEach((tx: any) => {
      const senderId = tx.senderId.toString();
      const senderFullName = tx.senderName || senderId;
      if (!nodesMap.has(senderId)) {
        nodesMap.set(senderId, {
          data: {
            id: senderId,
            fullName: senderFullName,
            initials: getInitials(senderFullName),
            color: getColorForId(senderId),
          },
        });
      }
      const receiverId = tx.receiverId.toString();
      const receiverFullName = tx.receiverName || receiverId;
      if (!nodesMap.has(receiverId)) {
        nodesMap.set(receiverId, {
          data: {
            id: receiverId,
            fullName: receiverFullName,
            initials: getInitials(receiverFullName),
            color: getColorForId(receiverId),
          },
        });
      }
    });
    const nodes = Array.from(nodesMap.values());
    const edges = transactions.map((tx: any) => ({
      data: {
        id: `e-${tx.id}`,
        source: tx.senderId.toString(),
        target: tx.receiverId.toString(),
        label: `$${parseFloat(tx.amount).toFixed(2)}`,
        amount: parseFloat(tx.amount).toFixed(2),
        timestamp: tx.timestamp,
        type: tx.type,
        senderColor: getColorForId(tx.senderId.toString()),
      },
    }));

    cy.add([...nodes, ...edges]);
    cy.layout({ name: "cose", animate: true }).run();

    // Initialize edgehandles (for potential interactive features)
    const eh = cy.edgehandles({
      snap: true,
      noEdgeEventsInDraw: true,
      edgeParams: function (source, target) {
        return {
          data: {
            label: "New Transaction",
          },
        };
      },
    });

    // --- Interaction handlers ---
    cy.on("mouseover", "node", (event) => {
      const node = event.target;
      node.addClass("hover");
      node.connectedEdges().addClass("highlight");
    });
    cy.on("mouseout", "node", (event) => {
      const node = event.target;
      node.removeClass("hover");
      node.connectedEdges().removeClass("highlight");
    });
    cy.on("mouseover", "edge", (event) => {
      const edge = event.target;
      edge.addClass("highlight");
    });
    cy.on("mouseout", "edge", (event) => {
      const edge = event.target;
      edge.removeClass("highlight");
    });
    // On click, show transaction details in modal
    cy.on("click", "edge", (event) => {
      const edgeData = event.target.data();
      setSelectedEdge(edgeData);
    });

    // Optional: Add a reset button for pan/zoom
    const resetPanZoom = () => {
      cy.fit();
    };
    (window as any).resetPanZoom = resetPanZoom;

    // Cleanup on unmount
    return () => {
      eh.destroy();
      cy.destroy();
    };
  }, [transactions]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4 md:space-y-8">
      <h2 className="text-2xl font-bold mb-4">Transaction Network</h2>
      <div className="relative">
        <div
          ref={cyRef}
          style={{ width: "100%", height: "600px", border: "1px solid #ddd", borderRadius: "8px" }}
        />
        {/* Reset button for pan/zoom */}
        <button
          onClick={() => (cyInstance ? cyInstance.fit() : null)}
          className="absolute top-2 right-2 bg-white rounded shadow px-3 py-1 text-sm hover:bg-gray-100 transition"
        >
          Reset View
        </button>
      </div>
      {/* Modal for Transaction Details */}
      {selectedEdge && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h3 className="text-lg font-bold mb-2">Transaction Details</h3>
            <p>
              <span className="font-semibold">Amount:</span> ${selectedEdge.amount}
            </p>
            <p>
              <span className="font-semibold">Type:</span> {selectedEdge.type}
            </p>
            <p>
              <span className="font-semibold">Timestamp:</span>{" "}
              {new Date(selectedEdge.timestamp).toLocaleString()}
            </p>
            <button
              onClick={() => setSelectedEdge(null)}
              className="mt-4 w-full bg-blue-500 text-white rounded py-1 hover:bg-blue-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
