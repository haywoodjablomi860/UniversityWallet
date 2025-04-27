import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import cytoscape from "cytoscape";
import edgehandles from "cytoscape-edgehandles";

cytoscape.use(edgehandles);

// Helper: Compute initials from a full name
function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

// Helper: Map a string id to a color using HSL
function getColorForId(id: string): string {
  const num = isNaN(Number(id))
    ? id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : Number(id);
  const hue = (num * 137.508) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

// Helper: Darken an HSL color by reducing its lightness
function darkenColor(hsl: string, amount: number): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
  if (!match) return hsl;
  const hue = Number(match[1]);
  const saturation = Number(match[2]);
  let lightness = Number(match[3]);
  lightness = Math.max(0, lightness - amount);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split("T")[0]; // e.g. "2025-04-05"
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
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  // New state to toggle filter UI
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState(getTodayDate());
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");

  // Fetch transactions from the server
  const { data: transactions = [], refetch } = useQuery<Transaction[]>({
    queryKey: ["/api/all-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/all-transactions");
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  // Initialize Cytoscape (only once)
  useEffect(() => {
    if (typeof window === "undefined" || !cyRef.current) return;

    const cy = cytoscape({
      container: cyRef.current,
      elements: [],
      style: [
        // Default node style: show initials
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
            events: "yes",
          },
        },
        // Node hover style: on hover the node grows slightly, becomes bold, and gets a dark border
        {
          selector: "node.highlight",
          style: {
            "border-width": "3px",
            "border-color": (ele) => darkenColor(ele.data("color"), 700),
            width: "52px",
            height: "52px",
            "font-weight": "bold",
          },
        },
        // Default edge style with no label
        {
          selector: "edge",
          style: {
            width: 3,
            "line-color": "#bbb",
            "target-arrow-color": "#bbb",
            "target-arrow-shape": (ele) => ele.data("arrowShape"), // Dynamically assign arrow shape
            "curve-style": "bezier",
            "line-style": "dashed",
            "font-size": "10px",
            "text-rotation": "autorotate",
            "text-margin-y": -10,
            opacity: 0.8,
            label: "",
          },
        },
        // Edge hover style: display transaction amount in a modern style with a smaller font
        {
          selector: "edge.highlight",
          style: {
            "line-color": "data(senderColor)",
            "target-arrow-color": "data(senderColor)",
            width: 4,
            "line-style": "solid",
            opacity: 1,
            label: "data(label)",
            "font-size": "7px",
            "font-family": "Helvetica, sans-serif",
            "font-weight": 500,
            "text-outline-width": "0.5px",
            "text-outline-color": "rgba(255,255,255,0.6)",
          },
        },
      ],
      layout: { name: "cose", animate: true },
    });

    // Change container cursor on node/edge hover
    cy.on("mouseover", "node, edge", () => {
      if (cyRef.current) {
        cyRef.current.style.cursor = "pointer";
      }
    });
    cy.on("mouseout", "node, edge", () => {
      if (cyRef.current) {
        cyRef.current.style.cursor = "default";
      }
    });

    // Event listeners for nodes and edges
    cy.on("mouseover", "node", (event) => {
      const node = event.target;
      node.addClass("highlight");

      // Create and attach tooltip
      const tooltip = document.createElement("div");
      tooltip.className = "node-tooltip";
      tooltip.innerText = node.data("fullName");
      Object.assign(tooltip.style, {
        position: "absolute",
        padding: "4px 8px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "#fff",
        borderRadius: "4px",
        fontSize: "12px",
        pointerEvents: "none",
      });
      document.body.appendChild(tooltip);
      node.data("tooltipElement", tooltip);

      const pointerEvent = event.originalEvent as MouseEvent;
      tooltip.style.left = pointerEvent.pageX + 10 + "px";
      tooltip.style.top = pointerEvent.pageY - 20 + "px";

      node.connectedEdges().addClass("highlight");
    });

    cy.on("mousemove", "node", (event) => {
      const node = event.target;
      const tooltip = node.data("tooltipElement");
      if (tooltip) {
        const pointerEvent = event.originalEvent as MouseEvent;
        tooltip.style.left = pointerEvent.pageX + 10 + "px";
        tooltip.style.top = pointerEvent.pageY - 20 + "px";
      }
    });

    cy.on("mouseout", "node", (event) => {
      const node = event.target;
      node.removeClass("highlight");
      const tooltip = node.data("tooltipElement");
      if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
      node.removeData("tooltipElement");
      node.connectedEdges().removeClass("highlight");
    });

    cy.on("mouseover", "edge", (event) => {
      event.target.addClass("highlight");
    });
    cy.on("mouseout", "edge", (event) => {
      event.target.removeClass("highlight");
    });

    let touchHoldTimer: any = null;

    // Mobile hover-like behavior (long press)
    cy.on("touchstart", "node", (event) => {
      const node = event.target;

      touchHoldTimer = setTimeout(() => {
        node.addClass("highlight");

        const tooltip = document.createElement("div");
        tooltip.className = "node-tooltip";
        tooltip.innerText = node.data("fullName");
        Object.assign(tooltip.style, {
          position: "absolute",
          padding: "4px 8px",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "#fff",
          borderRadius: "4px",
          fontSize: "12px",
          pointerEvents: "none",
          zIndex: 9999,
        });
        document.body.appendChild(tooltip);
        node.data("tooltipElement", tooltip);

        // Use bounding box center for positioning (mobile-safe)
        const pos = node.renderedPosition();
        const rect = cyRef.current?.getBoundingClientRect();
        if (rect) {
          tooltip.style.left = rect.left + pos.x + 10 + "px";
          tooltip.style.top = rect.top + pos.y - 20 + "px";
        }

        node.connectedEdges().addClass("highlight");
      }, 500); // 500ms for long-press
    });

    cy.on("touchend touchmove", "node", (event) => {
      const node = event.target;
      clearTimeout(touchHoldTimer);
      node.removeClass("highlight");

      const tooltip = node.data("tooltipElement");
      if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
      node.removeData("tooltipElement");
      node.connectedEdges().removeClass("highlight");
    });
    let edgeTouchHoldTimer: any = null;

    // Mobile hover-like behavior for edges (long press)
    cy.on("touchstart", "edge", (event) => {
      const edge = event.target;

      edgeTouchHoldTimer = setTimeout(() => {
        edge.addClass("highlight");
      }, 500);
    });

    cy.on("touchend touchmove", "edge", (event) => {
      const edge = event.target;
      clearTimeout(edgeTouchHoldTimer);
      edge.removeClass("highlight");

      const tooltip = edge.data("tooltipElement");
      if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
      edge.removeData("tooltipElement");
    });



    const handleNodeClick = async (event: any) => {
      const node = event.target;
      const userId = node.data("id");
      try {
        const res = await fetch(`/api/user/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch user details");
        const userInfo = await res.json();
        setSelectedNode(userInfo);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    
    const handleEdgeClick = (event: any) => {
      const edgeData = event.target.data();
      setSelectedEdge(edgeData);
    };
    
    // Desktop + Mobile compatibility
    cy.on("click tap", "node", handleNodeClick);
    cy.on("click tap", "edge", handleEdgeClick);
    

    // Initialize edgehandles
    const eh = cy.edgehandles({
      snap: true,
      noEdgeEventsInDraw: true,
      edgeParams: function (source, target) {
        return { data: { label: "New Transaction" } };
      },
    });

    setCyInstance(cy);
    
    // Fit and adjust zoom for a zoomed-out view
    cy.layout({ name: "cose", animate: true }).run();
    cy.fit(undefined, 50);
    cy.zoom(cy.zoom() * 0.8);
    
    (window as any).resetPanZoom = () => cy.fit(undefined, 50);
    
    return () => {
      eh.destroy();
      cy.destroy();
    };
  }, []);

  // Update Cytoscape elements when transactions or filters change
  useEffect(() => {
    if (!cyInstance) return;

    // Remove existing elements
    cyInstance.elements().remove();

    // Apply filters locally
    const filteredTransactions = transactions.filter((tx) => {
      if (
        filterName &&
        !tx.senderName.toLowerCase().includes(filterName.toLowerCase()) &&
        !tx.receiverName.toLowerCase().includes(filterName.toLowerCase())
      ) {
        return false;
      }
      if (filterDate && new Date(tx.timestamp) < new Date(filterDate)) {
        return false;
      }
      if (filterMinAmount && parseFloat(tx.amount as string) < parseFloat(filterMinAmount)) {
        return false;
      }
      if (filterMaxAmount && parseFloat(tx.amount as string) > parseFloat(filterMaxAmount)) {
        return false;
      }
      return true;
    });

    // Build nodes from filtered transactions
    const nodesMap = new Map<string, { data: any }>();
    filteredTransactions.forEach((tx) => {
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

    // Build edges with detailed data and a modern, stylish amount with no decimals
    // Build edges with detailed data and a modern, stylish amount with no decimals
const edges = filteredTransactions.map((tx) => {
  let arrowShape = "triangle"; // default
  if (tx.type === "deposit") {
    arrowShape = "triangle";
  } else if (tx.type === "withdrawal") {
    arrowShape = "tee"; // flat end, good to indicate stop or pull
  }

  return {
    data: {
      id: `e-${tx.id}`,
      source: tx.senderId.toString(),
      target: tx.receiverId.toString(),
      label: `$${Math.round(Number(tx.amount))}`,
      senderColor: getColorForId(tx.senderId.toString()),
      senderName: tx.senderName,
      receiverName: tx.receiverName,
      timestamp: tx.timestamp,
      type: tx.type,
      amount: Math.round(Number(tx.amount)),
      arrowShape, // <-- include custom arrow shape
    },
  };
});


    cyInstance.add([...nodes, ...edges]);
    cyInstance.layout({ name: "cose", animate: true }).run();
  }, [transactions, filterName, filterDate, filterMinAmount, filterMaxAmount, cyInstance]);

  return (
    <div className="p-2 md:p-4 max-w-6xl mx-auto space-y-2">
      <h2 className="text-xl font-bold">Transaction Network</h2>
        <p className="text-sm text-gray-600">
            Showing transactions {filterDate ? `from ${new Date(filterDate).toLocaleDateString()}` : "from all dates"}
            {filterName && ` involving "${filterName}"`}
            {filterMinAmount && ` with amount ≥ $${filterMinAmount}`}
            {filterMaxAmount && ` with amount ≤ $${filterMaxAmount}`}
        </p>

      
      {/* Container for filters and buttons on one line */}
      <div className="flex flex-wrap justify-end gap-2 items-center">
        {showFilters && (
          <>
            <input
              type="text"
              placeholder="Search name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="p-1 border rounded text-xs w-32 min-w-[120px]"
            />

            <input
              type="date"
              placeholder="On or after"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="p-1 border rounded text-xs"
            />
            <input
              type="number"
              placeholder="Min amount"
              value={filterMinAmount}
              onChange={(e) => setFilterMinAmount(e.target.value)}
              className="p-1 border rounded text-xs w-24 min-w-[90px]"
            />
            <input
              type="number"
              placeholder="Max amount"
              value={filterMaxAmount}
              onChange={(e) => setFilterMaxAmount(e.target.value)}
              className="p-1 border rounded text-xs w-24 min-w-[90px]"
            />
            
          </>
        )}
        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-1 border rounded hover:bg-gray-100"
          title="Toggle Filters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 019 17v-3.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
        </button>
        
        {/* Reload button with reload icon (no animation) */}
        <button
          onClick={() => {
            refetch();
            cyInstance?.fit(undefined, 50);
          }}
          className="p-1 border rounded hover:bg-gray-100"
          title="Reload"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M4 14a8 8 0 0116 0M4 10a8 8 0 0116 0" />
          </svg>
        </button>
      </div>
      
      {/* Cytoscape container */}
      <div className="relative">
        <div
          ref={cyRef}
          style={{
            width: "100%",
            height: "calc(100vh - 120px)",
            border: "1px solid #ddd",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        />
      </div>
      
      {/* Transaction details modal */}
      {selectedEdge && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 w-80">
            <h3 className="text-lg font-bold mb-2">Transaction Details</h3>
            <p>
              <span className="font-semibold">Sender:</span> {selectedEdge.senderName}
            </p>
            <p>
              <span className="font-semibold">Receiver:</span> {selectedEdge.receiverName}
            </p>
            <p>
              <span className="font-semibold">Amount:</span> ${selectedEdge.amount}
            </p>
            <p>
              <span className="font-semibold">Type:</span> {selectedEdge.type}
            </p>
            <p>
              <span className="font-semibold">Date & Time:</span>{" "}
              {new Date(selectedEdge.timestamp).toLocaleString()}
            </p>
            <button
              onClick={() => setSelectedEdge(null)}
              className="mt-3 w-full bg-blue-500 text-white rounded py-1 hover:bg-blue-600 transition text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* User details modal */}
      {selectedNode && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 w-80">
            <h3 className="text-lg font-bold mb-2">User Details</h3>
            <p>
              <span className="font-semibold">Name:</span> {selectedNode.fullName}
            </p>
            <p>
              <span className="font-semibold">Department:</span> {selectedNode.department}
            </p>
            <button
              onClick={() => setSelectedNode(null)}
              className="mt-3 w-full bg-blue-500 text-white rounded py-1 hover:bg-blue-600 transition text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
